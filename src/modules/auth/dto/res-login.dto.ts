import { ApiProperty } from '@nestjs/swagger';

export class ResLoginDto {
  @ApiProperty()
  token: string;
}
