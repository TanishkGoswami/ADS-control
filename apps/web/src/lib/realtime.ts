import { useEffect, useRef } from 'react';
import { SWRCache } from './swr-cache';

export interface RealtimeMessage {
  type: string;
  payload?: any;
  timestamp: number;
}

type RealtimeListener = (event: RealtimeMessage) => void;

class RealtimeClient {
  private static instance: RealtimeClient;
  private eventSource: EventSource | null = null;
  private listeners = new Set<RealtimeListener>();
  private broadcastChannel: BroadcastChannel | null = null;
  private reconnectTimer: any = null;
  private isConnected = false;

  private constructor() {
    this.initBroadcastChannel();
    this.connect();
  }

  static getInstance(): RealtimeClient {
    if (!RealtimeClient.instance) {
      RealtimeClient.instance = new RealtimeClient();
    }
    return RealtimeClient.instance;
  }

  private initBroadcastChannel() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.broadcastChannel = new BroadcastChannel('metabull_realtime_channel');
        this.broadcastChannel.onmessage = (event) => {
          if (event?.data) {
            this.handleIncomingEvent(event.data, false);
          }
        };
      } catch (err) {
        console.warn('BroadcastChannel initialization failed:', err);
      }
    }
  }

  private connect() {
    if (typeof window === 'undefined') return;

    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }

    try {
      const sseBase = import.meta.env.VITE_API_URL 
        ? `${(import.meta.env.VITE_API_URL as string).replace(/\/+$/, '')}/api/v1/realtime/stream` 
        : '/api/v1/realtime/stream';
      this.eventSource = new EventSource(sseBase);

      this.eventSource.onopen = () => {
        this.isConnected = true;
        console.log('⚡ Connected to MetaBull Realtime Live Stream');
      };

      this.eventSource.onmessage = (e) => {
        try {
          const data: RealtimeMessage = JSON.parse(e.data);
          if (data && data.type && data.type !== 'HEARTBEAT') {
            this.handleIncomingEvent(data, true);
          }
        } catch (err) {
          // Heartbeat or malformed non-JSON
        }
      };

      this.eventSource.onerror = () => {
        this.isConnected = false;
        if (this.eventSource) {
          this.eventSource.close();
          this.eventSource = null;
        }
        // Reconnect after 3 seconds
        if (!this.reconnectTimer) {
          this.reconnectTimer = setTimeout(() => {
            this.reconnectTimer = null;
            this.connect();
          }, 3000);
        }
      };
    } catch (err) {
      console.warn('Realtime connection error:', err);
    }
  }

  private handleIncomingEvent(event: RealtimeMessage, shouldBroadcast: boolean) {
    console.log('📢 Realtime Event Received:', event.type, event);

    // 1. Auto-invalidate relevant SWR cache entries
    if (event.type === 'META_ASSETS_UPDATED') {
      SWRCache.invalidate('meta-accounts');
      SWRCache.invalidate('meta-connections');
      SWRCache.invalidate('dashboard');
    } else if (event.type === 'DASHBOARD_UPDATED') {
      SWRCache.invalidate('dashboard');
    } else if (event.type === 'LEDGER_UPDATED') {
      SWRCache.invalidate('ledger');
      SWRCache.invalidate('dashboard');
    }

    // 2. Notify all registered in-app listeners
    this.listeners.forEach((listener) => {
      try {
        listener(event);
      } catch (err) {
        console.error('Error in realtime listener callback:', err);
      }
    });

    // 3. Forward to other tabs in the same browser if origin was SSE
    if (shouldBroadcast && this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage(event);
      } catch (err) {
        // Channel closed
      }
    }
  }

  subscribe(listener: RealtimeListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  broadcastLocal(event: RealtimeMessage) {
    this.handleIncomingEvent(event, true);
  }
}

export const realtimeClient = RealtimeClient.getInstance();

/**
 * React Hook to subscribe to specific realtime events
 */
export function useRealtimeEvent(
  eventType: string | string[],
  callback: (event: RealtimeMessage) => void
) {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    const types = Array.isArray(eventType) ? eventType : [eventType];

    const unsubscribe = realtimeClient.subscribe((event) => {
      if (types.includes(event.type) || types.includes('*')) {
        callbackRef.current(event);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [Array.isArray(eventType) ? eventType.join(',') : eventType]);
}
