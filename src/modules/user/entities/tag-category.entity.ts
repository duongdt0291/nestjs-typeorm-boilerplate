import { AutoMap } from '@automapper/classes';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AbstractEntity } from 'src/common/abstract.entity';
import { IsString } from 'src/decorators';
import { Column, Entity, Unique } from 'typeorm';

@Entity()
@Unique(['title'])
export class TagCategory extends AbstractEntity {
  @ApiProperty()
  @Column()
  @AutoMap()
  @IsString({})
  title: string;

  @ApiPropertyOptional()
  @Column({ nullable: true })
  @AutoMap()
  @IsString({ optional: true })
  description?: string;
}
