import { Role } from '../entities/Role.ts';
import { User } from '../entities/User.ts';

export class UserSeeder {
    static async run() {
        const superAdminUserExists = await User.findOne({
            where: {
                roleId: Role.SUPER_ADMINISTRATOR.id
            }
        });
        if(superAdminUserExists) {
            console.log('Super Administrator user already exists');
            return;
        }

        const superAdminUser = User.create({
            username: 'ynnorj',
            password: User.hashPassword('P@s5w0rd'),
            email: 'ynnorj@gmail.com',
            firstName: 'Jronny',
            lastName: 'Amarante',
            roleId: Role.SUPER_ADMINISTRATOR.id,
        });
        await superAdminUser.save();
        console.log('Super Administrator user seeded successfully');
    }
}
