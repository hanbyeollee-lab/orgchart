import { useState, useRef, useEffect } from "react";
import { supabase, uploadPdf, getPdfMeta, deletePdf } from "./supabase";
import LoginScreen from "./components/LoginScreen";

const ALLOWED_DOMAIN = "myrealtrip.com";

// 업로드 권한이 있는 관리자 이메일 목록 (HR)
const ADMIN_EMAILS = [
  "hanbyeol.lee@myrealtrip.com",
  "haein.cho@myrealtrip.com",
  "yoonjae.lee@myrealtrip.com",
];

export default function App() {
  const [session, setSession] = useState(null);
  const [pdfData, setPdfData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [authLoading, setAuthLoading] = useState(true);
  const fileRef = useRef();
  const pdfContainerRef = useRef();

  const user = session?.user;
  const userEmail = user?.email || '';
  const isValidDomain = userEmail.endsWith(`@${ALLOWED_DOMAIN}`);
  const isAdmin = isValidDomain && ADMIN_EMAILS.includes(userEmail);

  // Supabase Auth 세션 관리
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setAuthLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setAuthLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // 저장된 PDF 불러오기
  useEffect(() => {
    if (!session || !isValidDomain) {
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const meta = await getPdfMeta();
        if (meta) setPdfData(meta);
      } catch { /* no data yet */ }
      setLoading(false);
    })();
  }, [session, isValidDomain]);

  // 마우스 휠 줌 기능
  useEffect(() => {
    const container = pdfContainerRef.current;
    if (!container) return;

    const handleWheel = (e) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = e.deltaY * -0.01;
        setZoom(prev => Math.min(Math.max(0.5, prev + delta), 3));
      }
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, [pdfData]);

  const handleUpload = async (e) => {
    const f = e.target.files[0];
    if (!f || f.type !== "application/pdf") return;
    setUploading(true);
    try {
      const meta = await uploadPdf(f, userEmail);
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

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setPdfData(null);
    setLoading(true);
  };

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.2, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.2, 0.5));
  const handleZoomReset = () => setZoom(1);

  // 인증 로딩 중
  if (authLoading) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#191919",
        color: "#FFFFFF",
        fontSize: 15,
        fontWeight: 500,
      }}>
        로딩 중...
      </div>
    );
  }

  // 로그인하지 않았거나 허용되지 않은 도메인
  if (!session || !isValidDomain) {
    if (session && !isValidDomain) {
      return (
        <div style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          background: "#191919",
          color: "#FFFFFF",
        }}>
          <img src="/logo.png" alt="MyRealTrip" style={{ width: 64, height: 64, marginBottom: 24, opacity: 0.5 }} />
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>접근 권한이 없습니다</h2>
          <p style={{ fontSize: 14, color: "#A3A3A3", marginBottom: 24 }}>
            @{ALLOWED_DOMAIN} 계정으로 로그인해주세요
          </p>
          <button onClick={handleLogout} style={{
            background: "#FFFFFF",
            color: "#191919",
            border: "none",
            borderRadius: 8,
            padding: "12px 24px",
            fontSize: 14,
            cursor: "pointer",
            fontWeight: 600,
          }}>
            다시 로그인
          </button>
        </div>
      );
    }
    return <LoginScreen />;
  }

  return (
    <div style={{
      height: "100vh", display: "flex", flexDirection: "column",
      fontFamily: "var(--font-kr)", background: "#F5F5F5",
      overflow: "hidden",
    }}>
      {/* Header */}
      <div style={{
        background: "#191919", color: "#fff",
        padding: "12px 24px", display: "flex", justifyContent: "space-between", alignItems: "center",
        flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <img src="/logo.png" alt="MyRealTrip" style={{ width: 28, height: 28 }} />
          <span style={{ fontWeight: 700, fontSize: 16 }}>MyRealTrip 조직도</span>
          {isAdmin && (
            <span style={{
              background: "#FFFFFF", color: "#191919", fontSize: 11, padding: "3px 10px",
              borderRadius: 6, fontWeight: 700, marginLeft: 4,
            }}>관리자</span>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {isAdmin && (
            <>
              <button onClick={() => fileRef.current.click()} style={{
                background: "#FFFFFF", color: "#191919", border: "none", borderRadius: 8,
                padding: "8px 16px", fontSize: 13, cursor: "pointer", fontWeight: 600,
                transition: "opacity 0.2s",
              }}>
                {uploading ? "업로드 중..." : pdfData ? "조직도 교체" : "조직도 업로드"}
              </button>
              {pdfData && (
                <button onClick={handleDelete} style={{
                  background: "rgba(255,255,255,0.1)", color: "#FFFFFF", border: "1px solid rgba(255,255,255,0.2)",
                  borderRadius: 8, padding: "8px 14px", fontSize: 13, cursor: "pointer", fontWeight: 600,
                }}>삭제</button>
              )}
              <input ref={fileRef} type="file" accept="application/pdf" style={{ display: "none" }} onChange={handleUpload} />
            </>
          )}
          <span style={{ fontSize: 13, opacity: 0.7, fontWeight: 500 }}>{userEmail}</span>
          <button onClick={handleLogout} style={{
            background: "rgba(255,255,255,0.1)", color: "#fff", border: "1px solid rgba(255,255,255,0.2)",
            borderRadius: 8, padding: "8px 16px", fontSize: 13, cursor: "pointer", fontWeight: 600,
          }}>로그아웃</button>
        </div>
      </div>

      {/* PDF Info bar */}
      {pdfData && (
        <div style={{
          background: "#FFFFFF", padding: "10px 24px", borderBottom: "1px solid #E5E5E5",
          display: "flex", alignItems: "center", gap: 12, fontSize: 13, color: "#737373", flexShrink: 0,
        }}>
          <span style={{ fontWeight: 600, color: "#191919" }}>{pdfData.name}</span>
          <span>·</span>
          <span>업로드: {pdfData.uploadedBy}</span>
          <span>·</span>
          <span>{pdfData.uploadedAt}</span>
          <span style={{
            background: "#F5F5F5", color: "#737373", fontSize: 11,
            padding: "4px 12px", borderRadius: 6, fontWeight: 500, marginLeft: "auto",
          }}>Ctrl+휠로 확대/축소</span>
          <span style={{
            background: "#F5F5F5", color: "#525252", fontSize: 11,
            padding: "4px 12px", borderRadius: 6, fontWeight: 600,
          }}>For Internal Use Only</span>
        </div>
      )}

      {/* Content */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0, overflow: "hidden" }}>
        {loading ? (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "#737373", fontSize: 15, fontWeight: 500 }}>
            불러오는 중...
          </div>
        ) : pdfData ? (
          <div ref={pdfContainerRef} style={{
            flex: 1,
            position: "relative",
            overflow: "auto",
            background: "#F5F5F5",
          }}
            onContextMenu={e => e.preventDefault()}>
            <div style={{
              width: "100%",
              height: "100%",
              transform: `scale(${zoom})`,
              transformOrigin: "top center",
              transition: "transform 0.1s ease",
            }}>
              <iframe
                src={pdfData.url + "#toolbar=0&navpanes=0&scrollbar=1&view=FitH"}
                style={{ width: "100%", height: "100%", border: "none" }}
                title="조직도"
                sandbox="allow-same-origin allow-scripts"
              />
            </div>
            {/* 우클릭/드래그 방지 오버레이 */}
            <div style={{
              position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
              background: "transparent", pointerEvents: "auto",
            }}
              onContextMenu={e => e.preventDefault()}
              onDragStart={e => e.preventDefault()}
            />
            {/* 줌 컨트롤 */}
            <div style={{
              position: "absolute",
              bottom: 24,
              right: 24,
              display: "flex",
              flexDirection: "column",
              gap: 8,
              background: "#FFFFFF",
              borderRadius: 12,
              padding: 8,
              boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
              zIndex: 10,
            }}>
              <button onClick={handleZoomIn} style={{
                background: "#191919",
                color: "#FFFFFF",
                border: "none",
                borderRadius: 8,
                width: 40,
                height: 40,
                fontSize: 18,
                cursor: "pointer",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}>+</button>
              <div style={{
                fontSize: 12,
                fontWeight: 600,
                color: "#191919",
                textAlign: "center",
                padding: "4px 0",
              }}>{Math.round(zoom * 100)}%</div>
              <button onClick={handleZoomOut} style={{
                background: "#191919",
                color: "#FFFFFF",
                border: "none",
                borderRadius: 8,
                width: 40,
                height: 40,
                fontSize: 18,
                cursor: "pointer",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}>-</button>
              <button onClick={handleZoomReset} style={{
                background: "#F5F5F5",
                color: "#191919",
                border: "none",
                borderRadius: 8,
                width: 40,
                height: 32,
                fontSize: 11,
                cursor: "pointer",
                fontWeight: 600,
                marginTop: 4,
              }}>100%</button>
            </div>
          </div>
        ) : (
          <div style={{
            flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
            flexDirection: "column", color: "#A3A3A3",
          }}>
            <img src="/logo.png" alt="MyRealTrip" style={{ width: 80, height: 80, marginBottom: 24, opacity: 0.3 }} />
            <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 12, color: "#525252" }}>
              아직 조직도가 업로드되지 않았습니다
            </div>
            <div style={{ fontSize: 15, fontWeight: 500, color: "#737373" }}>
              {isAdmin ? "상단의 '조직도 업로드' 버튼으로 PDF를 올려주세요." : "HR 담당자에게 문의해주세요."}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{
        textAlign: "center", padding: "12px 0", fontSize: 11, color: "rgba(255,255,255,0.6)",
        background: "#191919", flexShrink: 0, fontWeight: 500,
      }}>
        © 2026 MyRealTrip — 내부 전용 · 다운로드 및 인쇄 불가
      </div>
    </div>
  );
}
