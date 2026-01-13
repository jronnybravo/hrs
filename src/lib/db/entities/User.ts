import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, BaseEntity } from 'typeorm';

@Entity('users')
export class User extends BaseEntity{
	@PrimaryGeneratedColumn()
	id!: number;

	@Column({ type: 'varchar', length: 255, unique: true })
	email!: string;

	@Column({ type: 'varchar', length: 255 })
	firstName!: string;

	@Column({ type: 'varchar', length: 255 })
	lastName!: string;

	@Column({ type: 'varchar', length: 255 })
	password!: string;

	@CreateDateColumn({ type: 'timestamp' })
	createdAt!: Date;

	@UpdateDateColumn({ type: 'timestamp' })
	updatedAt: Date | null = null;
}
