<script lang="ts">
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { ChevronDown, Check, Search, X } from '@lucide/svelte';
	import { cn } from '$lib/utils.js';
	import { PUBLIC_WEB_FONTS_API_KEY as apiKey } from '$env/static/public';
	import type { GoogleFont } from '$lib/types';
	import { app_state } from '$lib/state/state.svelte.js';

	interface Props {
		value?: string;
		triggerText?: string;
		type: 'main' | 'sub';
		sampleFonts?: GoogleFont[];
		// Expose selected font for parent to access subsets/variants
		selectedFont?: GoogleFont | null;
		// Expose selected subset and variant as bindable props
		selectedSubset?: string;
		selectedVariant?: string;
	}

	let {
		value = $bindable(''),
		triggerText = 'Select Font',
		sampleFonts,
		type = 'main',
		selectedFont = $bindable(null),
		selectedSubset = $bindable('latin'),
		selectedVariant = $bindable('regular')
	}: Props = $props();

	let open = $state(false);
	let fonts = $state<GoogleFont[]>([]);
	let fullFonts = $state<GoogleFont[]>([]); // Store complete font catalog for searching
	let searchQuery = $state('');
	let previewText = $state('The quick brown fox jumps over the lazy dog');
	let loading = $state(false);
	let loadedFonts = $state(new Set<string>());
	let fontLoading = $state(new Set<string>());
	let searchTimeout: ReturnType<typeof setTimeout>;

	// Levenshtein distance for fuzzy matching
	function levenshtein(a: string, b: string): number {
		if (a.length === 0) return b.length;
		if (b.length === 0) return a.length;

		const matrix: number[][] = [];

		for (let i = 0; i <= b.length; i++) {
			matrix[i] = [i];
		}

		for (let j = 0; j <= a.length; j++) {
			matrix[0][j] = j;
		}

		for (let i = 1; i <= b.length; i++) {
			for (let j = 1; j <= a.length; j++) {
				if (b.charAt(i - 1) === a.charAt(j - 1)) {
					matrix[i][j] = matrix[i - 1][j - 1];
				} else {
					matrix[i][j] = Math.min(
						matrix[i - 1][j - 1] + 1,
						matrix[i][j - 1] + 1,
						matrix[i - 1][j] + 1
					);
				}
			}
		}

		return matrix[b.length][a.length];
	}

	// Default sample fonts if no API key provided
	const defaultSampleFonts: GoogleFont[] = [
		{
			family: 'Roboto',
			variants: ['regular', '700'],
			subsets: ['latin'],
			version: 'v32',
			lastModified: '2024-01-01',
			files: {}
		},
		{
			family: 'Open Sans',
			variants: ['regular', '700'],
			subsets: ['latin'],
			version: 'v40',
			lastModified: '2024-01-01',
			files: {}
		},
		{
			family: 'Lato',
			variants: ['regular', '700'],
			subsets: ['latin'],
			version: 'v24',
			lastModified: '2024-01-01',
			files: {}
		},
		{
			family: 'Montserrat',
			variants: ['regular', '700'],
			subsets: ['latin'],
			version: 'v26',
			lastModified: '2024-01-01',
			files: {}
		},
		{
			family: 'Poppins',
			variants: ['regular', '700'],
			subsets: ['latin'],
			version: 'v20',
			lastModified: '2024-01-01',
			files: {}
		},
		{
			family: 'Playfair Display',
			variants: ['regular', '700'],
			subsets: ['latin'],
			version: 'v36',
			lastModified: '2024-01-01',
			files: {}
		},
		{
			family: 'Inter',
			variants: ['regular', '700'],
			subsets: ['latin'],
			version: 'v13',
			lastModified: '2024-01-01',
			files: {}
		},
		{
			family: 'Merriweather',
			variants: ['regular', '700'],
			subsets: ['latin'],
			version: 'v30',
			lastModified: '2024-01-01',
			files: {}
		},
		{
			family: 'Raleway',
			variants: ['regular', '700'],
			subsets: ['latin'],
			version: 'v28',
			lastModified: '2024-01-01',
			files: {}
		},
		{
			family: 'Nunito',
			variants: ['regular', '700'],
			subsets: ['latin'],
			version: 'v26',
			lastModified: '2024-01-01',
			files: {}
		},
		{
			family: 'Ubuntu',
			variants: ['regular', '700'],
			subsets: ['latin'],
			version: 'v22',
			lastModified: '2024-01-01',
			files: {}
		},
		{
			family: 'Source Sans Pro',
			variants: ['regular', '700'],
			subsets: ['latin'],
			version: 'v22',
			lastModified: '2024-01-01',
			files: {}
		}
	];

	// Debounced search function - performs in-memory search with Levenshtein fuzzy matching
	function performSearch(query: string) {
		if (fullFonts.length === 0) return;

		const lowerQuery = query.toLowerCase();
		const filtered = fullFonts.filter((font) => {
			const name = font.family.toLowerCase();
			// Direct substring match
			if (name.includes(lowerQuery)) return true;
			// Fuzzy match using Levenshtein distance
			const distance = levenshtein(name, lowerQuery);
			// Allow match if distance is within reasonable threshold
			const threshold = Math.min(3, Math.max(name.length, lowerQuery.length) * 0.3);
			return distance <= threshold;
		});
		fonts = filtered.slice(0, 100);
		fonts.forEach((font: GoogleFont) => loadFontCSS(font.family));
	}

	// Handle search input with debouncing
	function handleSearchInput(event: Event) {
		const target = event.target as HTMLInputElement;
		searchQuery = target.value;

		clearTimeout(searchTimeout);
		if (searchQuery.length > 2 && fullFonts.length > 0) {
			searchTimeout = setTimeout(() => {
				performSearch(searchQuery);
			}, 150); // 150ms debounce
		} else if (searchQuery.length <= 2) {
			// Reset to default fonts when query is too short
			if (fullFonts.length > 0) {
				fonts = fullFonts.slice(0, 100);
			}
		}
	}

	// Load fonts when sheet opens
	$effect(() => {
		if (open && fonts.length === 0) {
			loadFonts();
		}
	});

	async function loadFonts() {
		loading = true;

		if (sampleFonts) {
			fonts = sampleFonts;
			fullFonts = sampleFonts;
		} else if (apiKey) {
			try {
				const response = await fetch(
					`https://www.googleapis.com/webfonts/v1/webfonts?key=${apiKey}&sort=popularity`
				);
				const data = await response.json();
				fullFonts = data.items; // Store complete catalog for searching
				fonts = data.items.slice(0, 500); // Show only first 100 popular fonts initially
			} catch (error) {
				console.error('Failed to fetch Google Fonts:', error);
				fonts = defaultSampleFonts;
				fullFonts = defaultSampleFonts;
			}
		} else {
			fonts = defaultSampleFonts;
			fullFonts = defaultSampleFonts;
		}

		// Pre-select current value if it exists
		if (value) {
			const currentFont = fonts.find((f) => f.family === value);
			if (currentFont) {
				selectedFont = currentFont;
				// Initialize subset and variant from the font or defaults
				selectedSubset = currentFont.selectedSubset || currentFont.subsets[0] || 'latin';
				selectedVariant = currentFont.selectedVariant || 'regular';
			}
		}

		// Load CSS for all fonts so font names display in their own fonts
		fonts.forEach((font) => loadFontCSS(font.family));

		loading = false;
	}

	function loadFontCSS(fontFamily: string, variant: string = '400') {
		if (loadedFonts.has(fontFamily)) return;
		if (fontLoading.has(fontFamily)) return;

		fontLoading.add(fontFamily);

		const link = document.createElement('link');
		link.rel = 'stylesheet';
		link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontFamily)}:wght@${variant}&display=swap`;

		link.onload = () => {
			loadedFonts.add(fontFamily);
			fontLoading.delete(fontFamily);
		};

		link.onerror = () => {
			fontLoading.delete(fontFamily);
		};

		document.head.appendChild(link);
	}

	function selectFont(font: GoogleFont | null) {
		if (font) {
			selectedFont = font;
			// Initialize subset and variant selections
			selectedSubset = font.selectedSubset || font.subsets[0] || 'latin';
			selectedVariant = font.selectedVariant || 'regular';
			value = font.family;
			if (type === 'main') {
				app_state.main_font = { ...font, selectedSubset, selectedVariant };
			} else {
				app_state.sub_font = { ...font, selectedSubset, selectedVariant };
			}
			// Load the font with selected variant
			loadFontCSS(font.family, selectedVariant === 'regular' ? '400' : selectedVariant);
		} else {
			selectedFont = null;
			value = '';
			if (type === 'main') {
				app_state.main_font = null;
			} else {
				app_state.sub_font = null;
			}
		}
	}

	// External function to update subset - can be called from parent
	export function updateSubset(subset: string) {
		selectedSubset = subset;
		if (selectedFont) {
			selectedFont = { ...selectedFont, selectedSubset: subset };
			if (type === 'main') {
				app_state.main_font = selectedFont;
			} else {
				app_state.sub_font = selectedFont;
			}
			// No need to reload font for subset changes as all subsets are loaded together
		}
	}

	// External function to update variant - can be called from parent
	export function updateVariant(variant: string) {
		selectedVariant = variant;
		if (selectedFont) {
			selectedFont = { ...selectedFont, selectedVariant: variant };
			if (type === 'main') {
				app_state.main_font = selectedFont;
			} else {
				app_state.sub_font = selectedFont;
			}
			// Reload font with new variant
			loadFontCSS(selectedFont.family, variant === 'regular' ? '400' : variant);
		}
	}

	const filteredFonts = $derived(fonts);
</script>

<Sheet.Root bind:open>
	<Sheet.Trigger>
		<Button variant="outline" class="w-full justify-between font-normal">
			<span
				class={value ? '' : 'text-muted-foreground'}
				style={value ? `font-family: '${value}', sans-serif` : ''}
			>
				{value || triggerText}
			</span>
			<ChevronDown class="ml-2 h-4 w-4 text-muted-foreground" />
		</Button>
	</Sheet.Trigger>

	<Sheet.Content side="bottom" class="flex h-[59vh] w-full flex-col">
		<div class="flex flex-1 flex-col gap-4 overflow-hidden px-3 py-4">
			<!-- Search Input -->
			<div class="relative">
				<Search class="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
				<Input
					tabindex="-1"
					autofocus={false}
					value={searchQuery}
					oninput={handleSearchInput}
					placeholder="Search fonts..."
					class="pl-9"
				/>
			</div>

			<!-- Font List -->
			<div class="flex-1 overflow-y-auto rounded-md border">
				{#if loading}
					<div class="p-4 text-center text-muted-foreground">Loading fonts...</div>
				{:else}
					<div class="divide-y">
						<!-- Default Option -->
						<button
							class={cn(
								'flex w-full items-center justify-between px-4 py-3 text-left transition-colors',
								'hover:bg-accent hover:text-accent-foreground',
								selectedFont === null && 'bg-accent text-accent-foreground'
							)}
							onclick={() => selectFont(null)}
						>
							<span class="text-base">Default</span>
							{#if selectedFont === null}
								<Check class="h-4 w-4 text-primary" />
							{/if}
						</button>
						{#each filteredFonts as font (font.family)}
							<button
								class={cn(
									'flex w-full items-center justify-between px-4 py-3 text-left transition-colors',
									'hover:bg-accent hover:text-accent-foreground',
									selectedFont?.family === font.family && 'bg-accent text-accent-foreground'
								)}
								onclick={() => selectFont(font)}
							>
								<span class="text-base" style="font-family: '{font.family}', sans-serif;">
									{font.family}
								</span>
								{#if selectedFont?.family === font.family}
									<Check class="h-4 w-4 text-primary" />
								{/if}
							</button>
						{/each}
						<!-- {:else }
					<div class="p-4 text-center text-muted-foreground">No fonts found</div> -->
					</div>
				{/if}
			</div>
		</div>
	</Sheet.Content>
</Sheet.Root>
