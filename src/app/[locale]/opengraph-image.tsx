import { ImageResponse } from 'next/og';
import { getTranslations } from 'next-intl/server';

// Image metadata
export const alt = 'CryptoTools - Professional Cryptographic Toolkit';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

interface OgImageProps {
  params: Promise<{
    locale: string;
  }>;
}

// Image generation
export default async function OgImage({ params }: OgImageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'app' });

  const title = t('title');
  const description = t('description');

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
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          position: 'relative',
        }}
      >
        {/* Decorative circles */}
        <div
          style={{
            position: 'absolute',
            top: 50,
            left: 100,
            width: 150,
            height: 150,
            borderRadius: '50%',
            border: '3px solid rgba(59, 130, 246, 0.3)',
            display: 'flex',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: 80,
            right: 120,
            width: 200,
            height: 200,
            borderRadius: '50%',
            border: '3px solid rgba(139, 92, 246, 0.3)',
            display: 'flex',
          }}
        />

        {/* Main content */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 20,
          }}
        >
          {/* Icon */}
          <div
            style={{
              fontSize: 120,
              marginBottom: 20,
              display: 'flex',
            }}
          >
            🔐
          </div>

          {/* Title */}
          <div
            style={{
              fontSize: 72,
              fontWeight: 'bold',
              color: 'white',
              letterSpacing: '-0.02em',
              display: 'flex',
            }}
          >
            {title}
          </div>

          {/* Subtitle */}
          <div
            style={{
              fontSize: 32,
              color: '#94a3b8',
              display: 'flex',
              textAlign: 'center',
              maxWidth: 900,
              paddingLeft: 40,
              paddingRight: 40,
            }}
          >
            {description}
          </div>

          {/* Feature badges */}
          <div
            style={{
              display: 'flex',
              gap: 20,
              marginTop: 40,
            }}
          >
            <div
              style={{
                padding: '12px 30px',
                borderRadius: 30,
                background: '#1e293b',
                border: '2px solid #3b82f6',
                color: '#3b82f6',
                fontSize: 20,
                display: 'flex',
              }}
            >
              🔐 Quantum-Safe
            </div>
            <div
              style={{
                padding: '12px 30px',
                borderRadius: 30,
                background: '#1e293b',
                border: '2px solid #8b5cf6',
                color: '#8b5cf6',
                fontSize: 20,
                display: 'flex',
              }}
            >
              🛠️ 18 Tools
            </div>
            <div
              style={{
                padding: '12px 30px',
                borderRadius: 30,
                background: '#1e293b',
                border: '2px solid #3b82f6',
                color: '#3b82f6',
                fontSize: 20,
                display: 'flex',
              }}
            >
              🌐 Browser-Based
            </div>
          </div>

          {/* Algorithms */}
          <div
            style={{
              marginTop: 30,
              fontSize: 22,
              color: '#64748b',
              display: 'flex',
            }}
          >
            AES • RSA • Kyber • Dilithium • BLAKE2 • SHA-3
          </div>

          {/* Domain */}
          <div
            style={{
              marginTop: 10,
              fontSize: 24,
              fontWeight: 'bold',
              background: 'linear-gradient(90deg, #3b82f6 0%, #8b5cf6 100%)',
              backgroundClip: 'text',
              color: 'transparent',
              display: 'flex',
            }}
          >
            crypto.elice.pro
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
