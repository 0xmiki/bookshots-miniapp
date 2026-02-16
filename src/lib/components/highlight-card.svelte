<script lang="ts">
	import type { Highlight } from '$lib/types';
	import { app_state, THEME_PRESETS, type ThemePreset } from '$lib/state/state.svelte';
	import Button from './ui/button/button.svelte';
	import { Image } from '@lucide/svelte';
	import { goto } from '$app/navigation';
	import { getTextDirection } from '$lib/utils/rtl';
	import Checkbox from './ui/checkbox/checkbox.svelte';

	let { highlight }: { highlight: Highlight } = $props();

	// Calculate optimal font size based on text length (simplified for DOM)
	function calculateFontSize(text: string): number {
		const length = text.length;
		if (length <= 50) return 32;
		if (length <= 100) return 28;
		if (length <= 200) return 24;
		if (length <= 400) return 20;
		return 18;
	}

	// Calculate optimal card width based on text length
	function calculateCardWidth(text: string): string {
		const length = text.length;
		if (length <= 100) return 'min(400px, 90vw)';
		if (length <= 300) return 'min(500px, 90vw)';
		if (length <= 600) return 'min(600px, 90vw)';
		return 'min(700px, 90vw)';
	}

	// Safe theme lookup with fallback to charcoal
	function getTheme(): ThemePreset {
		const themeId = app_state.highlight_theme || 'charcoal';
		return THEME_PRESETS.find((t) => t.id === themeId) || THEME_PRESETS[9];
	}

	let fontSize = $derived(calculateFontSize(highlight.text || ''));
	let cardWidth = $derived(calculateCardWidth(highlight.text || ''));
	let theme = $derived(getTheme());
	let textDirection = $derived(getTextDirection(highlight.text || ''));

	// Get CSS gradient or solid color for theme
	function getThemeBackground(theme: ThemePreset): string {
		if (theme.type === 'solid') {
			return theme.colors[0];
		}
		return `linear-gradient(135deg, ${theme.colors.join(', ')})`;
	}

	function add_or_remove_id(highlightId: string) {
		if (!app_state.highlight_ids_to_delete) {
			app_state.highlight_ids_to_delete = [];
		}
		const index = app_state.highlight_ids_to_delete.indexOf(highlightId);
		if (index === -1) {
			app_state.highlight_ids_to_delete.push(highlightId);
		} else {
			app_state.highlight_ids_to_delete.splice(index, 1);
		}
	}
</script>

<div class="flex w-full items-center justify-center gap-3">
	<div
		class="cursor-pointer overflow-hidden rounded-xl {app_state.delete_mode &&
		app_state.highlight_ids_to_delete?.includes(highlight.$id || '')
			? 'ring-2 ring-destructive'
			: ''} shadow-lg transition-all duration-300 hover:shadow-xl"
		style="width: {cardWidth}; background: {getThemeBackground(
			theme
		)}; color: {theme.textColor}; font-family: 'serif'; font-size: {fontSize}px; line-height: 1.4; direction: {textDirection};"
		onclick={() => {
			if (app_state.delete_mode) {
				add_or_remove_id(highlight.$id);
				return;
			} else {
				const bookKey = `${highlight.author}::${highlight.title}`;
				goto(`/book/${bookKey}/highlight/${highlight.$id}`);
			}
		}}
		onkeydown={(e) => {
			if (e.key === 'Enter' || e.key === ' ') {
				e.preventDefault();
				if (app_state.delete_mode) {
					add_or_remove_id(highlight.$id);
					return;
				} else {
					const bookKey = `${highlight.author}::${highlight.title}`;
					goto(`/book/${bookKey}/highlight/${highlight.$id}`);
				}
			}
		}}
		role="button"
		tabindex="0"
	>
		<div class="px-4 py-3">
			<p class="leading-relaxed wrap-break-word whitespace-pre-wrap">{highlight.text || ''}</p>
		</div>
	</div>
	<!-- only show this when user is in deleting mode -->
	{#if app_state.delete_mode}
		<Checkbox
			checked={app_state.highlight_ids_to_delete?.includes(highlight.$id || '')}
			onCheckedChange={() => add_or_remove_id(highlight.$id || '')}
		/>
	{/if}
</div>
