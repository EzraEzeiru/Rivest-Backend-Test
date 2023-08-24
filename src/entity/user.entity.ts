import { Entity, PrimaryGeneratedColumn, Column, BeforeInsert, OneToMany } from 'typeorm';
import bcrypt from 'bcrypt';
import { File } from './file.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
    id!: number;

  @Column({ type: 'varchar' })
    email!: string;

  @Column({ type: 'varchar' })
    password!: string;

  @Column({ type: 'varchar' })
    fullName!: string;

  @Column({ default: false })
    isAdmin!: boolean;

  @OneToMany(() => File, file => file.user)
  files!: File[];

  @BeforeInsert()
  async hashPassword() {
    this.password = await bcrypt.hash(this.password, 10);
  }
}
