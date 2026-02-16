<script lang="ts">
	import { page } from '$app/state';
	import { app_state } from '$lib/state/state.svelte';
	import type { Highlight } from '$lib/types';
	import * as Tabs from '$lib/components/ui/tabs/index.js';
	import { Input } from '$lib/components/ui/input';
	import { Textarea } from '$lib/components/ui/textarea';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import { Button } from '$lib/components/ui/button';
	import { Slider } from '$lib/components/ui/slider';
	import { calculateDynamicLayout, DEFAULT_LAYOUT_CONFIG } from '$lib/utils';
	import { getTextDirection } from '$lib/utils/rtl';
	import {
		getBookViewSettings,
		saveBookViewTheme,
		getHighlightsSession,
		saveHighlightsSession
	} from '$lib/utils/storage';
	import {
		EyeOff,
		Eye,
		Italic,
		Bold,
		Underline,
		AlignLeft,
		AlignCenter,
		AlignRight,
		Download,
		ChevronLeft,
		ChevronRight,
		ChevronUp,
		ChevronDown,
		Minus,
		Plus,
		Loader,
		RotateCcw,
		Trash,
		Image as ImageIcon,
		ArrowUp,
		ArrowDown
	} from '@lucide/svelte';
	import ButtonGroup from '$lib/components/ui/button-group/button-group.svelte';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import FontSelector from '$lib/components/font-selector.svelte';
	import SubsetDropdown from '$lib/components/subset-dropdown.svelte';
	import VariantDropdown from '$lib/components/variant-dropdown.svelte';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import type { GoogleFont } from '$lib/types';
	import { send } from 'process';
	let selected_highlight: Highlight | null = $state(null);

	// ── Font Selection State ──
	let mainFont = $state<GoogleFont | null>(null);
	let mainSubset = $state('latin');
	let mainVariant = $state('regular');
	let subFont = $state<GoogleFont | null>(null);
	let subSubset = $state('latin');
	let subVariant = $state('regular');

	let sending_highlight = $state(false);

	// Functions to update subset and variant for main font
	function updateMainSubset(subset: string) {
		mainSubset = subset;
		if (mainFont) {
			mainFont = { ...mainFont, selectedSubset: subset };
			app_state.main_font = mainFont;
		}
	}

	function updateMainVariant(variant: string) {
		mainVariant = variant;
		if (mainFont) {
			mainFont = { ...mainFont, selectedVariant: variant };
			app_state.main_font = mainFont;
			// Load font with new variant
			const link = document.createElement('link');
			link.rel = 'stylesheet';
			link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(mainFont.family)}:wght@${variant === 'regular' ? '400' : variant}&display=swap`;
			document.head.appendChild(link);
		}
	}

	// Functions to update subset and variant for sub font
	function updateSubSubset(subset: string) {
		subSubset = subset;
		if (subFont) {
			subFont = { ...subFont, selectedSubset: subset };
			app_state.sub_font = subFont;
		}
	}

	function updateSubVariant(variant: string) {
		subVariant = variant;
		if (subFont) {
			subFont = { ...subFont, selectedVariant: variant };
			app_state.sub_font = subFont;
			// Load font with new variant
			const link = document.createElement('link');
			link.rel = 'stylesheet';
			link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(subFont.family)}:wght@${variant === 'regular' ? '400' : variant}&display=swap`;
			document.head.appendChild(link);
		}
	}

	let selected_tab = $state('text-content');

	let display_text = $state('');
	let display_title = $state('');
	let display_author = $state('');
	let show_title = $state(true);
	let show_author = $state(true);
	let show_book_detail = $state(true);
	let swap_layout = $state(false);

	// ── Text Decoration State ──
	let is_bold = $state(false);
	let is_italic = $state(false);
	let is_underline = $state(false);
	let text_align: 'left' | 'center' | 'right' = $state('left');

	// ── Font Size State ──
	let custom_font_size = $state<number[]>([]);

	// ── Custom Dimensions State ──
	let custom_width = $state<number[]>([]);
	let custom_height = $state<number[]>([]);

	let canvas: HTMLCanvasElement | undefined = $state();

	async function downloadCanvas() {
		if (!canvas) return;

		// Get Telegram WebApp context
		const tg = window.Telegram?.WebApp;
		if (!tg) {
			console.error('Telegram WebApp context not found');
			return;
		}

		// Convert canvas to PNG blob
		canvas.toBlob(async (blob) => {
			if (!blob) {
				console.error('Failed to convert canvas to blob');
				return;
			}

			// Create FormData with the image
			const formData = new FormData();
			formData.append('init_data', tg.initData);
			formData.append('image', blob, `${display_title || 'highlight'}.png`);
			formData.append('title', display_title || 'Generated Image');

			try {
				sending_highlight = true;
				const apiResponse = await fetch('https://koreader-plugin-bot-server.deno.dev/send_image', {
					method: 'POST',
					body: formData
				});

				if (!apiResponse.ok) {
					throw new Error(`API request failed: ${apiResponse.statusText}`);
				}

				const result = await apiResponse.json();

				// Show success popup
				tg.showPopup({
					title: 'Success',
					message: result.message || 'Image sent to your chat!',
					buttons: [{ type: 'ok' }]
				});
			} catch (error) {
				console.error('Error sending image:', error);
				tg.showPopup({
					title: 'Error',
					message: 'Failed to send image. Please try again.',
					buttons: [{ type: 'ok' }]
				});
			} finally {
				sending_highlight = false;
			}
		}, 'image/png');
	}

	// ── Background State ──
	type BackgroundMode = 'theme' | 'image';
	let bg_mode: BackgroundMode = $state('theme');
	let text_color = $state('#1a1a1a');
	let meta_color = $state('#666666');
	let selected_theme_id = $state('minimal-light');
	let bg_image: HTMLImageElement | null = $state(null);
	let bg_image_url: string = $state('');
	let overlay_enabled = $state(false);
	let overlay_opacity = $state(0.3);
	let overlay_color = $state('#000000');
	let bg_offset_x = $state(0);
	let bg_offset_y = $state(0);
	const BG_MOVE_STEP = 20;

	// Get book key from page params
	let bookKey = $derived(page.params.id);

	// Load theme from localStorage when bookKey changes
	$effect(() => {
		if (bookKey) {
			const settings = getBookViewSettings(bookKey);
			selected_theme_id = settings.theme;
		}
	});

	// Save theme to localStorage when it changes
	$effect(() => {
		if (bookKey && selected_theme_id) {
			saveBookViewTheme(bookKey, selected_theme_id);
		}
	});

	// Load global session settings from localStorage
	$effect(() => {
		const session = getHighlightsSession();
		bg_mode = session.backgroundMode === 'url' ? 'image' : 'theme';
		bg_image_url = session.backgroundImageUrl;
		if (session.backgroundImageUrl) {
			const img = new Image();
			img.onload = () => {
				bg_image = img;
			};
			img.src = session.backgroundImageUrl;
		}
		// Load overlay settings
		overlay_enabled = session.overlayEnabled;
		overlay_opacity = session.overlayOpacity;
		overlay_color = session.overlayColor;
		// Load text colors
		text_color = session.textColor;
		meta_color = session.metaColor;
	});

	// Save global session settings when they change
	$effect(() => {
		saveHighlightsSession({
			backgroundMode: bg_mode === 'image' ? 'url' : 'color',
			backgroundImageUrl: bg_image_url,
			overlayEnabled: overlay_enabled,
			overlayOpacity: overlay_opacity,
			overlayColor: overlay_color,
			textColor: text_color,
			metaColor: meta_color
		});
	});

	// ── Theme Presets ──
	interface ThemePreset {
		id: string;
		name: string;
		type: 'solid' | 'gradient';
		colors: string[];
		textColor: string;
		metaColor: string;
		/** CSS value for the preview swatch */
		preview: string;
	}

	const THEME_PRESETS: ThemePreset[] = [
		{
			id: 'minimal-light',
			name: 'Minimal Light',
			type: 'solid',
			colors: ['#ffffff'],
			textColor: '#1a1a1a',
			metaColor: '#1a1a1a',
			preview: '#ffffff'
		},
		{
			id: 'minimal-dark',
			name: 'Minimal Dark',
			type: 'solid',
			colors: ['#1a1a2e'],
			textColor: '#e0e0e0',
			metaColor: '#e0e0e0',
			preview: '#1a1a2e'
		},
		{
			id: 'warm-paper',
			name: 'Warm Paper',
			type: 'solid',
			colors: ['#f5f0e8'],
			textColor: '#3d3229',
			metaColor: '#3d3229',
			preview: '#f5f0e8'
		},
		{
			id: 'ocean-depth',
			name: 'Ocean Depth',
			type: 'gradient',
			colors: ['#0f2027', '#203a43', '#2c5364'],
			textColor: '#e0f0ff',
			metaColor: '#e0f0ff',
			preview: 'linear-gradient(135deg, #0f2027, #203a43, #2c5364)'
		},
		{
			id: 'sunset-glow',
			name: 'Sunset Glow',
			type: 'gradient',
			colors: ['#ee9ca7', '#ffdde1'],
			textColor: '#2d1f21',
			metaColor: '#2d1f21',
			preview: 'linear-gradient(135deg, #ee9ca7, #ffdde1)'
		},
		{
			id: 'forest-mist',
			name: 'Forest Mist',
			type: 'gradient',
			colors: ['#134e5e', '#71b280'],
			textColor: '#f0fff0',
			metaColor: '#f0fff0',
			preview: 'linear-gradient(135deg, #134e5e, #71b280)'
		},
		{
			id: 'midnight-purple',
			name: 'Midnight',
			type: 'gradient',
			colors: ['#0f0c29', '#302b63', '#24243e'],
			textColor: '#e8e0ff',
			metaColor: '#e8e0ff',
			preview: 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)'
		},
		{
			id: 'golden-hour',
			name: 'Golden Hour',
			type: 'gradient',
			colors: ['#f7971e', '#ffd200'],
			textColor: '#2a1f00',
			metaColor: '#2a1f00',
			preview: 'linear-gradient(135deg, #f7971e, #ffd200)'
		},
		{
			id: 'rose-water',
			name: 'Rose Water',
			type: 'gradient',
			colors: ['#e55d87', '#5fc3e4'],
			textColor: '#ffffff',
			metaColor: '#ffffff',
			preview: 'linear-gradient(135deg, #e55d87, #5fc3e4)'
		},
		{
			id: 'charcoal',
			name: 'Charcoal',
			type: 'solid',
			colors: ['#2c2c2c'],
			textColor: '#f5f5f5',
			metaColor: '#f5f5f5',
			preview: '#2c2c2c'
		},
		{
			id: 'sage-green',
			name: 'Sage',
			type: 'solid',
			colors: ['#d4e2c8'],
			textColor: '#2d3a24',
			metaColor: '#2d3a24',
			preview: '#d4e2c8'
		},
		{
			id: 'lavender-dream',
			name: 'Lavender',
			type: 'gradient',
			colors: ['#c9d6ff', '#e2e2e2'],
			textColor: '#2a2a3d',
			metaColor: '#2a2a3d',
			preview: 'linear-gradient(135deg, #c9d6ff, #e2e2e2)'
		}
	];

	const textDirection = $derived.by(() => getTextDirection(display_text || ''));

	const layout = $derived.by(() => {
		const calculatedLayout = calculateDynamicLayout(display_text || '', DEFAULT_LAYOUT_CONFIG);
		// Use custom dimensions if set, otherwise use calculated values
		let result = { ...calculatedLayout };
		if (custom_font_size.length > 0) {
			result.fontSize = custom_font_size[0];
		}
		if (custom_width.length > 0) {
			result.cardWidth = custom_width[0];
		}
		if (custom_height.length > 0) {
			result.cardHeight = custom_height[0];
		}
		return result;
	});

	function applyTheme(theme: ThemePreset) {
		selected_theme_id = theme.id;
		text_color = theme.textColor;
		meta_color = theme.metaColor;
	}

	function handleImageUpload(event: Event) {
		const input = event.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;

		if (!file.type.startsWith('image/')) return;

		const reader = new FileReader();
		reader.onload = (e) => {
			const url = e.target?.result as string;
			bg_image_url = url;
			const img = new Image();
			img.onload = () => {
				bg_image = img;
				bg_offset_x = 0;
				bg_offset_y = 0;
			};
			img.src = url;
		};
		reader.readAsDataURL(file);
	}

	function clearImage() {
		bg_image = null;
		bg_image_url = '';
		bg_offset_x = 0;
		bg_offset_y = 0;
	}

	function changeImage() {
		// clearImage();
		// Use a small timeout to ensure the state is cleared before opening the file dialog
		const fileInput = document.getElementById('bg-image-input') as HTMLInputElement;
		if (fileInput) {
			fileInput.click();
		}
	}

	function drawCanvas() {
		if (!canvas) return;
		const ctx = canvas.getContext('2d');
		if (!ctx) return;

		const { cardWidth, cardHeight, fontSize } = layout;
		const padding = DEFAULT_LAYOUT_CONFIG.padding;

		canvas.width = cardWidth;
		canvas.height = cardHeight;

		// ── Draw Background ──
		if (bg_mode === 'image' && bg_image) {
			// Draw uploaded image covering the canvas (cover fit)
			const imgRatio = bg_image.width / bg_image.height;
			const canvasRatio = cardWidth / cardHeight;
			let drawWidth: number, drawHeight: number, offsetX: number, offsetY: number;

			if (imgRatio > canvasRatio) {
				drawHeight = cardHeight;
				drawWidth = cardHeight * imgRatio;
				offsetX = -(drawWidth - cardWidth) / 2 + bg_offset_x;
				offsetY = bg_offset_y;
			} else {
				drawWidth = cardWidth;
				drawHeight = cardWidth / imgRatio;
				offsetX = bg_offset_x;
				offsetY = -(drawHeight - cardHeight) / 2 + bg_offset_y;
			}
			ctx.drawImage(bg_image, offsetX, offsetY, drawWidth, drawHeight);

			// Optional overlay for readability
			if (overlay_enabled) {
				ctx.fillStyle =
					overlay_color +
					Math.round(overlay_opacity * 255)
						.toString(16)
						.padStart(2, '0');
				ctx.fillRect(0, 0, cardWidth, cardHeight);
			}
		} else if (bg_mode === 'image' && !bg_image) {
			// No image uploaded yet — show placeholder
			ctx.fillStyle = '#f0f0f0';
			ctx.fillRect(0, 0, cardWidth, cardHeight);
		} else {
			// Theme mode
			const theme = THEME_PRESETS.find((t) => t.id === selected_theme_id);
			if (theme) {
				if (theme.type === 'solid') {
					ctx.fillStyle = theme.colors[0];
					ctx.fillRect(0, 0, cardWidth, cardHeight);
				} else {
					const gradient = ctx.createLinearGradient(0, 0, cardWidth, cardHeight);
					theme.colors.forEach((color, i) => {
						gradient.addColorStop(i / (theme.colors.length - 1), color);
					});
					ctx.fillStyle = gradient;
					ctx.fillRect(0, 0, cardWidth, cardHeight);
				}
			}
		}

		// ── Determine text colors ──
		let currentTextColor = text_color;
		let currentMetaColor = meta_color;
		if (bg_mode === 'theme') {
			const theme = THEME_PRESETS.find((t) => t.id === selected_theme_id);
			if (theme) {
				currentTextColor = theme.textColor;
				currentMetaColor = theme.metaColor;
			}
		}

		ctx.textBaseline = 'top';
		const maxWidth = cardWidth - padding * 2;

		function wrapText(
			text: string,
			x: number,
			startY: number,
			fSize: number,
			color: string,
			isMainText: boolean = false
		) {
			ctx!.fillStyle = color;

			let fontStyle = '';
			if (isMainText) {
				if (is_italic) fontStyle += 'italic ';
				if (is_bold) fontStyle += 'bold ';
			}

			// Get font weight and style from selected variant
			let fontWeight = '400';
			let variantStyle = '';

			const getVariantParts = (variant: string) => {
				// Handle variants like "400italic", "700italic", "regular", "700", etc.
				if (variant === 'regular') {
					return { weight: '400', style: '' };
				}
				// Check if variant contains "italic"
				if (variant.includes('italic')) {
					const weight = variant.replace('italic', '');
					return { weight: weight || '400', style: 'italic ' };
				}
				// Otherwise, it's just a weight
				return { weight: variant, style: '' };
			};

			if (fSize === fontSize && app_state.main_font?.selectedVariant) {
				const parts = getVariantParts(app_state.main_font.selectedVariant);
				fontWeight = parts.weight;
				variantStyle = parts.style;
			} else if (app_state.sub_font?.selectedVariant) {
				const parts = getVariantParts(app_state.sub_font.selectedVariant);
				fontWeight = parts.weight;
				variantStyle = parts.style;
			}

			// Combine user-selected style with variant style
			// If user selected italic and variant is italic, just use italic once
			if (variantStyle && fontStyle.includes('italic')) {
				fontStyle = fontStyle.replace('italic ', '') + variantStyle;
			} else {
				fontStyle += variantStyle;
			}

			const fontFamily =
				fSize === fontSize && app_state.main_font
					? app_state.main_font.family
					: fSize === fontSize
						? 'serif'
						: app_state.sub_font
							? app_state.sub_font.family
							: 'sans-serif';
			ctx!.font = `${fontStyle}${fontWeight} ${fSize}px "${fontFamily}"`;

			// For RTL text, we need to process words from right to left
			// Split text by newlines first to handle line breaks
			const paragraphs = text.split(/\\n|\n/);
			let y = startY;
			const lineHeight = fSize * 1.2;

			const drawLine = (textLine: string, lineY: number) => {
				let lineX = x;
				// Adjust lineX for RTL text
				if (textDirection === 'rtl') {
					lineX = x + maxWidth - ctx!.measureText(textLine).width;
				}
				if (isMainText) {
					const metrics = ctx!.measureText(textLine.trim());
					if (text_align === 'center') {
						lineX = x + (maxWidth - metrics.width) / 2;
					} else if (text_align === 'right') {
						lineX = x + (maxWidth - metrics.width);
					}
				}
				ctx!.fillText(textLine.trim(), lineX, lineY);

				if (isMainText && is_underline) {
					const metrics = ctx!.measureText(textLine.trim());
					ctx!.beginPath();
					ctx!.strokeStyle = color;
					ctx!.lineWidth = fSize / 15;
					ctx!.moveTo(lineX, lineY + fSize * 0.95);
					ctx!.lineTo(lineX + metrics.width, lineY + fSize * 0.95);
					ctx!.stroke();
				}
			};

			// Function to check if text contains CJK (Chinese, Japanese, Korean) characters
			const containsCJK = (str: string) => {
				return /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\uff66-\uff9f]/.test(str);
			};

			// Process each paragraph
			for (let p = 0; p < paragraphs.length; p++) {
				const paragraph = paragraphs[p].trim();
				if (paragraph.length === 0) {
					y += lineHeight; // Add extra space for empty lines
					continue;
				}

				// For CJK text, wrap character by character
				if (containsCJK(paragraph)) {
					let line = '';
					for (let i = 0; i < paragraph.length; i++) {
						const char = paragraph[i];
						const testLine = line + char;
						const metrics = ctx!.measureText(testLine);

						if (metrics.width > maxWidth && line.length > 0) {
							drawLine(line, y);
							line = char;
							y += lineHeight;
						} else {
							line = testLine;
						}
					}
					if (line.length > 0) {
						drawLine(line, y);
						y += lineHeight;
					}
				} else {
					// For non-CJK text, wrap by words
					const words = paragraph.split(' ');
					let line = '';
					for (let n = 0; n < words.length; n++) {
						const testLine = line + words[n] + ' ';
						const metrics = ctx!.measureText(testLine);
						const testWidth = metrics.width;
						if (testWidth > maxWidth && n > 0) {
							drawLine(line, y);
							line = words[n] + ' ';
							y += lineHeight;
						} else {
							line = testLine;
						}
					}
					drawLine(line, y);
					y += lineHeight;
				}
			}
			return y;
		}

		// Book Info font size
		const infoFontSize = 33;

		function getWrappedHeight(text: string, fSize: number) {
			const fontFamily = app_state.sub_font ? app_state.sub_font.family : 'sans-serif';
			ctx!.font = `${fSize}px "${fontFamily}"`;

			// Split text by newlines first to handle line breaks
			const paragraphs = text.split(/\\n|\n/);
			let lines = 0;

			// Function to check if text contains CJK (Chinese, Japanese, Korean) characters
			const containsCJK = (str: string) => {
				return /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\uff66-\uff9f]/.test(str);
			};

			for (let p = 0; p < paragraphs.length; p++) {
				const paragraph = paragraphs[p].trim();
				if (paragraph.length === 0) {
					lines++; // Count empty lines
					continue;
				}

				if (containsCJK(paragraph)) {
					// For CJK text, count lines by character wrapping
					let line = '';
					for (let i = 0; i < paragraph.length; i++) {
						const char = paragraph[i];
						const testLine = line + char;
						if (ctx!.measureText(testLine).width > maxWidth && line.length > 0) {
							line = char;
							lines++;
						} else {
							line = testLine;
						}
					}
					if (line.length > 0) {
						lines++;
					}
				} else {
					// For non-CJK text, count lines by word wrapping
					const words = paragraph.split(' ');
					let line = '';
					for (let n = 0; n < words.length; n++) {
						const testLine = line + words[n] + ' ';
						if (ctx!.measureText(testLine).width > maxWidth && n > 0) {
							line = words[n] + ' ';
							lines++;
						} else {
							line = testLine;
						}
					}
					lines++; // Count last line of paragraph
				}
			}

			return lines * (fSize * 1.2);
		}

		const titleHeight = show_title ? getWrappedHeight(display_title, infoFontSize) : 0;
		const authorHeight = show_author ? getWrappedHeight(display_author, infoFontSize) : 0;

		if (swap_layout) {
			// Book Info at top
			let infoY = padding;
			if (show_title) {
				infoY = wrapText(display_title, padding, infoY, infoFontSize, currentMetaColor);
			}
			if (show_author) {
				infoY = wrapText(display_author, padding, infoY, infoFontSize, currentMetaColor);
			}

			// Draw Quote at bottom
			const textHeight = getWrappedHeight(display_text, fontSize);
			let textY = cardHeight - padding - textHeight;
			wrapText(display_text, padding, textY, fontSize, currentTextColor, true);
		} else {
			// Draw Quote at top (default)
			wrapText(display_text, padding, padding, fontSize, currentTextColor, true);

			// Book Info at bottom
			let infoY = cardHeight - padding - titleHeight - authorHeight;
			if (show_author) {
				infoY = wrapText(display_author, padding, infoY, infoFontSize, currentMetaColor);
			}
			if (show_title) {
				wrapText(display_title, padding, infoY, infoFontSize, currentMetaColor);
			}
		}
	}

	$effect(() => {
		// Access reactive values to create dependencies
		const _text = display_text;
		const _title = display_title;
		const _author = display_author;
		const _canvas = canvas;
		const _layout = layout;
		const _bgMode = bg_mode;
		const _textColor = text_color;
		const _metaColor = meta_color;
		const _themeId = selected_theme_id;
		const _bgImage = bg_image;
		const _overlayEnabled = overlay_enabled;
		const _overlayOpacity = overlay_opacity;
		const _overlayColor = overlay_color;
		const _showTitle = show_title;
		const _showAuthor = show_author;
		const _isBold = is_bold;
		const _isItalic = is_italic;
		const _isUnderline = is_underline;
		const _textAlign = text_align;
		const _customFontSize = custom_font_size;
		const _customWidth = custom_width;
		const _customHeight = custom_height;
		const _bgOffsetX = bg_offset_x;
		const _bgOffsetY = bg_offset_y;
		const _mainFont = app_state.main_font;
		const _subFont = app_state.sub_font;
		const _swapLayout = swap_layout;
		drawCanvas();
	});

	// Track if sliders have been initialized with calculated values
	let slidersInitialized = $state(false);

	// Initialize sliders once when display_text is first populated
	$effect(() => {
		// Only initialize when we have content and sliders haven't been initialized yet
		if (display_text && !slidersInitialized) {
			slidersInitialized = true;
			custom_font_size = [layout.fontSize];
			custom_width = [layout.cardWidth];
			custom_height = [layout.cardHeight];
		}
	});

	// Redraw canvas when variant changes (with delay for font loading)
	$effect(() => {
		const _mainVariant = mainVariant;
		const _subVariant = subVariant;
		// Wait for font to load before redrawing
		setTimeout(() => drawCanvas(), 100);
	});

	// Check if we're in custom quote mode
	let isCustomQuote = $derived(page.params.hid === 'custom_quote');
	let customQuoteInitialized = $state(false);

	$effect(() => {
		// Handle custom quote mode - initialize with empty fields
		// Check page.params.hid directly to avoid reactive loop
		if (page.params.hid === 'custom_quote' && !customQuoteInitialized) {
			customQuoteInitialized = true;
			// Use timeout to avoid immediate re-trigger
			setTimeout(() => {
				selected_highlight = null;
				display_text = '';
				display_title = '';
				display_author = '';
			}, 0);
			return;
		}

		if (selected_highlight) {
			return;
		}
		if (!app_state.profile) {
			return;
		}
		const bookKey = page.params.id;
		const highlightId = page.params.hid;
		const highlight = app_state.profile.highlights.find(
			(h) => `${h.author}::${h.title}::${h.$id}` === `${bookKey}::${highlightId}`
		);
		if (highlight) {
			selected_highlight = highlight;
			display_text = highlight.text;
			display_title = highlight.title;
			display_author = highlight.author;
		}
	});

	$effect(() => {
		const backButton = window.Telegram?.WebApp?.BackButton;
		if (backButton) {
			backButton.show();
			// In custom quote mode, go to home page, otherwise go to book page
			if (isCustomQuote) {
				backButton.onClick(() => goto('/'));
			} else {
				backButton.onClick(() => goto('/book/' + page.params.id));
			}
		}
		return () => {
			backButton?.hide();
		};
	});
</script>

{#if selected_highlight || isCustomQuote}
	<div class="mt-5 px-3">
		<div class="overflow-x-auto">
			<div class="flex justify-center px-4" style="min-width: max-content;">
				<canvas
					bind:this={canvas}
					class="shrink-0 rounded-lg border shadow-sm"
					style="width: {layout.cardWidth / 2}px; height: {layout.cardHeight / 2}px;"
				></canvas>
			</div>
		</div>

		<Tabs.Root bind:value={selected_tab} class="mt-4">
			<div class="flex gap-2">
				<Tabs.List class="grid w-full grid-cols-3">
					<Tabs.Trigger value="text-content">Text</Tabs.Trigger>
					<Tabs.Trigger value="dimensions">Dimensions</Tabs.Trigger>
					<Tabs.Trigger value="background">Background</Tabs.Trigger>
				</Tabs.List>
				<Button variant="outline" size="icon" class="rounded-full" onclick={downloadCanvas}>
					{#if sending_highlight}
						<Loader class="animate-spin" />
					{:else}
						<Download />
					{/if}
				</Button>
			</div>

			<!-- ── Text Tab ── -->
			<Tabs.Content value="text-content">
				<div class="mt-4 flex flex-col gap-4">
					<div class="space-y-2">
						<!-- <label for="highlight-text" class="text-sm font-medium">Highlight Text</label> -->
						<div class="flex flex-col">
							<div class="mb-2 flex flex-wrap gap-2">
								<FontSelector
									type="main"
									bind:selectedFont={mainFont}
									bind:selectedSubset={mainSubset}
									bind:selectedVariant={mainVariant}
								/>

								<!-- Subset Dropdown for Main Font -->
								<SubsetDropdown
									font={mainFont}
									selectedSubset={mainSubset}
									onValueChange={updateMainSubset}
								/>

								<!-- Variant Dropdown for Main Font -->
								<VariantDropdown
									font={mainFont}
									selectedVariant={mainVariant}
									onValueChange={updateMainVariant}
								/>
							</div>
							<div class="flex flex-wrap gap-1 rounded-t-md border border-b-0 bg-muted/50 p-1">
								<Button
									size="icon"
									variant={is_bold ? 'default' : 'ghost'}
									class="h-8 w-8"
									onclick={() => (is_bold = !is_bold)}
								>
									<Bold class="h-4 w-4" />
								</Button>
								<Button
									size="icon"
									variant={is_italic ? 'default' : 'ghost'}
									class="h-8 w-8"
									onclick={() => (is_italic = !is_italic)}
								>
									<Italic class="h-4 w-4" />
								</Button>
								<Button
									size="icon"
									variant={is_underline ? 'default' : 'ghost'}
									class="h-8 w-8"
									onclick={() => (is_underline = !is_underline)}
								>
									<Underline class="h-4 w-4" />
								</Button>

								<div class="mx-1 w-[1px] bg-border"></div>

								<Button
									size="icon"
									variant={text_align === 'left' ? 'default' : 'ghost'}
									class="h-8 w-8"
									onclick={() => (text_align = 'left')}
								>
									<AlignLeft class="h-4 w-4" />
								</Button>
								<Button
									size="icon"
									variant={text_align === 'center' ? 'default' : 'ghost'}
									class="h-8 w-8"
									onclick={() => (text_align = 'center')}
								>
									<AlignCenter class="h-4 w-4" />
								</Button>
								<Button
									size="icon"
									variant={text_align === 'right' ? 'default' : 'ghost'}
									class="h-8 w-8"
									onclick={() => (text_align = 'right')}
								>
									<AlignRight class="h-4 w-4" />
								</Button>

								<div class="mx-1 w-[1px] bg-border"></div>

								<Button
									size="icon"
									variant={swap_layout ? 'default' : 'ghost'}
									class="h-8 w-8"
									onclick={() => (swap_layout = !swap_layout)}
								>
									{#if swap_layout}
										<ArrowDown class="h-4 w-4" />
									{:else}
										<ArrowUp class="h-4 w-4" />
									{/if}
								</Button>
							</div>
							<Textarea
								id="highlight-text"
								class="h-40 max-h-60 resize-y rounded-t-none"
								bind:value={display_text}
								placeholder="Write the main quote"
								dir={textDirection}
							/>
						</div>
					</div>
					<div class="mb-2 flex flex-wrap gap-2 py-0">
						<FontSelector
							type="sub"
							bind:selectedFont={subFont}
							bind:selectedSubset={subSubset}
							bind:selectedVariant={subVariant}
						/>

						<!-- Subset Dropdown for Sub Font -->
						<SubsetDropdown
							font={subFont}
							selectedSubset={subSubset}
							onValueChange={updateSubSubset}
						/>

						<!-- Variant Dropdown for Sub Font -->
						<VariantDropdown
							font={subFont}
							selectedVariant={subVariant}
							onValueChange={updateSubVariant}
						/>
					</div>
					<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
						<div class="space-y-2">
							<!-- <label for="book-title" class="text-sm font-medium">Book Title</label> -->
							<div class="flex w-full gap-1">
								<Input
									id="book-title"
									bind:value={display_title}
									placeholder="Book Title"
									dir={textDirection}
								/>

								<Button size="icon" variant="outline" onclick={() => (show_title = !show_title)}>
									{#if show_title}
										<Eye />
									{:else}
										<EyeOff />
									{/if}
								</Button>
							</div>
						</div>
						<div class="space-y-2">
							<!-- <label for="book-author" class="text-sm font-medium">Author</label> -->

							<div class="flex w-full gap-1">
								<Input
									id="book-author"
									bind:value={display_author}
									placeholder="Author Name"
									dir={textDirection}
								/>
								<Button size="icon" variant="outline" onclick={() => (show_author = !show_author)}>
									{#if show_author}
										<Eye />
									{:else}
										<EyeOff />
									{/if}
								</Button>
							</div>
						</div>
					</div>
				</div>
			</Tabs.Content>

			<!-- ── Dimensions Tab ── -->
			<Tabs.Content value="dimensions">
				<div class="mt-4 flex flex-col gap-6">
					<!-- Reset Button -->
					<Button
						variant="outline"
						class="w-full"
						onclick={() => {
							custom_font_size = [];
							custom_width = [];
							custom_height = [];
						}}
					>
						Reset to Auto
					</Button>

					<!-- Font Size Control -->
					<div class="space-y-3">
						<div class="flex items-center justify-between">
							<label class="text-sm font-medium">Font Size</label>
							<span class="font-mono text-xs text-muted-foreground">
								{custom_font_size.length > 0 ? custom_font_size[0] : layout.fontSize}
							</span>
						</div>
						<div class="flex w-full gap-3">
							<Button
								onclick={() => {
									if (custom_font_size[0] > DEFAULT_LAYOUT_CONFIG.minFontSize) {
										custom_font_size = [custom_font_size[0] - 1];
									}
								}}
								variant="outline"
								class="rounded-full"
								size="icon"><Minus /></Button
							>
							<Slider
								type="multiple"
								bind:value={custom_font_size}
								min={DEFAULT_LAYOUT_CONFIG.minFontSize}
								max={69}
								step={1}
							/>
							<Button
								onclick={() => {
									if (custom_font_size[0] < 69) {
										custom_font_size = [custom_font_size[0] + 1];
									}
								}}
								variant="outline"
								size="icon"><Plus /></Button
							>
						</div>

						<div class="flex justify-between text-xs text-muted-foreground">
							<span>{DEFAULT_LAYOUT_CONFIG.minFontSize}px</span>
							<span>69px</span>
						</div>
					</div>

					<!-- Width Control -->
					<div class="space-y-3">
						<div class="flex items-center justify-between">
							<label class="text-sm font-medium">Card Width</label>
							<span class="font-mono text-xs text-muted-foreground">
								{custom_width.length > 0 ? custom_width[0] : layout.cardWidth}
							</span>
						</div>
						<div class="flex w-full gap-3">
							<Button
								onclick={() => {
									if (custom_width[0] > DEFAULT_LAYOUT_CONFIG.initialWidth) {
										custom_width = [custom_width[0] - 10];
									}
								}}
								variant="outline"
								class="rounded-full"
								size="icon"><Minus /></Button
							>
							<Slider
								type="multiple"
								bind:value={custom_width}
								min={DEFAULT_LAYOUT_CONFIG.initialWidth}
								max={DEFAULT_LAYOUT_CONFIG.maxWidth}
								step={10}
							/>
							<Button
								onclick={() => {
									if (custom_width[0] < DEFAULT_LAYOUT_CONFIG.maxWidth) {
										custom_width = [custom_width[0] + 10];
									}
								}}
								variant="outline"
								size="icon"><Plus /></Button
							>
						</div>
						<div class="flex justify-between text-xs text-muted-foreground">
							<span>{DEFAULT_LAYOUT_CONFIG.initialWidth}px</span>
							<span>{DEFAULT_LAYOUT_CONFIG.maxWidth}px</span>
						</div>
					</div>

					<!-- Height Control -->
					<div class="space-y-3">
						<div class="flex items-center justify-between">
							<label class="text-sm font-medium">Card Height</label>
							<span class="font-mono text-xs text-muted-foreground">
								{custom_height.length > 0 ? custom_height[0] : layout.cardHeight}
							</span>
						</div>
						<div class="flex w-full gap-3">
							<Button
								onclick={() => {
									if (custom_height[0] > DEFAULT_LAYOUT_CONFIG.initialHeight) {
										custom_height = [custom_height[0] - 10];
									}
								}}
								variant="outline"
								class="rounded-full"
								size="icon"><Minus /></Button
							>
							<Slider
								type="multiple"
								bind:value={custom_height}
								min={DEFAULT_LAYOUT_CONFIG.initialHeight}
								max={DEFAULT_LAYOUT_CONFIG.maxHeight}
								step={10}
							/>
							<Button
								onclick={() => {
									if (custom_height[0] < DEFAULT_LAYOUT_CONFIG.maxHeight) {
										custom_height = [custom_height[0] + 10];
									}
								}}
								variant="outline"
								size="icon"><Plus /></Button
							>
						</div>
						<div class="flex justify-between text-xs text-muted-foreground">
							<span>{DEFAULT_LAYOUT_CONFIG.initialHeight}px</span>
							<span>{DEFAULT_LAYOUT_CONFIG.maxHeight}px</span>
						</div>
					</div>
				</div>
			</Tabs.Content>

			<!-- ── Background Tab ── -->
			<Tabs.Content value="background">
				<div class="mt-4 flex flex-col gap-6">
					<!-- Background Mode Switcher -->
					<div class="space-y-3">
						<div class="grid grid-cols-2 gap-2">
							<Button
								variant={bg_mode === 'theme' ? 'default' : 'outline'}
								class="w-full"
								onclick={() => (bg_mode = 'theme')}
							>
								Theme
							</Button>
							<Button
								variant={bg_mode === 'image' ? 'default' : 'outline'}
								class="w-full"
								onclick={() => (bg_mode = 'image')}
							>
								Image
							</Button>
						</div>
					</div>

					<!-- ── Theme Mode ── -->
					{#if bg_mode === 'theme'}
						<div class="space-y-3">
							<div class="grid grid-cols-3 gap-3 sm:grid-cols-4">
								{#each THEME_PRESETS as theme (theme.id)}
									<Button
										variant="outline"
										class="group relative flex h-auto flex-col items-center gap-2 border-2 p-3 transition-all {selected_theme_id ===
										theme.id
											? 'border-primary'
											: 'border-transparent hover:border-muted-foreground/30'}"
										onclick={() => applyTheme(theme)}
									>
										<div
											class="h-12 w-full rounded-md shadow-sm"
											style="background: {theme.preview};"
										></div>
										<span
											class="text-xs {selected_theme_id === theme.id
												? 'font-medium text-foreground'
												: 'text-muted-foreground'}"
										>
											{theme.name}
										</span>
										{#if selected_theme_id === theme.id}
											<div
												class="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground"
											>
												<svg
													xmlns="http://www.w3.org/2000/svg"
													class="h-3 w-3"
													viewBox="0 0 20 20"
													fill="currentColor"
												>
													<path
														fill-rule="evenodd"
														d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
														clip-rule="evenodd"
													/>
												</svg>
											</div>
										{/if}
									</Button>
								{/each}
							</div>
						</div>

						<!-- ── Image Mode ── -->
					{:else if bg_mode === 'image'}
						<div class="flex flex-col gap-5">
							<!-- Hidden file input always in DOM for changeImage() to work -->
							<input
								id="bg-image-input"
								type="file"
								accept="image/*"
								class="hidden"
								onchange={handleImageUpload}
							/>
							<!-- Upload Area -->
							<div class="space-y-2">
								{#if bg_image_url}
									<!-- <div class="relative overflow-hidden rounded-lg border">
										<img
											src={bg_image_url}
											alt="Background preview"
											class="h-40 w-full object-cover"
										/>
										<Button
											variant="destructive"
											size="icon"
											class="absolute top-2 right-2 h-8 w-8 rounded-full"
											onclick={clearImage}
										>
											<svg
												xmlns="http://www.w3.org/2000/svg"
												class="h-4 w-4"
												viewBox="0 0 20 20"
												fill="currentColor"
											>
												<path
													fill-rule="evenodd"
													d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
													clip-rule="evenodd"
												/>
											</svg>
										</Button>
									</div> -->
									<div class="flex w-full justify-between px-3">
										<div class="flex gap-3">
											<ButtonGroup>
												<Button
													variant="outline"
													size="icon"
													onclick={() => (bg_offset_y -= BG_MOVE_STEP)}><ChevronUp /></Button
												>
												<Button
													variant="outline"
													size="icon"
													onclick={() => (bg_offset_y += BG_MOVE_STEP)}><ChevronDown /></Button
												>
												<Button
													variant="outline"
													size="icon"
													onclick={() => (bg_offset_x -= BG_MOVE_STEP)}><ChevronLeft /></Button
												>
												<Button
													variant="outline"
													size="icon"
													onclick={() => (bg_offset_x += BG_MOVE_STEP)}><ChevronRight /></Button
												>
											</ButtonGroup>
											<Button
												variant="outline"
												size="icon"
												onclick={() => {
													bg_offset_x = 0;
													bg_offset_y = 0;
												}}
												title="Reset position"
											>
												<RotateCcw />
											</Button>
										</div>
										<Button variant="outline" onclick={changeImage}>Change <ImageIcon /></Button>
									</div>
								{:else}
									<label
										for="bg-image-input"
										class="flex h-40 cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted/50 transition-colors hover:border-muted-foreground/50 hover:bg-muted"
									>
										<svg
											xmlns="http://www.w3.org/2000/svg"
											class="h-10 w-10 text-muted-foreground"
											fill="none"
											viewBox="0 0 24 24"
											stroke="currentColor"
											stroke-width="1.5"
										>
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
											/>
										</svg>
										<div class="text-center">
											<p class="text-sm font-medium text-muted-foreground">
												Click to upload an image
											</p>
											<p class="text-xs text-muted-foreground/70">JPG, PNG, WebP supported</p>
										</div>
									</label>
								{/if}
							</div>

							<!-- Text Color for Image Mode -->
							<div class="space-y-3">
								<label class="text-sm font-medium">Text Color</label>
								<div class="flex gap-3">
									<Button
										variant={text_color === '#ffffff' ? 'default' : 'outline'}
										class="flex-1 gap-2"
										onclick={() => {
											text_color = '#ffffff';
											meta_color = '#e0e0e0';
										}}
									>
										<span class="inline-block h-4 w-4 rounded-full border bg-white"></span>
										Light
									</Button>
									<Button
										variant={text_color === '#1a1a1a' ? 'default' : 'outline'}
										class="flex-1 gap-2"
										onclick={() => {
											text_color = '#1a1a1a';
											meta_color = '#444444';
										}}
									>
										<span class="inline-block h-4 w-4 rounded-full border bg-black"></span>
										Dark
									</Button>
								</div>
							</div>

							<!-- Overlay Controls -->
							<div class="space-y-4 rounded-lg border bg-muted/30 p-4">
								<div class="flex w-full items-center space-x-2">
									<Checkbox id="overlay" bind:checked={overlay_enabled} />
									<label for="overlay" class="w-full text-sm font-medium"
										>Enable Color Overlay</label
									>
								</div>
								{#if overlay_enabled}
									<div class="space-y-4 pl-6">
										<div class="flex items-center gap-3">
											<label for="overlay-color" class="text-sm text-muted-foreground">Color</label>
											<input
												id="overlay-color"
												type="color"
												bind:value={overlay_color}
												class="h-8 w-14 cursor-pointer rounded border bg-transparent"
											/>
										</div>
										<div class="space-y-2">
											<div class="flex items-center justify-between">
												<label for="overlay-opacity" class="text-sm text-muted-foreground"
													>Opacity</label
												>
												<span class="font-mono text-sm text-muted-foreground">
													{Math.round(overlay_opacity * 100)}%
												</span>
											</div>
											<input
												id="overlay-opacity"
												type="range"
												min="0"
												max="1"
												step="0.01"
												bind:value={overlay_opacity}
												class="w-full accent-primary"
											/>
										</div>
									</div>
								{/if}
							</div>
						</div>
					{/if}
				</div>
			</Tabs.Content>
		</Tabs.Root>
	</div>
{:else}
	<div class="flex h-64 items-center justify-center">
		<p class="text-muted-foreground">Loading...</p>
	</div>
{/if}
