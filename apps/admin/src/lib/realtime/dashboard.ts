"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Appointment } from "@illajwala/types";
import { adminAppConfig } from "../config";

export type DashboardRealtimeEvent =
  | {
      type: "metrics.updated";
      metrics: {
        activeConsultations: number;
        waitingPatients: number;
        averageWaitTime: number;
        noShowRate: number;
        revenueToday: number;
      };
    }
  | {
      type: "appointment.created" | "appointment.updated" | "appointment.deleted" | "appointment.status.changed";
      appointment: Appointment;
    }
  | { type: "heartbeat"; connectionId?: string };

export type DashboardRealtimeConnectionState = "idle" | "connecting" | "open" | "error" | "closed";

type UseDashboardRealtimeOptions = {
  token: string | null;
  enabled?: boolean;
  onEvent: (event: DashboardRealtimeEvent) => void;
  onError?: (error: Error) => void;
  onConnectionChange?: (state: DashboardRealtimeConnectionState) => void;
};

const buildDashboardStreamUrl = (token: string) => {
  const baseUrl = new URL(adminAppConfig.realtimeBaseUrl ?? adminAppConfig.apiBaseUrl);
  baseUrl.search = "";
  baseUrl.hash = "";
  const normalizedPath = baseUrl.pathname.replace(/\/$/, "");
  baseUrl.pathname = `${normalizedPath}/dashboard`;
  baseUrl.searchParams.set("token", token);
  return baseUrl.toString();
};

export const useDashboardRealtime = ({
  token,
  enabled = true,
  onEvent,
  onError,
  onConnectionChange,
}: UseDashboardRealtimeOptions) => {
  const [connectionState, setConnectionState] = useState<DashboardRealtimeConnectionState>("idle");
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const retryRef = useRef(0);
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

  const updateConnectionState = useCallback((state: DashboardRealtimeConnectionState) => {
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
        const streamUrl = buildDashboardStreamUrl(authToken);
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
            const payload = JSON.parse(event.data) as DashboardRealtimeEvent;
            if (payload && typeof payload === "object" && "type" in payload) {
              onEventRef.current?.(payload);
            }
          } catch (error) {
            console.warn("[admin-realtime] Failed to parse dashboard event", error);
          }
        };

        eventSource.onerror = (error) => {
          updateConnectionState("error");
          eventSource.close();
          onErrorRef.current?.(
            error instanceof Error ? error : new Error("Unexpected EventSource error while listening to dashboard events")
          );
          scheduleReconnect(authToken);
        };
      } catch (error) {
        updateConnectionState("error");
        onErrorRef.current?.(
          error instanceof Error ? error : new Error("Failed to initialise dashboard real-time stream")
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


