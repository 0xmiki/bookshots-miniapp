import { franc } from 'franc';

// List of RTL language codes supported by franc
const RTL_LANGUAGES = new Set([
	'arb', // Standard Arabic
	'urd', // Urdu
	'heb', // Hebrew
	'ckb', // Central Kurdish
	'pbu', // Northern Pashto
	'prs', // Dari
	'uig', // Uighur (Arabic)
	'ydd', // Eastern Yiddish
	'tzm', // Central Atlas Tamazight
	'zlm' // Malay (individual language) (Arabic)
]);

/**
 * Detects if the given text is in a right-to-left language
 * @param text The text to analyze
 * @returns True if text is in an RTL language, false otherwise
 */
export function isRTL(text: string): boolean {
	// If text is empty, return false
	if (!text || text.trim().length === 0) {
		return false;
	}

	// Detect language using franc
	const langCode = franc(text);

	// Check if detected language is in our RTL list
	return RTL_LANGUAGES.has(langCode);
}

/**
 * Gets the text direction (ltr or rtl) for a given text
 * @param text The text to analyze
 * @returns 'rtl' if text is in an RTL language, 'ltr' otherwise
 */
export function getTextDirection(text: string): 'ltr' | 'rtl' {
	return isRTL(text) ? 'rtl' : 'ltr';
}
