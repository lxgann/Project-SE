import React, { useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { SnackbarProvider } from './context/SnackbarContext';
import Header from './components/Header';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Play from './pages/Play';
import Leaderboard from './pages/Leaderboard';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Upload from './pages/Upload';
import Profile from './pages/Profile';
import Admin from './pages/Admin';

function App() {
  const bgmRef = useRef(null);

  useEffect(() => {
    const BGM_TRACKS = [
      '/audio/bgm_elevator.mp3',
      '/audio/bgm_fluffing.mp3',
      '/audio/bgm_monkeys.mp3',
      '/audio/bgm_polka.mp3',
      '/audio/bgm_trap.mp3',
      '/audio/bgm_runamok.mp3',
      '/audio/bgm_daisy.mp3',
      '/audio/bgm_superepic.mp3'
    ];

    // Pick a random track to start
    let currentTrackIdx = Math.floor(Math.random() * BGM_TRACKS.length);
    const bgm = new Audio(BGM_TRACKS[currentTrackIdx]);
    bgm.volume = 0.16; // 16% volume for background music
    bgmRef.current = bgm;

    const playNextRandomTrack = () => {
      // Pick a different track index to avoid playing the same one twice back-to-back
      let nextIdx;
      do {
        nextIdx = Math.floor(Math.random() * BGM_TRACKS.length);
      } while (nextIdx === currentTrackIdx && BGM_TRACKS.length > 1);
      
      currentTrackIdx = nextIdx;
      bgm.src = BGM_TRACKS[currentTrackIdx];
      bgm.load();
      
      const muted = localStorage.getItem('gameguessr_muted') === 'true';
      if (!muted) {
        bgm.play().catch(() => {});
      }
    };

    bgm.addEventListener('ended', playNextRandomTrack);

    const checkMuteAndPlay = () => {
      const muted = localStorage.getItem('gameguessr_muted') === 'true';
      if (muted) {
        bgm.pause();
      } else {
        bgm.play().catch(() => {});
      }
    };

    checkMuteAndPlay();

    window.addEventListener('mute_toggle', checkMuteAndPlay);

    // Bypass browser autoplay blocks on first user interaction
    const handleFirstClick = () => {
      const muted = localStorage.getItem('gameguessr_muted') === 'true';
      if (!muted) {
        bgm.play().catch(() => {});
      }
      window.removeEventListener('click', handleFirstClick);
    };
    window.addEventListener('click', handleFirstClick);

    return () => {
      bgm.pause();
      bgm.removeEventListener('ended', playNextRandomTrack);
      window.removeEventListener('mute_toggle', checkMuteAndPlay);
      window.removeEventListener('click', handleFirstClick);
    };
  }, []);
  return (
    <LanguageProvider>
      <AuthProvider>
        <SnackbarProvider>
          <Router>
            <Header />
            <main className="main-content">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/play" element={<Play />} />
                <Route path="/leaderboard" element={<Leaderboard />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/upload" element={<ProtectedRoute requiredRole="uploader"><Upload /></ProtectedRoute>} />
                <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                <Route path="/admin" element={<ProtectedRoute requiredRole="admin"><Admin /></ProtectedRoute>} />
              </Routes>
            </main>
            <Footer />
          </Router>
        </SnackbarProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;
