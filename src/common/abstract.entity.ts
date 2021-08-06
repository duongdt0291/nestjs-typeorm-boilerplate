import { AutoMap } from '@automapper/classes';
import { ApiProperty } from '@nestjs/swagger';
import { CreateDateColumn, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export abstract class AbstractEntity {
  @ApiProperty()
  @PrimaryGeneratedColumn()
  @AutoMap()
  id: number;

  @ApiProperty()
  @CreateDateColumn({ update: false })
  @AutoMap()
  createdAt: Date;

  @ApiProperty()
  @UpdateDateColumn()
  @AutoMap()
  updatedAt: Date;
}
