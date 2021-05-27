import { AuthGuard } from '@nestjs/passport';

export class LoginAuthGuard extends AuthGuard('local') {}
