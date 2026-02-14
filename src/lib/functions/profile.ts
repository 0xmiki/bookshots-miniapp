import { databases, tablesDB } from '$lib/appwrite';
import { app_state } from '$lib/state/state.svelte';
import { DATABASE_ID, PROFILE_COLLECTION_ID } from '$lib/utils';
import { Query } from 'appwrite';

export async function get_user_profile(telegram_id: number | string | null) {
	if (!telegram_id) {
		console.error('❌ Missing user_id or telegram_id');
		return;
	}
	console.log(`Fetching Profile...`);
	const profile = await tablesDB.getRow({
		databaseId: DATABASE_ID,
		tableId: PROFILE_COLLECTION_ID,
		rowId: telegram_id.toString(),
		queries: [Query.select(['*', 'highlights.*'])]
	});

	if (profile) {
		app_state.profile = profile as any;
		console.log('Profile:', app_state.profile);
	} else {
		// something is wrong, initiate sus mode
		// remove all sessions and params and show a something went wrong screen to the user

		console.log('No profile found for user:', telegram_id);
	}
}
