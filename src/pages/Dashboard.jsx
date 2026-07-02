import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";

const ROLES = [
  { id: "Java Developer", icon: "☕" },
  { id: "React Developer", icon: "⚛️" },
  { id: "Full Stack Developer", icon: "🔧" },
  { id: "Data Analyst", icon: "📊" },
  { id: "ML Engineer", icon: "🤖" },
];

const DIFFICULTIES = [
  { id: "Easy", color: "#22c55e", bg: "rgba(34,197,94,0.12)", border: "rgba(34,197,94,0.3)" },
  { id: "Medium", color: "#f59e0b", bg: "rgba(245,158,11,0.12)", border: "rgba(245,158,11,0.3)" },
  { id: "Hard", color: "#ef4444", bg: "rgba(239,68,68,0.12)", border: "rgba(239,68,68,0.3)" },
];

export default function Dashboard() {
  const [tab, setTab] = useState("role");
  const [role, setRole] = useState("Java Developer");
  const [difficulty, setDifficulty] = useState("Medium");
  const [loading, setLoading] = useState(false);
  const [resumeFile, setResumeFile] = useState(null);
  const [resumeLoading, setResumeLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const navigate = useNavigate();
  const name = localStorage.getItem("name") || "there";

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setHistoryLoading(true);
    try {
      const res = await api.get("/api/interview/history");
      setHistory(res.data);
    } catch {
      console.error("Failed to fetch history");
    } finally {
      setHistoryLoading(false);
    }
  };

  const startInterview = async () => {
    setLoading(true);
    try {
      const res = await api.post("/api/interview/start", { role, difficulty });
      navigate("/interview", { state: res.data });
    } catch {
      alert("Failed to start interview. Make sure backend and Ollama are running.");
    } finally {
      setLoading(false);
    }
  };

  const startInterviewWithResume = async () => {
    if (!resumeFile) return;
    setResumeLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", resumeFile);
      formData.append("difficulty", difficulty);
      const res = await api.post("/api/interview/start-with-resume-file", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      navigate("/interview", { state: res.data });
    } catch {
      alert("Failed to process resume. Please try again.");
    } finally {
      setResumeLoading(false);
    }
  };

  const logout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const selectedDiff = DIFFICULTIES.find((d) => d.id === difficulty);

  const avgScore =
    history.length > 0
      ? Math.round(
          history.reduce((sum, s) => sum + (s.overallScore || 0), 0) / history.length
        )
      : null;

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-IN", {
      day: "numeric", month: "short", year: "numeric",
    });
  };

  const scoreColor = (score) =>
    score >= 70 ? "#22c55e" : score >= 40 ? "#f59e0b" : "#ef4444";

  return (
    <div style={{
      minHeight: "100vh", background: "#080810",
      fontFamily: "'Inter', system-ui, sans-serif", color: "#fff",
    }}>
      {/* Navbar */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "1.25rem 2rem", borderBottom: "1px solid #1a1a2e",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{
            width: "32px", height: "32px",
            background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
            borderRadius: "9px", display: "flex", alignItems: "center",
            justifyContent: "center", fontSize: "16px",
          }}>🧠</div>
          <span style={{ fontWeight: "600", fontSize: "15px" }}>MockMate</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <div style={{
            width: "32px", height: "32px", borderRadius: "50%",
            background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "13px", fontWeight: "600",
          }}>
            {name.charAt(0).toUpperCase()}
          </div>
          <button onClick={logout} style={{
            background: "none", border: "1px solid #1e1e30",
            borderRadius: "8px", padding: "6px 14px",
            color: "#9090a8", fontSize: "13px", cursor: "pointer",
          }}>Sign out</button>
        </div>
      </div>

      <div style={{ maxWidth: "680px", margin: "0 auto", padding: "3rem 1.5rem" }}>

        {/* Greeting */}
        <div style={{ marginBottom: "2rem" }}>
          <h1 style={{ fontSize: "28px", fontWeight: "700", margin: "0 0 6px" }}>
            Hey, {name} 👋
          </h1>
          <p style={{ color: "#6b6b80", fontSize: "15px", margin: 0 }}>
            Ready for your next mock interview?
          </p>
        </div>

        {/* Stats row */}
        {history.length > 0 && (
          <div style={{
            display: "grid", gridTemplateColumns: "repeat(3, 1fr)",
            gap: "12px", marginBottom: "2rem",
          }}>
            <div style={{
              background: "#12121e", border: "1px solid #1e1e2e",
              borderRadius: "14px", padding: "1rem",
            }}>
              <p style={{ color: "#6b6b80", fontSize: "12px", margin: "0 0 4px" }}>Sessions</p>
              <p style={{ color: "#fff", fontSize: "24px", fontWeight: "700", margin: 0 }}>
                {history.length}
              </p>
            </div>
            <div style={{
              background: "#12121e", border: "1px solid #1e1e2e",
              borderRadius: "14px", padding: "1rem",
            }}>
              <p style={{ color: "#6b6b80", fontSize: "12px", margin: "0 0 4px" }}>Avg score</p>
              <p style={{ color: scoreColor(avgScore), fontSize: "24px", fontWeight: "700", margin: 0 }}>
                {avgScore}
              </p>
            </div>
            <div style={{
              background: "#12121e", border: "1px solid #1e1e2e",
              borderRadius: "14px", padding: "1rem",
            }}>
              <p style={{ color: "#6b6b80", fontSize: "12px", margin: "0 0 4px" }}>Best score</p>
              <p style={{ color: "#22c55e", fontSize: "24px", fontWeight: "700", margin: 0 }}>
                {Math.max(...history.map((s) => s.overallScore || 0))}
              </p>
            </div>
          </div>
        )}

        {/* Start Interview Card */}
        <div style={{
          background: "#12121e", border: "1px solid #1e1e2e",
          borderRadius: "20px", padding: "1.75rem", marginBottom: "2rem",
        }}>
          <h2 style={{ fontSize: "16px", fontWeight: "600", margin: "0 0 4px" }}>
            Start new interview
          </h2>
          <p style={{ color: "#6b6b80", fontSize: "13px", margin: "0 0 1.25rem" }}>
            Choose how you want to be interviewed
          </p>

          {/* Tab switcher */}
          <div style={{
            display: "flex", background: "#0d0d1a",
            border: "1px solid #1e1e30", borderRadius: "10px",
            padding: "3px", marginBottom: "1.5rem",
          }}>
            <button
              onClick={() => setTab("role")}
              style={{
                flex: 1, padding: "8px", borderRadius: "8px",
                border: "none", fontSize: "13px", fontWeight: "600",
                cursor: "pointer",
                background: tab === "role"
                  ? "linear-gradient(135deg, #6366f1, #8b5cf6)" : "transparent",
                color: tab === "role" ? "#fff" : "#6b6b80",
                transition: "all 0.2s",
              }}
            >🎯 By Role</button>
            <button
              onClick={() => setTab("resume")}
              style={{
                flex: 1, padding: "8px", borderRadius: "8px",
                border: "none", fontSize: "13px", fontWeight: "600",
                cursor: "pointer",
                background: tab === "resume"
                  ? "linear-gradient(135deg, #6366f1, #8b5cf6)" : "transparent",
                color: tab === "resume" ? "#fff" : "#6b6b80",
                transition: "all 0.2s",
              }}
            >📄 By Resume</button>
          </div>

          {/* Role Tab */}
          {tab === "role" && (
            <>
              <div style={{ marginBottom: "1.5rem" }}>
                <p style={{
                  color: "#9090a8", fontSize: "12px", margin: "0 0 10px",
                  textTransform: "uppercase", letterSpacing: "0.05em",
                }}>Role</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  {ROLES.map((r) => (
                    <button key={r.id} onClick={() => setRole(r.id)} style={{
                      display: "flex", alignItems: "center", gap: "6px",
                      padding: "8px 14px", borderRadius: "10px", fontSize: "13px",
                      fontWeight: "500", cursor: "pointer", transition: "all 0.15s",
                      background: role === r.id
                        ? "linear-gradient(135deg, #6366f1, #8b5cf6)" : "#0d0d1a",
                      border: role === r.id ? "1px solid #6366f1" : "1px solid #1e1e30",
                      color: role === r.id ? "#fff" : "#9090a8",
                    }}>
                      {r.icon} {r.id}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: "1.5rem" }}>
                <p style={{
                  color: "#9090a8", fontSize: "12px", margin: "0 0 10px",
                  textTransform: "uppercase", letterSpacing: "0.05em",
                }}>Difficulty</p>
                <div style={{ display: "flex", gap: "8px" }}>
                  {DIFFICULTIES.map((d) => (
                    <button key={d.id} onClick={() => setDifficulty(d.id)} style={{
                      padding: "8px 20px", borderRadius: "10px", fontSize: "13px",
                      fontWeight: "600", cursor: "pointer",
                      background: difficulty === d.id ? d.bg : "#0d0d1a",
                      border: difficulty === d.id
                        ? `1px solid ${d.border}` : "1px solid #1e1e30",
                      color: difficulty === d.id ? d.color : "#9090a8",
                    }}>{d.id}</button>
                  ))}
                </div>
              </div>

              <div style={{
                background: "#0d0d1a", border: "1px solid #1e1e30",
                borderRadius: "12px", padding: "1rem 1.25rem",
                display: "flex", justifyContent: "space-between",
                alignItems: "center", marginBottom: "1.25rem",
              }}>
                <div>
                  <p style={{ color: "#6b6b80", fontSize: "12px", margin: "0 0 2px" }}>Selected</p>
                  <p style={{ color: "#fff", fontSize: "14px", fontWeight: "500", margin: 0 }}>
                    {role} · <span style={{ color: selectedDiff?.color }}>{difficulty}</span>
                  </p>
                </div>
                <span style={{ fontSize: "20px" }}>
                  {ROLES.find((r) => r.id === role)?.icon}
                </span>
              </div>

              <button
                onClick={startInterview}
                disabled={loading}
                style={{
                  width: "100%",
                  background: loading ? "#3730a3" : "linear-gradient(135deg, #6366f1, #8b5cf6)",
                  border: "none", borderRadius: "12px", padding: "14px",
                  color: "#fff", fontSize: "15px", fontWeight: "600",
                  cursor: loading ? "not-allowed" : "pointer",
                  opacity: loading ? 0.7 : 1,
                }}
              >
                {loading ? "Starting..." : `Start ${role} Interview →`}
              </button>
            </>
          )}

          {/* Resume Tab */}
          {tab === "resume" && (
            <>
              <div style={{ marginBottom: "1.5rem" }}>
                <p style={{
                  color: "#9090a8", fontSize: "12px", margin: "0 0 10px",
                  textTransform: "uppercase", letterSpacing: "0.05em",
                }}>Difficulty</p>
                <div style={{ display: "flex", gap: "8px" }}>
                  {DIFFICULTIES.map((d) => (
                    <button key={d.id} onClick={() => setDifficulty(d.id)} style={{
                      padding: "8px 20px", borderRadius: "10px", fontSize: "13px",
                      fontWeight: "600", cursor: "pointer",
                      background: difficulty === d.id ? d.bg : "#0d0d1a",
                      border: difficulty === d.id
                        ? `1px solid ${d.border}` : "1px solid #1e1e30",
                      color: difficulty === d.id ? d.color : "#9090a8",
                    }}>{d.id}</button>
                  ))}
                </div>
              </div>

              {/* File drop zone */}
              <div
                onClick={() => document.getElementById("resumeInput").click()}
                style={{
                  border: "2px dashed #1e1e30", borderRadius: "14px",
                  padding: "2rem", textAlign: "center",
                  cursor: "pointer", marginBottom: "1.25rem",
                  background: resumeFile ? "rgba(99,102,241,0.06)" : "transparent",
                  borderColor: resumeFile ? "#6366f1" : "#1e1e30",
                  transition: "all 0.2s",
                }}
              >
                <p style={{ fontSize: "28px", margin: "0 0 8px" }}>
                  {resumeFile ? "✅" : "📄"}
                </p>
                <p style={{
                  color: resumeFile ? "#818cf8" : "#6b6b80",
                  fontSize: "14px", margin: "0 0 4px", fontWeight: "500",
                }}>
                  {resumeFile ? resumeFile.name : "Click to upload your resume"}
                </p>
                <p style={{ color: "#3a3a4e", fontSize: "12px", margin: 0 }}>
                  PDF files only
                </p>
                <input
                  id="resumeInput"
                  type="file"
                  accept=".pdf"
                  style={{ display: "none" }}
                  onChange={(e) => setResumeFile(e.target.files[0])}
                />
              </div>

              <div style={{
                background: "rgba(99,102,241,0.06)",
                border: "1px solid rgba(99,102,241,0.15)",
                borderRadius: "10px", padding: "10px 14px",
                marginBottom: "1.25rem",
                display: "flex", gap: "8px", alignItems: "flex-start",
              }}>
                <span style={{ fontSize: "14px" }}>💡</span>
                <p style={{ color: "#9090a8", fontSize: "12px", margin: 0, lineHeight: "1.6" }}>
                  AI will analyze your resume and ask personalized questions based on
                  your skills, projects, and experience.
                </p>
              </div>

              <button
                onClick={startInterviewWithResume}
                disabled={resumeLoading || !resumeFile}
                style={{
                  width: "100%",
                  background: resumeLoading || !resumeFile
                    ? "#1a1a2e"
                    : "linear-gradient(135deg, #6366f1, #8b5cf6)",
                  border: "none", borderRadius: "12px", padding: "14px",
                  color: resumeLoading || !resumeFile ? "#6b6b80" : "#fff",
                  fontSize: "15px", fontWeight: "600",
                  cursor: resumeLoading || !resumeFile ? "not-allowed" : "pointer",
                  transition: "all 0.2s",
                }}
              >
                {resumeLoading ? "Analyzing resume..." : "Start Resume Interview →"}
              </button>
            </>
          )}
        </div>

        {/* Tips */}
        <div style={{
          marginBottom: "2rem", padding: "1rem 1.25rem",
          background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.15)",
          borderRadius: "12px", display: "flex", gap: "12px", alignItems: "flex-start",
        }}>
          <span style={{ fontSize: "18px" }}>💡</span>
          <p style={{ color: "#9090a8", fontSize: "13px", margin: 0, lineHeight: "1.6" }}>
            You can answer by typing or using the{" "}
            <strong style={{ color: "#818cf8" }}>🎤 mic button</strong> in the interview.
            Use Chrome or Brave for best speech recognition support.
          </p>
        </div>

        {/* History */}
        <div>
          <h2 style={{ fontSize: "16px", fontWeight: "600", margin: "0 0 1rem" }}>
            Past sessions
          </h2>

          {historyLoading ? (
            <div style={{ color: "#6b6b80", fontSize: "14px", textAlign: "center", padding: "2rem" }}>
              Loading history...
            </div>
          ) : history.length === 0 ? (
            <div style={{
              background: "#12121e", border: "1px solid #1e1e2e",
              borderRadius: "16px", padding: "2rem", textAlign: "center",
            }}>
              <p style={{ fontSize: "24px", margin: "0 0 8px" }}>🎯</p>
              <p style={{ color: "#6b6b80", fontSize: "14px", margin: 0 }}>
                No completed sessions yet. Start your first interview above!
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {history.map((s) => {
                const sc = Math.round(s.overallScore || 0);
                const scColor = scoreColor(sc);
                const diff = DIFFICULTIES.find((d) => d.id === s.difficulty);
                return (
                  <div key={s.sessionId} style={{
                    background: "#12121e", border: "1px solid #1e1e2e",
                    borderRadius: "14px", padding: "1rem 1.25rem",
                    display: "flex", alignItems: "center",
                    justifyContent: "space-between", gap: "1rem",
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{
                        display: "flex", alignItems: "center",
                        gap: "8px", marginBottom: "4px",
                      }}>
                        <span style={{ color: "#fff", fontSize: "14px", fontWeight: "500" }}>
                          {s.role}
                        </span>
                        <span style={{
                          fontSize: "11px", padding: "2px 8px", borderRadius: "20px",
                          background: diff?.bg || "#1e1e30",
                          color: diff?.color || "#9090a8",
                          fontWeight: "600",
                        }}>
                          {s.difficulty}
                        </span>
                      </div>
                      <p style={{ color: "#6b6b80", fontSize: "12px", margin: 0 }}>
                        {formatDate(s.startedAt)}
                      </p>
                    </div>

                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <p style={{
                        color: scColor, fontSize: "20px",
                        fontWeight: "700", margin: "0 0 2px",
                      }}>
                        {sc}
                        <span style={{ color: "#3a3a4e", fontSize: "13px", fontWeight: "400" }}>
                          /100
                        </span>
                      </p>
                    </div>

                    <button
                      onClick={() =>
                        navigate(`/report/${s.sessionId}`, {
                          state: { report: s.feedbackReport, score: s.overallScore },
                        })
                      }
                      style={{
                        background: "rgba(99,102,241,0.1)",
                        border: "1px solid rgba(99,102,241,0.25)",
                        borderRadius: "8px", padding: "6px 14px",
                        color: "#818cf8", fontSize: "13px", fontWeight: "500",
                        cursor: "pointer", flexShrink: 0,
                      }}
                    >
                      View →
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}