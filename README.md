# Bookshots Miniapp

A telegram miniapp that lets you browse your e-books, highlights, and create custom quotes with beautiful typography.

## Features

- ✨ **Highlights Management** - Browse, search, and manage your reading highlights
- 🖋️ **Custom Quotes** - Create beautiful custom quotes with customizable fonts
- 🔤 **Font Picker** - Extensive font selection with variants and subsets
- 🌐 **RTL Support** - Full right-to-left language support

## Tech Stack

- **Framework**: Sveltekit
- **Backend**: Appwrite (authentication & database)
- **UI Components**: shadcn-svelte
- **Font Selection**: Google Fonts API integration

## Getting Started

### Installation

```sh
# Install dependencies
bun install
# or
npm install
```

### Environment Variables

Copy `.env.example` to `.env` and configure:

```sh
cp .env.example .env
```

Required variables:

- `PUBLIC_APPWRITE_ENDPOINT` - Appwrite API endpoint
- `PUBLIC_APPWRITE_PROJECT` - Appwrite project ID
- `APPWRITE_API_KEY` - Appwrite API key (server-side)
- `TELEGRAM_BOT_TOKEN` - Telegram bot token

---

- `PUBLIC_APPWRITE_DATABASE_ID` - Appwrite database id
- `PUBLIC_APPWRITE_PROFILE_COLLECTION_ID` - Appwrite Profile table id
- `PUBLIC_APPWRITE_HIGHLIGHT_COLLECTION_ID` - Appwrite highlights table id

### Development

```sh
# Start development server
bun run dev

# Open in browser
bun run dev -- --open
```

### Building

```sh
# Create production build
bun run build

# Preview production build
bun run preview
```

### Using with a Proxy/Reverse Proxy

If you're using a tunneling service like ngrok, zrok, outray, or any other reverse proxy to expose your local development server, you need to update the `allowedHosts` in [`vite.config.ts`](vite.config.ts:1).

1. Uncomment the `server` block in `vite.config.ts`
2. Replace `'friendly-67.outray.app'` with your actual proxy URL (without the `https://` prefix)

```ts
server: {
    host: true, // or '0.0.0.0'
    cors: {
        origin: '*'
    },
    allowedHosts: ['your-proxy-url.example.com']
}
```

This allows the development server to respond correctly when accessed through the proxy.

## Project Structure

```
src/
├── lib/
│   ├── components/       # Svelte components
│   │   ├── ui/          # shadcn-svelte UI components
│   │   ├── book-card.svelte
│   │   ├── font-selector.svelte
│   │   ├── highlight-card.svelte
│   │   └── ...
│   ├── functions/       # Business logic
│   ├── state/          # Svelte 5 state management
│   ├── utils/          # Utility functions
│   ├── types.ts        # TypeScript types
│   └── assets/         # Static assets (font-picker)
├── routes/
│   ├── +page.svelte    # Home page (library)
│   ├── book/[id]/      # Book details
│   ├── book/[id]/highlight/[hid]/  # Highlight details
│   └── api/            # API routes
└── app.html            # HTML template
```

## License

MIT
