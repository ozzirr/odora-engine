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
          background: "linear-gradient(135deg, #17110d 0%, #2d2119 48%, #0f0d0b 100%)",
          color: "#fff8ed",
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
            background: "rgba(217, 183, 127, 0.2)",
            filter: "blur(26px)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -220,
            left: -100,
            width: 620,
            height: 620,
            borderRadius: 9999,
            background: "rgba(255, 248, 237, 0.12)",
            filter: "blur(34px)",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 38,
            borderRadius: 42,
            border: "1px solid rgba(255, 248, 237, 0.24)",
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
                  borderRadius: 9999,
                  background: "#fff8ed",
                  color: "#1E4B3B",
                  border: "1px solid rgba(217, 183, 127, 0.42)",
                  fontSize: 32,
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
                  color: "#d9b77f",
                }}
              >
                Smart fragrance finder
              </div>
              <div
                style={{
                  display: "flex",
                  fontSize: 36,
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                }}
              >
                ODORA
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
                fontSize: 82,
                lineHeight: 1,
                fontWeight: 700,
                letterSpacing: "-0.045em",
              }}
            >
              Trova la tua firma olfattiva.
            </div>
            <div
              style={{
                display: "flex",
                fontSize: 30,
                lineHeight: 1.35,
                color: "#ead8bd",
                maxWidth: 840,
              }}
            >
              Rispondi a poche scelte sensoriali: Odora legge mood, stagione, occasione e budget per creare una selezione personale.
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
              {["Mood", "Stagione", "Occasione", "Budget"].map((label) => (
                <div
                  key={label}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    padding: "12px 18px",
                    borderRadius: 9999,
                    background: "rgba(255, 248, 237, 0.12)",
                    border: "1px solid rgba(255, 248, 237, 0.22)",
                    fontSize: 20,
                    color: "#fff8ed",
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
                color: "#d9b77f",
              }}
            >
              odora.it
            </div>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
