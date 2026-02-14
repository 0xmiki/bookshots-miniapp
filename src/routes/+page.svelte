<script lang="ts">
	import BookCard from '$lib/components/book-card.svelte';
	import HighlightCard from '$lib/components/highlight-card.svelte';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Tabs from '$lib/components/ui/tabs/index.js';
	const { Root: TabsRoot, List: TabsList, Trigger: TabsTrigger, Content: TabsContent } = Tabs;
	import { init } from '$lib/functions/init';
	import { app_state } from '$lib/state/state.svelte';
	import type { Book } from '$lib/types';
	import { BookOpen, Quote, Library, Zap } from '@lucide/svelte';
	import { goto } from '$app/navigation';

	// Group highlights by book
	let books = $derived(
		(() => {
			const grouped = new Map<string, Book>();
			if (!app_state.profile) {
				return [];
			}
			for (const highlight of app_state.profile.highlights) {
				const key = `${highlight.author}::${highlight.title}`;

				if (grouped.has(key)) {
					grouped.get(key)!.highlights += 1;
				} else {
					grouped.set(key, {
						author: highlight.author,
						title: highlight.title,
						highlights: 1
					});
				}
			}

			return Array.from(grouped.values());
		})()
	);

	// Get recent highlights with pagination
	let displayedCount = $state(5);
	let recentHighlights = $derived(app_state.profile?.highlights.slice(0, displayedCount) ?? []);

	// Calculate stats
	let totalHighlights = $derived(app_state.profile?.highlights.length ?? 0);
	let totalBooks = $derived(books.length);
	let hasMoreHighlights = $derived(displayedCount < (app_state.profile?.highlights.length ?? 0));

	function loadMore() {
		if (hasMoreHighlights) {
			displayedCount += 5;
		}
	}

	// Intersection observer for infinite scroll
	let sentinel: HTMLDivElement;
	$effect(() => {
		if (!sentinel || !hasMoreHighlights) return;

		const observer = new IntersectionObserver(
			(entries) => {
				if (entries[0]?.isIntersecting) {
					loadMore();
				}
			},
			{ threshold: 0.1 }
		);

		observer.observe(sentinel);

		return () => observer.disconnect();
	});
</script>

{#if app_state.profile}
	<div class="flex flex-col gap-4 px-4 pt-4 pb-8">
		<!-- Simple stats row -->
		<div class="flex gap-3">
			<Card.Root class="flex-1">
				<Card.Header class="flex flex-row items-center justify-between space-y-0  ">
					<Card.Title class="text-sm font-medium">Books</Card.Title>
					<BookOpen class="h-4 w-4 text-muted-foreground" />
				</Card.Header>
				<Card.Content>
					<p class="text-2xl font-bold">{totalBooks}</p>
				</Card.Content>
			</Card.Root>
			<Card.Root class="flex-1">
				<Card.Header class="flex flex-row items-center justify-between space-y-0 ">
					<Card.Title class="text-sm font-medium">Highlights</Card.Title>
					<Quote class="h-4 w-4 text-muted-foreground" />
				</Card.Header>
				<Card.Content>
					<p class="text-2xl font-bold">{totalHighlights}</p>
				</Card.Content>
			</Card.Root>
		</div>

		<!-- Custom Quote Button -->
		<Button
			variant="outline"
			class="w-full gap-2"
			onclick={() => goto('/book/custom/highlight/custom_quote')}
		>
			<Zap class="h-4 w-4" />
			<span>Create Custom Quote</span>
		</Button>

		<!-- Tabs for Books and Recent Highlights -->
		<TabsRoot value="books" class="w-full">
			<TabsList class="grid w-full grid-cols-2">
				<TabsTrigger value="books" class="gap-2">
					<Library class="h-4 w-4" />
					Books
				</TabsTrigger>
				<TabsTrigger value="highlights" class="gap-2">
					<Quote class="h-4 w-4" />
					Recent
				</TabsTrigger>
			</TabsList>
			<TabsContent value="books" class="mt-4">
				{#if books.length === 0}
					<div class="flex flex-col items-center justify-center py-12 text-center">
						<BookOpen class="mb-3 h-10 w-10 text-muted-foreground" />
						<p class="text-sm text-muted-foreground">No books yet</p>
					</div>
				{:else}
					<div class="grid gap-3">
						{#each books as book}
							<BookCard {book} />
						{/each}
					</div>
				{/if}
			</TabsContent>
			<TabsContent value="highlights" class="mt-4">
				{#if recentHighlights.length === 0}
					<div class="flex flex-col items-center justify-center py-12 text-center">
						<Quote class="mb-3 h-10 w-10 text-muted-foreground" />
						<p class="text-sm text-muted-foreground">No highlights yet</p>
					</div>
				{:else}
					<div class="flex flex-col gap-4">
						{#each recentHighlights as highlight}
							<HighlightCard {highlight} />
						{/each}
						<!-- Sentinel for infinite scroll -->
						{#if hasMoreHighlights}
							<div bind:this={sentinel} class="h-4 w-full" />
						{/if}
					</div>
				{/if}
			</TabsContent>
		</TabsRoot>
	</div>
{:else}
	<div class="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
		<p class="text-muted-foreground">No profile found.</p>
		<p class="text-sm text-muted-foreground">Something went wrong.</p>
		<Button onclick={() => init()} variant="outline">Try Again</Button>
	</div>
{/if}
