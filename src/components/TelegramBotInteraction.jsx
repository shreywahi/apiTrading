import React, { useState } from 'react';

function TelegramBotInteraction() {
  const [apiKey, setApiKey] = useState(''); // Telegram bot token
  const [apiKeyValid, setApiKeyValid] = useState(false);
  const [botInfo, setBotInfo] = useState(null);
  const [chatId, setChatId] = useState('');
  const [chatIdValid, setChatIdValid] = useState(false);
  const [message, setMessage] = useState('');
  const [chat, setChat] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [connecting, setConnecting] = useState(false);

  // Connect bot only when button is clicked
  const handleConnectBot = async () => {
    if (!apiKey || apiKey.trim().length === 0) {
      setApiKeyValid(false);
      setBotInfo(null);
      setError('Invalid Bot API Key');
      return;
    }
    if (!chatId || chatId.trim().length === 0) {
      setChatIdValid(false);
      setError('Chat ID is required to connect to bot');
      return;
    }
    setConnecting(true);
    setError('');
    try {
      const res = await fetch(`https://api.telegram.org/bot${apiKey}/getMe`);
      const data = await res.json();
      if (data.ok) {
        setApiKeyValid(true);
        setBotInfo(data.result);
      } else {
        setApiKeyValid(false);
        setBotInfo(null);
        setError('Invalid Bot API Key or unable to fetch bot info');
      }
    } catch (e) {
      setApiKeyValid(false);
      setBotInfo(null);
      setError('Error connecting to bot');
    }
    setConnecting(false);
  };

  // Only one handleChatIdBlur function should exist

  const handleChatIdBlur = () => {
    if (chatId && chatId.trim().length > 0) {
      setChatIdValid(true);
      setError('');
    } else {
      setChatIdValid(false);
      setError('Invalid Chat ID');
    }
  };

  // For demo, keep chatId logic hidden unless you want to send messages
  // You can add chatId field back if needed

  const handleSend = async () => {
    if (!apiKeyValid || !chatId || !message) return;
    setLoading(true);
    setError('');
    setChat(prev => [...prev, { from: 'user', text: message }]);
    try {
      const res = await fetch(`https://api.telegram.org/bot${apiKey}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text: message })
      });
      const data = await res.json();
      if (data.ok && data.result && data.result.text) {
        setChat(prev => [...prev, { from: 'bot', text: data.result.text }]);
      } else {
        setChat(prev => [...prev, { from: 'bot', text: 'Message sent, but no reply received.' }]);
      }
      setMessage('');
      setLoading(false);
    } catch (e) {
      setError('Error sending message');
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: '32px 0' }}>
      <div style={{
        background: 'rgba(118,75,162,0.18)',
        borderRadius: 18,
        padding: '28px 32px',
        margin: '0 auto 32px auto',
        boxShadow: '0 2px 18px 0 rgba(118,75,162,0.10)',
        maxWidth: 440,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 18
      }}>
        <div style={{ fontWeight: 700, fontSize: 18, color: '#764ba2', marginBottom: 8 }}>Bot API Key (Telegram Token):</div>
        <input
          type="text"
          value={apiKey}
          onChange={e => setApiKey(e.target.value)}
          placeholder="Enter Bot API Key"
          style={{ width: '100%', padding: 12, borderRadius: 10, border: '1.5px solid #764ba2', fontSize: 16, background: '#f8f6fc', marginBottom: 8 }}
          disabled={apiKeyValid || connecting}
        />
        <input
          type="text"
          value={chatId}
          onChange={e => setChatId(e.target.value)}
          placeholder="Enter Your Chat ID"
          style={{ width: '100%', padding: 12, borderRadius: 10, border: '1.5px solid #764ba2', fontSize: 16, background: '#f8f6fc', marginBottom: 8 }}
          disabled={apiKeyValid || connecting}
        />
        <button
          onClick={handleConnectBot}
          disabled={apiKeyValid || connecting || !apiKey || !chatId}
          style={{ width: '100%', padding: '12px 0', borderRadius: 10, background: '#764ba2', color: '#fff', border: 'none', fontWeight: 700, fontSize: 17, cursor: connecting ? 'not-allowed' : 'pointer', marginTop: 4 }}
        >
          {connecting ? 'Connecting...' : 'Connect'}
        </button>
        {error && <div style={{ color: '#e53e3e', marginTop: 4, fontWeight: 500 }}>{error}</div>}
      </div>
      {error && <div style={{ color: '#e53e3e', marginBottom: 8 }}>{error}</div>}

      {/* Bot info and welcome message removed for cleaner UI */}

      {apiKeyValid && botInfo && (
        <div style={{ marginTop: 0 }}>
          <div style={{ fontWeight: 600, marginBottom: 8, fontSize: 18, color: '#764ba2', textAlign: 'left', marginLeft: 10 }}>
            Chat with {botInfo.first_name || botInfo.username} <span style={{ color: '#888', fontWeight: 400 }}>@{botInfo.username}</span>:
          </div>
          <div style={{
            background: 'rgba(118,75,162,0.13)',
            borderRadius: 14,
            padding: 20,
            minHeight: 120,
            marginBottom: 18,
            maxHeight: 260,
            overflowY: 'auto',
            border: '1.5px solid #764ba2',
            boxShadow: '0 2px 12px 0 rgba(118,75,162,0.08)'
          }}>
            {chat.length === 0 && <div style={{ color: '#888', fontSize: 16 }}>No messages yet.</div>}
            {chat.map((msg, idx) => (
              <div key={idx} style={{
                textAlign: msg.from === 'user' ? 'right' : 'left',
                marginBottom: 10
              }}>
                <span style={{
                  display: 'inline-block',
                  background: msg.from === 'user' ? 'linear-gradient(90deg,#764ba2,#667eea)' : '#fff',
                  color: msg.from === 'user' ? '#fff' : '#764ba2',
                  borderRadius: 10,
                  padding: '12px 18px',
                  maxWidth: '80%',
                  fontWeight: 500,
                  fontSize: 17,
                  boxShadow: msg.from === 'user' ? '0 2px 8px 0 rgba(118,75,162,0.10)' : 'none'
                }}>{msg.text}</span>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <input
              type="text"
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Type a message..."
              style={{ flex: 1, padding: 14, borderRadius: 10, border: '1.5px solid #764ba2', fontSize: 16, background: '#f8f6fc' }}
              onKeyDown={e => { if (e.key === 'Enter') handleSend(); }}
              disabled={loading}
            />
            <button
              onClick={handleSend}
              disabled={loading || !message}
              style={{ padding: '14px 32px', borderRadius: 10, background: '#764ba2', color: '#fff', border: 'none', fontWeight: 700, fontSize: 17, cursor: loading ? 'not-allowed' : 'pointer' }}
            >
              {loading ? 'Sending...' : 'Send'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default TelegramBotInteraction;
