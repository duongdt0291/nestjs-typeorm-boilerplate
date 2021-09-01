import { AutoMap } from '@automapper/classes';
import { ApiProperty } from '@nestjs/swagger';
import { CreateDateColumn, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export abstract class AbstractEntity {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  @AutoMap()
  id?: string;

  @ApiProperty()
  @CreateDateColumn({ update: false, type: 'timestamp with time zone' })
  @AutoMap()
  createdAt?: Date;

  @ApiProperty()
  @UpdateDateColumn({ type: 'timestamp with time zone' })
  @AutoMap()
  updatedAt?: Date;
}
