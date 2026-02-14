import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { account } from './appwrite';
import { app_state } from './state/state.svelte';
import {
	PUBLIC_APPWRITE_DATABASE_ID,
	PUBLIC_APPWRITE_PROJECT_ID,
	PUBLIC_APPWRITE_PROFILE_COLLECTION_ID,
	PUBLIC_APPWRITE_HIGHLIGHT_COLLECTION_ID
} from '$env/static/public';

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type WithoutChild<T> = T extends { child?: any } ? Omit<T, 'child'> : T;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type WithoutChildren<T> = T extends { children?: any } ? Omit<T, 'children'> : T;
export type WithoutChildrenOrChild<T> = WithoutChildren<WithoutChild<T>>;
export type WithElementRef<T, U extends HTMLElement = HTMLElement> = T & { ref?: U | null };

export const DATABASE_ID = PUBLIC_APPWRITE_DATABASE_ID;
export const PROJECT_ID = PUBLIC_APPWRITE_PROJECT_ID;
export const PROFILE_COLLECTION_ID = PUBLIC_APPWRITE_PROFILE_COLLECTION_ID;
// export const AUTH_FUNCTION_ID = 'APPWRITE_AUTH_FUNCTION_ID'; // Not used in current implementation, but can be added for serverless auth logic
export const HIGHLIGHT_COLLECTION_ID = PUBLIC_APPWRITE_HIGHLIGHT_COLLECTION_ID;
export function extract_telegram_id(initData: string | null | undefined): number | null {
	if (!initData) return null;

	try {
		const params = new URLSearchParams(initData);
		const userParam = params.get('user');
		if (!userParam) return null;

		const userObj = JSON.parse(decodeURIComponent(userParam));
		return Number(userObj.id) || null;
	} catch (err) {
		console.error('❌ Failed to extract Telegram ID:', err);
		return null;
	}
}

export async function get_item(key = 'secret'): Promise<{ exists: boolean; value: string | null }> {
	try {
		if (!window.Telegram?.WebApp?.CloudStorage) throw new Error('CloudStorage not available.');
		return new Promise((resolve) => {
			window.Telegram?.WebApp?.CloudStorage?.getItem(key, (error, value) => {
				resolve(error || !value ? { exists: false, value: null } : { exists: true, value });
			});
		});
	} catch (err) {
		console.error('CloudStorage error:', err);
		return { exists: false, value: null };
	}
}

export async function store_secret(secret: string) {
	try {
		const cs = window.Telegram?.WebApp?.CloudStorage;
		if (!cs) throw new Error('CloudStorage is not available.');
		cs.setItem('secret', secret);
	} catch (err) {
		console.error('❌ Failed to store secret/user_id:', err);
	}
}

export async function clearStorage() {
	try {
		const cs = window.Telegram?.WebApp?.CloudStorage;
		if (!cs) return;
		await cs.removeItem('secret');
	} catch (err) {
		console.error('❌ Failed to clear storage:', err);
	}
}

export async function create_session_if_not_exist(secret: string): Promise<boolean> {
	try {
		let telegram_id = extract_telegram_id(window.Telegram?.WebApp?.initData);
		if (!telegram_id) {
			console.error('❌ Telegram ID is missing');
			return false;
		}
		await account.createSession({ userId: telegram_id?.toString(), secret: secret });
		app_state.user = await account.get();
		console.log('✅ Session created from stored credentials');
		return true;
	} catch (err: any) {
		console.error('❌ Failed to create session:', err);
		return false;
	}
}

export async function authenticate_user() {
	console.log('Attempting to authenticate user via SvelteKit backend');
	const initData = window.Telegram?.WebApp?.initData;
	if (!initData) {
		console.error('❌ No init data');
		return;
	}

	try {
		const response = await fetch('/api/auth', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ init_data: initData })
		});

		const result = await response.json();

		if (!response.ok) {
			console.error(
				'❌ Authentication failed:',
				result.message || `HTTP error! status: ${response.status}`
			);
			return;
		}

		console.log('Response from SvelteKit /auth endpoint:', result);
		const { secret, data } = result; // data is the profile document

		if (!secret || !data || !data.$id) {
			console.error('❌ Invalid response structure from /auth:', result);
			return;
		}
		// user_id and telegram_id are the same
		store_secret(secret);
		await create_session_if_not_exist(secret); // Ensure this returns and is awaited if needed
		app_state.profile = data;
		console.log('Fetching channels complete.');
	} catch (err: any) {
		console.error('❌ Client-side authentication error:', err);
	}
}

export const DEFAULT_LAYOUT_CONFIG = {
	initialWidth: 603,
	initialHeight: 603,
	minFontSize: 28,
	maxFontSize: 55,
	charsForMaxFont: 150,
	charsForMinFont: 888,
	padding: 33,
	baseTextLengthForHeightScaling: 90,
	heightScaleFactor: 88,
	baseTextLengthForWidthScaling: 290,
	widthScaleThreshold: 290,
	widthScaleFactor: 33,
	maxWidth: 1500,
	maxHeight: 2000
};

export function calculateDynamicLayout(text: string, config = DEFAULT_LAYOUT_CONFIG) {
	// Function to check if text contains CJK (Chinese, Japanese, Korean) characters
	const containsCJK = (str: string): boolean => {
		return /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\uff66-\uff9f\uac00-\ud7af\u1100-\u11ff\u3130-\u318f]/.test(
			str
		);
	};

	let length = text?.length || 0;
	// For CJK text, we need to adjust the length to account for higher density
	const adjustedLength = containsCJK(text) ? length * 1.5 : length;

	let fontSize;
	if (adjustedLength <= config.charsForMaxFont) {
		fontSize = config.maxFontSize;
	} else if (adjustedLength >= config.charsForMinFont) {
		fontSize = config.minFontSize;
	} else {
		const fontRange = config.maxFontSize - config.minFontSize;
		const charRange = config.charsForMinFont - config.charsForMaxFont;
		fontSize =
			config.maxFontSize - ((adjustedLength - config.charsForMaxFont) / charRange) * fontRange;
		fontSize = Math.max(config.minFontSize, Math.min(config.maxFontSize, Math.round(fontSize)));
	}

	let cardHeight = config.initialHeight;
	const heightThreshold = containsCJK(text)
		? config.baseTextLengthForHeightScaling * 0.6
		: config.baseTextLengthForHeightScaling;
	if (adjustedLength > heightThreshold) {
		const extraHeight =
			Math.log(Math.max(1, adjustedLength - heightThreshold + 1)) * config.heightScaleFactor;
		cardHeight = Math.round(config.initialHeight + extraHeight);
	}

	let cardWidth = config.initialWidth;
	const widthThreshold = containsCJK(text)
		? config.widthScaleThreshold * 0.6
		: config.widthScaleThreshold;
	if (adjustedLength >= widthThreshold && adjustedLength > config.baseTextLengthForWidthScaling) {
		const extraWidth =
			Math.log(Math.max(1, adjustedLength - config.baseTextLengthForWidthScaling + 1)) *
			config.widthScaleFactor;
		cardWidth = Math.round(config.initialWidth + extraWidth);
	}

	cardWidth = Math.min(cardWidth, config.maxWidth);
	cardHeight = Math.min(cardHeight, config.maxHeight);
	cardWidth = Math.max(cardWidth, config.initialWidth);
	cardHeight = Math.max(cardHeight, config.initialHeight);

	return { cardWidth, cardHeight, fontSize };
}
