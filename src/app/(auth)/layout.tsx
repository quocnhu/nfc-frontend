"use client";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        position: "relative",
      }}
    >
      <div className="nfc-bg">
        <div className="nfc-ripple" />
        <div className="nfc-ripple" />
        <div className="nfc-ripple" />
        <div className="nfc-ripple" />
        <div className="nfc-ripple-offset" />
        <div className="nfc-ripple-offset" />
        <div className="nfc-ripple-offset" />
      </div>
      <div style={{ width: "100%", maxWidth: 420, padding: 24, position: "relative", zIndex: 1 }}>
        {children}
      </div>
    </div>
  );
}
