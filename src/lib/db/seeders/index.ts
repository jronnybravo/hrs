import 'reflect-metadata';
import { AppDataSource } from '../data-source.ts';
import { RoleSeeder } from './RoleSeeder.ts';
import { UserSeeder } from './UserSeeder.ts';

async function runSeeders() {
    try {
        await AppDataSource.initialize();
        console.log('Database connection established');

        console.log('Running seeders...');
        await RoleSeeder.run();
        await UserSeeder.run();

        console.log('All seeders completed successfully');
        await AppDataSource.destroy();
    } catch (error) {
        console.error('Seeder error:', error);
        process.exit(1);
    }
}

runSeeders();
