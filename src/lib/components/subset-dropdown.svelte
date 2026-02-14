<script lang="ts">
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import { Button } from '$lib/components/ui/button';
	import { ChevronDown } from '@lucide/svelte';
	import type { GoogleFont } from '$lib/types';

	interface Props {
		font: GoogleFont | null;
		selectedSubset: string;
		onValueChange: (value: string) => void;
	}

	let { font, selectedSubset, onValueChange }: Props = $props();
</script>

<DropdownMenu.Root>
	<DropdownMenu.Trigger disabled={!font}>
		<Button variant="outline" class="min-w-[100px] justify-between font-normal" disabled={!font}>
			<span class={font ? '' : 'text-muted-foreground'}>
				{font ? selectedSubset : 'Subset'}
			</span>
			<ChevronDown class="ml-2 h-4 w-4 text-muted-foreground" />
		</Button>
	</DropdownMenu.Trigger>
	<DropdownMenu.Content class="max-h-[300px] overflow-y-auto">
		<DropdownMenu.RadioGroup value={selectedSubset} {onValueChange}>
			{#if font}
				{#each font.subsets as subset}
					<DropdownMenu.RadioItem value={subset}>
						{subset}
					</DropdownMenu.RadioItem>
				{/each}
			{/if}
		</DropdownMenu.RadioGroup>
	</DropdownMenu.Content>
</DropdownMenu.Root>
