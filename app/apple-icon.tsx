import { ImageResponse } from 'next/og';

/** iOS でホーム画面に追加したときのアイコン（PNGとして自動生成される） */
export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0B1220',
          color: '#34D399',
          fontSize: 116,
          fontFamily: 'sans-serif',
        }}
      >
        ♠
      </div>
    ),
    { ...size },
  );
}
