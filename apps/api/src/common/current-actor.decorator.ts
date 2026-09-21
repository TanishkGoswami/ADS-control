import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { AuthPrincipal } from '@ads-control/shared';

export const CurrentActor = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthPrincipal =>
    context.switchToHttp().getRequest<{ actor: AuthPrincipal }>().actor
);
