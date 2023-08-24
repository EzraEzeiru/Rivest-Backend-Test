import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { User } from './user.entity';
import { Folder } from './folder.entity';

@Entity()
export class File {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  key!: string; 

  @Column()
  originalName!: string; 

  @ManyToOne(() => Folder, folder => folder.files)
  folder!: Folder;

  @Column({ default: false })
  isUnsafe!: boolean;

  @Column()
  mimeType!: string;

  @ManyToOne(() => User, user => user.files)
  user!: User;
}
