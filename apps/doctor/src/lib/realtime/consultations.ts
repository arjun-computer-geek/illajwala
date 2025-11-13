"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Appointment } from "@illajwala/types";
import { doctorAppConfig } from "../config";

export type ConsultationRealtimeEvent =
  | {
      type:
        | "appointment.created"
        | "appointment.updated"
        | "appointment.status.changed"
        | "appointment.completed"
        | "appointment.checked-in";
      appointment: Appointment;
    }
  | {
      type: "appointment.removed" | "appointment.cancelled" | "appointment.no-show";
      appointmentId: string;
    }
  | {
      type: "heartbeat";
      connectionId?: string;
    };

export type ConsultationRealtimeConnectionState = "idle" | "connecting" | "open" | "error" | "closed";

type UseConsultationRealtimeOptions = {
  token: string | null;
  enabled?: boolean;
  onEvent: (event: ConsultationRealtimeEvent) => void;
  onConnectionChange?: (state: ConsultationRealtimeConnectionState) => void;
  onError?: (error: Error) => void;
};

const buildConsultationStreamUrl = (token: string) => {
  const baseUrl = new URL(doctorAppConfig.realtimeBaseUrl ?? doctorAppConfig.apiBaseUrl);
  baseUrl.search = "";
  baseUrl.hash = "";
  const normalizedPath = baseUrl.pathname.replace(/\/$/, "");
  baseUrl.pathname = `${normalizedPath}/consultations`;
  baseUrl.searchParams.set("token", token);
  return baseUrl.toString();
};

export const useConsultationRealtime = ({
  token,
  enabled = true,
  onEvent,
  onConnectionChange,
  onError,
}: UseConsultationRealtimeOptions) => {
  const [connectionState, setConnectionState] = useState<ConsultationRealtimeConnectionState>("idle");
  const retryRef = useRef(0);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const onEventRef = useRef(onEvent);
  const onErrorRef = useRef(onError);
  const onConnectionChangeRef = useRef(onConnectionChange);

  useEffect(() => {
    onEventRef.current = onEvent;
  }, [onEvent]);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  useEffect(() => {
    onConnectionChangeRef.current = onConnectionChange;
  }, [onConnectionChange]);

  const updateConnectionState = useCallback((state: ConsultationRealtimeConnectionState) => {
    setConnectionState(state);
    onConnectionChangeRef.current?.(state);
  }, []);

  useEffect(() => {
    let stopped = false;

    const cleanup = () => {
      if (reconnectTimeoutRef.current) {
        window.clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      eventSourceRef.current?.close();
      eventSourceRef.current = null;
    };

    const scheduleReconnect = (authToken: string) => {
      if (stopped) {
        return;
      }
      const attempt = retryRef.current + 1;
      retryRef.current = attempt;
      const delay = Math.min(30000, 2000 * attempt);
      reconnectTimeoutRef.current = window.setTimeout(() => {
        reconnectTimeoutRef.current = null;
        connect(authToken);
      }, delay);
    };

    const connect = (authToken: string) => {
      if (stopped) {
        return;
      }

      cleanup();
      updateConnectionState("connecting");

      try {
        const streamUrl = buildConsultationStreamUrl(authToken);
        const eventSource = new EventSource(streamUrl, { withCredentials: true });
        eventSourceRef.current = eventSource;

        eventSource.onopen = () => {
          retryRef.current = 0;
          updateConnectionState("open");
        };

        eventSource.onmessage = (event) => {
          if (!event.data) {
            return;
          }

          try {
            const payload = JSON.parse(event.data) as ConsultationRealtimeEvent;

            // Defensive: ignore unknown payloads
            if (payload && typeof payload === "object" && "type" in payload) {
              onEventRef.current?.(payload);
            }
          } catch (error) {
            console.warn("[doctor-realtime] Failed to parse consultation event", error);
          }
        };

        eventSource.onerror = (error) => {
          updateConnectionState("error");
          eventSource.close();
          onErrorRef.current?.(
            error instanceof Error ? error : new Error("Unexpected EventSource error while listening to consultations")
          );
          scheduleReconnect(authToken);
        };
      } catch (error) {
        updateConnectionState("error");
        onErrorRef.current?.(
          error instanceof Error ? error : new Error("Failed to initialise consultation real-time stream")
        );
        scheduleReconnect(authToken);
      }
    };

    if (!enabled || !token) {
      cleanup();
      updateConnectionState("idle");
      return;
    }

    connect(token);

    return () => {
      stopped = true;
      cleanup();
      updateConnectionState("closed");
    };
  }, [enabled, token, updateConnectionState]);

  return connectionState;
};


