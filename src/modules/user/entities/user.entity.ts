import { AutoMap } from '@automapper/classes';
import { AbstractEntity } from 'src/common/abstract.entity';
import { Entity, Unique, Column, ManyToMany, JoinTable } from 'typeorm';
import { Tag } from './tag.entity';

@Entity()
@Unique(['email'])
export class User extends AbstractEntity {
  @Column()
  @AutoMap()
  firstName: string;

  @Column()
  @AutoMap()
  lastName: string;

  @Column()
  @AutoMap()
  email: string;

  @Column({ select: false })
  password: string;

  @Column({ nullable: true })
  @AutoMap()
  age: number;

  @ManyToMany(() => Tag)
  @JoinTable()
  tags: Tag[];
}
