import React, { useState, useEffect } from 'react';
import axios from 'axios';

function App() {
  const [vibe, setVibe] = useState('');
  const [playlist, setPlaylist] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [spotifyToken, setSpotifyToken] = useState(null);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [savingPlaylist, setSavingPlaylist] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('spotify_token');
    if (token) {
      setSpotifyToken(token);
    }

    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    if (code) {
      exchangeCodeForToken(code);
      window.history.replaceState({}, document.title, '/');
    }
  }, []);

  const authenticateSpotify = async () => {
    try {
      const response = await axios.get('/api/spotify/auth');
      window.location.href = response.data.authUrl;
    } catch (error) {
      setError('Failed to authenticate with Spotify');
    }
  };

  const exchangeCodeForToken = async (code) => {
    try {
      const response = await axios.post('/api/spotify/callback', { code });
      localStorage.setItem('spotify_token', response.data.access_token);
      setSpotifyToken(response.data.access_token);
    } catch (error) {
      setError('Failed to complete Spotify authentication');
    }
  };

  const generatePlaylist = async (e) => {
    e.preventDefault();
    if (!vibe.trim()) return;

    setLoading(true);
    setError('');
    setPlaylist([]);

    try {
      const response = await axios.post('/api/generate-playlist', { vibe });
      setPlaylist(response.data.playlist);
    } catch (error) {
      setError('Failed to generate playlist. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const playTrack = (track) => {
    if (!spotifyToken) {
      setError('Please connect to Spotify first');
      return;
    }

    if (currentTrack?.id === track.id) {
      setCurrentTrack(null);
    } else {
      setCurrentTrack(track);
      if (track.preview_url) {
        const audio = new Audio(track.preview_url);
        audio.play();
      }
    }
  };

  const saveToSpotify = async () => {
    if (!spotifyToken || !playlist.length) return;

    setSavingPlaylist(true);
    setError('');

    try {
      const trackUris = playlist.map(track => track.uri);
      const response = await axios.post('/api/spotify/create-playlist', {
        accessToken: spotifyToken,
        vibe,
        trackUris,
      });

      if (response.data.success) {
        window.open(response.data.playlistUrl, '_blank');
      }
    } catch (error) {
      setError('Failed to create playlist in Spotify');
    } finally {
      setSavingPlaylist(false);
    }
  };

  if (!spotifyToken) {
    return (
      <div className="container">
        <div className="header">
          <h1>VibeStream</h1>
          <p>AI-powered playlist generator for any mood</p>
        </div>
        <div className="spotify-auth">
          <h2>Connect to Spotify</h2>
          <p style={{ margin: '1rem 0', color: '#a0a0a0' }}>
            To play your generated playlists, please connect your Spotify account
          </p>
          <button className="auth-btn" onClick={authenticateSpotify}>
            Connect with Spotify
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="header">
        <h1>VibeStream</h1>
        <p>AI-powered playlist generator for any mood</p>
      </div>

      <div className="vibe-input-section">
        <form onSubmit={generatePlaylist} className="vibe-form">
          <input
            type="text"
            className="vibe-input"
            placeholder="Enter your vibe... (e.g., 'sunset drive', 'morning workout', 'rainy day coding')"
            value={vibe}
            onChange={(e) => setVibe(e.target.value)}
            disabled={loading}
          />
          <button type="submit" className="generate-btn" disabled={loading || !vibe.trim()}>
            {loading ? 'Generating...' : 'Generate Playlist'}
          </button>
        </form>
      </div>

      {error && <div className="error">{error}</div>}

      {loading && (
        <div className="loading">
          <p>Creating your perfect playlist...</p>
        </div>
      )}

      {playlist.length > 0 && (
        <div className="playlist-section">
          <div className="playlist-header">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2>Your "{vibe}" Playlist</h2>
                <p style={{ color: '#a0a0a0' }}>{playlist.length} tracks</p>
              </div>
              <button 
                className="save-playlist-btn" 
                onClick={saveToSpotify}
                disabled={savingPlaylist}
              >
                {savingPlaylist ? 'Saving...' : 'Save to Spotify'}
              </button>
            </div>
          </div>
          <div className="track-list">
            {playlist.map((track, index) => (
              <div key={track.id} className="track-item">
                <div className="track-number">{index + 1}</div>
                <div className="track-info">
                  <div className="track-name">{track.name}</div>
                  <div className="track-artist">{track.artist}</div>
                </div>
                <div className="track-actions">
                  {track.preview_url && (
                    <button 
                      className="track-btn" 
                      onClick={() => playTrack(track)}
                    >
                      {currentTrack?.id === track.id ? 'Stop' : 'Preview'}
                    </button>
                  )}
                  <a 
                    href={track.external_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="track-btn"
                    style={{ textDecoration: 'none' }}
                  >
                    Open in Spotify
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;