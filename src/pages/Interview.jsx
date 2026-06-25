import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../api/axios";

const clean = (text) =>
  text
    ?.replace(/#{1,6}\s/g, "")
    .replace(/\*\*/g, "")
    .replace(/\*/g, "")
    .trim() || "";

const speakText = (text) => {
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-IN";
  utterance.rate = 0.9;
  utterance.pitch = 1;
  window.speechSynthesis.speak(utterance);
};

export default function Interview() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const [session, setSession] = useState(state);
  const [messages, setMessages] = useState([]);
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [interimText, setInterimText] = useState("");
  const [audioUrl, setAudioUrl] = useState(null);
  const [mode, setMode] = useState("interview"); // "interview" or "classic"

  const bottomRef = useRef(null);
  const transcriptBottomRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recognitionRef = useRef(null);

  const speakQuestion = (text) => {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-IN";
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    if (state) {
      const firstMsg = {
        role: "ai",
        text: clean(state.message),
        questionNumber: state.questionNumber,
      };
      setMessages([firstMsg]);
      if (mode === "interview") speakQuestion(clean(state.message));
    }
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    transcriptBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        stream.getTracks().forEach((t) => t.stop());
      };
      mediaRecorder.start();
    } catch {
      console.error("Microphone access denied");
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    stopRecording();
    setIsListening(false);
    setInterimText("");
  };

  const startListening = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      alert("Use Chrome or Brave for speech input.");
      return;
    }

    startRecording();
    const r = new SR();
    r.lang = "en-IN";
    r.continuous = true;
    r.interimResults = true;
    recognitionRef.current = r;

    r.onstart = () => setIsListening(true);
    r.onresult = (e) => {
      let final = "";
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) final += e.results[i][0].transcript;
        else interim += e.results[i][0].transcript;
      }
      if (final) setAnswer((prev) => prev + (prev ? " " : "") + final);
      setInterimText(interim);
    };
    r.onerror = () => { setIsListening(false); setInterimText(""); };
    r.onend = () => { setIsListening(false); setInterimText(""); stopRecording(); };
    r.start();
  };

  const submitAnswer = async () => {
    if (!answer.trim() || loading) return;
    setLoading(true);
    window.speechSynthesis.cancel();
    setIsSpeaking(false);

    const currentAudioUrl = audioUrl;
    const userMsg = { role: "user", text: answer, audioUrl: currentAudioUrl };
    setMessages((prev) => [...prev, userMsg]);
    setAnswer("");
    setAudioUrl(null);

    try {
      const res = await api.post("/api/interview/answer", {
        sessionId: session.sessionId,
        answer: userMsg.text,
      });

      if (res.data.status === "COMPLETED") {
        setMessages((prev) => [
          ...prev,
          { role: "ai", text: "✅ Interview complete! Taking you to your report...", score: res.data.score },
        ]);
        setTimeout(() => {
          navigate(`/report/${session.sessionId}`, {
            state: { report: res.data.feedbackReport, score: res.data.score },
          });
        }, 1500);
      } else {
        const aiMsg = {
          role: "ai",
          text: clean(res.data.message),
          questionNumber: res.data.questionNumber,
          score: res.data.score,
        };
        setMessages((prev) => [...prev, aiMsg]);
        setSession(res.data);
        if (mode === "interview") speakQuestion(clean(res.data.message));
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "ai", text: "⚠️ Something went wrong. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submitAnswer();
    }
  };

  const progress = ((session?.questionNumber || 1) / (session?.totalQuestions || 5)) * 100;
  const scoreColor = (score) => score >= 70 ? "#22c55e" : score >= 40 ? "#f59e0b" : "#ef4444";

  // ─── INTERVIEW MODE UI ───────────────────────────────────────────
  const InterviewModeUI = () => (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>

      {/* Two avatars row */}
      <div style={{
        display: "flex", gap: "1.5rem", padding: "2rem 2rem 1rem",
        justifyContent: "center", alignItems: "flex-end"
      }}>

        {/* AI side */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px", flex: 1 }}>
          <div style={{ position: "relative" }}>
            {/* Glow rings when speaking */}
            {isSpeaking && (
              <>
                <div style={{
                  position: "absolute", inset: "-12px", borderRadius: "50%",
                  border: "2px solid rgba(99,102,241,0.4)",
                  animation: "ringPulse 1.2s infinite"
                }} />
                <div style={{
                  position: "absolute", inset: "-24px", borderRadius: "50%",
                  border: "2px solid rgba(99,102,241,0.2)",
                  animation: "ringPulse 1.2s infinite 0.3s"
                }} />
              </>
            )}
            <div style={{
              width: "80px", height: "80px", borderRadius: "50%",
              background: isSpeaking
                ? "linear-gradient(135deg, #6366f1, #8b5cf6)"
                : "#1e1e30",
              border: isSpeaking ? "3px solid #6366f1" : "3px solid #2a2a3e",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "32px", transition: "all 0.3s",
              boxShadow: isSpeaking ? "0 0 30px rgba(99,102,241,0.5)" : "none"
            }}>
              🧠
            </div>
          </div>

          <div style={{ textAlign: "center" }}>
            <p style={{ color: "#fff", fontSize: "14px", fontWeight: "600", margin: "0 0 2px" }}>
              AI Interviewer
            </p>
            <p style={{
              fontSize: "11px", margin: 0,
              color: isSpeaking ? "#818cf8" : "#6b6b80",
              animation: isSpeaking ? "pulse 1.5s infinite" : "none"
            }}>
              {isSpeaking ? "🔊 Speaking..." : loading ? "Thinking..." : "Waiting"}
            </p>
          </div>

          {/* Sound wave bars when AI speaking */}
          {isSpeaking && (
            <div style={{ display: "flex", gap: "3px", alignItems: "center", height: "20px" }}>
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} style={{
                  width: "3px", background: "#6366f1", borderRadius: "2px",
                  animation: `wave ${0.4 + i * 0.1}s ease-in-out infinite alternate`,
                  animationDelay: `${i * 0.1}s`
                }} />
              ))}
            </div>
          )}
        </div>

        {/* VS divider */}
        <div style={{
          display: "flex", flexDirection: "column", alignItems: "center", gap: "4px",
          paddingBottom: "40px"
        }}>
          <div style={{ width: "1px", height: "40px", background: "#1e1e30" }} />
          <span style={{ color: "#3a3a4e", fontSize: "11px", fontWeight: "600" }}>VS</span>
          <div style={{ width: "1px", height: "40px", background: "#1e1e30" }} />
        </div>

        {/* User side */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px", flex: 1 }}>
          <div style={{ position: "relative" }}>
            {isListening && (
              <>
                <div style={{
                  position: "absolute", inset: "-12px", borderRadius: "50%",
                  border: "2px solid rgba(239,68,68,0.4)",
                  animation: "ringPulse 1s infinite"
                }} />
                <div style={{
                  position: "absolute", inset: "-24px", borderRadius: "50%",
                  border: "2px solid rgba(239,68,68,0.2)",
                  animation: "ringPulse 1s infinite 0.25s"
                }} />
              </>
            )}
            <div style={{
              width: "80px", height: "80px", borderRadius: "50%",
              background: isListening ? "rgba(239,68,68,0.2)" : "#1e1e30",
              border: isListening ? "3px solid #ef4444" : "3px solid #2a2a3e",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "32px", transition: "all 0.3s",
              boxShadow: isListening ? "0 0 30px rgba(239,68,68,0.4)" : "none"
            }}>
              👤
            </div>
          </div>

          <div style={{ textAlign: "center" }}>
            <p style={{ color: "#fff", fontSize: "14px", fontWeight: "600", margin: "0 0 2px" }}>
              {localStorage.getItem("name") || "You"}
            </p>
            <p style={{
              fontSize: "11px", margin: 0,
              color: isListening ? "#ef4444" : "#6b6b80",
              animation: isListening ? "pulse 1.5s infinite" : "none"
            }}>
              {isListening ? "🎤 Listening..." : "Tap mic to answer"}
            </p>
          </div>

          {/* Sound wave bars when user speaking */}
          {isListening && (
            <div style={{ display: "flex", gap: "3px", alignItems: "center", height: "20px" }}>
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} style={{
                  width: "3px", background: "#ef4444", borderRadius: "2px",
                  animation: `wave ${0.4 + i * 0.1}s ease-in-out infinite alternate`,
                  animationDelay: `${i * 0.1}s`
                }} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Transcript panel */}
      <div style={{
        flex: 1, margin: "0 1.5rem", background: "#0d0d1a",
        border: "1px solid #1a1a2e", borderRadius: "16px",
        overflowY: "auto", padding: "1rem"
      }}>
        <p style={{
          color: "#3a3a4e", fontSize: "11px", textTransform: "uppercase",
          letterSpacing: "0.1em", margin: "0 0 12px", textAlign: "center"
        }}>
          Transcript
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {messages.map((msg, i) => (
            <div key={i}>
              {msg.role === "ai" && (
                <div style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
                  <span style={{
                    color: "#6366f1", fontSize: "11px", fontWeight: "700",
                    flexShrink: 0, marginTop: "2px",
                    background: "rgba(99,102,241,0.1)",
                    padding: "2px 6px", borderRadius: "4px"
                  }}>
                    Q{msg.questionNumber}
                  </span>
                  <p style={{
                    color: i === messages.length - 1 ? "#e8e8f0" : "#9090a8",
                    fontSize: "13px", margin: 0, lineHeight: "1.6",
                    fontWeight: i === messages.length - 1 ? "500" : "400"
                  }}>
                    {msg.text}
                  </p>
                </div>
              )}
              {msg.role === "user" && (
                <div style={{ display: "flex", gap: "8px", alignItems: "flex-start", paddingLeft: "28px" }}>
                  <span style={{
                    color: "#9090a8", fontSize: "11px", fontWeight: "700",
                    flexShrink: 0, marginTop: "2px",
                    background: "#1a1a2e", padding: "2px 6px", borderRadius: "4px"
                  }}>
                    A
                  </span>
                  <div style={{ flex: 1 }}>
                    <p style={{ color: "#c8c8d8", fontSize: "13px", margin: "0 0 4px", lineHeight: "1.6" }}>
                      {msg.text}
                    </p>
                    {msg.audioUrl && (
                      <audio controls src={msg.audioUrl} style={{
                        height: "28px", borderRadius: "20px",
                        filter: "invert(1) hue-rotate(200deg)", marginTop: "4px"
                      }} />
                    )}
                  </div>
                  {msg.score !== undefined && msg.score !== null && (
                    <span style={{
                      color: scoreColor(msg.score), fontSize: "12px",
                      fontWeight: "700", flexShrink: 0
                    }}>
                      {msg.score}/100
                    </span>
                  )}
                </div>
              )}
            </div>
          ))}

          {/* Live interim text */}
          {interimText && (
            <div style={{ display: "flex", gap: "8px", alignItems: "flex-start", paddingLeft: "28px" }}>
              <span style={{
                color: "#ef4444", fontSize: "11px", fontWeight: "700",
                flexShrink: 0, marginTop: "2px",
                background: "rgba(239,68,68,0.1)", padding: "2px 6px", borderRadius: "4px"
              }}>
                A
              </span>
              <p style={{ color: "#6b6b80", fontSize: "13px", margin: 0, fontStyle: "italic" }}>
                {interimText}...
              </p>
            </div>
          )}

          {loading && (
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <span style={{
                color: "#6366f1", fontSize: "11px", fontWeight: "700",
                background: "rgba(99,102,241,0.1)", padding: "2px 6px", borderRadius: "4px"
              }}>Q</span>
              <div style={{ display: "flex", gap: "3px" }}>
                {[0, 1, 2].map((i) => (
                  <div key={i} style={{
                    width: "5px", height: "5px", borderRadius: "50%",
                    background: "#6366f1", animation: "bounce 1.2s infinite",
                    animationDelay: `${i * 0.2}s`
                  }} />
                ))}
              </div>
            </div>
          )}

          <div ref={transcriptBottomRef} />
        </div>
      </div>

      {/* Input area */}
      <div style={{ padding: "1rem 1.5rem" }}>
        {answer && (
          <p style={{
            color: "#9090a8", fontSize: "12px", margin: "0 0 6px 4px",
            background: "#0d0d1a", padding: "6px 12px", borderRadius: "8px",
            border: "1px solid #1a1a2e"
          }}>
            {answer}
          </p>
        )}
        <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
          <button
            onClick={isListening ? stopListening : startListening}
            disabled={loading}
            style={{
              width: "56px", height: "56px", borderRadius: "50%", fontSize: "22px",
              cursor: loading ? "not-allowed" : "pointer",
              background: isListening ? "rgba(239,68,68,0.15)" : "rgba(99,102,241,0.15)",
              color: isListening ? "#ef4444" : "#818cf8",
              border: isListening ? "2px solid #ef4444" : "2px solid #6366f1",
              animation: isListening ? "pulse 1.5s infinite" : "none",
              transition: "all 0.2s"
            }}
          >
            {isListening ? "⏹️" : "🎤"}
          </button>

          <button
            onClick={submitAnswer}
            disabled={loading || !answer.trim()}
            style={{
              padding: "0 28px", height: "56px", borderRadius: "28px",
              background: loading || !answer.trim()
                ? "#1a1a2e"
                : "linear-gradient(135deg, #6366f1, #8b5cf6)",
              border: "none",
              color: loading || !answer.trim() ? "#6b6b80" : "#fff",
              fontSize: "15px", fontWeight: "600",
              cursor: loading || !answer.trim() ? "not-allowed" : "pointer",
              transition: "all 0.2s"
            }}
          >
            Send Answer →
          </button>

          <button
            onClick={() => {
              const txt = answer || messages.filter(m => m.role === "ai").slice(-1)[0]?.text || "";
              speakText(txt);
            }}
            disabled={isSpeaking}
            title="Replay last question"
            style={{
              width: "56px", height: "56px", borderRadius: "50%", fontSize: "20px",
              cursor: isSpeaking ? "not-allowed" : "pointer",
              background: "#0d0d1a", border: "2px solid #1e1e30",
              color: "#9090a8", transition: "all 0.2s"
            }}
          >
            🔊
          </button>
        </div>
      </div>
    </div>
  );

  // ─── CLASSIC MODE UI ─────────────────────────────────────────────
  const ClassicModeUI = () => (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      <div style={{ flex: 1, overflowY: "auto", padding: "1.5rem" }}>
        <div style={{
          maxWidth: "760px", margin: "0 auto",
          display: "flex", flexDirection: "column", gap: "1rem"
        }}>
          {messages.map((msg, i) => (
            <div key={i} style={{
              display: "flex",
              justifyContent: msg.role === "user" ? "flex-end" : "flex-start"
            }}>
              {msg.role === "ai" && (
                <div style={{
                  width: "30px", height: "30px", flexShrink: 0,
                  background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                  borderRadius: "50%", display: "flex", alignItems: "center",
                  justifyContent: "center", fontSize: "14px",
                  marginRight: "10px", alignSelf: "flex-start", marginTop: "2px"
                }}>🧠</div>
              )}
              <div style={{ maxWidth: "72%" }}>
                {msg.role === "ai" && msg.questionNumber && (
                  <p style={{
                    color: "#6366f1", fontSize: "11px", margin: "0 0 4px",
                    fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.05em"
                  }}>Question {msg.questionNumber}</p>
                )}
                <div style={{
                  padding: "12px 16px",
                  borderRadius: msg.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                  background: msg.role === "user"
                    ? "linear-gradient(135deg, #6366f1, #8b5cf6)" : "#12121e",
                  border: msg.role === "user" ? "none" : "1px solid #1e1e2e",
                  fontSize: "14px", lineHeight: "1.6", color: "#e8e8f0"
                }}>{msg.text}</div>

                {msg.score !== undefined && msg.score !== null && msg.role === "ai" && (
                  <div style={{ marginTop: "6px", display: "flex", alignItems: "center", gap: "6px" }}>
                    <div style={{ height: "4px", width: "80px", background: "#1e1e30", borderRadius: "2px" }}>
                      <div style={{
                        height: "100%", borderRadius: "2px",
                        width: `${msg.score}%`, background: scoreColor(msg.score)
                      }} />
                    </div>
                    <span style={{ fontSize: "12px", fontWeight: "600", color: scoreColor(msg.score) }}>
                      {msg.score}/100
                    </span>
                  </div>
                )}

                {msg.role === "user" && msg.audioUrl && (
                  <div style={{ marginTop: "6px", display: "flex", justifyContent: "flex-end" }}>
                    <audio controls src={msg.audioUrl} style={{
                      height: "32px", borderRadius: "20px",
                      filter: "invert(1) hue-rotate(200deg)"
                    }} />
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{
                width: "30px", height: "30px", flexShrink: 0,
                background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                borderRadius: "50%", display: "flex", alignItems: "center",
                justifyContent: "center", fontSize: "14px"
              }}>🧠</div>
              <div style={{
                padding: "12px 16px", background: "#12121e",
                border: "1px solid #1e1e2e", borderRadius: "18px 18px 18px 4px",
                display: "flex", gap: "4px", alignItems: "center"
              }}>
                {[0, 1, 2].map((idx) => (
                  <div key={idx} style={{
                    width: "6px", height: "6px", borderRadius: "50%",
                    background: "#6366f1", animation: "bounce 1.2s infinite",
                    animationDelay: `${idx * 0.2}s`
                  }} />
                ))}
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Classic input */}
      <div style={{ background: "#0d0d1a", borderTop: "1px solid #1a1a2e", padding: "1rem 1.5rem" }}>
        <div style={{ maxWidth: "760px", margin: "0 auto" }}>
          {interimText && (
            <p style={{ color: "#6b6b80", fontSize: "12px", margin: "0 0 6px 4px", fontStyle: "italic" }}>
              🎤 {interimText}...
            </p>
          )}
          {isListening && !interimText && (
            <p style={{ color: "#ef4444", fontSize: "11px", margin: "0 0 6px 4px", animation: "pulse 1.5s infinite" }}>
              Listening... speak now
            </p>
          )}
          <div style={{ display: "flex", gap: "10px" }}>
            <textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              onKeyDown={handleKey}
              disabled={loading}
              rows={2}
              placeholder="Type your answer or tap 🎤 to speak..."
              style={{
                flex: 1, background: "#12121e",
                border: isListening ? "1px solid rgba(239,68,68,0.4)" : "1px solid #1e1e2e",
                borderRadius: "14px", padding: "12px 16px",
                color: "#fff", fontSize: "14px", resize: "none",
                outline: "none", lineHeight: "1.5", opacity: loading ? 0.5 : 1
              }}
            />
            <button
              onClick={isListening ? stopListening : startListening}
              disabled={loading}
              style={{
                width: "46px", height: "46px", alignSelf: "flex-end",
                borderRadius: "12px", fontSize: "18px",
                cursor: loading ? "not-allowed" : "pointer",
                background: isListening ? "rgba(239,68,68,0.15)" : "#12121e",
                color: isListening ? "#ef4444" : "#9090a8",
                border: isListening ? "1px solid rgba(239,68,68,0.3)" : "1px solid #1e1e2e",
                animation: isListening ? "pulse 1.5s infinite" : "none"
              }}
            >{isListening ? "⏹️" : "🎤"}</button>
            <button
              onClick={submitAnswer}
              disabled={loading || !answer.trim()}
              style={{
                padding: "0 20px", height: "46px", alignSelf: "flex-end",
                background: loading || !answer.trim() ? "#1a1a2e" : "linear-gradient(135deg, #6366f1, #8b5cf6)",
                border: "none", borderRadius: "12px",
                color: loading || !answer.trim() ? "#6b6b80" : "#fff",
                fontSize: "14px", fontWeight: "600",
                cursor: loading || !answer.trim() ? "not-allowed" : "pointer"
              }}
            >Send</button>
          </div>
        </div>
      </div>
    </div>
  );

  // ─── MAIN RENDER ─────────────────────────────────────────────────
  return (
    <div style={{
      height: "100vh", background: "#080810", display: "flex",
      flexDirection: "column", fontFamily: "'Inter', system-ui, sans-serif", color: "#fff"
    }}>
      {/* Header */}
      <div style={{ background: "#0d0d1a", borderBottom: "1px solid #1a1a2e", padding: "0.875rem 1.5rem" }}>
        <div style={{ maxWidth: "900px", margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div style={{
                width: "28px", height: "28px",
                background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                borderRadius: "8px", display: "flex", alignItems: "center",
                justifyContent: "center", fontSize: "14px"
              }}>🧠</div>
              <span style={{ fontWeight: "600", fontSize: "15px" }}>{state?.role || "Interview"}</span>
              <span style={{
                background: "rgba(99,102,241,0.15)", color: "#818cf8",
                fontSize: "11px", padding: "2px 8px", borderRadius: "20px", fontWeight: "500"
              }}>{state?.difficulty}</span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <span style={{ color: "#6b6b80", fontSize: "13px" }}>
                {session?.questionNumber || 1} / {session?.totalQuestions || 5}
              </span>

              {/* Mode toggle */}
              <div style={{
                display: "flex", background: "#0d0d1a",
                border: "1px solid #1e1e2e", borderRadius: "8px", padding: "3px"
              }}>
                <button
                  onClick={() => setMode("interview")}
                  style={{
                    padding: "4px 10px", borderRadius: "6px", border: "none",
                    fontSize: "11px", fontWeight: "600", cursor: "pointer",
                    background: mode === "interview" ? "#6366f1" : "transparent",
                    color: mode === "interview" ? "#fff" : "#6b6b80"
                  }}
                >Interview</button>
                <button
                  onClick={() => setMode("classic")}
                  style={{
                    padding: "4px 10px", borderRadius: "6px", border: "none",
                    fontSize: "11px", fontWeight: "600", cursor: "pointer",
                    background: mode === "classic" ? "#6366f1" : "transparent",
                    color: mode === "classic" ? "#fff" : "#6b6b80"
                  }}
                >Classic</button>
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div style={{ height: "3px", background: "#1e1e30", borderRadius: "2px" }}>
            <div style={{
              height: "100%", borderRadius: "2px",
              background: "linear-gradient(90deg, #6366f1, #8b5cf6)",
              width: `${progress}%`, transition: "width 0.4s ease"
            }} />
          </div>
        </div>
      </div>

      {/* Main content — swap based on mode */}
      <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
        {mode === "interview" ? <InterviewModeUI /> : <ClassicModeUI />}
      </div>

      <style>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-6px); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
        @keyframes ringPulse {
          0% { transform: scale(1); opacity: 0.8; }
          100% { transform: scale(1.15); opacity: 0; }
        }
        @keyframes wave {
          from { height: 4px; }
          to { height: 18px; }
        }
      `}</style>
    </div>
  );
}