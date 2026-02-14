<script lang="ts">
	import { Loader2 } from '@lucide/svelte';

	let { title = 'Loading your highlights', description = 'Please wait a moment...' } = $props();
</script>

<div class="flex min-h-screen w-full items-center justify-center bg-background">
	<div class="flex flex-col items-center gap-4">
		<div class="relative">
			<div class="h-12 w-12 animate-spin rounded-full border-4 border-muted border-t-primary"></div>
		</div>
		<div class="flex flex-col items-center gap-1 text-center">
			<p class="text-sm font-medium text-foreground">{title}</p>
			<p class="text-xs text-muted-foreground">{description}</p>
		</div>
	</div>
</div>
