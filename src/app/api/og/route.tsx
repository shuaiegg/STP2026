import { ImageResponse } from 'next/og';

export const runtime = 'edge';

const TAGLINE = '帮中国出海企业建立可预测的海外获客系统';

async function loadNotoSansSC(): Promise<ArrayBuffer> {
  // Fetch only the characters used in the tagline to minimize payload size
  const css = await fetch(
    `https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@700&text=${encodeURIComponent(TAGLINE)}`,
    {
      headers: {
        // Desktop User-Agent required to receive woff2 format instead of woff
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    }
  ).then((r) => r.text());

  const fontUrl = css.match(/url\(([^)]+)\)/)?.[1];
  if (!fontUrl) throw new Error('[OG Route] Could not extract font URL from Google Fonts CSS');

  return fetch(fontUrl).then((r) => r.arrayBuffer());
}

export async function GET() {
  const fontData = await loadNotoSansSC();

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0a0a0a',
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          position: 'relative',
        }}
      >
        {/* Brand Name */}
        <div
          style={{
            display: 'flex',
            fontSize: 96,
            fontWeight: 'bold',
            color: 'white',
            letterSpacing: '-0.02em',
            marginBottom: 24,
          }}
        >
          ScaletoTop
        </div>

        {/* Gradient Divider */}
        <div
          style={{
            display: 'flex',
            height: '3px',
            width: '600px',
            background: 'linear-gradient(to right, #00ff88, #00d4ff)',
            marginBottom: 32,
          }}
        />

        {/* Tagline */}
        <div
          style={{
            display: 'flex',
            fontSize: 36,
            fontFamily: 'NotoSansSC',
            color: 'rgba(255, 255, 255, 0.7)',
            textAlign: 'center',
            maxWidth: '900px',
          }}
        >
          {TAGLINE}
        </div>

        {/* Watermark */}
        <div
          style={{
            position: 'absolute',
            bottom: 40,
            right: 40,
            display: 'flex',
            fontSize: 24,
            color: '#8a8a8a',
            fontWeight: 500,
          }}
        >
          scaletotop.com
        </div>

        {/* Bottom Gradient Bar */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            display: 'flex',
            height: '6px',
            width: '100%',
            background: 'linear-gradient(to right, #00ff88, #00d4ff)',
          }}
        />
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: [
        {
          name: 'NotoSansSC',
          data: fontData,
          weight: 700,
          style: 'normal',
        },
      ],
    }
  );
}
