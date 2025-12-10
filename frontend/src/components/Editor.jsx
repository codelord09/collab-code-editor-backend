import React, { useEffect, useRef, useState } from 'react';

const Editor = ({ roomId }) => {
    const [code, setCode] = useState('');
    const [suggestion, setSuggestion] = useState('');
    const ws = useRef(null);
    const API_URL = 'http://localhost:8000'; // Adjust if port differs
    const WS_URL = 'ws://localhost:8000';

    useEffect(() => {
        // Initialize WebSocket
        ws.current = new WebSocket(`${WS_URL}/ws/${roomId}`);

        ws.current.onopen = () => {
            console.log('Connected to room:', roomId);
        };

        ws.current.onmessage = (event) => {
            // Receive code updates from other users
            setCode(event.data);
        };

        return () => {
            if (ws.current) {
                ws.current.close();
            }
        };
    }, [roomId]);

    const handleChange = (e) => {
        const newCode = e.target.value;
        setCode(newCode);
        // Broadcast to room
        if (ws.current && ws.current.readyState === WebSocket.OPEN) {
            ws.current.send(newCode);
        }
    };

    const handleAutocomplete = async () => {
        try {
            const res = await fetch(`${API_URL}/autocomplete`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    context: code,
                    cursor_position: code.length // Simplified for textarea
                }),
            });
            const data = await res.json();
            setSuggestion(data.suggestion);
        } catch (err) {
            console.error('Autocomplete failed:', err);
        }
    };

    const applySuggestion = () => {
        const newCode = code + '\n' + suggestion;
        setCode(newCode);
        setSuggestion('');
        if (ws.current && ws.current.readyState === WebSocket.OPEN) {
            ws.current.send(newCode);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', height: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3>Room: {roomId}</h3>
                <button onClick={handleAutocomplete} style={{ padding: '8px 16px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                    Get AI Suggestion
                </button>
            </div>

            <div style={{ position: 'relative', flex: 1, minHeight: '400px', border: '1px solid #ccc', borderRadius: '4px' }}>
                <textarea
                    value={code}
                    onChange={handleChange}
                    style={{
                        width: '100%',
                        height: '100%',
                        padding: '10px',
                        fontFamily: 'monospace',
                        fontSize: '14px',
                        border: 'none',
                        resize: 'none',
                        outline: 'none'
                    }}
                    placeholder="Start typing..."
                />
            </div>

            {suggestion && (
                <div style={{ background: '#f0f0f0', padding: '10px', borderRadius: '4px', border: '1px solid #ddd' }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>Suggestion:</div>
                    <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{suggestion}</pre>
                    <div style={{ marginTop: '10px' }}>
                        <button onClick={applySuggestion} style={{ marginRight: '10px' }}>Apply</button>
                        <button onClick={() => setSuggestion('')}>Dismiss</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Editor;
