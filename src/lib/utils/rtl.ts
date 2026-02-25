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

// Minimum text length required for reliable RTL detection
const MIN_TEXT_LENGTH = 11;

/**
 * Strips HTML tags from text for language detection
 * @param text The text to strip HTML tags from
 * @returns Text with HTML tags removed
 */
function stripHtmlTags(text: string): string {
	return text.replace(/<[^>]*>/g, '');
}

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

	// Strip HTML tags before detection
	const cleanText = stripHtmlTags(text);

	// If cleaned text is too short, return false (not enough data for reliable detection)
	if (cleanText.trim().length < MIN_TEXT_LENGTH) {
		return false;
	}

	// Detect language using franc
	const langCode = franc(cleanText);

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
