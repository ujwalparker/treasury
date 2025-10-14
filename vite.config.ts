import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	build: {
		rollupOptions: {
			onwarn(warning, warn) {
				if (warning.code === 'THIS_IS_UNDEFINED') return;
				warn(warning);
			}
		}
	}
});