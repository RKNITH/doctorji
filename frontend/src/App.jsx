import React, { useState, useRef, useEffect, useCallback } from "react";

// ─── Icons ──────────────────────────────────────────────────────────────────
const HeartIcon = ({ style }) => (
  <svg style={style} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 21.593c-5.63-5.539-11-10.297-11-14.402 0-3.791 3.068-5.191 5.281-5.191 1.312 0 4.151.501 5.719 4.457 1.59-3.968 4.464-4.447 5.726-4.447 2.54 0 5.274 1.621 5.274 5.181 0 4.069-5.136 8.625-11 14.402z" />
  </svg>
);
const MicIcon = ({ style }) => (
  <svg style={style} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1-9c0-.55.45-1 1-1s1 .45 1 1v6c0 .55-.45 1-1 1s-1-.45-1-1V5zm6 6c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
  </svg>
);
const StopIcon = ({ style }) => (
  <svg style={style} viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h12v12H6z" /></svg>
);
const SpeakerIcon = ({ style }) => (
  <svg style={style} viewBox="0 0 24 24" fill="currentColor">
    <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z" />
  </svg>
);
const SendIcon = ({ style }) => (
  <svg style={style} viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" /></svg>
);
const CrossIcon = ({ style }) => (
  <svg style={style} viewBox="0 0 24 24" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" /></svg>
);
const ChevronIcon = ({ expanded }) => (
  <svg
    style={{ width: 18, height: 18, color: "#6b7280", flexShrink: 0, transition: "transform 0.3s", transform: expanded ? "rotate(180deg)" : "rotate(0deg)" }}
    viewBox="0 0 24 24" fill="currentColor"
  >
    <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z" />
  </svg>
);

// ─── Section Definitions ─────────────────────────────────────────────────────
const SECTION_DEFS = [
  { key: "condition", emoji: "🩺", label: "संभावित समस्या", match: /संभावित समस्या/i, type: "default" },
  { key: "suggestion", emoji: "📋", label: "विस्तृत सुझाव", match: /विस्तृत सुझाव/i, type: "default" },
  { key: "remedy", emoji: "🌿", label: "घरेलू उपचार", match: /घरेलू उपचार/i, type: "home-remedy" },
  { key: "warning", emoji: "⚠️", label: "चेतावनी संकेत", match: /चेतावनी संकेत/i, type: "warning" },
  { key: "general", emoji: "📌", label: "सामान्य जानकारी", match: /सामान्य जानकारी/i, type: "default" },
];

// ─── Response Parser ──────────────────────────────────────────────────────────
function parseResponse(text) {
  if (!text) return [];
  const lines = text.split("\n");
  const sections = [];
  let cur = null, curLines = [];
  for (const line of lines) {
    const def = SECTION_DEFS.find(d => d.match.test(line.trim()));
    if (def) {
      if (cur) sections.push({ ...cur, content: curLines.join("\n").trim() });
      cur = def; curLines = [];
    } else if (cur) {
      curLines.push(line);
    }
  }
  if (cur) sections.push({ ...cur, content: curLines.join("\n").trim() });
  if (sections.length === 0)
    sections.push({ key: "raw", emoji: "🩺", label: "स्वास्थ्य सलाह", content: text.trim(), type: "default" });
  return sections;
}

// ─── Split text into ~200-char chunks at sentence/comma boundaries ───────────
// This is the KEY fix for Chrome's TTS cutting off long text.
function splitTextIntoChunks(text, maxLen = 200) {
  if (!text) return [];
  // Split at sentence-ending punctuation first
  const sentences = text.split(/(?<=[।|.!?])\s+/);
  const chunks = [];
  let current = "";
  for (const sentence of sentences) {
    if ((current + " " + sentence).trim().length <= maxLen) {
      current = current ? current + " " + sentence : sentence;
    } else {
      if (current) chunks.push(current.trim());
      // If a single sentence is too long, split at commas
      if (sentence.length > maxLen) {
        const parts = sentence.split(/(?<=[,،؛])\s+/);
        let sub = "";
        for (const part of parts) {
          if ((sub + " " + part).trim().length <= maxLen) {
            sub = sub ? sub + " " + part : part;
          } else {
            if (sub) chunks.push(sub.trim());
            sub = part;
          }
        }
        if (sub) current = sub;
        else current = "";
      } else {
        current = sentence;
      }
    }
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks.filter(Boolean);
}

// ─── Section Card ─────────────────────────────────────────────────────────────
const SectionCard = ({ section, index }) => {
  const [expanded, setExpanded] = useState(true);
  const isWarning = section.type === "warning";
  const isRemedy = section.type === "home-remedy";
  const accentColor = isWarning ? "#ef4444" : isRemedy ? "#f59e0b" : "#00c576";
  const titleColor = isWarning ? "#f87171" : isRemedy ? "#fbbf24" : "#34d399";
  const bgColor = isWarning ? "rgba(239,68,68,0.05)" : isRemedy ? "rgba(245,158,11,0.05)" : "rgba(0,197,118,0.05)";
  const borderColor = isWarning ? "rgba(239,68,68,0.18)" : isRemedy ? "rgba(245,158,11,0.18)" : "rgba(0,197,118,0.15)";
  return (
    <div style={{ background: bgColor, border: `1px solid ${borderColor}`, borderRadius: 14, padding: "16px 16px 14px 20px", margin: "10px 0", position: "relative", overflow: "hidden", animation: `slideUp 0.45s ${index * 0.07}s ease both` }}>
      <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 3, background: accentColor, borderRadius: "3px 0 0 3px" }} />
      <button onClick={() => setExpanded(v => !v)} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, textAlign: "left", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: "1.25rem", lineHeight: 1 }}>{section.emoji}</span>
          <span style={{ fontFamily: "'Noto Sans Devanagari', sans-serif", fontWeight: 700, fontSize: "0.95rem", color: titleColor }}>{section.label}</span>
        </div>
        <ChevronIcon expanded={expanded} />
      </button>
      {expanded && section.content && (
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid rgba(255,255,255,0.05)", animation: "fadeIn 0.25s ease" }}>
          <p style={{ fontFamily: "'Noto Sans Devanagari', sans-serif", color: "#d1d5db", lineHeight: 1.85, fontSize: "0.9rem", whiteSpace: "pre-wrap", margin: 0 }}>
            {section.content}
          </p>
        </div>
      )}
    </div>
  );
};

// ─── Loading ──────────────────────────────────────────────────────────────────
const LoadingState = () => (
  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "40px 16px", gap: 16 }}>
    <div style={{ position: "relative", width: 72, height: 72 }}>
      <div style={{ position: "absolute", inset: 0, border: "2px solid rgba(0,197,118,0.15)", borderTop: "2px solid #00c576", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      <div style={{ position: "absolute", inset: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <HeartIcon style={{ width: 24, height: 24, color: "#00c576" }} />
      </div>
    </div>
    <div style={{ textAlign: "center" }}>
      <p style={{ fontFamily: "'Noto Sans Devanagari', sans-serif", color: "#34d399", fontWeight: 600, fontSize: "1.05rem", margin: "0 0 10px" }}>AI जांच कर रहा है...</p>
      <div style={{ display: "flex", justifyContent: "center", gap: 6 }}>
        {[0, 1, 2].map(i => <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: "#00c576", animation: `dotBounce 1.4s ${i * 0.2}s ease-in-out infinite` }} />)}
      </div>
    </div>
    <p style={{ fontFamily: "'Noto Sans Devanagari', sans-serif", color: "#4b5563", fontSize: "0.82rem", textAlign: "center" }}>आपके लक्षणों का विश्लेषण हो रहा है, कृपया प्रतीक्षा करें</p>
  </div>
);

// ─── Quick Symptoms ───────────────────────────────────────────────────────────
const QUICK_SYMPTOMS = ["बुखार और सिरदर्द", "पेट दर्द और उल्टी", "खांसी और जुकाम", "थकान और कमज़ोरी", "पीठ में दर्द", "चक्कर आना"];

// ─── Voice Settings Panel ─────────────────────────────────────────────────────
const VoiceSettingsPanel = ({ voices, voiceSettings, setVoiceSettings }) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectedIdx = voices.findIndex(v => v === voiceSettings.voice);
  const deva = { fontFamily: "'Noto Sans Devanagari', sans-serif" };

  return (
    <div style={{ marginBottom: 10 }}>
      <button onClick={() => setIsOpen(o => !o)}
        style={{ ...deva, background: "none", border: "none", cursor: "pointer", color: "#34d399", fontSize: "0.75rem", display: "flex", alignItems: "center", gap: 4, padding: "4px 0" }}>
        🎵 आवाज़ सेटिंग {isOpen ? "▲" : "▼"}
      </button>

      {isOpen && (
        <div style={{ marginTop: 8, padding: "14px", borderRadius: 14, background: "rgba(0,197,118,0.06)", border: "1px solid rgba(0,197,118,0.15)", animation: "fadeIn 0.2s ease" }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 12 }}>
            <select
              value={selectedIdx >= 0 ? selectedIdx : 0}
              onChange={e => setVoiceSettings(prev => ({ ...prev, voice: voices[Number(e.target.value)] }))}
              style={{ flex: 1, fontSize: "0.75rem", padding: "6px 10px", borderRadius: 8, border: "1px solid rgba(0,197,118,0.3)", background: "rgba(10,25,40,0.8)", color: "#d1d5db", outline: "none" }}
            >
              {voices.length === 0 && <option>Loading voices...</option>}
              {voices.map((v, i) => (
                <option key={v.name + i} value={i}>{v.name} {v.lang ? `(${v.lang})` : ""}</option>
              ))}
            </select>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={{ ...deva, color: "#34d399", fontSize: "0.7rem", fontWeight: 600, display: "block", marginBottom: 4 }}>
                Speed: {voiceSettings.rate}x
              </label>
              <input type="range" min="0.6" max="1.6" step="0.05" value={voiceSettings.rate}
                onChange={e => setVoiceSettings(prev => ({ ...prev, rate: Number(e.target.value) }))}
                style={{ width: "100%", accentColor: "#00c576" }} />
            </div>
            <div>
              <label style={{ ...deva, color: "#34d399", fontSize: "0.7rem", fontWeight: 600, display: "block", marginBottom: 4 }}>
                Pitch: {voiceSettings.pitch}
              </label>
              <input type="range" min="0.6" max="2.0" step="0.1" value={voiceSettings.pitch}
                onChange={e => setVoiceSettings(prev => ({ ...prev, pitch: Number(e.target.value) }))}
                style={{ width: "100%", accentColor: "#00c576" }} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Main App ─────────────────────────────────────────────────────────────────
const App = () => {
  const [prompt, setPrompt] = useState("");
  const [response, setResponse] = useState("");
  const [sections, setSections] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voices, setVoices] = useState([]);
  const [voiceSettings, setVoiceSettings] = useState({ voice: null, rate: 0.88, pitch: 1.0 });

  // ── Refs ───────────────────────────────────────────────────────────────────
  const chunksRef = useRef([]);       // array of text chunks to speak
  const chunkIdxRef = useRef(0);      // which chunk we're on
  const isCancelledRef = useRef(false); // cancellation flag
  const keepAliveRef = useRef(null);  // setInterval handle for Chrome bug workaround
  const recognitionRef = useRef(null);
  const resultRef = useRef(null);
  const textareaRef = useRef(null);

  // ── Load voices ────────────────────────────────────────────────────────────
  useEffect(() => {
    function loadVoices() {
      const v = window.speechSynthesis.getVoices();
      if (!v.length) return; // not ready yet
      setVoices(v);
      // Prefer hi-IN voice
      const hiIdx = v.findIndex(vx => vx.lang?.startsWith("hi"));
      const chosen = hiIdx >= 0 ? v[hiIdx] : v[0] || null;
      setVoiceSettings(prev => ({ ...prev, voice: chosen }));
    }
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
    return () => { window.speechSynthesis.onvoiceschanged = null; };
  }, []);

  useEffect(() => {
    if (response) setSections(parseResponse(response));
  }, [response]);

  useEffect(() => {
    if (response && !isLoading && resultRef.current)
      setTimeout(() => resultRef.current.scrollIntoView({ behavior: "smooth", block: "start" }), 150);
  }, [response, isLoading]);

  // ── Chrome keepAlive: pause/resume every 10 seconds to prevent cutoff ─────
  function startKeepAlive() {
    stopKeepAlive();
    keepAliveRef.current = setInterval(() => {
      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.pause();
        window.speechSynthesis.resume();
      }
    }, 10000);
  }

  function stopKeepAlive() {
    if (keepAliveRef.current) {
      clearInterval(keepAliveRef.current);
      keepAliveRef.current = null;
    }
  }

  // ── Speak a single chunk, then chain to next ───────────────────────────────
  function speakChunk(idx) {
    if (isCancelledRef.current) {
      setIsSpeaking(false);
      stopKeepAlive();
      return;
    }
    const chunks = chunksRef.current;
    if (idx >= chunks.length) {
      // All done
      setIsSpeaking(false);
      stopKeepAlive();
      return;
    }

    const utter = new SpeechSynthesisUtterance(chunks[idx]);
    if (voiceSettings.voice) utter.voice = voiceSettings.voice;
    utter.rate = voiceSettings.rate || 0.88;
    utter.pitch = voiceSettings.pitch || 1.0;
    utter.lang = "hi-IN";

    utter.onstart = () => {
      if (idx === 0) setIsSpeaking(true);
    };

    utter.onend = () => {
      if (!isCancelledRef.current) {
        chunkIdxRef.current = idx + 1;
        speakChunk(idx + 1);
      }
    };

    utter.onerror = (e) => {
      // "interrupted" fires when we cancel intentionally — ignore it
      if (e.error === "interrupted" || e.error === "canceled") return;
      console.error("TTS error:", e.error);
      if (!isCancelledRef.current) {
        // Try next chunk on error
        chunkIdxRef.current = idx + 1;
        speakChunk(idx + 1);
      }
    };

    window.speechSynthesis.speak(utter);
  }

  // ── speakText: chunk + kick off ────────────────────────────────────────────
  function speakText(text) {
    if (!("speechSynthesis" in window)) {
      alert("आपका ब्राउज़र Text-to-Speech सपोर्ट नहीं करता। Chrome उपयोग करें।");
      return;
    }

    // Cancel any ongoing speech first
    isCancelledRef.current = true;
    window.speechSynthesis.cancel();
    stopKeepAlive();

    // Small delay to let cancel() flush
    setTimeout(() => {
      isCancelledRef.current = false;
      const chunks = splitTextIntoChunks(text, 200);
      chunksRef.current = chunks;
      chunkIdxRef.current = 0;

      if (chunks.length === 0) return;

      setIsSpeaking(true);
      startKeepAlive();
      speakChunk(0);
    }, 150);
  }

  // ── cancelSpeak ────────────────────────────────────────────────────────────
  function cancelSpeak() {
    isCancelledRef.current = true;
    window.speechSynthesis.cancel();
    stopKeepAlive();
    setIsSpeaking(false);
    chunksRef.current = [];
    chunkIdxRef.current = 0;
  }

  // ── handleSpeak toggle ─────────────────────────────────────────────────────
  const handleSpeak = useCallback(() => {
    if (!response) return;
    if (isSpeaking) { cancelSpeak(); return; }
    speakText(response);
  }, [response, isSpeaking, voiceSettings]);

  // Cleanup on unmount
  useEffect(() => {
    return () => { cancelSpeak(); };
  }, []);

  // ── Call backend ─────────────────────────────────────────────────────────────
  const handleCheckHealth = useCallback(async () => {
    const trimmed = prompt.trim();
    if (!trimmed) { textareaRef.current?.focus(); return; }
    setIsLoading(true); setResponse(""); setSections([]);
    cancelSpeak();
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/check-health`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: trimmed }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.result) setResponse(data.result);
      else throw new Error("Empty result");
    } catch (err) {
      console.error(err);
      setResponse("⚠️ क्षमा करें, अभी सेवा उपलब्ध नहीं है।\n\nकृपया:\n- अपना इंटरनेट कनेक्शन जांचें\n- थोड़ी देर बाद फिर कोशिश करें\n- गंभीर समस्या में नज़दीकी स्वास्थ्य केंद्र जाएं");
    } finally { setIsLoading(false); }
  }, [prompt]);

  const handleKeyDown = (e) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) handleCheckHealth(); };

  // ── Voice Input ────────────────────────────────────────────────────────────
  const toggleMic = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { alert("वॉइस इनपुट के लिए Chrome ब्राउज़र उपयोग करें।"); return; }
    if (isListening) { recognitionRef.current?.stop(); setIsListening(false); return; }
    const r = new SR();
    r.lang = "hi-IN"; r.continuous = false; r.interimResults = false;
    recognitionRef.current = r;
    r.onstart = () => setIsListening(true);
    r.onresult = (e) => setPrompt(prev => prev ? prev + " " + e.results[0][0].transcript : e.results[0][0].transcript);
    r.onend = () => setIsListening(false);
    r.onerror = (e) => { console.error("SR error:", e.error); setIsListening(false); };
    r.start();
  }, [isListening]);

  const clearAll = () => { setResponse(""); setSections([]); cancelSpeak(); };

  // ── Styles ─────────────────────────────────────────────────────────────────
  const deva = { fontFamily: "'Noto Sans Devanagari', sans-serif" };
  const glass = { background: "rgba(10,25,40,0.78)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", border: "1px solid rgba(0,197,118,0.15)", boxShadow: "0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04)" };

  return (
    <div style={{ minHeight: "100vh", background: "#040d14", overflowX: "hidden", position: "relative" }}>

      {/* BG blobs */}
      <div style={{ position: "fixed", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, #00c576, #005f38)", filter: "blur(90px)", opacity: 0.11, top: -150, left: -150, animation: "float 9s ease-in-out infinite", pointerEvents: "none", zIndex: 0 }} />
      <div style={{ position: "fixed", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, #0077b6, #003566)", filter: "blur(90px)", opacity: 0.09, bottom: -100, right: -100, animation: "float 9s 3s ease-in-out infinite", pointerEvents: "none", zIndex: 0 }} />
      <div style={{ position: "fixed", inset: 0, backgroundImage: "linear-gradient(rgba(0,197,118,1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,197,118,1) 1px, transparent 1px)", backgroundSize: "60px 60px", opacity: 0.018, pointerEvents: "none", zIndex: 0 }} />

      <div style={{ position: "relative", zIndex: 1, maxWidth: 680, margin: "0 auto", padding: "clamp(16px,4vw,40px) 16px 80px" }}>

        {/* HEADER */}
        <header style={{ textAlign: "center", marginBottom: "clamp(28px,5vw,52px)", animation: "slideUp 0.55s ease both" }}>
          <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 72, height: 72, borderRadius: 20, background: "linear-gradient(135deg, rgba(0,197,118,0.15), rgba(0,119,182,0.15))", border: "1px solid rgba(0,197,118,0.3)", fontSize: 36, marginBottom: 16 }}>🏥</div>
          <h1 style={{ ...deva, fontFamily: "'Sora','Noto Sans Devanagari',sans-serif", fontSize: "clamp(1.75rem,5vw,2.5rem)", fontWeight: 800, margin: "0 0 8px", background: "linear-gradient(135deg,#00c576,#00a0c7,#00e5a0)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", lineHeight: 1.2 }}>
            AI स्वास्थ्य सहायक
          </h1>
          <p style={{ ...deva, color: "#9ca3af", fontSize: "clamp(0.88rem,2.5vw,1.02rem)", margin: "0 0 18px" }}>अपने लक्षण बताइए, तुरंत स्वास्थ्य सलाह पाइए</p>
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 8 }}>
            {[["🌿", "घरेलू उपचार"], ["🗣️", "हिंदी सलाह"], ["🔊", "सुनें आवाज़ में"], ["🎙️", "बोलकर बताएं"]].map(([e, t]) => (
              <span key={t} style={{ ...deva, background: "rgba(0,197,118,0.08)", border: "1px solid rgba(0,197,118,0.2)", borderRadius: 999, padding: "5px 14px", fontSize: "0.73rem", color: "#34d399", display: "inline-flex", alignItems: "center", gap: 5 }}>{e} {t}</span>
            ))}
          </div>
        </header>

        {/* INPUT CARD */}
        <div style={{ ...glass, borderRadius: 24, padding: "clamp(16px,4vw,28px)", marginBottom: 14, animation: "slideUp 0.55s 0.08s ease both" }}>
          <div style={{ marginBottom: 14 }}>
            <p style={{ color: "#374151", fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8, ...deva }}>⚡ जल्दी चुनें</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
              {QUICK_SYMPTOMS.map(s => (
                <button key={s} onClick={() => { setPrompt(s); textareaRef.current?.focus(); }}
                  style={{ ...deva, fontSize: "0.73rem", padding: "5px 11px", borderRadius: 999, cursor: "pointer", transition: "all 0.18s", background: prompt === s ? "rgba(0,197,118,0.2)" : "rgba(255,255,255,0.04)", border: `1px solid ${prompt === s ? "rgba(0,197,118,0.5)" : "rgba(255,255,255,0.08)"}`, color: prompt === s ? "#00c576" : "#9ca3af" }}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div style={{ position: "relative", borderRadius: 14, border: "1px solid rgba(255,255,255,0.08)" }}>
            <textarea ref={textareaRef} value={prompt} onChange={e => setPrompt(e.target.value)} onKeyDown={handleKeyDown}
              placeholder={"अपने लक्षण यहाँ लिखें या माइक दबाकर बोलें...\nजैसे: मुझे 2 दिन से बुखार है और सिरदर्द भी हो रहा है"}
              maxLength={500} rows={4}
              style={{ ...deva, width: "100%", background: "transparent", padding: "14px 44px 14px 16px", color: "#e5e7eb", fontSize: "clamp(0.875rem,2.5vw,1rem)", lineHeight: 1.75, resize: "none", outline: "none", border: "none", borderRadius: 14, boxSizing: "border-box" }}
            />
            {prompt && (
              <button onClick={() => setPrompt("")} style={{ position: "absolute", top: 10, right: 10, width: 26, height: 26, borderRadius: "50%", background: "rgba(255,255,255,0.07)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <CrossIcon style={{ width: 13, height: 13, color: "#9ca3af" }} />
              </button>
            )}
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 11, gap: 10 }}>
            <span style={{ color: "#374151", fontSize: "0.68rem", flexShrink: 0 }}>{prompt.length}/500</span>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              {/* MIC BUTTON */}
              <button onClick={toggleMic} title={isListening ? "बंद करें" : "बोलकर बताएं"}
                style={{ width: 44, height: 44, borderRadius: "50%", border: `1px solid ${isListening ? "rgba(239,68,68,0.55)" : "rgba(0,197,118,0.35)"}`, background: isListening ? "rgba(239,68,68,0.14)" : "rgba(0,197,118,0.1)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s", animation: isListening ? "micPulse 1s ease-in-out infinite" : "none" }}>
                <MicIcon style={{ width: 20, height: 20, color: isListening ? "#f87171" : "#34d399" }} />
              </button>
              {/* SEND BUTTON */}
              <button onClick={handleCheckHealth} disabled={isLoading || !prompt.trim()}
                style={{ ...deva, display: "flex", alignItems: "center", gap: 8, padding: "10px 20px", borderRadius: 12, background: "linear-gradient(135deg,#00c576,#00a562)", border: "none", color: "#052e16", fontWeight: 700, fontSize: "clamp(0.78rem,2vw,0.92rem)", cursor: prompt.trim() && !isLoading ? "pointer" : "not-allowed", opacity: !prompt.trim() || isLoading ? 0.45 : 1, transition: "all 0.2s" }}>
                {isLoading ? <div style={{ width: 17, height: 17, border: "2px solid rgba(5,46,22,0.25)", borderTop: "2px solid #052e16", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} /> : <SendIcon style={{ width: 17, height: 17 }} />}
                <span>{isLoading ? "जांच हो रही है..." : "सलाह पाएं"}</span>
              </button>
            </div>
          </div>
          <p style={{ textAlign: "center", color: "#1f2937", fontSize: "0.67rem", marginTop: 7, ...deva }}>Ctrl + Enter से भी सबमिट कर सकते हैं</p>
        </div>

        {/* LISTENING INDICATOR */}
        {isListening && (
          <div style={{ ...glass, borderRadius: 14, padding: "11px 16px", marginBottom: 12, display: "flex", alignItems: "center", gap: 10, borderColor: "rgba(239,68,68,0.35)", animation: "fadeIn 0.25s ease" }}>
            <div style={{ width: 9, height: 9, borderRadius: "50%", background: "#f87171", animation: "micPulse 1s ease-in-out infinite", flexShrink: 0 }} />
            <span style={{ ...deva, color: "#f87171", fontSize: "0.85rem" }}>सुन रहा हूँ... बोलिए अपने लक्षण</span>
          </div>
        )}

        {/* LOADING */}
        {isLoading && (
          <div style={{ ...glass, borderRadius: 24, animation: "fadeIn 0.25s ease" }}>
            <LoadingState />
          </div>
        )}

        {/* RESULT */}
        {response && !isLoading && (
          <div ref={resultRef} style={{ animation: "slideUp 0.45s ease both" }}>

            {/* Result Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, padding: "0 2px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <HeartIcon style={{ width: 20, height: 20, color: "#34d399" }} />
                <h2 style={{ ...deva, color: "#fff", fontWeight: 700, fontSize: "clamp(0.95rem,2.5vw,1.15rem)", margin: 0 }}>आपकी स्वास्थ्य रिपोर्ट</h2>
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                {/* SPEAK BUTTON */}
                <button onClick={handleSpeak}
                  style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 20, background: isSpeaking ? "linear-gradient(135deg,#ef4444,#dc2626)" : "linear-gradient(135deg,#0077b6,#005f8a)", border: "none", cursor: "pointer", transition: "all 0.2s" }}>
                  {isSpeaking
                    ? <StopIcon style={{ width: 14, height: 14, color: "#fff" }} />
                    : <SpeakerIcon style={{ width: 14, height: 14, color: "#fff" }} />}
                  <span style={{ ...deva, color: "#fff", fontSize: "0.75rem", fontWeight: 600 }}>
                    {isSpeaking ? "बंद करें" : "सुनें"}
                  </span>
                </button>
                {/* CLOSE */}
                <button onClick={clearAll} style={{ width: 38, height: 38, borderRadius: "50%", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <CrossIcon style={{ width: 15, height: 15, color: "#9ca3af" }} />
                </button>
              </div>
            </div>

            {/* Speaking waveform */}
            {isSpeaking && (
              <div style={{ ...glass, borderRadius: 12, padding: "10px 14px", marginBottom: 10, display: "flex", alignItems: "center", gap: 10, animation: "fadeIn 0.25s ease" }}>
                <div style={{ display: "flex", gap: 3, alignItems: "flex-end" }}>
                  {[1, 2, 3, 4].map(i => <div key={i} style={{ width: 3, borderRadius: 3, background: "#60a5fa", height: `${8 + i * 4}px`, animation: `dotBounce 0.8s ${i * 0.15}s ease-in-out infinite` }} />)}
                </div>
                <span style={{ ...deva, color: "#93c5fd", fontSize: "0.83rem" }}>आवाज़ में पढ़ा जा रहा है... "बंद करें" दबाएं रोकने के लिए</span>
              </div>
            )}

            {/* Voice settings */}
            <VoiceSettingsPanel voices={voices} voiceSettings={voiceSettings} setVoiceSettings={setVoiceSettings} />

            {/* Section cards */}
            <div style={{ ...glass, borderRadius: 24, padding: "clamp(12px,3.5vw,22px)" }}>
              {sections.map((s, i) => <SectionCard key={s.key + i} section={s} index={i} />)}
            </div>

            {/* Disclaimer */}
            <div style={{ background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 12, padding: "11px 15px", marginTop: 10 }}>
              <p style={{ ...deva, color: "#fca5a5", fontSize: "0.78rem", lineHeight: 1.65, margin: 0 }}>
                ⚠️ <strong>महत्वपूर्ण:</strong> यह AI द्वारा दी गई सामान्य जानकारी है। यह किसी डॉक्टर की जगह नहीं ले सकती। गंभीर लक्षणों में तुरंत नज़दीकी स्वास्थ्य केंद्र जाएं।
              </p>
            </div>

            <button onClick={() => { clearAll(); setPrompt(""); window.scrollTo({ top: 0, behavior: "smooth" }); }}
              style={{ ...deva, width: "100%", marginTop: 10, padding: "13px", borderRadius: 14, background: "transparent", border: "1px solid rgba(0,197,118,0.3)", color: "#34d399", fontWeight: 600, fontSize: "0.88rem", cursor: "pointer", transition: "all 0.2s" }}
              onMouseOver={e => e.currentTarget.style.background = "rgba(0,197,118,0.08)"}
              onMouseOut={e => e.currentTarget.style.background = "transparent"}>
              🔄 नए लक्षण बताएं
            </button>
          </div>
        )}

        {/* EMPTY STATE */}
        {!response && !isLoading && (
          <div style={{ ...glass, borderRadius: 20, padding: "clamp(24px,4vw,40px) 16px", textAlign: "center", animation: "slideUp 0.55s 0.16s ease both" }}>
            <div style={{ fontSize: 38, marginBottom: 12, opacity: 0.28 }}>💊</div>
            <p style={{ ...deva, color: "#4b5563", fontSize: "0.88rem", lineHeight: 1.8, margin: 0 }}>
              ऊपर अपने लक्षण लिखें या बोलें<br />
              <span style={{ color: "#374151", fontSize: "0.78rem" }}>AI आपको सरल हिंदी में विस्तृत सलाह देगा</span>
            </p>
          </div>
        )}

        <footer style={{ textAlign: "center", marginTop: 32, color: "#fff", fontSize: "0.73rem", lineHeight: 2.1 }}>

          <p>Made By Raviranjan</p>
        </footer>
      </div>

      <style>{`
        * { box-sizing: border-box; }
        textarea::placeholder { color: #374151; }
        @keyframes spin      { to { transform: rotate(360deg); } }
        @keyframes float     { 0%,100%{transform:translate(0,0)} 33%{transform:translate(18px,-18px)} 66%{transform:translate(-12px,10px)} }
        @keyframes slideUp   { from{opacity:0;transform:translateY(26px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeIn    { from{opacity:0} to{opacity:1} }
        @keyframes dotBounce { 0%,80%,100%{transform:scale(0.6);opacity:0.4} 40%{transform:scale(1);opacity:1} }
        @keyframes micPulse  { 0%,100%{box-shadow:0 0 0 0 rgba(239,68,68,0.45)} 50%{box-shadow:0 0 0 7px rgba(239,68,68,0)} }
      `}</style>
    </div>
  );
};

export default App;