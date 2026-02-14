<script lang="ts">
	import type { Highlight } from '$lib/types';
	import HighlightCard from './highlight-card.svelte';

	let { highlights }: { highlights: Highlight[] } = $props();
</script>

<div class="flex w-full flex-col gap-4">
	{#if highlights.length === 0}
		<p class="py-10 text-center text-muted-foreground">No highlights found matching your search.</p>
	{:else}
		<div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
			{#each highlights as highlight}
				<HighlightCard {highlight} />
			{/each}
		</div>
	{/if}
</div>
