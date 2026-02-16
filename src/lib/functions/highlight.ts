import { tablesDB } from '$lib/appwrite';
import { app_state } from '$lib/state/state.svelte';
import { DATABASE_ID, HIGHLIGHT_COLLECTION_ID } from '$lib/utils';

export async function delete_highlight(highlight_id: string) {
	try {
		if (!app_state.profile?.highlights) {
			console.error('❌ No highlights found in user state');
			return;
		}
		await tablesDB.deleteRow({
			databaseId: DATABASE_ID,
			tableId: HIGHLIGHT_COLLECTION_ID,
			rowId: highlight_id
		});
		app_state.profile.highlights = app_state.profile.highlights.filter(
			(h: any) => h.$id !== highlight_id
		);
		console.log(`✅ Highlight with ID ${highlight_id} deleted successfully`);
	} catch (e) {
		console.log(`❌ Failed to delete highlight with ID ${highlight_id}:`, e);
	}
}
