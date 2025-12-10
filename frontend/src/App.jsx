import React, { useState } from 'react';
import Editor from './components/Editor';

function App() {
  const [roomId, setRoomId] = useState(null);
  const [inputRoomId, setInputRoomId] = useState('');

  const API_URL = 'http://localhost:8000';

  const createRoom = async () => {
    try {
      const res = await fetch(`${API_URL}/rooms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      const data = await res.json();
      setRoomId(data.room_id);
    } catch (err) {
      console.error('Failed to create room:', err);
      alert('Error creating room');
    }
  };

  const joinRoom = (e) => {
    e.preventDefault();
    if (inputRoomId.trim()) {
      setRoomId(inputRoomId.trim());
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px', fontFamily: 'sans-serif' }}>
      <header style={{ borderBottom: '1px solid #eee', paddingBottom: '20px', marginBottom: '20px' }}>
        <h1 style={{ margin: 0 }}>Collaborative Code Editor</h1>
      </header>

      {!roomId ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div style={{ marginBottom: '40px' }}>
            <button
              onClick={createRoom}
              style={{ fontSize: '18px', padding: '12px 24px', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
            >
              Create New Room
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
            <span>Or join existing:</span>
            <form onSubmit={joinRoom} style={{ display: 'flex', gap: '10px' }}>
              <input
                type="text"
                value={inputRoomId}
                onChange={(e) => setInputRoomId(e.target.value)}
                placeholder="Enter Room ID"
                style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
              />
              <button type="submit" style={{ padding: '8px 16px', cursor: 'pointer' }}>Join</button>
            </form>
          </div>
        </div>
      ) : (
        <div>
          <button onClick={() => setRoomId(null)} style={{ marginBottom: '10px', background: 'none', border: 'none', color: '#666', cursor: 'pointer', textDecoration: 'underline' }}>
            &larr; Back to Home
          </button>
          <Editor roomId={roomId} />
        </div>
      )}
    </div>
  );
}

export default App;
