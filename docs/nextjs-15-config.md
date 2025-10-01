# Next.js 15.5.4 App Router Configuration Guide

## Project Structure with App Router

### Root Layout (Required)
Create `app/layout.tsx` as the root layout:

```tsx
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
```

### Tailwind CSS Integration
Configure Tailwind for App Router in `tailwind.config.js`:

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

## Advanced Configuration Options

### Client-Side Router Cache
Configure cache stale times in `next.config.js`:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    staleTimes: {
      dynamic: 30,
      static: 180,
    },
  },
}

module.exports = nextConfig
```

### Dynamic Route Fallbacks
Control fallback behavior with `dynamicParams`:

```jsx
// app/[slug]/page.js
export const dynamicParams = true;

export async function generateStaticParams() {
  return [...]
}

export default async function Post({ params }) {
  const post = await getPost(params);
  return ...
}
```

### Web Vitals Reporting
Create a dedicated client component for Web Vitals:

```jsx
// app/_components/web-vitals.js
'use client'

import { useReportWebVitals } from 'next/web-vitals'

export function WebVitals() {
  useReportWebVitals((metric) => {
    console.log(metric)
  })
}
```

Add to root layout:

```jsx
// app/layout.js
import { WebVitals } from './_components/web-vitals'

export default function Layout({ children }) {
  return (
    <html>
      <body>
        <WebVitals />
        {children}
      </body>
    </html>
  )
}
```

## Internationalization Setup

### i18n Redirects Configuration
Configure redirects for internationalization:

```javascript
module.exports = {
  async redirects() {
    return [
      {
        source: '/en/old-path',
        destination: '/en/new-path',
        permanent: false,
      },
      {
        source: '/:locale/old-path',
        destination: '/:locale/new-path',
        permanent: false,
      },
      {
        source: '/:locale(en|fr|de)/:path*',
        destination: '/:locale/new-section/:path*',
        permanent: false,
      },
    ]
  },
}
```

## Self-Hosting Configuration

### Streaming with Proxy
Enable streaming behind proxies like Nginx:

```js
module.exports = {
  async headers() {
    return [
      {
        source: '/:path*{/}?',
        headers: [
          {
            key: 'X-Accel-Buffering',
            value: 'no',
          },
        ],
      },
    ]
  },
}
```

## Performance Features

### App Router Benefits
- Server Components by default
- Improved data fetching
- Built-in streaming and Suspense
- Optimized client-side routing
- Better bundle optimization

### Migration from Pages Router
- Move files from `pages/` to `app/`
- Replace `getStaticProps`/`getServerSideProps` with Server Components
- Update data fetching patterns
- Migrate custom `_app.js` and `_document.js` to `layout.js`

## ESLint Configuration
Keep ESLint up to date:

```bash
npm install -D eslint-config-next@latest
```