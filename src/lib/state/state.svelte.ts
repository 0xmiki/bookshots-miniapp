import type { GoogleFont, Profile, User } from '$lib/types';

export interface ThemePreset {
	id: string;
	name: string;
	type: 'solid' | 'gradient';
	colors: string[];
	textColor: string;
	metaColor: string;
	preview: string;
}

export const THEME_PRESETS: ThemePreset[] = [
	{
		id: 'minimal-light',
		name: 'Minimal Light',
		type: 'solid',
		colors: ['#ffffff'],
		textColor: '#1a1a1a',
		metaColor: '#666666',
		preview: '#ffffff'
	},
	{
		id: 'minimal-dark',
		name: 'Minimal Dark',
		type: 'solid',
		colors: ['#1a1a2e'],
		textColor: '#e0e0e0',
		metaColor: '#999999',
		preview: '#1a1a2e'
	},
	{
		id: 'warm-paper',
		name: 'Warm Paper',
		type: 'solid',
		colors: ['#f5f0e8'],
		textColor: '#3d3229',
		metaColor: '#8a7b6b',
		preview: '#f5f0e8'
	},
	{
		id: 'ocean-depth',
		name: 'Ocean Depth',
		type: 'gradient',
		colors: ['#0f2027', '#203a43', '#2c5364'],
		textColor: '#e0f0ff',
		metaColor: '#8ab4d6',
		preview: 'linear-gradient(135deg, #0f2027, #203a43, #2c5364)'
	},
	{
		id: 'sunset-glow',
		name: 'Sunset Glow',
		type: 'gradient',
		colors: ['#ee9ca7', '#ffdde1'],
		textColor: '#2d1f21',
		metaColor: '#5a3d42',
		preview: 'linear-gradient(135deg, #ee9ca7, #ffdde1)'
	},
	{
		id: 'forest-mist',
		name: 'Forest Mist',
		type: 'gradient',
		colors: ['#134e5e', '#71b280'],
		textColor: '#f0fff0',
		metaColor: '#c0e0c0',
		preview: 'linear-gradient(135deg, #134e5e, #71b280)'
	},
	{
		id: 'midnight-purple',
		name: 'Midnight',
		type: 'gradient',
		colors: ['#0f0c29', '#302b63', '#24243e'],
		textColor: '#e8e0ff',
		metaColor: '#a89fd4',
		preview: 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)'
	},
	{
		id: 'golden-hour',
		name: 'Golden Hour',
		type: 'gradient',
		colors: ['#f7971e', '#ffd200'],
		textColor: '#2a1f00',
		metaColor: '#5c4a00',
		preview: 'linear-gradient(135deg, #f7971e, #ffd200)'
	},
	{
		id: 'rose-water',
		name: 'Rose Water',
		type: 'gradient',
		colors: ['#e55d87', '#5fc3e4'],
		textColor: '#ffffff',
		metaColor: '#e0e0e0',
		preview: 'linear-gradient(135deg, #e55d87, #5fc3e4)'
	},
	{
		id: 'charcoal',
		name: 'Charcoal',
		type: 'solid',
		colors: ['#2c2c2c'],
		textColor: '#f5f5f5',
		metaColor: '#aaaaaa',
		preview: '#2c2c2c'
	},
	{
		id: 'sage-green',
		name: 'Sage',
		type: 'solid',
		colors: ['#d4e2c8'],
		textColor: '#2d3a24',
		metaColor: '#5a6b4f',
		preview: '#d4e2c8'
	},
	{
		id: 'lavender-dream',
		name: 'Lavender',
		type: 'gradient',
		colors: ['#c9d6ff', '#e2e2e2'],
		textColor: '#2a2a3d',
		metaColor: '#5c5c7a',
		preview: 'linear-gradient(135deg, #c9d6ff, #e2e2e2)'
	}
];

interface AppState {
	user: User | null;
	profile: Profile | null;
	loading_profile: boolean;
	error: string | null;
	main_font: GoogleFont | null;
	sub_font: GoogleFont | null;
	highlight_theme: string;
	redirecting_to_highlight: boolean;
	delete_mode: boolean;
	highlight_ids_to_delete?: string[];
}

export const app_state: AppState = $state({
	user: null,
	profile: null,
	loading_profile: true,
	error: null,
	main_font: null,
	sub_font: null,
	highlight_theme: 'charcoal',
	redirecting_to_highlight: false,
	delete_mode: false,
	highlight_ids_to_delete: []
});

export function applyTheme(themeId: string) {
	app_state.highlight_theme = themeId;
}
