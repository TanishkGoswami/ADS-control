import { Controller, Sse, MessageEvent } from '@nestjs/common';
import { Observable, merge, interval } from 'rxjs';
import { map } from 'rxjs/operators';
import { RealtimeService } from './realtime.service';
import { Public } from '../../common/public.decorator';

@Controller('api/v1/realtime')
export class RealtimeController {
  constructor(private readonly realtimeService: RealtimeService) {}

  @Public()
  @Sse('stream')
  stream(): Observable<MessageEvent> {
    // 1. Business events from RealtimeService
    const events$ = this.realtimeService.getStream().pipe(
      map((event) => ({
        data: event,
        type: 'message'
      }))
    );

    // 2. Keep-alive heartbeat ping every 25 seconds to keep proxies/tunnels active
    const heartbeat$ = interval(25000).pipe(
      map(() => ({
        data: { type: 'HEARTBEAT', timestamp: Date.now() },
        type: 'ping'
      }))
    );

    return merge(events$, heartbeat$);
  }
}
