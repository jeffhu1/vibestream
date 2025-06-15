# VibeStream - AI-Powered Playlist Generator

VibeStream uses Claude AI to generate Spotify playlists based on any vibe or mood you describe.

## Setup

### Prerequisites
- Node.js 18+
- Claude API key from Anthropic
- Spotify Developer account

### Local Development

1. Install all dependencies:
   ```bash
   npm run install:all
   ```

2. Create a `.env` file in the backend directory based on `.env.example`:
   ```bash
   cd backend && cp .env.example .env
   ```

3. Fill in your credentials:
   - `ANTHROPIC_API_KEY`: Get from https://console.anthropic.com/
   - `SPOTIFY_CLIENT_ID` & `SPOTIFY_CLIENT_SECRET`: Create an app at https://developer.spotify.com/dashboard
   - For local dev, set redirect URI to `http://127.0.0.1:5173/callback` in Spotify app settings

4. Start both frontend and backend:
   ```bash
   npm run dev
   ```

5. Open http://127.0.0.1:5173 in your browser

### Railway Deployment

1. Connect your GitHub repo to Railway
2. Set environment variables in Railway dashboard:
   - `ANTHROPIC_API_KEY`
   - `SPOTIFY_CLIENT_ID`
   - `SPOTIFY_CLIENT_SECRET`
   - `SPOTIFY_REDIRECT_URI` (use your Railway app URL + /callback)
3. Update your Spotify app redirect URI to match your Railway deployment
4. Deploy automatically on push to main branch

## Usage

1. Connect your Spotify account when prompted
2. Enter a vibe description (e.g., "sunset drive", "morning workout", "rainy day coding")
3. Click "Generate Playlist" to get AI-curated tracks
4. Preview tracks or open them in Spotify

## Features

- AI-powered playlist generation using Claude
- Spotify integration for track search and playback
- Track previews (30-second clips)
- Direct links to open tracks in Spotify
- Beautiful gradient UI with dark theme