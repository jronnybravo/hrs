import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	ssr: {
		external: ['typeorm', 'mysql2']
	},
	optimizeDeps: {
		exclude: ['typeorm', 'mysql2']
	}
});
