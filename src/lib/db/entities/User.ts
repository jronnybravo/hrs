import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, BaseEntity, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Role } from './Role';
import { Permission } from '$lib/utils/Permission';
import crypto from 'crypto';

@Entity('users')
export class User extends BaseEntity{
	@PrimaryGeneratedColumn()
	id!: number;

    @Column({ type: 'varchar', length: 255, unique: true })
    username!: string;

	@Column({ type: 'varchar', length: 255, unique: true })
	email!: string;

	@Column({ type: 'varchar', length: 255 })
	firstName!: string;

	@Column({ type: 'varchar', length: 255 })
	lastName!: string;

	@Column({ type: 'varchar', length: 255 })
	password!: string;

    @Column('int')
    roleId!: number;

    @Column('json', { nullable: true, comment: 'Overrides the permissions of the role' })
    permissions?: string[] | null;

    @CreateDateColumn({ type: 'timestamp' })
	createdAt!: Date;

	@UpdateDateColumn({ type: 'timestamp' })
	updatedAt!: Date;

    @ManyToOne(() => Role, role => role.users)
    @JoinColumn()
    role!: Role;

    @OneToMany(() => Role, role => role.createdByUser)
    createdRoles?: Role[] | null;

    can(permission: string): boolean {
        if (this.permissions && this.permissions.length) {
            const permissionPath = Permission.getPermissionPath(permission);
            return this.permissions.some(permission => permissionPath.includes(permission));
        }

        return this.role.can(permission);
    }

    fullName(): string {
        return `${this.firstName} ${this.lastName}`;
    }

    static hashPassword(password: string): string {
        const salt = crypto.randomBytes(16).toString('hex');
        const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
        return `${salt}:${hash}`;
    }

    static verifyPassword(password: string, hashedPassword: string): boolean {
        const [salt, hash] = hashedPassword.split(':');
        const hashVerify = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
        return hash === hashVerify;
    }
}
