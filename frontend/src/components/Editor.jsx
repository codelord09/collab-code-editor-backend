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
            // Clear suggestion if code changes externally
            setSuggestion('');
        };

        return () => {
            if (ws.current) {
                ws.current.close();
            }
        };
    }, [roomId]);

    // Auto-trigger autocomplete
    useEffect(() => {
        if (!code) return;

        const timer = setTimeout(() => {
            handleAutocomplete();
        }, 600); // 600ms debounce as per PRD

        return () => clearTimeout(timer);
    }, [code]);

    const handleChange = (e) => {
        const newCode = e.target.value;
        setCode(newCode);
        setSuggestion(''); // Clear old suggestion on type
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
            if (data.suggestion) {
                setSuggestion(data.suggestion);
            }
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
        <div className="editor-container">
            <div className="toolbar">
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <span className="room-badge">{roomId}</span>
                </div>

                <div className="status-text">
                    <span className="status-dot"></span>
                    Live Sync • AI Autocomplete On
                </div>
            </div>

            <div className="code-area">
                <textarea
                    className="main-editor"
                    value={code}
                    onChange={handleChange}
                    placeholder="Start typing your python code here..."
                    spellCheck="false"
                />
            </div>

            {suggestion && (
                <div className="suggestion-box">
                    <div className="suggestion-header">
                        <div className="suggestion-title">
                            <span>✨ AI Suggestion</span>
                        </div>
                    </div>
                    <div className="suggestion-content">
                        <pre className="suggestion-code">{suggestion}</pre>
                    </div>
                    <div className="suggestion-actions">
                        <button onClick={applySuggestion} className="btn btn-primary btn-xs">Apply (Tab)</button>
                        <button onClick={() => setSuggestion('')} className="btn btn-secondary btn-xs">Dismiss</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Editor;
