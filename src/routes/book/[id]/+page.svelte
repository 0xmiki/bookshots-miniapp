<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import BookCard from '$lib/components/book-card.svelte';
	import HighlightCard from '$lib/components/highlight-card.svelte';
	import HighlightCarosel from '$lib/components/highlight-carosel.svelte';
	import SearchResults from '$lib/components/search-results.svelte';
	import { Button } from '$lib/components/ui/button';
	import ButtonGroup from '$lib/components/ui/button-group/button-group.svelte';
	import { Input } from '$lib/components/ui/input';
	import { init } from '$lib/functions/init';
	import { app_state, THEME_PRESETS } from '$lib/state/state.svelte';
	import type { Book, Highlight } from '$lib/types';
	import {
		ChevronDown,
		ChevronUp,
		Filter,
		GalleryHorizontal,
		GalleryVertical,
		List,
		Palette,
		SortAsc,
		SortDesc
	} from '@lucide/svelte';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import ScrollArea from '$lib/components/ui/scroll-area/scroll-area.svelte';
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
	let viewMode = $state<ViewMode>('carousel');
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
							Date <SortDesc />
						</DropdownMenu.CheckboxItem>
						<DropdownMenu.CheckboxItem
							checked={sortBy === 'date-asc'}
							onCheckedChange={() => (sortBy = 'date-asc')}
						>
							Date <SortAsc />
						</DropdownMenu.CheckboxItem>
					</DropdownMenu.Group>
				</DropdownMenu.Content>
			</DropdownMenu.Root>
			<Input class=" w-full" placeholder="Search Highlights" bind:value={searchQuery} />
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
			</div>
		</div>
	</div>

	{#if searchQuery}
		<div class="mt-2 px-4">
			<SearchResults highlights={bookData.filteredHighlights} />
		</div>
	{:else}
		<div class="mt-2 flex w-full items-center justify-center">
			<HighlightCarosel highlights={bookData.bookHighlights} mode={viewMode} {carouselIndex} />
		</div>
	{/if}
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
