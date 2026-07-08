import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const tagline = "För föreningar, lag och grupper";

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#FAFAF8",
        }}
      >
        <div
          style={{
            width: 120,
            height: 120,
            borderRadius: 24,
            background: "#1D6EE8",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 40,
          }}
        >
          <svg width="66" height="66" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="1.6">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z"
            />
          </svg>
        </div>
        <div style={{ fontSize: 72, fontWeight: 700, color: "#1A1917", display: "flex" }}>Lagkassan</div>
        <div style={{ fontSize: 32, color: "#6B6860", marginTop: 20, display: "flex", justifyContent: "center", whiteSpace: "pre" }}>
          {tagline}
        </div>
      </div>
    ),
    { ...size },
  );
}
