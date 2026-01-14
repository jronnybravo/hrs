import { Role } from '../entities/Role.ts';

export class RoleSeeder {
    static async run() {
        const superAdminExists = await Role.findOne({
            where: { id: Role.SUPER_ADMINISTRATOR.id }
        });
        if (superAdminExists) {
            console.log('SUPER_ADMINISTRATOR role already exists');
            return;
        }

        const superAdminRole = Role.create({ ...Role.SUPER_ADMINISTRATOR });
        await superAdminRole.save();
        console.log('SUPER_ADMINISTRATOR role seeded successfully');
    }
}
