import { ApiController } from 'src/decorators';
import { TagService } from './tag.service';

@ApiController('/:companyId/tag')
export class TagController {
  constructor(readonly service: TagService) {}
}
