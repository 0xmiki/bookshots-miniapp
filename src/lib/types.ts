export interface Profile {
	wallet_address: null;
	first_name: string;
	last_name: string;
	telegram_id: number;
	username: string;
	profile_pic: string;
	user_id: string;
	$id: string;
	$createdAt: Date;
	$updatedAt: Date;
	$permissions: any[];
	$databaseId: string;
	$collectionId: string;
	appearance: Appearance[] | null;
	highlights: Highlight[];
}

/**
 * Represents a User object with its properties, based on the provided example.
 */
export interface User {
	/** User ID. */
	$id: string;
	/** User creation date in ISO 8601 format. */
	$createdAt: string;
	/** User update date in ISO 8601 format. */
	$updatedAt: string;
	/** User name. */
	name: string;
	/** User registration date in ISO 8601 format. */
	registration: string;
	/** User status. `true` for enabled, `false` for disabled. */
	status: boolean;
	/** Labels for the user. */
	labels: string[];
	/** Password update time in ISO 8601 format. */
	passwordUpdate: string;
	/** User email address. */
	email: string;
	/** User phone number in E.164 format. */
	phone: string;
	/** Email verification status. */
	emailVerification: boolean;
	/** Phone verification status. */
	phoneVerification: boolean;
	/** Multi factor authentication status. */
	mfa: boolean;
	/** User preferences as a key-value object. */
	prefs: Preferences;
	/** A user-owned message receiver. */
	targets: Target[];
	/** Most recent access date in ISO 8601 format. This attribute is only updated again after 24 hours. */
	accessedAt: string;
}

export interface Highlight {
	$id: string;
	$createdAt: string;
	$updatedAt: string;

	text: string;
	title: string;
	author: string;
	pageno: number; // Page number where the highlight is located
	pos0: string;
	pos1: string;
	page: string;
	reader: Profile | string;
	datetime: string; // Date and time when the highlight was created
	chapter: string;
}

/** User preferences model */
interface Preferences {
	[key: string]: any; //Replace with specific properties if known
}

/** Represents a user target e.g email or phone. */
interface Target {
	[key: string]: any; // Replace with specific properties if known
}

export type Appearance = {
	$id: string;
	$createdAt: string;
	$updatedAt: string;
	background_mode: 'color' | 'url'; // More specific
	text: string;
	metaText: string;
	authorText: string;
	overlay_rgb: string; // e.g., "0,0,0"
	overlay_opacity: number; // e.g., 0.0 to 1.0
	name: string;
	background_color: string; // e.g., "#FFFFFF"
	background_image_url: string;
	owner: string; // telegram id of the user
};

export type Book = {
	title: string;
	author: string;
	highlights: number;
};

export interface GoogleFont {
	family: string;
	variants: string[];
	subsets: string[];
	version: string;
	lastModified: string;
	files: Record<string, string>;
	category?: string;
	selectedSubset?: string;
	selectedVariant?: string;
}
