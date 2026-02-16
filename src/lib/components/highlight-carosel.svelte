<script lang="ts">
	import { goto } from '$app/navigation';
	import * as Carousel from '$lib/components/ui/carousel/index.js';
	import type { CarouselAPI } from '$lib/components/ui/carousel/context.js';
	import type { Highlight } from '$lib/types';
	import { ImagePlus, SquarePen } from '@lucide/svelte';
	import HighlightCard from './highlight-card.svelte';
	import { Button } from './ui/button';
	import ScrollArea from './ui/scroll-area/scroll-area.svelte';
	import { saveCarouselIndex } from '$lib/utils/storage';

	let {
		highlights,
		mode = 'carousel',
		carouselIndex = 0
	}: { highlights: Highlight[]; mode?: 'carousel' | 'vertical'; carouselIndex?: number } = $props();

	// Get book key for saving carousel index
	let bookKey = $derived(
		highlights.length > 0 ? `${highlights[0].author}::${highlights[0].title}` : ''
	);

	// Store carousel API
	let api: CarouselAPI | undefined = $state(undefined);
	let initialized = $state(false);
	let lastBookKey = $state('');

	// Set up API and listen for select events
	function handleApiSet(newApi: CarouselAPI | undefined) {
		api = newApi;
		if (api) {
			// Listen for select events
			api.on('select', () => {
				const index = api?.selectedScrollSnap();
				if (index !== undefined && bookKey) {
					saveCarouselIndex(bookKey, index);
				}
			});

			// Scroll to saved position after initialization
			if (carouselIndex > 0 && !initialized) {
				setTimeout(() => {
					api?.scrollTo(carouselIndex, true);
					initialized = true;
				}, 50);
			} else {
				initialized = true;
			}
		}
	}

	// React to carouselIndex prop changes (when navigating from bottom bar)
	$effect(() => {
		if (api && carouselIndex >= 0 && initialized) {
			const currentIndex = api.selectedScrollSnap();
			if (currentIndex !== carouselIndex) {
				initialized = false; // Allow re-initialization scroll
				setTimeout(() => {
					api?.scrollTo(carouselIndex, true);
					initialized = true;
				}, 50);
			}
		}
	});

	// Reset initialized flag when bookKey changes (navigation between books)
	$effect(() => {
		if (bookKey && bookKey !== lastBookKey) {
			initialized = false;
			lastBookKey = bookKey;
		}
	});

	// Handle scroll to saved index in vertical mode
	$effect(() => {
		if (mode === 'vertical' && highlights.length > 0 && carouselIndex > 0) {
			const targetHighlight = highlights[carouselIndex];
			if (targetHighlight) {
				setTimeout(() => {
					const element = document.getElementById(`highlight-${targetHighlight.$id}`);
					if (element) {
						element.scrollIntoView({ behavior: 'smooth', block: 'center' });
					}
				}, 100);
			}
		}
	});
</script>

{#if mode === 'carousel'}
	<!-- Horizontal Carousel View -->
	<Carousel.Root class=" h-[80vh] w-[95%] " opts={{ duration: 0 }} setApi={handleApiSet}>
		<ScrollArea orientation="vertical" class="h-[80vh] w-full">
			<Carousel.Content>
				{#each highlights as highlight, i}
					<Carousel.Item>
						<HighlightCard {highlight} />

						<div class=" flex items-center justify-between px-2 py-1">
							<p class="text-xs text-muted-foreground">{i + 1} of {highlights.length}</p>
							<Button
								variant="outline"
								class=" mt-1 rounded-full"
								size="icon"
								onclick={() =>
									goto(`/book/${highlight.author}::${highlight.title}/highlight/${highlight.$id}`)}
							>
								<ImagePlus />
							</Button>
							<p class="text-xs text-muted-foreground">Page {highlight.pageno}</p>
						</div>
					</Carousel.Item>
				{/each}
			</Carousel.Content>
		</ScrollArea>
	</Carousel.Root>
{:else}
	<!-- Vertical Scroll View -->
	<ScrollArea class="h-[80vh] w-[83%]" orientation="vertical">
		<div class="flex flex-col gap-4 py-2">
			{#each highlights as highlight, i}
				<div id="highlight-{highlight.$id}" class="cursor-pointer">
					<HighlightCard {highlight} />
				</div>
			{/each}
		</div>
	</ScrollArea>
{/if}
