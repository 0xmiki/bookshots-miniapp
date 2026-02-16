import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [tailwindcss(), sveltekit()]
	// used for local development and testing with tools like ngrok, zrok, etc.
	// server: {
	// 	host: true, // or '0.0.0.0'
	// 	cors: {
	// 		origin: '*'
	// 	},
	// 	allowedHosts: ['hihl679ayqe9.share.zrok.io']
	// }
});
