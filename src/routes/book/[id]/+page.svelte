<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import HighlightCarosel from '$lib/components/highlight-carosel.svelte';
	import SearchResults from '$lib/components/search-results.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { delete_highlight } from '$lib/functions/highlight';
	import { app_state, THEME_PRESETS } from '$lib/state/state.svelte';
	import type { Book, Highlight } from '$lib/types';
	import {
		Filter,
		GalleryHorizontal,
		GalleryVertical,
		Palette,
		SortAsc,
		SortDesc,
		Trash2,
		Check,
		X
	} from '@lucide/svelte';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import {
		getBookSettings,
		saveSortBy,
		saveViewMode,
		saveBookTheme,
		type SortOption,
		type ViewMode
	} from '$lib/utils/storage';

	let searchQuery = $state('');
	type LocalSortOption = SortOption;
	let sortBy = $state<LocalSortOption>('page-asc');
	let viewMode = $state<ViewMode>('vertical');
	let carouselIndex = $state(0);

	// Get book key from page params
	let bookKey = $derived(page.params.id);

	// Get the specific book and its highlights
	let bookData = $derived(
		(() => {
			if (!app_state.profile) {
				return null;
			}

			const bookKey = page.params.id; // "author::title"

			// Filter highlights for this specific book
			let bookHighlights = app_state.profile.highlights.filter(
				(h) => `${h.author}::${h.title}` === bookKey
			);

			if (bookHighlights.length === 0) {
				return null;
			}

			// Build book object from first highlight
			const book: Book = {
				author: bookHighlights[0].author,
				title: bookHighlights[0].title,
				highlights: bookHighlights.length
			};

			// Apply sorting
			bookHighlights = [...bookHighlights].sort((a, b) => {
				if (sortBy === 'page-asc') return (a.pageno || 0) - (b.pageno || 0);
				if (sortBy === 'page-desc') return (b.pageno || 0) - (a.pageno || 0);
				if (sortBy === 'date-asc')
					return new Date(a.$createdAt || 0).getTime() - new Date(b.$createdAt || 0).getTime();
				if (sortBy === 'date-desc')
					return new Date(b.$createdAt || 0).getTime() - new Date(a.$createdAt || 0).getTime();
				return 0;
			});

			// Apply search
			const filteredHighlights = searchQuery
				? bookHighlights.filter((h) => h.text.toLowerCase().includes(searchQuery.toLowerCase()))
				: bookHighlights;

			return { book, bookHighlights, filteredHighlights };
		})()
	);

	// Get all highlight IDs for the current book (for select all functionality)
	let currentBookHighlightIds = $derived(
		bookData?.bookHighlights.map((h) => h.$id).filter(Boolean) || []
	);

	// Calculate selected count
	let selectedCount = $derived(app_state.highlight_ids_to_delete?.length || 0);

	// Select all highlights in current book
	function selectAllHighlights() {
		app_state.highlight_ids_to_delete = [...currentBookHighlightIds];
	}

	// Deselect all highlights
	function deselectAllHighlights() {
		app_state.highlight_ids_to_delete = [];
	}

	// Delete selected highlights
	async function deleteSelectedHighlights() {
		const idsToDelete = app_state.highlight_ids_to_delete || [];
		for (const highlightId of idsToDelete) {
			await delete_highlight(highlightId);
		}
		// Reset selection after deletion
		app_state.highlight_ids_to_delete = [];
		app_state.delete_mode = false;
	}

	// Find duplicate highlights in current book (based on text content)
	let duplicateCount = $derived(
		(() => {
			if (!bookData?.bookHighlights) return 0;
			const textCounts: Record<string, number> = {};
			for (const h of bookData.bookHighlights) {
				const text = h.text?.toLowerCase().trim() || '';
				if (text) {
					textCounts[text] = (textCounts[text] || 0) + 1;
				}
			}
			// Count total duplicates (all extras beyond the first occurrence)
			return Object.values(textCounts).reduce((sum, count) => sum + (count > 1 ? count - 1 : 0), 0);
		})()
	);

	// Delete duplicate highlights, keeping only one copy
	async function deleteDuplicates() {
		if (!bookData?.bookHighlights) return;

		// Group highlights by text content
		const textToHighlights: Record<string, Highlight[]> = {};
		for (const h of bookData.bookHighlights) {
			const text = h.text?.toLowerCase().trim() || '';
			if (text) {
				if (!textToHighlights[text]) {
					textToHighlights[text] = [];
				}
				textToHighlights[text].push(h);
			}
		}

		// Delete all duplicates except the first one for each text
		for (const highlights of Object.values(textToHighlights)) {
			if (highlights.length > 1) {
				// Keep the first one, delete the rest
				for (let i = 1; i < highlights.length; i++) {
					await delete_highlight(highlights[i].$id);
				}
			}
		}
	}

	// let allbooks = $derived(() => {
	// 	if (!app_state.profile) {
	// 		return [];
	// 	}
	// 	const booksMap: Record<string, Book> = {};
	// 	app_state.profile.highlights.forEach((h) => {
	// 		const key = `${h.author}::${h.title}`;
	// 		if (!booksMap[key]) {
	// 			booksMap[key] = { author: h.author, title: h.title, highlights: 0 };
	// 		}
	// 		booksMap[key].highlights += 1;
	// 	});
	// 	return Object.values(booksMap);
	// });

	$effect(() => {
		const backButton = window.Telegram?.WebApp?.BackButton;
		if (backButton) {
			backButton.show();
			backButton.onClick(() => goto('/'));
		}
		return () => {
			backButton?.hide();
		};
	});

	// Load settings from localStorage when bookKey changes
	$effect(() => {
		if (bookKey) {
			const settings = getBookSettings(bookKey);
			sortBy = settings.sortBy;
			viewMode = settings.viewMode;
			carouselIndex = settings.carouselIndex;
			// Apply theme from storage
			app_state.highlight_theme = settings.theme;
		}
	});

	// Save sortBy to localStorage when it changes
	$effect(() => {
		if (bookKey && sortBy) {
			saveSortBy(bookKey, sortBy);
		}
	});

	// Save viewMode to localStorage when it changes
	$effect(() => {
		if (bookKey && viewMode) {
			saveViewMode(bookKey, viewMode);
		}
	});

	// Save theme to localStorage when it changes
	$effect(() => {
		if (bookKey && app_state.highlight_theme) {
			saveBookTheme(bookKey, app_state.highlight_theme);
		}
	});
</script>

{#if bookData}
	<div class="flex flex-col gap-3 px-2 pt-5">
		<div class="flex flex-row items-center justify-between gap-3 rounded-lg p-4">
			<!-- <p class="text-lg">{bookData.book.title} by {bookData.book.author}</p> -->
			<!-- <ButtonGroup>
				<Button variant="outline" onclick={() => goto('/')}>Back</Button>
				<Button variant="outline" size="icon"><List /></Button>
			</ButtonGroup> -->
			<!-- make it have a settings button and make it hide  -->
			<DropdownMenu.Root>
				<DropdownMenu.Trigger>
					{#snippet child({ props })}
						<Button {...props} variant="outline"><Filter /></Button>
					{/snippet}
				</DropdownMenu.Trigger>
				<DropdownMenu.Content class="w-56" align="start">
					<DropdownMenu.Label>Sort Highlights</DropdownMenu.Label>
					<DropdownMenu.Group>
						<DropdownMenu.CheckboxItem
							checked={sortBy === 'page-desc'}
							onCheckedChange={() => (sortBy = 'page-desc')}
						>
							Page <SortDesc />
						</DropdownMenu.CheckboxItem>
						<DropdownMenu.CheckboxItem
							checked={sortBy === 'page-asc'}
							onCheckedChange={() => (sortBy = 'page-asc')}
						>
							Page <SortAsc />
						</DropdownMenu.CheckboxItem>
					</DropdownMenu.Group>
					<DropdownMenu.Separator />
					<DropdownMenu.Group>
						<DropdownMenu.CheckboxItem
							checked={sortBy === 'date-desc'}
							onCheckedChange={() => (sortBy = 'date-desc')}
						>
							Latest
						</DropdownMenu.CheckboxItem>
						<DropdownMenu.CheckboxItem
							checked={sortBy === 'date-asc'}
							onCheckedChange={() => (sortBy = 'date-asc')}
						>
							Oldest
						</DropdownMenu.CheckboxItem>
					</DropdownMenu.Group>
				</DropdownMenu.Content>
			</DropdownMenu.Root>
			<Input
				class=" w-full"
				placeholder={`Search ${bookData?.book?.title || 'Highlights'}`}
				bind:value={searchQuery}
			/>
			<div class="flex gap-2">
				<DropdownMenu.Root>
					<DropdownMenu.Trigger>
						{#snippet child({ props })}
							<Button {...props} variant="outline"><Palette /></Button>
						{/snippet}
					</DropdownMenu.Trigger>
					<DropdownMenu.Content class="w-56" align="end">
						<DropdownMenu.Label>Theme</DropdownMenu.Label>
						<DropdownMenu.Group>
							{#each THEME_PRESETS as theme}
								<DropdownMenu.CheckboxItem
									checked={app_state.highlight_theme === theme.id}
									onCheckedChange={() => (app_state.highlight_theme = theme.id)}
								>
									<div class="flex items-center gap-2">
										{#if theme.type === 'solid'}
											<div
												class="h-4 w-4 rounded-sm border border-gray-300"
												style="background-color: {theme.preview};"
											></div>
										{:else}
											<div
												class="h-4 w-4 rounded-sm border border-gray-300"
												style="background: {theme.preview};"
											></div>
										{/if}
										<span>{theme.name}</span>
									</div>
								</DropdownMenu.CheckboxItem>
							{/each}
						</DropdownMenu.Group>
					</DropdownMenu.Content>
				</DropdownMenu.Root>
				<Button
					size="icon"
					variant="outline"
					onclick={() => (viewMode = viewMode === 'carousel' ? 'vertical' : 'carousel')}
				>
					{#if viewMode === 'carousel'}
						<GalleryVertical />
					{:else}
						<GalleryHorizontal />
					{/if}
				</Button>
				<Button
					onclick={() => (app_state.delete_mode = !app_state.delete_mode)}
					size="icon"
					variant={app_state.delete_mode ? 'destructive' : 'outline'}
				>
					{#if app_state.delete_mode}
						<X />
					{:else}
						<Trash2 />
					{/if}
				</Button>
			</div>
		</div>
		<!-- Delete mode submenu -->
		{#if app_state.delete_mode}
			<div
				class="flex flex-row items-center justify-between gap-3 rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-2"
			>
				<div class="flex items-center gap-2">
					{#if selectedCount > 0}
						<Button variant="outline" size="sm" onclick={deselectAllHighlights}>
							<Check class="mr-1 h-4 w-4" />
							Deselect All
						</Button>
					{:else}
						<Button variant="outline" size="sm" onclick={selectAllHighlights}>
							<Check class="mr-1 h-4 w-4" />
							Select All
						</Button>
					{/if}
				</div>
				<div class="flex items-center gap-2 text-sm text-destructive">
					<span>{selectedCount} highlight{selectedCount !== 1 ? 's' : ''}</span>
				</div>
				<Button
					size="sm"
					variant="destructive"
					disabled={selectedCount === 0}
					onclick={deleteSelectedHighlights}
				>
					<Trash2 class="mr-1 h-4 w-4" />
					Delete
				</Button>
			</div>
		{/if}
		<!-- Delete duplicates row - always visible when duplicates detected -->
		{#if duplicateCount > 0}
			<div class="flex flex-row items-center justify-between gap-3 rounded-lg px-4 py-2">
				<div class="flex items-center gap-2 text-sm text-muted-foreground">
					<span>{duplicateCount} duplicate{duplicateCount !== 1 ? 's' : ''} detected</span>
				</div>
				<Button size="sm" variant="outline" onclick={deleteDuplicates}>
					<Trash2 class="mr-1 h-4 w-4" />
					Delete Duplicates
				</Button>
			</div>
		{/if}

		{#if searchQuery}
			<div class="mt-2 px-4">
				<SearchResults highlights={bookData.filteredHighlights} />
			</div>
		{:else}
			<div class="mt-2 flex w-full items-center justify-center">
				<HighlightCarosel highlights={bookData.bookHighlights} mode={viewMode} {carouselIndex} />
			</div>
		{/if}
	</div>
	<!-- Might be distracting... why would a user want to switch between books... usually they read one at a time -->
	<!-- <div class="absolute bottom-0 w-full border-card bg-card px-2 py-1">
		<ScrollArea orientation="horizontal" class="w-full">
			<div class="flex min-w-max flex-row gap-2">
				{#each allbooks() as book}
					<Button
						onclick={() => goto(`/book/${book.author}::${book.title}`)}
						variant={`${book.author}::${book.title}` === page.params.id ? 'default' : 'outline'}
					>
						{book.title.length > 20 ? book.title.slice(0, 17) + '...' : book.title}
					</Button>
				{/each}
			</div>
		</ScrollArea>
	</div> -->
{:else}
	<p>Something went wrong</p>
{/if}
