## Overview

`a.elice.pro/ko/sha256` 페이지 구조를 참고해 각 도구별 세부 항목 페이지를 생성하고 SEO 메타·사이트맵까지 갱신하는 작업을 진행한다.

## Task List

- [ ] 01. 기존 `tool-config`와 관련 레이아웃/컴포넌트를 검토해 현재 구조와 의존성을 파악한다.
- [ ] 02. `a.elice.pro/ko/sha256` 페이지를 기준으로 재사용 가능한 페이지/섹션 템플릿을 설계하고 스타일 가이드를 정리한다.
- [ ] 03. 각 도구(`base64`, `hash`, `symmetric`, `asymmetric`, `encoding`, `files`)와 별칭(`sha256`, `sha512`, `sha384`, `sha1`, `aes`)에 맞춘 섹션 페이지를 생성한다.
- [ ] 04. 다국어 지원을 위해 `src/messages`와 `src/i18n`에 필요한 번역 키 및 메시지를 추가한다.
- [ ] 05. `TOOL_DEFINITIONS`, `TOOL_ROUTE_LOOKUP`, `TOOL_ALIAS_LOOKUP` 등 데이터 맵을 업데이트하여 신규 페이지 경로를 라우팅에 연결한다.
- [ ] 06. 각 페이지의 `generateMetadata` 및 연관 SEO 메타 태그를 정의해 타이틀, 설명, OG 태그, 키워드를 최적화한다.
- [ ] 07. `src/app/sitemap.ts`와 `src/app/robots.ts`를 갱신하여 신규 경로가 노출되도록 하고, 내부 링크 구조를 강화한다.
- [ ] 08. 접근성/테마 대응을 검증하고 스모크 테스트 또는 스크린샷 테스트를 통해 기본 동작을 확인한다.
- [ ] 09. 변경 사항 요약과 함께 추후 커밋/배포를 위한 검증 체크리스트를 정리한다.

## Deliverables

- 도구 및 별칭별 섹션 페이지 컴포넌트
- 업데이트된 i18n 메시지 및 라우팅/SEO 설정
- 보강된 메타데이터, 사이트맵, 로봇 설정
- 검증 및 후속 작업 가이드
