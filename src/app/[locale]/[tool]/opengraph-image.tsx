import { ImageResponse } from 'next/og';
import { getTranslations } from 'next-intl/server';
import { TOOL_DEFINITIONS, TOOL_ROUTE_LOOKUP } from '@/lib/tool-config';

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
    tool: string;
  }>;
}

// Image generation
export default async function OgImage({ params }: OgImageProps) {
  const { locale, tool } = await params;
  const routeToolId = TOOL_ROUTE_LOOKUP[tool];

  if (!routeToolId) {
    // Fallback to generic image
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
          }}
        >
          <div style={{ fontSize: 72, color: 'white' }}>CryptoTools</div>
        </div>
      ),
      { ...size }
    );
  }

  const config = TOOL_DEFINITIONS[routeToolId];
  const t = await getTranslations({ locale });
  const title = t(config.titleKey);
  const description = t(config.descriptionKey);
  const badge = t(config.badgeKey);

  // Get tool icon based on tool ID
  const getToolIcon = () => {
    switch (routeToolId) {
      case 'hash':
      case 'sha3':
      case 'blake2':
        return '🔐';
      case 'symmetric':
      case 'des':
      case 'tripledes':
      case 'stream':
        return '🔒';
      case 'asymmetric':
      case 'elgamal':
      case 'ecies':
        return '🗝️';
      case 'base64':
      case 'encoding':
        return '🔤';
      case 'bgv':
      case 'paillier':
        return '🧮';
      case 'pqc':
        return '🛡️';
      case 'rc4':
      case 'rabbit':
        return '⚡';
      case 'files':
        return '📁';
      default:
        return '🔐';
    }
  };

  const icon = getToolIcon();

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
            maxWidth: 1000,
            padding: '0 40px',
          }}
        >
          {/* Icon */}
          <div
            style={{
              fontSize: 100,
              marginBottom: 10,
              display: 'flex',
            }}
          >
            {icon}
          </div>

          {/* Title */}
          <div
            style={{
              fontSize: 60,
              fontWeight: 'bold',
              color: 'white',
              letterSpacing: '-0.02em',
              display: 'flex',
              textAlign: 'center',
            }}
          >
            {title}
          </div>

          {/* Description */}
          <div
            style={{
              fontSize: 28,
              color: '#94a3b8',
              display: 'flex',
              textAlign: 'center',
              maxWidth: 900,
            }}
          >
            {description}
          </div>

          {/* Badge */}
          <div
            style={{
              padding: '12px 30px',
              borderRadius: 30,
              background: '#1e293b',
              border: '2px solid #3b82f6',
              color: '#3b82f6',
              fontSize: 22,
              display: 'flex',
              marginTop: 20,
            }}
          >
            {badge}
          </div>

          {/* Domain and branding */}
          <div
            style={{
              marginTop: 30,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <div
              style={{
                fontSize: 20,
                color: '#64748b',
                display: 'flex',
              }}
            >
              CryptoTools
            </div>
            <div
              style={{
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
      </div>
    ),
    {
      ...size,
    }
  );
}
