'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { WaitlistEntry } from '@illajwala/types';
import { doctorAppConfig } from '../config';

export type WaitlistRealtimeEvent =
  | {
      type: 'waitlist.created' | 'waitlist.updated' | 'waitlist.status.changed';
      waitlist: WaitlistEntry;
    }
  | {
      type: 'waitlist.removed';
      waitlistId: string;
    }
  | {
      type: 'heartbeat';
      connectionId?: string;
    }
  | {
      type: 'error';
      message: string;
    };

export type WaitlistRealtimeConnectionState = 'idle' | 'connecting' | 'open' | 'error' | 'closed';

type UseWaitlistRealtimeOptions = {
  token: string | null;
  enabled?: boolean;
  onEvent: (event: WaitlistRealtimeEvent) => void;
  onConnectionChange?: (state: WaitlistRealtimeConnectionState) => void;
  onError?: (error: Error) => void;
};

const buildWaitlistStreamUrl = (token: string) => {
  const baseUrl = new URL(doctorAppConfig.realtimeBaseUrl ?? doctorAppConfig.apiBaseUrl);
  baseUrl.search = '';
  baseUrl.hash = '';
  const normalizedPath = baseUrl.pathname.replace(/\/$/, '');
  baseUrl.pathname = `${normalizedPath}/waitlists`;
  baseUrl.searchParams.set('token', token);
  return baseUrl.toString();
};

export const useWaitlistRealtime = ({
  token,
  enabled = true,
  onEvent,
  onConnectionChange,
  onError,
}: UseWaitlistRealtimeOptions) => {
  const [connectionState, setConnectionState] = useState<WaitlistRealtimeConnectionState>('idle');
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

  const updateConnectionState = useCallback((state: WaitlistRealtimeConnectionState) => {
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
      updateConnectionState('connecting');

      try {
        const streamUrl = buildWaitlistStreamUrl(authToken);
        const eventSource = new EventSource(streamUrl, { withCredentials: true });
        eventSourceRef.current = eventSource;

        eventSource.onopen = () => {
          retryRef.current = 0;
          updateConnectionState('open');
        };

        eventSource.onmessage = (event) => {
          if (!event.data) {
            return;
          }

          try {
            const payload = JSON.parse(event.data) as WaitlistRealtimeEvent;

            // Defensive: ignore unknown payloads
            if (payload && typeof payload === 'object' && 'type' in payload) {
              onEventRef.current?.(payload);
            }
          } catch (error) {
            console.warn('[doctor-realtime] Failed to parse waitlist event', error);
          }
        };

        eventSource.onerror = (error) => {
          updateConnectionState('error');
          eventSource.close();
          onErrorRef.current?.(
            error instanceof Error
              ? error
              : new Error('Unexpected EventSource error while listening to waitlists'),
          );
          scheduleReconnect(authToken);
        };
      } catch (error) {
        updateConnectionState('error');
        onErrorRef.current?.(
          error instanceof Error
            ? error
            : new Error('Failed to initialise waitlist real-time stream'),
        );
        scheduleReconnect(authToken);
      }
    };

    if (!enabled || !token) {
      cleanup();
      updateConnectionState('idle');
      return;
    }

    connect(token);

    return () => {
      stopped = true;
      cleanup();
      updateConnectionState('closed');
    };
  }, [enabled, token, updateConnectionState]);

  return connectionState;
};
