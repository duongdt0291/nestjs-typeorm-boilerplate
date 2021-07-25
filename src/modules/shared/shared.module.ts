import { Global, HttpModule, Module } from '@nestjs/common';
import { ApiConfigService } from './services/api-config.service';

const providers = [ApiConfigService];

@Global()
@Module({
  providers,
  imports: [HttpModule],
  exports: [...providers, HttpModule],
})
export class SharedModule {}
