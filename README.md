# VibeStream - AI-Powered Playlist Generator

VibeStream uses Claude AI to generate Spotify playlists based on any vibe or mood you describe.

## Setup

### Prerequisites
- Node.js 18+
- Claude API key from Anthropic
- Spotify Developer account

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   npm install
   ```

2. Create a `.env` file based on `.env.example`:
   ```bash
   cp .env.example .env
   ```

3. Fill in your credentials:
   - `ANTHROPIC_API_KEY`: Get from https://console.anthropic.com/
   - `SPOTIFY_CLIENT_ID` & `SPOTIFY_CLIENT_SECRET`: Create an app at https://developer.spotify.com/dashboard
   - Set redirect URI to `http://127.0.0.1:5173/callback` in Spotify app settings (Spotify no longer allows localhost)

4. Start the backend:
   ```bash
   npm run dev
   ```

### Frontend Setup

1. In a new terminal, navigate to frontend:
   ```bash
   cd frontend
   npm install
   ```

2. Start the frontend:
   ```bash
   npm run dev
   ```

3. Open http://127.0.0.1:5173 in your browser (not localhost)

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