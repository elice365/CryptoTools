# Tasks: Multilingual Cryptography Tool Website

**Input**: Design documents from `/specs/001-docs-ai-prds/`
**Prerequisites**: plan.md, spec.md

## Execution Flow
1.  **Analyze** `spec.md` for functional requirements and entities.
2.  **Analyze** `plan.md` and existing code for tech stack and structure.
3.  **Generate** tasks based on requirements, following a Test-Driven Development (TDD) approach.
4.  **Order** tasks by dependency: Setup → Tests → Core Implementation → Integration → Polish.
5.  **Mark** independent tasks for parallel execution `[P]`.

## Format: `[ID] [P?] Description`
-   **[P]**: Can run in parallel (different files, no dependencies).
-   Includes exact file paths for clarity.

## Path Conventions
-   **Source**: `src/`
-   **Tests**: `tests/` (Note: Project currently lacks a `tests` directory, tests will be added alongside components or in a new top-level `tests` folder).

## Phase 3.1: Setup & Configuration
-   [x] T001 Implement ThemeProvider and ThemeToggle component in `src/components/theme-provider.tsx` and `src/components/crypto/theme-toggle.tsx`.
-   [x] T002 [P] Create new message files for Russian (`src/messages/ru.json`), Indonesian (`src/messages/id.json`), and Chinese (`src/messages/zh.json`).
-   [x] T003 Configure `src/i18n.ts` and `src/middleware.ts` to support the new locales (ru, id, zh).

## Phase 3.2: Tests First (TDD)
-   [ ] T004 [P] Write unit tests for Base64 logic, including URL-safe and image conversion, in `src/lib/crypto/base64.test.ts`.
-   [ ] T005 [P] Write unit tests for all hashing functions in `src/lib/crypto/hashing.test.ts`.
-   [ ] T006 [P] Write unit tests for symmetric algorithms and block modes in `src/lib/crypto/symmetric.test.ts`.
-   [ ] T007 [P] Write unit tests for asymmetric algorithms (RSA, ECC, ElGamal) in `src/lib/crypto/asymmetric.test.ts`.
-   [ ] T008 [P] Write unit tests for PQC algorithms (Kyber, Dilithium) in `src/lib/crypto/pqc.test.ts`.
-   [ ] T009 [P] Write unit tests for advanced crypto (Paillier, BGV) in `src/lib/crypto/paillier.test.ts` and `src/lib/crypto/bgv.test.ts`.
-   [ ] T010 [P] Write component tests for the Base64 tool UI (`src/components/crypto/base64-tool.tsx`).
-   [ ] T011 [P] Write component tests for the generic Hash tool UI (`src/components/crypto/hash-tool.tsx`).

## Phase 3.3: Core Implementation
-   [x] T012 [P] Implement UI for the Base64 tool, including URL-safe and image-to-Base64 options, in `src/components/crypto/base64-tool.tsx`.
-   [x] T013 [P] Implement the generic UI for Hashing tools in `src/components/crypto/hash-tool.tsx` and populate with all hash functions.
-   [x] T014 [P] Implement the generic UI for Symmetric Encryption in `src/components/crypto/symmetric-tool.tsx`, supporting all algorithms and modes.
-   [x] T015 [P] Implement the generic UI for Asymmetric Encryption in `src/components/crypto/asymmetric-tool.tsx`, supporting RSA, ECC, and ElGamal.
-   [ ] T016 [P] Implement UI for Post-Quantum Cryptography (Kyber, Dilithium) in `src/components/crypto/asymmetric-tool.tsx` or a new component.
-   [ ] T017 [P] Implement demo UI for Advanced Cryptography (Paillier, BGV), clarifying scope as needed, in new components under `src/components/crypto/`.
-   [x] T018 [P] Create a URL encoding/decoding utility component in `src/components/crypto/encoding-tools.tsx`.
-   [ ] T019 Implement real-time updates with a configurable debounce mechanism in all relevant tools.
-   [ ] T020 Implement file input (drag & drop, selector) and streaming for large files in all relevant tools.
-   [ ] T021 Implement "copy to clipboard" and "download as file" functionality for all tool outputs.
-   [ ] T022 Implement comprehensive input validation and user-friendly error messages for all tools.

## Phase 3.4: Integration
-   [ ] T023 Integrate all the newly created crypto tools into the main application grid in `src/app/[locale]/page.tsx`.
-   [ ] T024 Implement the `UserPreferences` entity to persist theme and language settings in local storage, used by `src/components/theme-provider.tsx` and `src/components/crypto/language-switcher.tsx`.
-   [ ] T025 [P] Ensure all new components and pages are fully responsive on mobile, tablet, and desktop screens.

## Phase 3.5: Polish & Documentation
-   [ ] T026 [P] Populate `ru.json`, `id.json`, and `zh.json` with translations for all UI text.
-   [ ] T027 [P] Add comprehensive unit and component tests to achieve >80% test coverage for all new functionality.
-   [ ] T028 [P] Create documentation in the `docs/` directory explaining how to use each new cryptography tool and its options.
-   [ ] T029 Conduct performance testing, focusing on large file handling and UI responsiveness, and document results.
-   [ ] T030 Perform manual testing based on all acceptance scenarios and edge cases defined in `specs/001-docs-ai-prds/spec.md`.

## Phase 3.6: Critical Missing Implementations (PRIORITY)
-   [x] T031 [P] Complete symmetric encryption algorithms: DES, 3DES, RC4, Rabbit, ChaCha20, Salsa20 in `src/lib/crypto/symmetric.ts`.
-   [x] T032 [P] Implement all block cipher modes (ECB, CBC, CFB, CTR, GCM) with proper padding in `src/lib/crypto/symmetric.ts`.
-   [x] T033 [P] Enhance Post-Quantum implementations for browser performance optimization in `src/lib/crypto/pqc.ts`.
-   [x] T034 [P] Complete Advanced Cryptography demos (Paillier homomorphic, BGV FHE) with scope clarification in respective files.
-   [x] T035 Implement Web Workers integration for CPU-intensive crypto operations to prevent UI blocking.
-   [x] T036 Add comprehensive file streaming capabilities for large file encryption/decryption operations.

## Dependencies
-   **Tests First**: All test tasks (T004-T011) should be attempted before their corresponding implementation tasks (T012-T018).
-   **Critical Missing**: Phase 3.6 tasks (T031-T036) are highest priority for functional completeness.
-   **Core Blocks Integration**: Core implementation (T012-T022, T031-T036) must be completed before integration (T023-T025).
-   **Implementation Blocks Polish**: All features must be implemented before polish tasks (T026-T030).

## Parallel Example
The following test creation tasks can be run concurrently:
```
Task: "Write unit tests for Base64 logic, including URL-safe and image conversion, in src/lib/crypto/base64.test.ts"
Task: "Write unit tests for all hashing functions in src/lib/crypto/hashing.test.ts"
Task: "Write unit tests for symmetric algorithms and block modes in src/lib/crypto/symmetric.test.ts"
Task: "Write component tests for the Base64 tool UI (src/components/crypto/base64-tool.tsx)"
```