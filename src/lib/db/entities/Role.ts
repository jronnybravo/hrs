import {
    Entity,
    BaseEntity,
    Column,
    PrimaryGeneratedColumn,
    JoinColumn,
    OneToMany,
    ManyToOne,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';
import { User } from './User';
import { Permission } from '$lib/utils/Permission';

@Entity()
export class Role extends BaseEntity {

    static SUPER_ADMINISTRATOR = {
        id: 1,
        name: 'Super Administrator',
        permissions: [ Permission.DO_EVERYTHING ],
    }
    
    @PrimaryGeneratedColumn()
    id!: number;

    @Column('varchar', { unique: true})
    name: string = '';

    @Column('text', { nullable: true })
    description: string | null = null;

    @Column('int', { nullable: true })
    createdByUserId: number | null = null;

    @Column('json')
    permissions: string[] = [];

    @CreateDateColumn({ type: 'timestamp' })
    createdAt!: Date;

    @UpdateDateColumn({ type: 'timestamp' })
    updatedAt!: Date;

    @ManyToOne(() => User, a => a.createdRoles)
    @JoinColumn()
    createdByUser?: User | null;

    @OneToMany(() => User, a => a.role)
    users?: User[] | null;

    can(permission: string): boolean {
        const permissionPath = Permission.getPermissionPath(permission);
        return this.permissions.some(permission => permissionPath.includes(permission)) ?? false;
    }
}