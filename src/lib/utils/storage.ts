// Storage utility for localStorage operations
// Handles book-specific settings and global highlights page session

import { browser } from '$app/environment';

import type { Highlight } from '$lib/types';

// Types for storage structures
export type SortOption = 'page-asc' | 'page-desc' | 'date-asc' | 'date-desc';
export type ViewMode = 'carousel' | 'vertical';

export interface BookSettings {
	carouselIndex: number;
	sortBy: SortOption;
	viewMode: ViewMode;
	theme: string;
}

// Separate settings for highlight detail page (book view page theme)
export interface BookViewSettings {
	theme: string;
}

export interface HighlightsSession {
	backgroundMode: 'color' | 'url';
	backgroundColor: string;
	backgroundImageUrl: string;
	theme: string;
	overlayEnabled: boolean;
	overlayOpacity: number;
	overlayColor: string;
	textColor: string;
	metaColor: string;
}

// Default values
const DEFAULT_BOOK_SETTINGS: BookSettings = {
	carouselIndex: 0,
	sortBy: 'page-asc',
	viewMode: 'vertical',
	theme: 'charcoal'
};

const DEFAULT_BOOK_VIEW_SETTINGS: BookViewSettings = {
	theme: 'charcoal'
};

const DEFAULT_HIGHLIGHTS_SESSION: HighlightsSession = {
	backgroundMode: 'color',
	backgroundColor: '#ffffff',
	backgroundImageUrl: '',
	theme: 'charcoal',
	overlayEnabled: false,
	overlayOpacity: 0.3,
	overlayColor: '#000000',
	textColor: '#1a1a1a',
	metaColor: '#666666'
};

// Helper to safely access localStorage
function getLocalStorage(): Storage | null {
	if (!browser) return null;
	try {
		return localStorage;
	} catch {
		return null;
	}
}

// Book-specific settings functions
export function getBookKey(author: string, title: string): string {
	return `${author}::${title}`;
}

/**
 * Find a highlight by ID from the profile's highlights array.
 * This is used for deep linking - when Telegram opens the app with a start_param,
 * we need to find the highlight to determine which book it belongs to.
 * @param highlights - Array of highlights from the profile
 * @param highlightId - The highlight ID to search for
 * @returns The highlight if found, undefined otherwise
 */
export function findHighlightById(
	highlights: Highlight[] | undefined,
	highlightId: string
): Highlight | undefined {
	if (!highlights || !highlightId) return undefined;
	return highlights.find((h) => h.$id === highlightId);
}

export function getBookSettingsKey(bookKey: string): string {
	return `book_settings_${bookKey}`;
}

export function getBookSettings(bookKey: string): BookSettings {
	const ls = getLocalStorage();
	if (!ls) return { ...DEFAULT_BOOK_SETTINGS };

	try {
		const stored = ls.getItem(getBookSettingsKey(bookKey));
		if (stored) {
			return { ...DEFAULT_BOOK_SETTINGS, ...JSON.parse(stored) };
		}
	} catch (e) {
		console.error('Error reading book settings:', e);
	}

	return { ...DEFAULT_BOOK_SETTINGS };
}

export function saveBookSettings(bookKey: string, settings: Partial<BookSettings>): void {
	const ls = getLocalStorage();
	if (!ls) return;

	try {
		const current = getBookSettings(bookKey);
		const updated = { ...current, ...settings };
		ls.setItem(getBookSettingsKey(bookKey), JSON.stringify(updated));
	} catch (e) {
		console.error('Error saving book settings:', e);
	}
}

// Convenience functions for individual settings
export function saveCarouselIndex(bookKey: string, index: number): void {
	saveBookSettings(bookKey, { carouselIndex: index });
}

export function saveSortBy(bookKey: string, sortBy: SortOption): void {
	saveBookSettings(bookKey, { sortBy });
}

export function saveViewMode(bookKey: string, viewMode: ViewMode): void {
	saveBookSettings(bookKey, { viewMode });
}

export function saveBookTheme(bookKey: string, theme: string): void {
	saveBookSettings(bookKey, { theme });
}

// Book view settings (for highlight detail page - separate from book page theme)
export function getBookViewSettingsKey(bookKey: string): string {
	return `book_view_settings_${bookKey}`;
}

export function getBookViewSettings(bookKey: string): BookViewSettings {
	const ls = getLocalStorage();
	if (!ls) return { ...DEFAULT_BOOK_VIEW_SETTINGS };

	try {
		const stored = ls.getItem(getBookViewSettingsKey(bookKey));
		if (stored) {
			return { ...DEFAULT_BOOK_VIEW_SETTINGS, ...JSON.parse(stored) };
		}
	} catch (e) {
		console.error('Error reading book view settings:', e);
	}

	return { ...DEFAULT_BOOK_VIEW_SETTINGS };
}

export function saveBookViewTheme(bookKey: string, theme: string): void {
	const ls = getLocalStorage();
	if (!ls) return;

	try {
		const current = getBookViewSettings(bookKey);
		const updated = { ...current, theme };
		ls.setItem(getBookViewSettingsKey(bookKey), JSON.stringify(updated));
	} catch (e) {
		console.error('Error saving book view theme:', e);
	}
}

// Global highlights session functions
export function getHighlightsSession(): HighlightsSession {
	const ls = getLocalStorage();
	if (!ls) return { ...DEFAULT_HIGHLIGHTS_SESSION };

	try {
		const stored = ls.getItem('highlights_session');
		if (stored) {
			return { ...DEFAULT_HIGHLIGHTS_SESSION, ...JSON.parse(stored) };
		}
	} catch (e) {
		console.error('Error reading highlights session:', e);
	}

	return { ...DEFAULT_HIGHLIGHTS_SESSION };
}

export function saveHighlightsSession(settings: Partial<HighlightsSession>): void {
	const ls = getLocalStorage();
	if (!ls) return;

	try {
		const current = getHighlightsSession();
		const updated = { ...current, ...settings };
		ls.setItem('highlights_session', JSON.stringify(updated));
	} catch (e) {
		console.error('Error saving highlights session:', e);
	}
}

// Convenience functions for individual session settings
export function saveHighlightsBackgroundMode(mode: 'color' | 'url'): void {
	saveHighlightsSession({ backgroundMode: mode });
}

export function saveHighlightsBackgroundColor(color: string): void {
	saveHighlightsSession({ backgroundColor: color });
}

export function saveHighlightsBackgroundImage(url: string): void {
	saveHighlightsSession({ backgroundImageUrl: url });
}

export function saveHighlightsTheme(theme: string): void {
	saveHighlightsSession({ theme });
}
