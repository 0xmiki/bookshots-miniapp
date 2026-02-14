// In a SvelteKit API route (+server.js)
import { ImageResponse } from '@takumi-rs/image-response';

export async function GET() {
	return new ImageResponse(
		{
			type: 'div',
			props: {
				style: {
					display: 'flex',
					height: '100%',
					width: '100%',
					alignItems: 'center',
					justifyContent: 'center',
					backgroundColor: 'black'
				},
				children: {
					type: 'h1',
					props: {
						children: 'Hello from Svelte!',
						style: {
							fontSize: '60px',
							color: '#f0f0f0'
						}
					}
				}
			}
		},
		{
			width: 1200,
			height: 630,
			format: 'Png'
		}
	);
}
