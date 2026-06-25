import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import api from "../api/axios";

// Add this function at the top of Report.jsx, outside the component
function fixJsonNewlines(str) {
  let result = "";
  let inString = false;
  let escaped = false;

  for (let i = 0; i < str.length; i++) {
    const char = str[i];

    if (escaped) {
      result += char;
      escaped = false;
      continue;
    }

    if (char === "\\" && inString) {
      result += char;
      escaped = true;
      continue;
    }

    if (char === '"') {
      inString = !inString;
      result += char;
      continue;
    }

    if (inString && char === "\n") {
      result += "\\n";
      continue;
    }

    if (inString && char === "\r") {
      result += "\\r";
      continue;
    }

    result += char;
  }

  return result;
}

export default function Report() {
  const { state } = useLocation();
  const navigate = useNavigate();

  const { sessionId } = useParams();
  const [messages, setMessages] = useState([]);
  const [showChat, setShowChat] = useState(false);

  const raw = state?.report || "{}";

  let report = {};
  try {
    const stripped = raw
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();
    const start = stripped.indexOf("{");
    const end = stripped.lastIndexOf("}");
    const jsonStr = stripped.substring(start, end + 1);
    const fixed = fixJsonNewlines(jsonStr); // ← fix newlines inside strings
    report = JSON.parse(fixed);
  } catch (e) {
    console.error("Parse error:", e);
    report = {
      overallScore: state?.score || 0,
      summary: "Report could not be parsed. Please try again.",
      strengths: [],
      weaknesses: [],
      topicsToStudy: [],
      questionFeedback: [],
    };
  }
  const score = report.overallScore || 0;
  const scoreColor =
    score >= 70 ? "#22c55e" : score >= 40 ? "#f59e0b" : "#ef4444";
  const scoreLabel =
    score >= 70 ? "Strong" : score >= 40 ? "Average" : "Needs Work";

  useEffect(() => {
    if (sessionId) {
      api
        .get(`/api/interview/session/${sessionId}/messages`)
        .then((res) => setMessages(res.data))
        .catch(() => console.error("Failed to load messages"));
    }
  }, [sessionId]);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#080810",
        fontFamily: "'Inter', system-ui, sans-serif",
        color: "#fff",
      }}
    >
      {/* Header */}
      <div
        style={{
          background: "#0d0d1a",
          borderBottom: "1px solid #1a1a2e",
          padding: "1rem 1.5rem",
          display: "flex",
          alignItems: "center",
          gap: "10px",
        }}
      >
        <div
          style={{
            width: "28px",
            height: "28px",
            background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
            borderRadius: "8px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "14px",
          }}
        >
          🧠
        </div>
        <span style={{ fontWeight: "600", fontSize: "15px" }}>MockMate</span>
      </div>

      <div
        style={{
          maxWidth: "720px",
          margin: "0 auto",
          padding: "2.5rem 1.5rem",
        }}
      >
        {/* Score hero */}
        <div
          style={{
            background: "#12121e",
            border: "1px solid #1e1e2e",
            borderRadius: "20px",
            padding: "2.5rem",
            textAlign: "center",
            marginBottom: "1.5rem",
          }}
        >
          <p
            style={{
              color: "#6b6b80",
              fontSize: "13px",
              margin: "0 0 1rem",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
            }}
          >
            Interview complete
          </p>
          <div
            style={{
              fontSize: "72px",
              fontWeight: "800",
              lineHeight: 1,
              color: scoreColor,
              marginBottom: "8px",
            }}
          >
            {score}
            <span
              style={{ fontSize: "28px", color: "#3a3a4e", fontWeight: "400" }}
            >
              /100
            </span>
          </div>
          <span
            style={{
              display: "inline-block",
              background:
                score >= 70
                  ? "rgba(34,197,94,0.12)"
                  : score >= 40
                    ? "rgba(245,158,11,0.12)"
                    : "rgba(239,68,68,0.12)",
              color: scoreColor,
              border: `1px solid ${scoreColor}40`,
              padding: "4px 14px",
              borderRadius: "20px",
              fontSize: "13px",
              fontWeight: "600",
              marginBottom: "1.25rem",
            }}
          >
            {scoreLabel}
          </span>
          <p
            style={{
              color: "#9090a8",
              fontSize: "14px",
              margin: 0,
              lineHeight: "1.7",
              maxWidth: "480px",
              marginLeft: "auto",
              marginRight: "auto",
            }}
          >
            {report.summary}
          </p>
        </div>

        {/* Strengths + Weaknesses */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "1rem",
            marginBottom: "1rem",
          }}
        >
          <div
            style={{
              background: "#12121e",
              border: "1px solid #1e1e2e",
              borderRadius: "16px",
              padding: "1.25rem",
            }}
          >
            <p
              style={{
                color: "#22c55e",
                fontSize: "13px",
                fontWeight: "600",
                margin: "0 0 12px",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              ✅ Strengths
            </p>
            {report.strengths?.length > 0 ? (
              report.strengths.map((s, i) => (
                <p
                  key={i}
                  style={{
                    color: "#c8c8d8",
                    fontSize: "13px",
                    margin: "0 0 8px",
                    lineHeight: "1.5",
                    paddingLeft: "12px",
                    borderLeft: "2px solid #22c55e30",
                  }}
                >
                  {s}
                </p>
              ))
            ) : (
              <p style={{ color: "#6b6b80", fontSize: "13px", margin: 0 }}>
                None identified
              </p>
            )}
          </div>

          <div
            style={{
              background: "#12121e",
              border: "1px solid #1e1e2e",
              borderRadius: "16px",
              padding: "1.25rem",
            }}
          >
            <p
              style={{
                color: "#f59e0b",
                fontSize: "13px",
                fontWeight: "600",
                margin: "0 0 12px",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              ⚠️ Areas to improve
            </p>
            {report.weaknesses?.length > 0 ? (
              report.weaknesses.map((w, i) => (
                <p
                  key={i}
                  style={{
                    color: "#c8c8d8",
                    fontSize: "13px",
                    margin: "0 0 8px",
                    lineHeight: "1.5",
                    paddingLeft: "12px",
                    borderLeft: "2px solid #f59e0b30",
                  }}
                >
                  {w}
                </p>
              ))
            ) : (
              <p style={{ color: "#6b6b80", fontSize: "13px", margin: 0 }}>
                Nothing noted
              </p>
            )}
          </div>
        </div>

        {/* Topics to study */}
        {report.topicsToStudy?.length > 0 && (
          <div
            style={{
              background: "#12121e",
              border: "1px solid #1e1e2e",
              borderRadius: "16px",
              padding: "1.25rem",
              marginBottom: "1rem",
            }}
          >
            <p
              style={{
                color: "#818cf8",
                fontSize: "13px",
                fontWeight: "600",
                margin: "0 0 12px",
              }}
            >
              📚 Topics to study
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {report.topicsToStudy.map((t, i) => (
                <span
                  key={i}
                  style={{
                    background: "rgba(99,102,241,0.1)",
                    border: "1px solid rgba(99,102,241,0.25)",
                    color: "#818cf8",
                    padding: "5px 12px",
                    borderRadius: "20px",
                    fontSize: "12px",
                    fontWeight: "500",
                  }}
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Question breakdown */}
        {report.questionFeedback?.length > 0 && (
          <div
            style={{
              background: "#12121e",
              border: "1px solid #1e1e2e",
              borderRadius: "16px",
              padding: "1.25rem",
              marginBottom: "1.5rem",
            }}
          >
            <p
              style={{
                color: "#fff",
                fontSize: "13px",
                fontWeight: "600",
                margin: "0 0 1rem",
              }}
            >
              📝 Question breakdown
            </p>
            <div
              style={{ display: "flex", flexDirection: "column", gap: "10px" }}
            >
              {report.questionFeedback.map((q, i) => {
                const qScore = q.score || 0;
                const qColor =
                  qScore >= 70
                    ? "#22c55e"
                    : qScore >= 40
                      ? "#f59e0b"
                      : "#ef4444";
                return (
                  <div
                    key={i}
                    style={{
                      background: "#0d0d1a",
                      border: "1px solid #1a1a2e",
                      borderRadius: "12px",
                      padding: "1rem",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        gap: "1rem",
                      }}
                    >
                      <p
                        style={{
                          color: "#c8c8d8",
                          fontSize: "13px",
                          fontWeight: "500",
                          margin: "0 0 6px",
                          lineHeight: "1.5",
                          flex: 1,
                        }}
                      >
                        Q{i + 1}: {q.question}
                      </p>
                      <span
                        style={{
                          color: qColor,
                          fontWeight: "700",
                          fontSize: "14px",
                          flexShrink: 0,
                        }}
                      >
                        {qScore}/100
                      </span>
                    </div>
                    <div
                      style={{
                        height: "3px",
                        background: "#1e1e30",
                        borderRadius: "2px",
                        marginBottom: "8px",
                      }}
                    >
                      <div
                        style={{
                          height: "100%",
                          width: `${qScore}%`,
                          background: qColor,
                          borderRadius: "2px",
                          transition: "width 0.4s",
                        }}
                      />
                    </div>
                    {q.yourAnswer && (
                      <p
                        style={{
                          color: "#6b6b80",
                          fontSize: "12px",
                          margin: "0 0 4px",
                        }}
                      >
                        Your answer: {q.yourAnswer}
                      </p>
                    )}
                    {q.modelAnswer && q.modelAnswer !== "..." && (
                      <p
                        style={{
                          color: "#818cf8",
                          fontSize: "12px",
                          margin: 0,
                        }}
                      >
                        Model answer: {q.modelAnswer}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Chat transcript */}
        <div style={{ marginBottom: "1.5rem" }}>
          <button
            onClick={() => setShowChat(!showChat)}
            style={{
              width: "100%",
              background: "#12121e",
              border: "1px solid #1e1e2e",
              borderRadius: "14px",
              padding: "14px 1.25rem",
              color: "#818cf8",
              fontSize: "14px",
              fontWeight: "600",
              cursor: "pointer",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span>💬 View full conversation</span>
            <span style={{ fontSize: "12px" }}>
              {showChat ? "▲ Hide" : "▼ Show"}
            </span>
          </button>

          {showChat && (
            <div
              style={{
                background: "#0d0d1a",
                border: "1px solid #1e1e2e",
                borderTop: "none",
                borderRadius: "0 0 14px 14px",
                padding: "1.25rem",
                display: "flex",
                flexDirection: "column",
                gap: "12px",
                maxHeight: "500px",
                overflowY: "auto",
              }}
            >
              {messages.length === 0 ? (
                <p
                  style={{
                    color: "#6b6b80",
                    fontSize: "13px",
                    textAlign: "center",
                    margin: 0,
                  }}
                >
                  No messages found for this session.
                </p>
              ) : (
                messages.map((msg, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      justifyContent:
                        msg.role === "user" ? "flex-end" : "flex-start",
                    }}
                  >
                    <div style={{ maxWidth: "80%" }}>
                      {msg.role === "assistant" && (
                        <p
                          style={{
                            color: "#6366f1",
                            fontSize: "11px",
                            margin: "0 0 4px",
                            fontWeight: "600",
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                          }}
                        >
                          Question {msg.questionNumber}
                        </p>
                      )}
                      <div
                        style={{
                          padding: "10px 14px",
                          fontSize: "13px",
                          lineHeight: "1.6",
                          borderRadius:
                            msg.role === "user"
                              ? "14px 14px 4px 14px"
                              : "14px 14px 14px 4px",
                          background:
                            msg.role === "user"
                              ? "rgba(99,102,241,0.15)"
                              : "#12121e",
                          border:
                            msg.role === "user"
                              ? "1px solid rgba(99,102,241,0.3)"
                              : "1px solid #1e1e2e",
                          color: "#c8c8d8",
                        }}
                      >
                        {msg.content}
                      </div>
                      {msg.role === "user" && msg.score !== null && (
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                            marginTop: "4px",
                            justifyContent: "flex-end",
                          }}
                        >
                          <div
                            style={{
                              height: "3px",
                              width: "60px",
                              background: "#1e1e30",
                              borderRadius: "2px",
                            }}
                          >
                            <div
                              style={{
                                height: "100%",
                                borderRadius: "2px",
                                width: `${msg.score}%`,
                                background:
                                  msg.score >= 70
                                    ? "#22c55e"
                                    : msg.score >= 40
                                      ? "#f59e0b"
                                      : "#ef4444",
                              }}
                            />
                          </div>
                          <span
                            style={{
                              fontSize: "11px",
                              fontWeight: "600",
                              color:
                                msg.score >= 70
                                  ? "#22c55e"
                                  : msg.score >= 40
                                    ? "#f59e0b"
                                    : "#ef4444",
                            }}
                          >
                            {msg.score}/100
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* CTA */}
        <button
          onClick={() => navigate("/dashboard")}
          style={{
            width: "100%",
            background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
            border: "none",
            borderRadius: "14px",
            padding: "15px",
            color: "#fff",
            fontSize: "15px",
            fontWeight: "600",
            cursor: "pointer",
          }}
        >
          Practice again →
        </button>
      </div>
    </div>
  );
}
