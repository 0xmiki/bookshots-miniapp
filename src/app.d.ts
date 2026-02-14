// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}

	interface Window {
		Telegram?: {
			WebApp?: {
				initData: string;
				initDataUnsafe: {
					user?: {
						id: number;
						first_name: string;
						last_name?: string;
						username?: string;
						language_code?: string;
					};
					start_param?: string;
				};
				themeParams?: {
					bg_color?: string;
					text_color?: string;
					hint_color?: string;
					link_color?: string;
					button_color?: string;
					button_text_color?: string;
				};
				expand(): void;
				close(): void;
				showPopup(options: {
					title?: string;
					message: string;
					buttons?: Array<{ type: 'ok' | 'close' | 'cancel'; text?: string }>;
				}): void;
				BackButton?: {
					show(): void;
					hide(): void;
					onClick(callback: () => void): void;
				};
				CloudStorage?: {
					getItem(key: string, callback: (error: Error | null, value: string | null) => void): void;
					setItem(key: string, value: string): void;
					removeItem(key: string): void;
				};
			};
		};
	}
}

export {};
