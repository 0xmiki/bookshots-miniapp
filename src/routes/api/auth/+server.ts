import { Client, Users, Databases, ID, Query, TablesDB, Account } from 'node-appwrite';
import { validate } from '@tma.js/init-data-node';
import { json } from '@sveltejs/kit';

import { APPWRITE_API_KEY, TELEGRAM_BOT_TOKEN } from '$env/static/private';
import {
	PUBLIC_APPWRITE_DATABASE_ID,
	PUBLIC_APPWRITE_PROFILE_COLLECTION_ID,
	PUBLIC_APPWRITE_PROJECT_ID
} from '$env/static/public';

// Ensure these environment variables are set in your .env file

export async function POST({ request }: { request: Request }) {
	try {
		const body = await request.json();
		const init_data = body.init_data;

		if (!init_data) {
			return json({ message: 'Missing init_data' }, { status: 400 });
		}

		// Validate init_data
		try {
			const uri_init_data = decodeURIComponent(init_data);
			validate(uri_init_data, TELEGRAM_BOT_TOKEN!);
		} catch (e: any) {
			console.error('Invalid init_data:', e.message);
			return json({ message: 'Invalid init_data', validation_error: e.message }, { status: 400 });
		}

		// Extract user data from init_data
		let user_telegram_data: {
			name: string | null;
			profile_pic: string | null;
			username: string | null;
			telegram_id: number | null;
		} = {
			name: null,
			profile_pic: null,
			username: null,
			telegram_id: null
		};

		const params = new URLSearchParams(init_data);
		const userParam = params.get('user');

		if (!userParam) {
			return json({ message: 'Missing user parameter in init_data' }, { status: 400 });
		}

		const userJsonStr = decodeURIComponent(userParam);
		const tgUser = JSON.parse(userJsonStr);

		user_telegram_data = {
			name: tgUser.first_name || null,
			profile_pic: tgUser.photo_url || null,
			username: tgUser.username || null,
			telegram_id: tgUser.id
		};

		if (!user_telegram_data.telegram_id) {
			return json({ message: 'Missing Telegram user ID in init_data' }, { status: 400 });
		}

		// Initialize Appwrite client
		const client = new Client();
		client
			.setEndpoint('https://fra.cloud.appwrite.io/v1')
			.setProject(PUBLIC_APPWRITE_PROJECT_ID!)
			.setKey(APPWRITE_API_KEY!);

		const users = new Users(client);
		const database = new Databases(client);
		const tableDB = new TablesDB(client);
		const account = new Account(client);
		// Check if profile exists
		const existingProfile = await tableDB.getRow({
			databaseId: PUBLIC_APPWRITE_DATABASE_ID,
			tableId: PUBLIC_APPWRITE_PROFILE_COLLECTION_ID,
			rowId: user_telegram_data.telegram_id.toString(),
			queries: [Query.select(['*', 'highlights.*'])]
		});

		if (existingProfile) {
			// Profile exists, return token and profile data
			console.log('User profile exists.');

			const token = await users.createToken({
				userId: existingProfile.$id.toString()
			});

			// if the the profile doesn't have the first_name or last_name or username, or profile_pic update it
			if (
				!existingProfile.first_name ||
				!existingProfile.username ||
				!existingProfile.profile_pic
			) {
				const updatedProfileData = {
					first_name: tgUser.first_name,
					last_name: tgUser.last_name || '',
					username: tgUser.username || '',
					profile_pic: tgUser.photo_url || ''
				};
				await database.updateDocument(
					PUBLIC_APPWRITE_DATABASE_ID!,
					PUBLIC_APPWRITE_PROFILE_COLLECTION_ID!,
					existingProfile.$id,
					updatedProfileData
				);
				// console.log('Profile updated with new data:', updatedProfileData);
			}
			// console.log('Existing profile found:', existingProfile);
			return json({
				secret: token.secret,
				data: existingProfile
			});
		}
	} catch (err: any) {
		console.error('Server-side authentication error:', err);
		// Check if the error is a fetch-related error (e.g., network issue, Appwrite down)
		if (err.message?.includes('fetch failed') || err.code === 'UND_ERR_CONNECT_TIMEOUT') {
			return json(
				{
					message: 'Could not connect to authentication service. Please try again later.',
					type: 'FETCH_FAILED',
					code: 503 // Service Unavailable
				},
				{ status: 503 }
			);
		}
		return json(
			{ message: err.message || 'Internal Server Error', type: err.type, code: err.code },
			{
				status:
					err.code && typeof err.code === 'number' && err.code >= 400 && err.code < 600
						? err.code
						: 500
			}
		);
	}
}
