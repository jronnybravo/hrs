import 'reflect-metadata';
import { config } from 'dotenv';
import { DataSource } from 'typeorm';
import { User } from './entities/User';
import { Setting } from './entities/Setting';
import { Role } from './entities/Role';

// Load environment variables
config();

export const AppDataSource = new DataSource({
	type: 'mysql',
	host: process.env.DB_HOST || 'localhost',
	port: parseInt(process.env.DB_PORT || '3306'),
	username: process.env.DB_USER || 'root',
	password: process.env.DB_PASSWORD || '',
	database: process.env.DB_NAME || 'hrs',
	synchronize: process.env.NODE_ENV !== 'production',
	logging: process.env.NODE_ENV !== 'production',
	entities: [
        Setting,
        User,
        Role
    ],
	migrations: ['src/lib/db/migrations/**/*.ts'],
	subscribers: []
});
