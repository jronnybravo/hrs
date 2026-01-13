import { AppDataSource } from './data-source';

export async function initializeDatabase() {
	try {
		if (!AppDataSource.isInitialized) {
			await AppDataSource.initialize();
			console.log('✓ Database connection initialized');
		}
		return AppDataSource;
	} catch (error) {
		console.warn('⚠ Database connection failed:', (error as Error).message);
		console.warn('⚠ Some features may not work until MySQL is running.');
		// Return null or a mock data source in development
		// This allows the app to continue running without a database
		return null;
	}
}

export async function closeDatabase() {
	if (AppDataSource.isInitialized) {
		await AppDataSource.destroy();
		console.log('✓ Database connection closed');
	}
}
