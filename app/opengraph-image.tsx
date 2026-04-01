import { ImageResponse } from "next/og";

export const alt = "Odora social preview";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          height: "100%",
          width: "100%",
          background:
            "radial-gradient(circle at top left, #fff4e5 0%, #f5e3cd 34%, #d8b992 66%, #8f6540 100%)",
          color: "#24180f",
          fontFamily: "ui-serif, Georgia, Cambria, 'Times New Roman', serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: -120,
            right: -40,
            width: 420,
            height: 420,
            borderRadius: 9999,
            background: "rgba(255, 255, 255, 0.22)",
            filter: "blur(18px)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -180,
            left: -60,
            width: 520,
            height: 520,
            borderRadius: 9999,
            background: "rgba(114, 70, 33, 0.18)",
            filter: "blur(22px)",
          }}
        />

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            width: "100%",
            padding: "54px 58px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 18,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 72,
                height: 72,
                borderRadius: 24,
                background: "rgba(255, 249, 242, 0.75)",
                border: "1px solid rgba(97, 63, 35, 0.18)",
                fontSize: 30,
                fontWeight: 700,
                letterSpacing: "-0.04em",
              }}
            >
              O
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 6,
              }}
            >
              <div
                style={{
                  display: "flex",
                  fontSize: 20,
                  letterSpacing: "0.24em",
                  textTransform: "uppercase",
                  color: "#6f5339",
                }}
              >
                Perfume discovery
              </div>
              <div
                style={{
                  display: "flex",
                  fontSize: 28,
                  fontWeight: 700,
                  letterSpacing: "-0.05em",
                }}
              >
                Odora
              </div>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              maxWidth: 860,
              gap: 18,
            }}
          >
            <div
              style={{
                display: "flex",
                fontSize: 78,
                lineHeight: 1,
                fontWeight: 700,
                letterSpacing: "-0.06em",
              }}
            >
              Discover perfumes with a better preview.
            </div>
            <div
              style={{
                display: "flex",
                fontSize: 30,
                lineHeight: 1.35,
                color: "#4c3828",
                maxWidth: 840,
              }}
            >
              Compare notes, price, mood, and standout picks in one refined fragrance experience.
            </div>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 24,
            }}
          >
            <div
              style={{
                display: "flex",
                gap: 12,
                flexWrap: "wrap",
              }}
            >
              {["Finder", "Catalog", "Price comparison"].map((label) => (
                <div
                  key={label}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    padding: "12px 18px",
                    borderRadius: 9999,
                    background: "rgba(255, 248, 240, 0.72)",
                    border: "1px solid rgba(97, 63, 35, 0.14)",
                    fontSize: 20,
                    color: "#5d4532",
                  }}
                >
                  {label}
                </div>
              ))}
            </div>

            <div
              style={{
                display: "flex",
                fontSize: 20,
                textTransform: "uppercase",
                letterSpacing: "0.18em",
                color: "#6b4e35",
              }}
            >
              odora
            </div>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
