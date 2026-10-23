import { useState, useEffect, useRef, useCallback } from 'react';
import { api } from '../services/api.js';

export function useVoiceAssistant(onNavigate, options = {}) {
  const { theme, setTheme, toggleTheme } = options;
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: 'Hello! I am your AI Voting Assistant. You can speak to me or type to verify blockchain integrity, navigate elections, check candidates, switch to white mode or dark mode, or learn how your vote is secured.',
    },
  ]);
  const [speechSupported, setSpeechSupported] = useState(false);

  const recognitionRef = useRef(null);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      setSpeechSupported(true);
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        setTranscript(currentTranscript);

        if (event.results[0].isFinal) {
          handleVoiceCommand(currentTranscript);
        }
      };

      recognition.onerror = (event) => {
        console.warn('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  // Text-to-Speech function
  const speak = useCallback((text) => {
    if (!('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel(); // Stop any ongoing speech
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    // Pick a natural English voice if available
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(
      (v) => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha'))
    );
    if (preferredVoice) utterance.voice = preferredVoice;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  }, []);

  // AI Voice Command & Intent Engine
  const processInput = async (userInput) => {
    if (!userInput.trim()) return;

    const query = userInput.toLowerCase().trim();

    // Append user message
    setMessages((prev) => [...prev, { role: 'user', text: userInput }]);

    let reply = '';

    try {
      // Theme Switching Commands
      if (
        query.includes('white mode') ||
        query.includes('light mode') ||
        query.includes('white theme') ||
        query.includes('switch to white') ||
        query.includes('white whode') ||
        query.includes('change to white') ||
        query.includes('turn on white') ||
        query.includes('make it white')
      ) {
        if (setTheme) setTheme('white');
        reply = 'Switched to White Mode! The interface is now in a radiant, clean light theme with navy and teal accents.';
        setMessages((prev) => [...prev, { role: 'assistant', text: reply }]);
        speak(reply);
        return;
      }

      if (
        query.includes('dark mode') ||
        query.includes('dark theme') ||
        query.includes('switch to dark') ||
        query.includes('change to dark') ||
        query.includes('turn on dark') ||
        query.includes('night mode')
      ) {
        if (setTheme) setTheme('dark');
        reply = 'Switched to Dark Mode! The interface is now in a deep navy cybersecurity theme.';
        setMessages((prev) => [...prev, { role: 'assistant', text: reply }]);
        speak(reply);
        return;
      }

      if (query.includes('toggle theme') || query.includes('toggle mode') || query.includes('switch theme') || query.includes('change mode')) {
        if (toggleTheme) toggleTheme();
        reply = 'Theme mode toggled successfully!';
        setMessages((prev) => [...prev, { role: 'assistant', text: reply }]);
        speak(reply);
        return;
      }

      if (query.includes('verify') || query.includes('blockchain check') || query.includes('integrity') || query.includes('tamper')) {
        reply = 'Running cryptographic verification on the blockchain ledger...';
        setMessages((prev) => [...prev, { role: 'assistant', text: reply }]);
        speak(reply);

        if (onNavigate) onNavigate('verification');

        // Fetch verification from API for election 1
        try {
          const report = await api.verifyBlockchain(1);
          const detailedReply = report.isValid
            ? `Ledger verification complete! All ${report.totalBlocks} blocks are mathematically intact. Previous-hash pointers and SHA-256 signatures are 100% verified.`
            : `Warning! Ledger verification detected discrepancies: ${report.issues?.join(', ') || 'Tampered block detected.'}`;

          setMessages((prev) => [...prev, { role: 'assistant', text: detailedReply }]);
          speak(detailedReply);
        } catch {
          const fallback = 'Navigated to the Verification page where you can run live cryptographic checks.';
          setMessages((prev) => [...prev, { role: 'assistant', text: fallback }]);
          speak(fallback);
        }
        return;
      }

      if (query.includes('election') || query.includes('vote now') || query.includes('cast')) {
        reply = 'Opening the Elections portal. You can view all upcoming and active elections, verify your eligibility, and cast your secure ballot.';
        if (onNavigate) onNavigate('elections');
      } else if (query.includes('result') || query.includes('winner') || query.includes('standings') || query.includes('turnout')) {
        reply = 'Navigating to Election Results. Here you can inspect live turnout rates, candidate vote standings, and certified outcomes.';
        if (onNavigate) onNavigate('results');
      } else if (query.includes('block') || query.includes('ledger') || query.includes('explorer')) {
        reply = 'Opening the Blockchain Explorer. You can inspect each block, its previous hash, current hash, and transaction signature.';
        if (onNavigate) onNavigate('explorer');
      } else if (query.includes('candidate') || query.includes('who is running')) {
        reply = 'The active election features Dr. Elena Vance running under Digital Transformation Alliance, Marcus Sterling under Progressive Campus Union, and Aaliyah Patel under Innovation and Ethics Caucus.';
        if (onNavigate) onNavigate('elections');
      } else if (query.includes('sql') || query.includes('dbms') || query.includes('queries') || query.includes('database')) {
        reply = 'Opening the DBMS Demonstration Terminal. Here you can execute live SQL queries including GROUP BY, JOINs, subqueries, and transaction rollback demonstrations.';
        if (onNavigate) onNavigate('sqldemo');
      } else if (query.includes('how does voting work') || query.includes('security') || query.includes('safe') || query.includes('anonymous')) {
        reply = 'Your vote uses an anonymous ballot architecture. Your participation record is kept strictly separate from your candidate choice. Every vote is mined into an immutable SHA-256 block linked to the preceding block.';
      } else if (query.includes('help') || query.includes('what can you do')) {
        reply = 'You can ask me to: verify blockchain integrity, show election results, list candidates, explain how voting works, or open the DBMS SQL demo.';
      } else {
        reply = `I heard: "${userInput}". I can help you navigate elections, verify blockchain integrity, inspect live results, or explain the DBMS architecture.`;
      }

      setMessages((prev) => [...prev, { role: 'assistant', text: reply }]);
      speak(reply);
    } catch (err) {
      console.error('Error handling voice command:', err);
      const errReply = 'Sorry, I encountered an issue processing that request. Please try again.';
      setMessages((prev) => [...prev, { role: 'assistant', text: errReply }]);
      speak(errReply);
    }
  };

  const handleVoiceCommand = (spokenText) => {
    processInput(spokenText);
  };

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      setTranscript('');
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.warn('Recognition start error:', err);
      }
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  return {
    isListening,
    isSpeaking,
    transcript,
    messages,
    speechSupported,
    startListening,
    stopListening,
    stopSpeaking,
    processInput,
    speak,
  };
}
