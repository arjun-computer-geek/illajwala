"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Appointment } from "@/types/api";
import { appConfig } from "../config";

export type AppointmentRealtimeEvent =
  | {
      type:
        | "appointment.created"
        | "appointment.updated"
        | "appointment.status.changed"
        | "appointment.rescheduled"
        | "appointment.feedback.updated";
      appointment: Appointment;
    }
  | {
      type: "appointment.cancelled" | "appointment.deleted" | "appointment.no-show";
      appointmentId: string;
    }
  | {
      type: "heartbeat";
      connectionId?: string;
    };

export type AppointmentRealtimeConnectionState = "idle" | "connecting" | "open" | "error" | "closed";

type UseAppointmentRealtimeOptions = {
  token: string | null;
  enabled?: boolean;
  onEvent: (event: AppointmentRealtimeEvent) => void;
  onConnectionChange?: (state: AppointmentRealtimeConnectionState) => void;
  onError?: (error: Error) => void;
};

const buildStreamUrl = (token: string) => {
  const baseUrl = new URL(appConfig.realtimeBaseUrl ?? appConfig.apiBaseUrl);
  baseUrl.search = "";
  baseUrl.hash = "";
  const normalizedPath = baseUrl.pathname.replace(/\/$/, "");
  baseUrl.pathname = `${normalizedPath}/appointments`;
  baseUrl.searchParams.set("token", token);
  return baseUrl.toString();
};

export const useAppointmentRealtime = ({
  token,
  enabled = true,
  onEvent,
  onConnectionChange,
  onError,
}: UseAppointmentRealtimeOptions) => {
  const [connectionState, setConnectionState] = useState<AppointmentRealtimeConnectionState>("idle");
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

  const updateConnectionState = useCallback((state: AppointmentRealtimeConnectionState) => {
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
        const streamUrl = buildStreamUrl(authToken);
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
            const payload = JSON.parse(event.data) as AppointmentRealtimeEvent;
            if (payload && typeof payload === "object" && "type" in payload) {
              onEventRef.current?.(payload);
            }
          } catch (error) {
            console.warn("[patient-realtime] Failed to parse appointment event", error);
          }
        };

        eventSource.onerror = (error) => {
          updateConnectionState("error");
          eventSource.close();
          onErrorRef.current?.(
            error instanceof Error ? error : new Error("Unexpected EventSource error while listening to appointments")
          );
          scheduleReconnect(authToken);
        };
      } catch (error) {
        updateConnectionState("error");
        onErrorRef.current?.(
          error instanceof Error ? error : new Error("Failed to initialise appointment real-time stream")
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


