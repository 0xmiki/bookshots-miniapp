import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [tailwindcss(), sveltekit()], // remove this in production
	server: {
		host: true, // or '0.0.0.0'
		cors: {
			origin: '*'
		},
		allowedHosts: ['u1l6nidb4j28.share.zrok.io']
	}
});
