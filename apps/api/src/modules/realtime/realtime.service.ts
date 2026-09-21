import { Injectable, Logger } from '@nestjs/common';
import { Subject, Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';

export interface RealtimeEvent {
  type: string;
  payload?: any;
  timestamp: number;
}

@Injectable()
export class RealtimeService {
  private readonly logger = new Logger(RealtimeService.name);
  private readonly eventStream$ = new Subject<RealtimeEvent>();

  /**
   * Broadcast an event to all connected SSE clients across the workspace
   */
  broadcast(type: string, payload: any = {}) {
    const event: RealtimeEvent = {
      type,
      payload,
      timestamp: Date.now()
    };
    this.logger.log(`📢 Realtime broadcast: ${type}`);
    this.eventStream$.next(event);
  }

  /**
   * Returns the observable event stream
   */
  getStream(): Observable<RealtimeEvent> {
    return this.eventStream$.asObservable();
  }

  /**
   * Filter stream by specific event types
   */
  getFilteredStream(types: string[]): Observable<RealtimeEvent> {
    return this.eventStream$.pipe(
      filter((e) => types.includes(e.type))
    );
  }
}
