import { browser } from '$app/environment';
import { app_state } from '$lib/state/state.svelte';
import { authenticate_user, extract_telegram_id } from '$lib/utils';

export async function init() {
	if (!browser) return;

	const telegram_id = extract_telegram_id(window.Telegram?.WebApp?.initData);

	try {
		await authenticate_user();
	} catch (err) {
		console.error('❌ Authentication failed:', err);
		app_state.error = 'Authentication failed. Please try again.';
	} finally {
		app_state.loading_profile = false;
	}
}
