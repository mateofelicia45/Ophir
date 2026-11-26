import React, { useState, useEffect, useRef } from 'react';
import { usePassage } from '../../context/PassageContext';
import { listNotes } from '../../lib/notes';

export default function AssistantPage() {
  const { passage } = usePassage();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [apiKey, setApiKey] = useState(localStorage.getItem('ophir.aiKey') || '');
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    if (!apiKey) {
      alert('Por favor, configurá tu API Key en los ajustes.');
      return;
    }

    const userMsg = { role: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('http://localhost:5000/api/ai/chat', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-AI-API-Key': apiKey 
        },
        body: JSON.stringify({
          message: userMsg.text,
          context: {
            passage: `${passage.book} ${passage.chapter}`,
            notes: listNotes().map(n => n.body).join('\n')
          }
        })
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      setMessages(prev => [...prev, { role: 'assistant', text: data.response }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'error', text: `Error: ${err.message}` }]);
    } finally {
      setLoading(false);
    }
  };

  const saveKey = (key) => {
    setApiKey(key);
    localStorage.setItem('ophir.aiKey', key);
  };

  return (
    <div className="assistant-root">
      <header className="assistant-header">
        <h2>Tutor Mayéutico de Ophir</h2>
        <div className="key-config">
          <input 
            type="password" 
            placeholder="API Key" 
            value={apiKey} 
            onChange={(e) => setApiKey(e.target.value)}
            onBlur={() => saveKey(apiKey)}
          />
        </div>
      </header>

      <div className="chat-window" ref={scrollRef}>
        {messages.length === 0 && (
          <div className="welcome-msg">
            <p>Hola. Soy tu asistente de estudio. Puedo ayudarte a explorar el texto, analizar la morfología o comparar posturas teológicas.</p>
            <p className="context-chip">Contexto actual: {passage.book} {passage.chapter}</p>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`msg-bubble ${m.role}`}>
            {m.text}
          </div>
        ))}
        {loading && <div className="msg-bubble assistant loading">...</div>}
      </div>

      <form className="chat-input" onSubmit={handleSend}>
        <input 
          value={input} 
          onChange={(e) => setInput(e.target.value)} 
          placeholder="Hacé una pregunta sobre el pasaje..."
        />
        <button type="submit" disabled={loading}>Enviar</button>
      </form>
      
      <style>{`
        .assistant-root { display: flex; flex-direction: column; height: 80vh; max-width: 800px; margin: 0 auto; border: 1px solid var(--border); border-radius: 8px; background: var(--card); }
        .assistant-header { padding: 1rem; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; }
        .key-config input { font-size: 0.8rem; padding: 4px; background: var(--muted); border: 1px solid var(--border); color: var(--foreground); }
        .chat-window { flex: 1; overflow-y: auto; padding: 1rem; display: flex; flex-direction: column; gap: 1rem; }
        .welcome-msg { text-align: center; color: var(--muted-foreground); margin-top: 2rem; }
        .context-chip { display: inline-block; padding: 4px 8px; background: var(--accent); border-radius: 4px; font-size: 0.8rem; margin-top: 1rem; }
        .msg-bubble { max-width: 80%; padding: 0.8rem; border-radius: 12px; line-height: 1.5; }
        .msg-bubble.user { align-self: flex-end; background: var(--accent); color: var(--foreground); border-bottom-right-radius: 2px; }
        .msg-bubble.assistant { align-self: flex-start; background: var(--muted); color: var(--foreground); border-bottom-left-radius: 2px; }
        .msg-bubble.error { align-self: center; background: #fee; color: #b00; font-size: 0.9rem; }
        .chat-input { display: flex; gap: 0.5rem; padding: 1rem; border-top: 1px solid var(--border); }
        .chat-input input { flex: 1; padding: 0.8rem; border: 1px solid var(--border); border-radius: 4px; background: var(--card); color: var(--foreground); }
        .chat-input button { padding: 0.8rem 1.5rem; background: var(--accent); border: none; border-radius: 4px; cursor: pointer; color: var(--foreground); }
      `}</style>
    </div>
  );
}
