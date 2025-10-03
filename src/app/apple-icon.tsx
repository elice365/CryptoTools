import { ImageResponse } from 'next/og';

// Image metadata
export const size = {
  width: 180,
  height: 180,
};
export const contentType = 'image/png';

// Image generation
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
        }}
      >
        <div style={{ fontSize: 80 }}>🔐</div>
        <div
          style={{
            fontSize: 24,
            fontWeight: 'bold',
            marginTop: 10,
          }}
        >
          CryptoTools
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
