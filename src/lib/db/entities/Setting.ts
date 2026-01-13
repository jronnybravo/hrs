import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, PrimaryColumn, BaseEntity } from 'typeorm';

@Entity('settings')
export class Setting extends BaseEntity {
    @PrimaryColumn({ type: 'varchar', length: 255 })
	key!: string;

	@Column({ type: 'longtext' })
	value!: string;

	@CreateDateColumn({ type: 'timestamp' })
	createdAt!: Date;

	@UpdateDateColumn({ type: 'timestamp' })
	updatedAt: Date | null = null;

    static async get(key: string): Promise<string | undefined> {
        const setting = await Setting.findOneBy({ key });
        return setting?.value;
    }
}
