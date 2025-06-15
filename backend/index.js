import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import Anthropic from '@anthropic-ai/sdk';
import axios from 'axios';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Serve static files from the frontend build
app.use(express.static(join(__dirname, '../frontend/dist')));

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

let spotifyAccessToken = null;
let spotifyTokenExpiry = null;

async function getSpotifyToken() {
  if (spotifyAccessToken && spotifyTokenExpiry && new Date() < spotifyTokenExpiry) {
    return spotifyAccessToken;
  }

  const response = await axios.post(
    'https://accounts.spotify.com/api/token',
    new URLSearchParams({
      grant_type: 'client_credentials',
    }),
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(
          `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
        ).toString('base64')}`,
      },
    }
  );

  spotifyAccessToken = response.data.access_token;
  spotifyTokenExpiry = new Date(Date.now() + response.data.expires_in * 1000);
  return spotifyAccessToken;
}

app.post('/api/generate-playlist', async (req, res) => {
  try {
    const { vibe } = req.body;

    const message = await anthropic.messages.create({
      model: 'claude-opus-4-20250514',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: `Generate a playlist of 10 songs that match this vibe: "${vibe}". 
        Return ONLY a JSON array with objects containing "artist" and "track" fields.
        Example format: [{"artist": "Artist Name", "track": "Song Title"}]`
      }],
    });

    const content = message.content[0].text;
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('Failed to parse playlist from AI response');
    }

    const playlist = JSON.parse(jsonMatch[0]);
    
    const token = await getSpotifyToken();
    const spotifyTracks = [];

    for (const song of playlist) {
      try {
        const searchResponse = await axios.get(
          'https://api.spotify.com/v1/search',
          {
            params: {
              q: `artist:${song.artist} track:${song.track}`,
              type: 'track',
              limit: 1,
            },
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (searchResponse.data.tracks.items.length > 0) {
          const track = searchResponse.data.tracks.items[0];
          spotifyTracks.push({
            id: track.id,
            uri: track.uri,
            name: track.name,
            artist: track.artists[0].name,
            preview_url: track.preview_url,
            external_url: track.external_urls.spotify,
          });
        }
      } catch (error) {
        console.error(`Failed to find track: ${song.artist} - ${song.track}`);
      }
    }

    res.json({
      vibe,
      playlist: spotifyTracks,
    });
  } catch (error) {
    console.error('Error generating playlist:', error);
    res.status(500).json({ error: 'Failed to generate playlist' });
  }
});

app.get('/api/spotify/auth', (req, res) => {
  const scopes = 'streaming user-read-email user-read-private playlist-modify-public playlist-modify-private';
  const redirectUri = process.env.SPOTIFY_REDIRECT_URI;
  const authUrl = `https://accounts.spotify.com/authorize?${new URLSearchParams({
    response_type: 'code',
    client_id: process.env.SPOTIFY_CLIENT_ID,
    scope: scopes,
    redirect_uri: redirectUri,
  })}`;
  res.json({ authUrl });
});

app.post('/api/spotify/callback', async (req, res) => {
  const { code } = req.body;
  const redirectUri = process.env.SPOTIFY_REDIRECT_URI;

  try {
    const response = await axios.post(
      'https://accounts.spotify.com/api/token',
      new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${Buffer.from(
            `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
          ).toString('base64')}`,
        },
      }
    );

    res.json({
      access_token: response.data.access_token,
      refresh_token: response.data.refresh_token,
      expires_in: response.data.expires_in,
    });
  } catch (error) {
    console.error('Error exchanging code for token:', error);
    res.status(500).json({ error: 'Failed to authenticate with Spotify' });
  }
});

app.post('/api/spotify/create-playlist', async (req, res) => {
  const { accessToken, vibe, trackUris } = req.body;

  try {
    // Get user ID
    const userResponse = await axios.get('https://api.spotify.com/v1/me', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const userId = userResponse.data.id;

    // Create playlist
    const playlistResponse = await axios.post(
      `https://api.spotify.com/v1/users/${userId}/playlists`,
      {
        name: `${vibe} Vibes`,
        description: `AI-generated playlist for "${vibe}" mood by VibeStream`,
        public: false,
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const playlistId = playlistResponse.data.id;

    // Add tracks to playlist
    await axios.post(
      `https://api.spotify.com/v1/playlists/${playlistId}/tracks`,
      {
        uris: trackUris,
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    res.json({
      success: true,
      playlistId,
      playlistUrl: playlistResponse.data.external_urls.spotify,
    });
  } catch (error) {
    console.error('Error creating playlist:', error.response?.data || error);
    res.status(500).json({ error: 'Failed to create playlist' });
  }
});

// Health check endpoint for Railway
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Catch-all route to serve the frontend app
app.get('*', (req, res) => {
  res.sendFile(join(__dirname, '../frontend/dist/index.html'));
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});