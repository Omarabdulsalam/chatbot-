import { useState, useRef, useEffect, useCallback } from 'react';
import ChatWindow from './components/ChatWindow.jsx';
import Header from './components/Header.jsx';
import InputArea from './components/InputArea.jsx';
import JarvisBg from './components/JarvisBg.jsx';
import FloatingHeart from './components/FloatingHeart.jsx';

export default function App() {
  const [messages, setMessages]     = useState([]);
  const [input, setInput]           = useState('');
  const [streaming, setStreaming]   = useState(false);
  const [listening, setListening]   = useState(false);
  const abortRef                    = useRef(null);
  const recognitionRef              = useRef(null);
  const heartRef                    = useRef(null);
  const pendingTextRef              = useRef(null);
  const sendMessageRef              = useRef(null);

  const sendMessage = useCallback(async (text) => {
    const content = (text || input).trim();
    if (!content || streaming) return;

    const userMsg = { role: 'user', content };
    const history = [...messages, userMsg];
    setMessages([...history, { role: 'assistant', content: '' }]);
    setInput('');
    setStreaming(true);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history }),
        signal: controller.signal,
      });

      if (!res.ok) throw new Error(`Server error: ${res.status}`);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let botText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const lines = decoder.decode(value).split('\n');
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6).trim();
          if (data === '[DONE]') break;
          try {
            const parsed = JSON.parse(data);
            if (parsed.text) {
              botText += parsed.text;
              setMessages(prev => {
                const updated = [...prev];
                updated[updated.length - 1] = { role: 'assistant', content: botText };
                return updated;
              });
            }
          } catch { /* ignore malformed chunks */ }
        }
      }

      if (botText) speakResponse(botText);
    } catch (err) {
      if (err.name !== 'AbortError') {
        setMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            role: 'assistant',
            content: 'I encountered an issue connecting to the server. Please check that the server is running and your API key is set.',
          };
          return updated;
        });
      }
    } finally {
      setStreaming(false);
    }
  }, [input, messages, streaming]);

  const speakResponse = (text) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const clean = text.replace(/[#*`_~|>]/g, '').replace(/\n+/g, ' ').slice(0, 500);
    const utt = new SpeechSynthesisUtterance(clean);
    utt.rate = 0.95;
    utt.pitch = 1.0;
    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find(v => v.name.includes('Google') && v.lang === 'en-US')
      || voices.find(v => v.lang === 'en-US');
    if (preferred) utt.voice = preferred;
    window.speechSynthesis.speak(utt);
  };

  const toggleVoice = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Voice input is not supported in your browser. Please use Chrome or Edge.');
      return;
    }

    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }

    const rec = new SpeechRecognition();
    rec.lang = 'en-US';
    rec.interimResults = true;
    rec.continuous = false;

    rec.onresult = (e) => {
      const transcript = Array.from(e.results)
        .map(r => r[0].transcript)
        .join('');
      setInput(transcript);
      if (e.results[e.results.length - 1].isFinal) {
        setListening(false);
        sendMessage(transcript);
      }
    };
    rec.onerror = () => setListening(false);
    rec.onend   = () => setListening(false);

    recognitionRef.current = rec;
    rec.start();
    setListening(true);
  }, [listening, sendMessage]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Keep sendMessageRef current so handleCrackDone never goes stale
  sendMessageRef.current = sendMessage;

  const handleSuggestion = (text) => {
    pendingTextRef.current = text;
    heartRef.current?.triggerCrack();
  };

  const handleCrackDone = useCallback(() => {
    const text = pendingTextRef.current;
    if (text) {
      pendingTextRef.current = null;
      sendMessageRef.current?.(text);
    }
  }, []);

  return (
    <>
      <JarvisBg />
      <FloatingHeart ref={heartRef} onCrackDone={handleCrackDone} />
      <div className="app">
        <Header onNewChat={() => { setMessages([]); setInput(''); }} />
        <ChatWindow
          messages={messages}
          streaming={streaming}
          onSuggestion={handleSuggestion}
          onBack={() => { setMessages([]); setInput(''); }}
        />
        <InputArea
          input={input}
          setInput={setInput}
          onSend={sendMessage}
          onKeyDown={handleKeyDown}
          onVoice={toggleVoice}
          listening={listening}
          disabled={streaming}
        />
      </div>
    </>
  );
}
