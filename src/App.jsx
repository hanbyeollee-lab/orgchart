import { useState, useRef, useEffect } from "react";
import { GoogleLogin } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";
import { uploadPdf, getPdfMeta, deletePdf } from "./supabase";

const ALLOWED_DOMAIN = "myrealtrip.com";

// 업로드 권한이 있는 관리자 이메일 목록 (HR)
const ADMIN_EMAILS = [
  "hanbyeol.lee@myrealtrip.com",
  "haein.cho@myrealtrip.com",
  "yoonjae.lee@myrealtrip.com",
];

function LoginScreen({ onLogin, error, onError }) {
  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    }}>
      <div style={{
        background: "#fff", borderRadius: 20, padding: "48px 40px", width: 380,
        boxShadow: "0 20px 60px rgba(0,0,0,0.3)", textAlign: "center",
      }}>
        <div style={{ fontSize: 40, marginBottom: 8 }}>✈️</div>
        <h1 style={{ margin: "0 0 4px", fontSize: 22, color: "#1a1a2e" }}>MyRealTrip</h1>
        <p style={{ color: "#888", fontSize: 13, margin: "0 0 32px" }}>내부 조직도 열람 시스템</p>
        <div style={{ background: "#f8f9fa", borderRadius: 12, padding: 20, marginBottom: 16 }}>
          <p style={{ fontSize: 12, color: "#666", margin: "0 0 16px" }}>
            @myrealtrip.com 계정으로 로그인해주세요
          </p>
          <div style={{ display: "flex", justifyContent: "center" }}>
            <GoogleLogin
              onSuccess={(res) => {
                const decoded = jwtDecode(res.credential);
                if (decoded.hd === ALLOWED_DOMAIN) {
                  onLogin(decoded.email);
                } else {
                  onError(`@${ALLOWED_DOMAIN} 계정만 로그인할 수 있습니다.`);
                }
              }}
              onError={() => onError("로그인 실패. 다시 시도해주세요.")}
              useOneTap
            />
          </div>
        </div>
        {error && (
          <div style={{ background: "#fff0f0", color: "#e94560", borderRadius: 8, padding: "10px 14px", fontSize: 13, fontWeight: 500 }}>
            ⚠️ {error}
          </div>
        )}
      </div>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [error, setError] = useState("");
  const [pdfData, setPdfData] = useState(null); // { url, name, uploadedBy, uploadedAt }
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef();
  const isAdmin = user && ADMIN_EMAILS.includes(user.email);

  // 저장된 PDF 불러오기
  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const meta = await getPdfMeta();
        if (meta) setPdfData(meta);
      } catch { /* no data yet */ }
      setLoading(false);
    })();
  }, [user]);

  const handleLogin = (email) => {
    if (!email) { setError("이메일을 입력해주세요."); return; }
    if (email.split("@")[1] !== ALLOWED_DOMAIN) {
      setError(`@${ALLOWED_DOMAIN} 계정만 로그인할 수 있습니다.`);
      return;
    }
    setUser({ email });
    setError("");
  };

  const handleUpload = async (e) => {
    const f = e.target.files[0];
    if (!f || f.type !== "application/pdf") return;
    setUploading(true);
    try {
      const meta = await uploadPdf(f, user.email);
      setPdfData(meta);
    } catch (err) {
      alert("업로드 실패: " + err.message);
    }
    setUploading(false);
    e.target.value = "";
  };

  const handleDelete = async () => {
    if (!confirm("조직도를 삭제하시겠습니까?")) return;
    try {
      await deletePdf();
    } catch {}
    setPdfData(null);
  };

  if (!user) return <LoginScreen onLogin={handleLogin} error={error} onError={setError} />;

  return (
    <div style={{
      height: "100vh", display: "flex", flexDirection: "column",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", background: "#525659",
      overflow: "hidden",
    }}>
      {/* Header */}
      <div style={{
        background: "#1a1a2e", color: "#fff",
        padding: "10px 20px", display: "flex", justifyContent: "space-between", alignItems: "center",
        flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 20 }}>✈️</span>
          <span style={{ fontWeight: 700, fontSize: 15 }}>MyRealTrip 조직도</span>
          {isAdmin && (
            <span style={{
              background: "#e94560", fontSize: 10, padding: "2px 8px",
              borderRadius: 4, fontWeight: 700, marginLeft: 4,
            }}>관리자</span>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {isAdmin && (
            <>
              <button onClick={() => fileRef.current.click()} style={{
                background: "#4361ee", color: "#fff", border: "none", borderRadius: 6,
                padding: "6px 14px", fontSize: 12, cursor: "pointer", fontWeight: 600,
              }}>
                {uploading ? "업로드 중..." : pdfData ? "📄 조직도 교체" : "📄 조직도 업로드"}
              </button>
              {pdfData && (
                <button onClick={handleDelete} style={{
                  background: "rgba(233,69,96,0.2)", color: "#e94560", border: "none",
                  borderRadius: 6, padding: "6px 10px", fontSize: 12, cursor: "pointer",
                }}>삭제</button>
              )}
              <input ref={fileRef} type="file" accept="application/pdf" style={{ display: "none" }} onChange={handleUpload} />
            </>
          )}
          <span style={{ fontSize: 12, opacity: 0.7 }}>👤 {user.email}</span>
          <button onClick={() => { setUser(null); setError(""); setPdfData(null); setLoading(true); }} style={{
            background: "rgba(255,255,255,0.1)", color: "#fff", border: "none",
            borderRadius: 6, padding: "6px 12px", fontSize: 12, cursor: "pointer",
          }}>로그아웃</button>
        </div>
      </div>

      {/* PDF Info bar */}
      {pdfData && (
        <div style={{
          background: "#fff", padding: "6px 20px", borderBottom: "1px solid #e5e7eb",
          display: "flex", alignItems: "center", gap: 12, fontSize: 12, color: "#666", flexShrink: 0,
        }}>
          <span style={{ fontWeight: 600, color: "#333" }}>📄 {pdfData.name}</span>
          <span>·</span>
          <span>업로드: {pdfData.uploadedBy}</span>
          <span>·</span>
          <span>{pdfData.uploadedAt}</span>
          <span style={{
            background: "#e8f5e9", color: "#2e7d32", fontSize: 10,
            padding: "2px 8px", borderRadius: 4, fontWeight: 600, marginLeft: "auto",
          }}>For Internal Use Only</span>
        </div>
      )}

      {/* Content */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0, overflow: "hidden" }}>
        {loading ? (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "#aaa", fontSize: 15 }}>
            불러오는 중...
          </div>
        ) : pdfData ? (
          <div style={{ flex: 1, position: "relative" }}
            onContextMenu={e => e.preventDefault()}>
            <iframe
              src={pdfData.url + "#toolbar=0&navpanes=0&scrollbar=1&view=FitH"}
              style={{ width: "100%", height: "100%", border: "none" }}
              title="조직도"
              sandbox="allow-same-origin allow-scripts"
            />
            {/* 우클릭/드래그 방지 오버레이 */}
            <div style={{
              position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
              background: "transparent", pointerEvents: "auto",
            }}
              onContextMenu={e => e.preventDefault()}
              onDragStart={e => e.preventDefault()}
            />
          </div>
        ) : (
          <div style={{
            flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
            flexDirection: "column", color: "#aaa",
          }}>
            <div style={{ fontSize: 64, marginBottom: 16, opacity: 0.4 }}>📄</div>
            <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8, color: "#888" }}>
              아직 조직도가 업로드되지 않았습니다
            </div>
            <div style={{ fontSize: 14 }}>
              {isAdmin ? "상단의 '조직도 업로드' 버튼으로 PDF를 올려주세요." : "HR 담당자에게 문의해주세요."}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{
        textAlign: "center", padding: "8px 0", fontSize: 10, color: "rgba(255,255,255,0.4)",
        background: "#1a1a2e", flexShrink: 0,
      }}>
        © 2026 MyRealTrip — 내부 전용 · 다운로드 및 인쇄 불가
      </div>
    </div>
  );
}
