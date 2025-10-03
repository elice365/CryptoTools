import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  // 암호화 라이브러리 최적화
  experimental: {
    // Web Workers 지원 (암호화 연산용)
    webVitalsAttribution: ["CLS", "LCP", "FCP", "FID", "TTFB"],
  },

  // Turbopack 최적화
  turbopack: {
    rules: {
      // WASM 파일 처리
      "*.wasm": {
        loaders: ["file-loader"],
        as: "*.wasm",
      },
    },
  },

  // 웹팩 설정 (암호화 라이브러리 호환성)
  webpack: (config, { isServer }) => {
    // 클라이언트 사이드 암호화를 위한 Node.js polyfill 설정
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        crypto: false, // 브라우저 crypto API 사용
        stream: false,
        fs: false,
        path: false,
        buffer: require.resolve("buffer"),
        process: require.resolve("process/browser"),
      };
    }

    // WASM 로더 설정
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
      syncWebAssembly: true,
    };

    return config;
  },

  // 보안 헤더 (개발 환경에서는 완화된 CSP 사용)
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // Content Security Policy - 개발 환경용 완화된 설정
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' 'wasm-unsafe-eval'", // 개발 환경용
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob:",
              "font-src 'self' data:",
              "worker-src 'self' blob:",
              "connect-src 'self' ws: wss:",
              "object-src 'none'",
              "base-uri 'self'",
            ].join("; "),
          },
          // 보안 헤더들
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          // 성능 헤더
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
        ],
      },
    ];
  },

  // 이미지 최적화
  images: {
    formats: ["image/webp", "image/avif"],
    dangerouslyAllowSVG: false,
  },

  // 압축 및 성능
  compress: true,
  poweredByHeader: false,
};

export default withNextIntl(nextConfig);
