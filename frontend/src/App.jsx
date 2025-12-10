import React, { useState, useEffect } from 'react';
import Editor from './components/Editor';

function App() {
  const [roomId, setRoomId] = useState(null);
  const [inputRoomId, setInputRoomId] = useState('');

  const API_URL = 'http://localhost:8000';

  useEffect(() => {
    // Check if URL has /room/:id
    const path = window.location.pathname;
    const match = path.match(/^\/room\/([^\/]+)$/);
    if (match) {
      setRoomId(match[1]);
    }
  }, []);

  const createRoom = async () => {
    try {
      const res = await fetch(`${API_URL}/rooms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      const data = await res.json();
      const newRoomId = data.room_id;
      setRoomId(newRoomId);
      // Update URL without reloading
      window.history.pushState({}, '', `/room/${newRoomId}`);
    } catch (err) {
      console.error('Failed to create room:', err);
      alert('Error creating room');
    }
  };

  const joinRoom = (e) => {
    e.preventDefault();
    if (inputRoomId.trim()) {
      const newRoomId = inputRoomId.trim();
      setRoomId(newRoomId);
      window.history.pushState({}, '', `/room/${newRoomId}`);
    }
  };

  const leaveRoom = () => {
    setRoomId(null);
    window.history.pushState({}, '', '/');
  };

  return (
    <div className="container">
      <header>
        <h1>⚡ Collaborative Editor</h1>
        {roomId && (
          <button onClick={leaveRoom} className="btn btn-secondary btn-xs" style={{ fontSize: '0.9rem', padding: '0.5rem 1rem' }}>
            Exit Room
          </button>
        )}
      </header>

      {!roomId ? (
        <div className="landing">
          <div className="card">
            <h2 style={{ marginBottom: '1.5rem', fontSize: '1.25rem' }}>Start Coding Together</h2>

            <button
              onClick={createRoom}
              className="btn btn-primary"
              style={{ marginBottom: '1rem' }}
            >
              Create New Room
            </button>

            <div className="divider">
              <span>OR</span>
            </div>

            <form onSubmit={joinRoom} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="input-group">
                <input
                  type="text"
                  value={inputRoomId}
                  onChange={(e) => setInputRoomId(e.target.value)}
                  placeholder="Enter Room Code"
                />
              </div>
              <button type="submit" className="btn btn-secondary" style={{ width: '100%' }}>Join Existing Room</button>
            </form>
          </div>
        </div>
      ) : (
        <Editor roomId={roomId} />
      )}
    </div>
  );
}

export default App;
