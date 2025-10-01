# CryptoTools Architecture Overview

## Feature Domains

- **Encodings**: Base64 text/image, URL encoding/decoding.
- **Hashing**: SHA-1/224/256/384/512, SHA3 variants, BLAKE2b/BLAKE2s.
- **Symmetric Ciphers**: AES (ECB/CBC/CFB/CTR/GCM), DES/3DES, RC4, Rabbit.
- **Stream/Modern Ciphers**: ChaCha20, Salsa20.
- **Asymmetric Ciphers**: RSA-OAEP, ECC-based ECIES (X25519 + ChaCha20-Poly1305), ElGamal on secp256k1.
- **Homomorphic**: Paillier (add/mul), educational BGV implementation (polynomial ring arithmetic, small parameters).
- **Post-Quantum**: Kyber (ML-KEM), Dilithium (ML-DSA).

## Library Choices

| Domain | Library | Notes |
| --- | --- | --- |
| Hashing | `@noble/hashes` | Pure TS, tree-shakeable, browser friendly. |
| AES/Legacy Ciphers | `crypto-js` | Provides AES (CBC/CFB/CTR/ECB), DES, 3DES, RC4, Rabbit. |
| AES-GCM/CTR | WebCrypto (`crypto.subtle`) | Native performance + GCM support. |
| ChaCha20/Salsa20 | `@noble/ciphers` | Modern, audited implementations. |
| RSA/ECC | WebCrypto + `@stablelib/x25519`, `@noble/ciphers` | RSA-OAEP via WebCrypto, ECIES using X25519 + ChaCha20Poly1305. |
| ElGamal | `js-crypto-elgamal` | Pure JS implementation with secp256k1 curve support. |
| Paillier | `paillier-bigint` | Deterministic big-int homomorphic encryption. |
| BGV | Custom lightweight module (`src/lib/crypto/bgv.ts`) | Demonstrational scheme with toy parameters, includes encrypt/decrypt/add/mul. |
| Kyber | `crystals-kyber-js` | ML-KEM (Kyber) TypeScript implementation workable in browsers. |
| Dilithium | `dilithium-crystals-js` | ML-DSA (Dilithium) signatures. |

All heavy libraries will be loaded via dynamic `import()` inside client-only helpers to keep the initial bundle small.

## Directory Layout

```
src/
├── app/
│   ├── [locale]/
│   │   ├── layout.tsx          # next-intl provider + theming
│   │   └── page.tsx            # Server component wiring data for CryptoWorkbench
│   ├── api/...
│   └── globals.css
├── components/
│   ├── crypto/
│   │   ├── CryptoWorkbench.tsx # Root client component orchestrating operations
│   │   ├── AlgorithmSelector.tsx
│   │   ├── OperationPanel.tsx
│   │   ├── ParameterFields.tsx
│   │   ├── ResultPanel.tsx
│   │   └── LanguageSwitcher.tsx
│   └── ui/...                  # Existing shadcn components reused
├── lib/
│   └── crypto/
│       ├── encodings.ts
│       ├── hashing.ts
│       ├── symmetric.ts
│       ├── stream.ts
│       ├── rsa.ts
│       ├── ecc.ts
│       ├── elgamal.ts
│       ├── paillier.ts
│       ├── bgv.ts
│       ├── pqc.ts
│       └── utils.ts            # shared helpers (byte conversions, base64, etc.)
└── messages/
    ├── ko.json
    ├── en.json
    ├── ja.json
    ├── ru.json
    ├── id.json
    └── zh.json
```

## UI Flow

1. **Header**: Language switcher, theme toggle (light/dark), documentation link.
2. **Algorithm Navigator** (left column on desktop, accordion on mobile): Groups algorithms by domain. Uses `Accordion` + `Tabs` from shadcn/ui.
3. **Operation Panel** (right column):
   - Input source selector (text/file/binary, context-aware).
   - Dynamic parameter fields (key, IV, nonce, mode selectors).
   - Action buttons (Encode/Decode, Encrypt/Decrypt, Hash, Sign/Verify, Generate keys).
   - Real-time status + timings (with `sonner` toast for success/failure).
4. **Result Panel**: Displays output, supports copy/download, shows metadata (e.g., ciphertext length, hash hex/base64, Paillier/BGV ciphertext components).
5. **History Sidebar** (optional stretch goal) storing last N operations in-memory.

## Internationalization Strategy

- Localized routes (`/[locale]/*`) handled by Next.js App Router.
- `NextIntlClientProvider` wraps layout with `messages` loaded via dynamic import.
- All UI strings defined under structured namespaces (`navigation`, `forms`, `algorithms`, `alerts`).
- Language switcher updates URL using `useRouter` + `usePathname` from `next-intl/navigation`.

## State Management

- Local component state with `useState`/`useReducer` for form inputs and results.
- `useTransition` or `useAsyncCallback` pattern to manage async crypto operations and show loading states.
- Debounced handlers for expensive hash operations on large inputs.

## Security & Performance Considerations

- All crypto runs client-side; no data leaves the browser.
- Sensitive inputs cleared from memory post-operation (`cryptoUtils.secureZeroMemory`).
- Files processed via streams (`File.arrayBuffer`) to avoid blocking main thread; large operations may offload to Web Workers in follow-up.
- WASM modules (Kyber, Dilithium) fetched lazily and cached.
- Strict CSP already configured in `next.config.ts`; ensure any new features comply (no inline scripts beyond allowed set).

## Testing Plan

- Unit tests (Vitest) for deterministic algorithms (hashing, encoding, AES, Paillier, BGV toy implementation).
- Snapshot tests for i18n navigation (ensure all locales render without runtime errors).
- Integration tests (playwright-like future) can verify UI flows.

## Pending Decisions / Risks

- `crypto-js` size -> consider code-splitting per algorithm.
- Custom BGV module provides educational security only; document clearly in UI.
- Browser compatibility for WASM-based packages (Kyber, Dilithium) must be verified in Turbopack dev server.
- Performance for large file/image conversions may need Web Worker offloading.
