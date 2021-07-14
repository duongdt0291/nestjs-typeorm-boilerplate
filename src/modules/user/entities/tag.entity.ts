import { AutoMap } from '@automapper/classes';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AbstractEntity } from 'src/common/abstract.entity';
import { IsNumber, IsString } from 'src/decorators';
import { Column, Entity, Unique } from 'typeorm';
import { TagCategory } from './tag-category.entity';

@Entity()
@Unique(['title'])
export class Tag extends AbstractEntity {
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

  @ApiProperty()
  @Column()
  @AutoMap()
  @IsNumber({})
  categoryId: number;

  category: TagCategory;
}
