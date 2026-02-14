<script lang="ts">
	import Button from './ui/button/button.svelte';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import type { Book } from '$lib/types';
	import { SquareArrowOutUpRight } from '@lucide/svelte';
	import { goto } from '$app/navigation';
	let { book }: { book: Book } = $props();
</script>

<Card.Root
	onclick={() => goto(`/book/${encodeURIComponent(book.author + '::' + book.title)}`)}
	class="group relative flex flex-row items-center justify-between overflow-hidden border-border/50  transition-all"
>
	<div class="min-w-0 flex-1 py-3 pl-4">
		<Card.Title class="truncate text-base font-semibold">
			{book.title}
		</Card.Title>
		<Card.Description class="truncate">
			{book.author}
		</Card.Description>
	</div>
	<div class="flex items-center gap-2 pr-4">
		<Badge variant="secondary" class="text-xs">
			{book.highlights}
		</Badge>
		<!-- <Button
			variant="ghost"
			size="icon"
		>
			<SquareArrowOutUpRight class="h-4 w-4" />
		</Button> -->
	</div>
</Card.Root>
