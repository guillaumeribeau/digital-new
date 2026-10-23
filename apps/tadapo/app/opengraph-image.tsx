import { ImageResponse } from "next/og";
export const alt = "Tadapo — Votre site pro. 0 € de frais de création.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export default function OpenGraphImage() {
  return new ImageResponse(<div style={{ background: "#FFF8F0", color: "#1E1B1A", width: "100%", height: "100%", display: "flex", flexDirection: "column", padding: 70, justifyContent: "space-between" }}><div style={{ fontSize: 72, fontWeight: 900 }}>tadapo.</div><div style={{ fontSize: 92, fontWeight: 900, lineHeight: 1.05, display: "flex", flexDirection: "column" }}><span>Votre site pro.</span><span style={{ color: "#E45439" }}>0 € de frais de création.</span></div><div style={{ fontSize: 25 }}>Un abonnement. Un site qui vous ressemble.</div></div>, size);
}
