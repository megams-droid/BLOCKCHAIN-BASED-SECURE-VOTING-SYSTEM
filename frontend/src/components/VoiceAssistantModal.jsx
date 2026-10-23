import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Volume2, VolumeX, Send, Sparkles, X, ChevronRight, ShieldCheck } from 'lucide-react';

export default function VoiceAssistantModal({ voice, isOpen, onClose }) {
  const [textInput, setTextInput] = useState('');
  const messagesEndRef = useRef(null);

  const {
    isListening,
    isSpeaking,
    transcript,
    messages,
    speechSupported,
    startListening,
    stopListening,
    stopSpeaking,
    processInput,
  } = voice;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, transcript]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!textInput.trim()) return;
    processInput(textInput);
    setTextInput('');
  };

  const handleChipClick = (prompt) => {
    processInput(prompt);
  };

  if (!isOpen) return null;

  return (
    <div className="voice-modal-overlay" onClick={onClose}>
      <div className="voice-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="voice-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #0284c7 0%, #0d9488 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                boxShadow: '0 2px 8px rgba(2, 132, 199, 0.3)',
              }}
            >
              <Sparkles size={20} />
            </div>
            <div>
              <h4 style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--navy-dark)' }}>
                AI Voice Assistant
              </h4>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span
                  style={{
                    width: '7px',
                    height: '7px',
                    borderRadius: '50%',
                    backgroundColor: isListening ? '#10b981' : isSpeaking ? '#0284c7' : '#94a3b8',
                  }}
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '500' }}>
                  {isListening ? 'Listening to your voice...' : isSpeaking ? 'Speaking response...' : 'Ready for voice commands'}
                </span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {isSpeaking && (
              <button
                className="btn btn-sm btn-outline"
                onClick={stopSpeaking}
                title="Mute voice"
                style={{ padding: '6px', borderRadius: '50%' }}
              >
                <VolumeX size={16} color="#ef4444" />
              </button>
            )}
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-muted)',
                padding: '4px',
              }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Audio Visualizer Waves if speaking or listening */}
        {(isListening || isSpeaking) && (
          <div
            style={{
              background: '#f0f9ff',
              padding: '8px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid #e0f2fe',
            }}
          >
            <span style={{ fontSize: '0.8rem', color: '#0284c7', fontWeight: '600' }}>
              {isListening ? '🎙️ Audio input detected' : '🔊 AI Audio playback active'}
            </span>
            <div className="audio-waves">
              <span className="wave-bar" style={{ background: '#0284c7' }} />
              <span className="wave-bar" style={{ background: '#0d9488' }} />
              <span className="wave-bar" style={{ background: '#0284c7' }} />
              <span className="wave-bar" style={{ background: '#0d9488' }} />
              <span className="wave-bar" style={{ background: '#0284c7' }} />
            </div>
          </div>
        )}

        {/* Chat / Transcript Body */}
        <div className="voice-modal-body" style={{ maxHeight: '340px', minHeight: '260px' }}>
          {messages.map((m, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start',
                marginBottom: '14px',
              }}
            >
              <div
                style={{
                  maxWidth: '85%',
                  padding: '10px 14px',
                  borderRadius: m.role === 'user' ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                  background: m.role === 'user' ? '#0284c7' : '#f1f5f9',
                  color: m.role === 'user' ? '#ffffff' : 'var(--text-main)',
                  fontSize: '0.88rem',
                  lineHeight: '1.45',
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                {m.text}
              </div>
            </div>
          ))}

          {/* Interim transcript while user speaks */}
          {transcript && isListening && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '14px' }}>
              <div
                style={{
                  maxWidth: '85%',
                  padding: '8px 12px',
                  borderRadius: '12px',
                  background: 'rgba(2, 132, 199, 0.1)',
                  color: '#0369a1',
                  fontSize: '0.85rem',
                  fontStyle: 'italic',
                }}
              >
                "{transcript}"
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Chips */}
        <div
          style={{
            padding: '8px 16px',
            background: 'var(--bg-card-subtle)',
            borderTop: '1px solid var(--border-light)',
            display: 'flex',
            gap: '8px',
            overflowX: 'auto',
            whiteSpace: 'nowrap',
          }}
        >
          <button
            onClick={() => handleChipClick('Switch to White Mode')}
            className="btn btn-sm btn-outline"
            style={{ fontSize: '0.75rem', padding: '4px 10px', borderColor: '#fde68a' }}
          >
            ☀️ White Mode
          </button>
          <button
            onClick={() => handleChipClick('Switch to Dark Mode')}
            className="btn btn-sm btn-outline"
            style={{ fontSize: '0.75rem', padding: '4px 10px' }}
          >
            🌙 Dark Mode
          </button>
          <button
            onClick={() => handleChipClick('Verify Blockchain Integrity')}
            className="btn btn-sm btn-outline"
            style={{ fontSize: '0.75rem', padding: '4px 10px' }}
          >
            <ShieldCheck size={12} color="#0d9488" /> Verify Blockchain
          </button>
          <button
            onClick={() => handleChipClick('Show active elections')}
            className="btn btn-sm btn-outline"
            style={{ fontSize: '0.75rem', padding: '4px 10px' }}
          >
            🗳️ Elections
          </button>
          <button
            onClick={() => handleChipClick('Show live results')}
            className="btn btn-sm btn-outline"
            style={{ fontSize: '0.75rem', padding: '4px 10px' }}
          >
            📊 Live Results
          </button>
          <button
            onClick={() => handleChipClick('How does voting work?')}
            className="btn btn-sm btn-outline"
            style={{ fontSize: '0.75rem', padding: '4px 10px' }}
          >
            ❓ How it Works
          </button>
        </div>

        {/* Input & Voice Controls */}
        <div style={{ padding: '14px 18px', borderTop: '1px solid var(--border-light)', background: 'var(--bg-modal)' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {speechSupported ? (
              <button
                type="button"
                onClick={isListening ? stopListening : startListening}
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '50%',
                  border: 'none',
                  background: isListening
                    ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
                    : 'linear-gradient(135deg, #0284c7 0%, #0d9488 100%)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: isListening ? '0 0 12px rgba(239, 68, 68, 0.6)' : '0 2px 8px rgba(2, 132, 199, 0.25)',
                  transition: 'all 0.2s',
                  flexShrink: 0,
                }}
                title={isListening ? 'Click to stop listening' : 'Click to speak'}
              >
                {isListening ? <MicOff size={18} /> : <Mic size={18} />}
              </button>
            ) : null}

            <input
              type="text"
              placeholder={speechSupported ? 'Or type a command...' : 'Type a command for AI assistant...'}
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              className="form-input"
              style={{ flex: 1, padding: '9px 14px' }}
            />

            <button type="submit" className="btn btn-primary" style={{ padding: '9px 14px' }}>
              <Send size={16} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
