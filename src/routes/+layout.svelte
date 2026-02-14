<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import LoadingScreen from '$lib/components/loading-screen.svelte';
	import { init } from '$lib/functions/init';
	import { app_state } from '$lib/state/state.svelte';
	import { goto } from '$app/navigation';
	import { findHighlightById, getBookKey } from '$lib/utils/storage';
	import { Toaster } from '$lib/components/ui/sonner';
	import { toast } from 'svelte-sonner';

	let { children } = $props();

	// Track if we've processed a deep link to prevent multiple redirects
	let hasProcessedDeepLink = $state(false);

	$effect(() => {
		if (window.Telegram?.WebApp && !app_state.profile) {
			console.log('initing');

			init();
		}
	});

	// Handle deep links from Telegram - redirect to highlight page
	$effect(() => {
		// Only process after profile is loaded and we haven't processed a deep link yet
		if (
			hasProcessedDeepLink ||
			!app_state.profile ||
			!window.Telegram?.WebApp?.initDataUnsafe?.start_param
		) {
			return;
		}

		const highlightId = window.Telegram.WebApp.initDataUnsafe.start_param;

		if (highlightId && highlightId.length > 0) {
			hasProcessedDeepLink = true;
			console.log('Deep link detected, redirecting to highlight:', highlightId);

			// Set redirecting state to show the redirecting loading screen
			app_state.redirecting_to_highlight = true;

			// Find the highlight from the profile to get book info
			const highlight = findHighlightById(app_state.profile?.highlights, highlightId);

			if (highlight) {
				// Build the book key from author and title
				const bookKey = getBookKey(highlight.author, highlight.title);
				console.log('Found highlight, navigating to book:', bookKey);

				// Clear the start_param so it doesn't trigger again
				window.Telegram.WebApp.initDataUnsafe.start_param = undefined;

				// Navigate to the highlight page with the correct book path
				goto(`/book/${encodeURIComponent(bookKey)}/highlight/${highlightId}`).then(() => {
					app_state.redirecting_to_highlight = false;
				});
			} else {
				console.warn('Highlight not found for ID:', highlightId);
				// Show error toast
				toast.error('Highlight not found', {
					description: 'The highlight you are looking for does not exist.',
					duration: 3000
				});

				// Clear the start_param and redirecting state
				window.Telegram.WebApp.initDataUnsafe.start_param = undefined;

				// Wait for toast to show, then redirect to main page
				setTimeout(() => {
					app_state.redirecting_to_highlight = false;
					// Navigate to main page
					goto('/');
				}, 1000);
			}
		}
	});
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

<Toaster />

{#if app_state.loading_profile || app_state.redirecting_to_highlight}
	<LoadingScreen
		title={app_state.redirecting_to_highlight
			? 'Taking you to your highlight'
			: 'Welcoming you back'}
		description={app_state.redirecting_to_highlight ? 'Please wait...' : 'Please wait a moment...'}
	/>
{:else}
	{@render children()}
{/if}
