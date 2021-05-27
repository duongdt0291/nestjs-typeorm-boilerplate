import { applyDecorators, UseGuards } from '@nestjs/common';
import { RolesGuard } from 'src/guards/role.guard';
import { Roles } from './role.decorator';

export const Auth = (roles) => applyDecorators(Roles(roles), UseGuards(RolesGuard));
