# 2026-09-27~28 스타터 검증 원본

> 역사적 실행 기록이다. 당시의 미구현·미실행 상태를 보존하며, 현재 패키지의 결과는 [검증 기록](../verification.md)을 따른다.

이 문서는 설계 판단에 사용한 **실행 결과**와 미실행 범위를 기록한다. 원본 저장소는 이 작업 전용 `/tmp/oxc-config-verify.sLzyPb/`에 직접 클론했다. 추가 보류 후보·Vitest 검증에는 `/tmp/oxc-config-followup.k9dt47/`를 사용했다. 이번 합성·Antfu 추가 검증은 별도 `/tmp/oxc-config-audit.p8DvLr/`에서 수행했다. 문서에 필요한 fixture·설정 증거를 복사한 뒤 **세 경로와 그 아래 설치한 의존성을 각각 제거하고 경로 부재를 확인했다**. 이후 실제 OSS 코드와 TS6/7 설치 매트릭스는 [별도 검증](../rule-ledger.md)으로 추가했으며 그 임시 경로 `/tmp/oxc-config-oss.8zmuXE/`도 확인 후 삭제했다. 아래 명령은 검증 당시의 작업 디렉터리 구조를 설명하는 재현 기록이다. 영구 실행 하네스는 이번 설계 작업에서 만들지 않았다.

## 입력·버전

| 대상 | 고정점·관찰 |
| --- | --- |
| [`sonsu-lee/templates`](https://github.com/sonsu-lee/templates/commit/bfd1c9114aad9af3adfb60207d063e9d02d4f33e) | 직접 clone; `bfd1c9114aad9af3adfb60207d063e9d02d4f33e`; clean `main`. 다섯 Oxlint 설정, 일곱 Oxfmt 설정. 원본 고정 Oxlint 1.82.0, Oxfmt 0.67.0, 웹 TypeScript 7.0.2, Nest API TypeScript 6.0.3. |
| [`antfu/eslint-config`](https://github.com/antfu/eslint-config/commit/df4d896ed9b493ca0562fdf2c8c0fcd92fd16f6e) | 직접 clone; `df4d896ed9b493ca0562fdf2c8c0fcd92fd16f6e`; package 9.5.1. 구성 소스 분석과 후보 규칙 이식 실험. Antfu 자체 테스트 실행은 `not_run`. |
| 실행 환경 | macOS, Node 24.18.1, npm 11.16.0, pnpm 10.34.5. 추가 비교 Oxlint 1.85.0, Oxfmt 0.70.0, oxlint-tsgolint 7.0.2003. |
| 후속 격리 실험 | `/tmp/oxc-config-followup.k9dt47/`에 Oxlint 1.85.0, Oxfmt 0.70.0, Vitest 5.0.2, TypeScript 7.0.2, oxlint-tsgolint 7.0.2003 설치. 사용자 저장소에는 설치하지 않음. [입력·출력 스냅샷](followup-probes.json). |

정확한 원본 옵션·심각도·override·사용 위치는 [원본 설정 인벤토리](templates-inventory.json), 규칙 단독 실험은 [규칙 원장](../rule-ledger.md)에 있다. 버전·상태가 바뀌면 같은 결론을 자동 상속하지 않는다.

## 원본 설정과 포맷 실행

다섯 `.oxlintrc.json`에서 고유 **명시** 규칙 104개, 선언 320개를 추출했다. 웹 세 곳은 `src/**`에 React/Next/접근성 89개를 동일하게 적용한다. `src/client/**`와 `src/**/*.client.*`에만 client import 제한이 추가되므로 `src/app/page.tsx`의 `'use client'`는 빠진다. API 두 곳은 `typescript/consistent-type-imports:off`이고 `src/**/*.ts`에서 `node/no-sync`와 `unicorn/no-process-exit`을 켠다. `scripts/**`는 그 두 규칙의 적용 대상이 아니다. Oxlint 1.82.0 `--print-config`의 [5개 출력 스냅샷](effective-configs.json)에는 루트와 overrides를 합쳐 명시 밖의 ID **146개**도 나온다. `--print-config`는 파일 하나에 대해 overrides를 합성한 최종값이 아니며 이 146개 각각의 fixture 및 버전 변경 diff는 `not_run`이다.

원본 clone의 **실제 TS/JS 파일**도 글롭과 대조했다. 웹의 `src/app/layout.tsx`, `src/app/page.tsx`는 모두 `src/**` 웹 규칙을 받지만 client 전용 override는 받지 않는다. 각 웹 템플릿에서 client 전용 override에 실제 맞는 파일은 `src/client/health-check.tsx` 하나이며, `*.client.*` 파일은 없다. `src/app/globals.css`는 디렉터리에 있지만 Oxlint TS/JS 파일 목록에는 넣지 않았다.

| 원본 설정 위치 | `src/**` 또는 `src/**/*.ts`의 실제 TS/JS 파일 | client override에 맞는 파일 |
| --- | --- | --- |
| `next-fullstack/` | `app/layout.tsx`, `app/page.tsx`, `app/api/health/route.ts`, `server/health.ts`, `client/health-check.tsx` | `client/health-check.tsx` |
| `next-node-nest/apps/web/` | 위와 동일 | `client/health-check.tsx` |
| `next-static-nest/apps/web/` | `app/layout.tsx`, `app/page.tsx`, `client/health-check.tsx` | `client/health-check.tsx` |
| 두 `apps/api/` 설정 각각 | `main.ts`, `health.service.ts`, `app.module.ts`, `health.schema.ts`, `health.controller.ts` | 해당 없음 |

표의 상대 경로는 모두 각 템플릿의 `src/`를 기준으로 한다. 루트 규칙은 ignore되지 않은 설정 범위의 파일에 적용된다. 모든 원본 파일을 하나씩 별도 lint 실행한 것은 `not_run`이며, 대표적인 실제 override 동작은 아래 sentinel과 공식 스타터에서 확인했다.

```sh
git clone --depth 1 https://github.com/sonsu-lee/templates /tmp/oxc-config-verify.sLzyPb/templates
git -C /tmp/oxc-config-verify.sLzyPb/templates rev-parse HEAD
git clone --depth 1 https://github.com/antfu/eslint-config /tmp/oxc-config-verify.sLzyPb/antfu-eslint-config
git -C /tmp/oxc-config-verify.sLzyPb/antfu-eslint-config rev-parse HEAD
```

같은 값을 가진 일곱 `.oxfmtrc.json`은 `singleAttributePerLine:true`, `singleQuote:true`, `sortImports:true`, `sortPackageJson:{sortScripts:true}`와 생성물 ignore 경로를 선언한다. 원본 값으로 `oxfmt --check .`는 의도적으로 잘못 포맷한 5개 파일 때문에 exit 1, `oxfmt --write .` exit 0 뒤 재검사 exit 0이었다. JSX attribute 분리, TS 작은따옴표, import 선언 순서, package scripts 정렬을 관찰했다. `sortImports`는 `{z,a}` named specifier의 순서를 바꾸지 않았고 `sort-imports`는 이를 진단·수정했다. 별도 Oxfmt 0.70 실험에서 `sortSideEffects:false`는 side effect import **끼리의 상대 순서**만 보존했다. CSS/HTML/Markdown의 Antfu 포맷터와 Oxfmt 사이 결과 동등성은 `not_run`. [Oxfmt 정렬 문서](https://oxc.rs/docs/guide/usage/formatter/sorting).

Oxfmt 0.67.0의 `ignorePatterns` 일곱 항목을 각각 경로에 파일을 만들어 직접 확인했다. `node_modules/`, `.next/`, `out/`, `dist/`, `coverage/`, `next-env.d.ts`를 단일 대상으로 `oxfmt --check <path>` 지정하면 각각 exit 2 `Expected at least one target file`이었다. 같은 경로를 빈 설정 `-c empty.json`으로 지정하면 모두 exit 0으로 매치돼, 원본 ignore가 제외한 것을 확인했다. `src/example.js` 정상 대조는 원본 설정에서 format 차이로 exit 1이었다. `*.tsbuildinfo`는 원본과 빈 설정 모두 exit 2라 이 확장자에 대해서는 ignore 효과를 별도로 증명할 수 없다. 디렉터리 단위 `--check .`는 ignore된 파일을 나열하지 않고 `src/example.js`와 config 파일만 보고했다.

**포맷 의미 변화:** 원본의 `sortImports:true`(Oxfmt 0.67.0)와 `sortSideEffects:false`(Oxfmt 0.70.0) 모두 일반 import를 side effect import 사이로 재배치했다. `node main.mjs` 실행의 평가 순서가 `z-polyfill,z,a-polyfill,a`에서 `z-polyfill,a,a-polyfill,z`로 바뀌었다. 따라서 원본 옵션은 공통 기본값에서 제거한다. 정확한 소스·명령·결과는 [Oxfmt import 순서 반례](oxfmt-import-order.md)에 보존했다. 조건부 `exports` 키 순서는 한 fixture에서 유지됐지만 그 이상을 보장하지 않는다.

원본 설정의 실제 적용 실험: `src/client/probe.ts`의 `node:fs`가 `eslint(no-restricted-imports)`와 `import(no-nodejs-modules)`를 냈고 `src/app/probe.ts`는 두 규칙에서 조용했다. 같은 sync I/O는 `src/**`에서 `node(no-sync)`, `scripts/**`에서 진단 0이었다. `next/no-img-element` 경고만 있으면 `oxlint` exit 0, `--deny-warnings` exit 1이었다. `env`만으로 `window` 금지를 보장하지 않았으며, 추가로 `no-undef:error`를 설정한 실험에서 scripts의 `window`만 진단했다. 무시 경로 단일 파일을 직접 지정하면 `No files found to lint`로 exit 1이므로 CI 대상은 안정적인 디렉터리로 지정한다.

## 설정 패키지 소비 실험

실제 패키지는 구현하지 않았다. 동일한 export 형태만 가진 임시 `@fixture/oxc-config@0.0.1` tarball을 `npm pack` 후 별도 소비 디렉터리에 설치했다. `./oxlint`, `./oxfmt`의 ESM 객체를 `oxlint.config.ts`와 `oxfmt.config.ts`에서 import했다. 첫 실험은 Node 24.18.1, Oxlint 1.82.0, Oxfmt 0.67.0에서 `-c` 없이 두 파일을 자동 탐색했다. `oxlint --print-config`에 공유 객체의 `no-debugger:deny`가 보였고 위반 파일은 `eslint(no-debugger)` exit 1; Oxfmt는 공유 `singleQuote:true`로 double quote 파일을 exit 1 처리했고 빈 config 대조군은 exit 0이었다. 소비자의 `package.json`에 `type:module`을 명시하면 Node의 typeless package 경고가 사라졌다. 후속 실험은 `.d.mts` 타입 선언과 당시 설계 이름인 named export `base`·`typescript`·`testVitest`·`shared`, `extends` 합성을 가진 별도 임시 tarball을 Node 24.18.1 및 22.23.2에서 검증했다. `tsc --noEmit` 0, 정상 소스 lint 0, 의도한 중복 import·require·집중 테스트 3 error였다. `oxfmt --check`는 미포맷 1, ignore된 생성물 단독 대상은 2였다. **현재 제안한 일곱 규칙 영역 export의 소비 결과는 아니다.** 실제 구현물의 peerDependencies와 지원 Node 전체 범위는 `not_run`. [합성 실행](composition-probes.json), [Oxlint 설정](https://oxc.rs/docs/guide/usage/linter/config), [Oxfmt 설정](https://oxc.rs/docs/guide/usage/formatter/config).

## 공식 스타터 조합

스타터별 결과는 도구의 성공과 제품 계약의 성공을 구분한다. 표의 `passed`는 적힌 명령과 관찰에 한정된다. 이 표는 앞선 원본/후보 설정 실행이다. 선별 규칙의 추가 합성 실행은 [아래](#선별-구성의-추가-통합-실행)에 기록한다. **실제 배포 패키지 적용과 배포 검사**는 `not_run`이다.

| 조합 | 공식 생성·설치 | 린트·타입·빌드/실행 | 판정 범위 |
| --- | --- | --- | --- |
| Next 일반 배포 | `create-next-app@16.3.6 --typescript --app --src-dir --no-tailwind --no-react-compiler --no-eslint --no-biome --use-npm --skip-install --disable-git --yes` exit 0. React 19.2.8. | 원본 웹 설정 + TS 7.0.2/Oxlint 1.82.0/tsgolint 7.0.2001: `next typegen`, `tsc --noEmit`, `oxlint .`, `next build` exit 0. 생성 직후 `oxfmt --check .`는 포맷 차이로 exit 1. | async Server Component, `useState` Client Component, 정적 `GET` Route Handler 정상 사례. |
| Next `output:'export'` | 같은 공식 스타터에 export 설정. | 정상 `GET` + `dynamic='force-static'`: 린트·타입·빌드 exit 0, `out/data.json` 생성. `request.url` 의존 `GET`: 린트 0, export build 1. | 린트가 배포 가능 여부를 판정하지 못함. 정상 `<img alt>`는 빌드 0인데 lint warning, `--deny-warnings` 1. 기본 `next/image`는 build 0이어도 `out`에 없는 `/_next/image` URL을 생성; `images.unoptimized:true`에서 `/tiny.png`로 출력. |
| Nest 12 | `npx --yes @nestjs/cli@12.0.7 new nest12 --package-manager npm --skip-install --skip-git --strict`; CLI 12.0.7, core 12.1.0, TS 6.0.3, Oxlint 1.85.0, tsgolint 7.0.2003. | 생성 Oxlint `npm run lint` 0, `tsc --noEmit -p tsconfig.build.json` 0, `npm run build` 0, HTTP `/` 200 `Hello World!`. 전체 `tsc -p tsconfig.json`은 생성 test의 `supertest/types` 해석 오류로 exit 2. | `@Injectable`/`@Controller`/`@Module` 정상. 생성 설정은 TS6에서도 type-aware floating Promise를 검출했으나 원본 templates API 설정은 `typeAware:false`라 동일 위반을 놓침. |
| Hono on Node.js | `npm create hono@0.19.5 -- -t nodejs -i -p npm hono-node`; Hono 4.13.9, `@hono/node-server` 2.1.1, TS7.0.2. | async middleware + typed `Variables` route: `npm run build` 0, Node 실행 후 `/api/me` HTTP 200 `{"userId":"u1"}`. [보존된 probe](composition-probes.json)는 기본 후보 10규칙의 정상 0진단, type-aware 14규칙의 정상 0진단과 `any` 위반의 세 `no-unsafe-*` 진단이다. | 실제 Hono 계약과 Node 검사 범위의 좁은 사례. floating Promise·sync I/O 조합의 실행 근거는 별도 확인 필요. |
| Hono on Cloudflare Workers | `npm create hono@0.19.5 -- -t cloudflare-workers -i -p npm hono-worker`; Hono 4.13.9, Wrangler 4.141.0, TS7.0.2, compatibility date 2026-09-27. | typed binding + async middleware: `wrangler types --env-interface CloudflareBindings`, `tsc --noEmit`, `wrangler deploy --dry-run` 모두 0, `wrangler dev` `/env/value` HTTP 200 `fixture` 및 middleware header. [보존된 probe](composition-probes.json)의 기본 후보 10규칙은 정상 0진단이다. | 실제 Cloudflare 배포는 `not_run`. floating Promise와 `AsyncLocalStorage` 추가 probe의 소스·출력은 미보존이므로 실행 근거로 쓰지 않는다. |

이전 작업 기록은 Hono Node에서 floating Promise·sync I/O 검출, Workers에서 floating Promise 검출과 `AsyncLocalStorage` dry-run·로컬 HTTP 성공을 서술했다. 연결된 [당시 합성 probe](composition-probes.json)에는 Node의 `any` 위반 3건과 Workers의 binding/middleware 정상 사례만 남아 있어 **그 추가 사례를 당시 실행 증거로 사용하지 않는다.** 2026-09-28에 [F11·F12](followup-2026-09-28.md)로 소스·설정·명령·결과를 새로 기록했다. F11은 TS7 typed floating Promise 위반을 검출했고 `node/no-sync`가 정상 시작 함수도 막았다. F12는 명시적 `nodejs_compat`를 쓰는 **다른 조합**에서 로컬 Worker의 20개 동시 요청 문맥 유지를 확인했다.

Next의 일반 Client Component 이름에서 `node:fs`를 import하면 원본 설정 `oxlint` exit 0, export build exit 1이었다. 같은 파일명을 `*.client.tsx`로 바꾸면 `no-restricted-imports`와 `import/no-nodejs-modules`가 검출했다. 파일명 기반 override는 실제 React client 경계의 완전한 검사가 아니다. [Next 정적 export 계약](https://nextjs.org/docs/app/guides/static-exports), [Next image export 제한](https://nextjs.org/docs/messages/export-image-api).

정적 웹 원본 설정의 `no-restricted-imports`는 `next/headers`에서 `cookies()`를 가져온 반례를 exit 1로 잡았고 일반 fullstack 설정은 exit 0이었다. 둘 모두 export build는 요청 시점의 `cookies()` 때문에 실패했다. 정적 설정도 `request.url` 반례는 놓쳤다. Hono의 공식 생성 명령은 설치 단계의 비대화형 `-i`가 없으면 프롬프트에서 중단됐으므로 표의 설치 뒤 `npm install --no-audit --no-fund`를 별도로 실행했다.

정적 Route Handler의 핵심 입력은 `export const dynamic = 'force-static'`과 `GET()`의 고정 `Response.json({status:'ready'})`였다. 위반 입력은 같은 Handler에서 `GET(request: Request)`의 `new URL(request.url).searchParams.get('name')`을 읽었다. Next client 경계 위반은 `src/app/ui/browser-fs.tsx`에 `'use client'`를 쓰고 `node:fs`의 `constants`를 import한 파일이었다. 파일명만 `browser-fs.client.tsx`로 바꿔 다시 lint했을 때에만 원본 client override가 적용됐다. Nest DI 반례는 생성된 `AppController`의 `AppService` 값 import를 type-only import로 바꾼 것이다. 이 세 사례는 각각 린트·빌드·런타임이 서로 다른 결함을 검출하는 이유를 보여준다.

## 타입 기반 검사와 metadata

[Oxc 타입 기반 린트 문서](https://oxc.rs/docs/guide/usage/linter/type-aware)는 `oxlint-tsgolint` 설치와 TypeScript 7 이상을 요구한다고 명시한다. 별도 좁은 실험에서는 TS 6.0.3 + Oxlint 1.82.0/tsgolint 7.0.2001 및 Oxlint 1.85.0/tsgolint 7.0.2003이 `typescript(no-floating-promises)`를 출력했다. 후자에서 `no-unsafe-assignment`와 TS2322도 출력했다. 이는 해당 fixture에서 실행됐다는 뜻이며 TS6의 공식 지원 또는 전 기능 정확성을 뜻하지 않는다. `paths` 값이 비상대 경로일 때 `typescript(tsconfig-error)`가 발생했고 `./src/...` 상대 경로로 고치자 해소됐다.

`typescript/consistent-type-imports`에 대해 TS 6.0.3의 legacy decorator + `emitDecoratorMetadata:true` 소형 fixture에서 Oxlint 1.85.0 `--fix`가 생성자에 주입한 값 클래스 import를 `import type`으로 바꿨다. JS `design:paramtypes`가 `[CatsService]`에서 `[Function]`으로 바뀌었다. 타입 검사와 TS emit은 exit 0이라도 DI 토큰이 바뀐다. [Oxc 규칙 문서](https://oxc.rs/docs/guide/usage/linter/rules/typescript/consistent-type-imports)는 decorator metadata의 예외를 설명하지만 이 실행은 달랐다. Nest에서는 이 규칙을 기본에서 끄고, 실제 DI 부트스트랩 결과를 함께 확인한다.

공식 Nest 12.1.0 앱에서도 `typescript/consistent-type-imports:error`가 생성물의 `AppService` 값 import를 진단했다. 제안대로 `import type`으로 바꾸면 `tsc -p tsconfig.build.json`과 `nest build`는 exit 0이지만 `node dist/main.js`가 `UnknownDependenciesException`으로 exit 1이었다. 다시 값 import로 복원하면 HTTP 200이었다. 이 결과는 작은 fixture의 metadata 우려가 실제 Nest DI 결함임을 확인한다.

동일 공식 Nest 스타터에 TS7.0.2를 설치하면 `tsc -p tsconfig.build.json`은 0이지만 `npm run build`는 1이었다. Nest CLI가 TS7.0의 programmatic compiler API가 없다고 명시했고 TS6 설치를 요구했다. TS6.0.3 복원 뒤 build는 다시 0. 설치된 schematics의 TypeScript peer 범위 `>=6.0.0`만으로 TS7 CLI 동작을 결론낼 수 없다. [Nest 공식 migration guide](https://docs.nestjs.com/migration-guide), [Oxc 타입 호환 문서](https://oxc.rs/docs/guide/usage/linter/type-aware#typescript-compatibility).

당시 Workers 조합의 호환 날짜 2026-09-27은 [Cloudflare 문서](https://developers.cloudflare.com/workers/runtime-apis/nodejs/)가 기본 Node 호환 모드를 켠다고 설명하는 2026-08-04 이후다. [AsyncLocalStorage API](https://developers.cloudflare.com/workers/runtime-apis/nodejs/asynclocalstorage/)는 별도 문서가 있지만, 이 저장소에 보존된 당시 probe에는 `node:async_hooks` 사용 소스와 실행 출력이 없다. **이 과거 조합의 AsyncLocalStorage 동작 판정은 보류한다.** [새 F12 실행](followup-2026-09-28.md)은 2026-08-03 날짜에 `nodejs_compat`를 명시하고 로컬 런타임을 검사한 별도 결과다. 두 결과를 합쳐 모든 `node:*` API나 원격 배포가 지원된다고 단정하지 않는다.

## 공식 스타터 재현 명령의 핵심

아래는 당시 격리된 각 프로젝트 디렉터리에서 사용한 명령이다. 위 표의 코드 fixture는 [규칙 원장](../rule-ledger.md)과 각 설명의 입력을 추가한 뒤 실행했다. 생성 도구가 내려받는 패키지의 전체 전이 의존성은 lockfile로 고정해야 재실험에서 동일한 조합이 된다. 이번 임시 프로젝트의 lockfile은 정리 대상이라 저장소에 복사하지 않았다.

```sh
npx --yes create-next-app@16.3.6 next-starter-work --typescript --app --src-dir --no-tailwind --no-react-compiler --no-eslint --no-biome --use-npm --skip-install --disable-git --yes
cd next-starter-work
npm install --no-audit --no-fund
npm install --save-dev --save-exact typescript@7.0.2 oxlint@1.82.0 oxlint-tsgolint@7.0.2001 oxfmt@0.67.0 --no-audit --no-fund
npx next typegen
npx oxlint .
npx tsc --noEmit
npx oxfmt --write .
npx oxfmt --check .
npm run build
cd ..

npx --yes @nestjs/cli@12.0.7 new nest12 --package-manager npm --skip-install --skip-git --strict
cd nest12
npm install --no-audit --no-fund
npm run lint
./node_modules/.bin/tsc --noEmit -p tsconfig.build.json
npm run build
PORT=4301 node dist/main.js
cd ..

npm create hono@0.19.5 -- -t nodejs -i -p npm hono-node
cd hono-node
npm install --no-audit --no-fund
npm run build
node dist/index.js
cd ..

npm create hono@0.19.5 -- -t cloudflare-workers -i -p npm hono-worker
cd hono-worker
npm install --no-audit --no-fund
npx wrangler types --env-interface CloudflareBindings
npx tsc --noEmit -p tsconfig.json
npx wrangler deploy --dry-run --outdir ./dry-run-dist
npx wrangler dev --port 8789
```

HTTP 검사는 Nest `/`, Hono Node `/api/me`, Workers `/env/value`에 `curl -i`를 사용했다. Wrangler `deploy --dry-run`은 실제 배포가 아니다. Next 정적·Nest DI 실패 반례의 exit 코드는 위의 조합 표와 타입 섹션에 기록했다.

## 보류 후보와 Vitest 후속 실행

[Vitest 전용 검증](../rule-ledger.md)에서 14개 후보를 개별 위반·정상 fixture와 두 fix 방식으로 시험했다. 처음 `vitest/valid-describe-callback`의 위반으로 잘못 가정한 `async describe`는 진단 0이어서, callback 인자가 있는 실제 위반으로 교체해 1 error를 확인했다. `vitest/consistent-test-it`의 `--fix`는 호출만 바꿔 import를 고치지 않았고 실제 `vitest run`은 `ReferenceError: it is not defined`, exit 1이었다. `expect-expect`는 정상 assertion helper를 진단했다. 7개 선별 규칙의 임시 파일 override는 `example.test.ts`+일반 `src.ts`에 진단 0, `focused.test.ts`에 `vitest(no-focused-tests)` 1이었다. Vitest 정상 예제는 4 passed, `.only` 예제는 1 passed·1 skipped이면서 exit 0이었다. `oxfmt --check format.test.ts`는 포맷 전 exit 1, `--write` 후 재검사 0이었다. 명령·소스·결과는 [실행 원본](followup-probes.json)에 있다.

Oxfmt `sortImports:{partitionByNewline:true,partitionByComment:true,newlinesBetween:false,sortSideEffects:false}`를 Node ESM 네 모듈의 평가 순서로 확인했다. `newlinesBetween`을 생략한 첫 시도는 Oxfmt 0.70.0이 `partitionByNewline:true`와 기본 `newlinesBetween:true`를 함께 쓸 수 없다고 설정 파싱을 거부했다. 유효 옵션으로 재시도하면 빈 줄·주석으로 분리한 두 입력은 포맷 전후 순서가 같았지만, 분리하지 않은 입력은 `z-polyfill,z,a-polyfill,a`에서 `z-polyfill,a,a-polyfill,z`로 바뀌었다. 공통 기본 `sortImports:false`를 유지한다. [설정 참조](https://oxc.rs/docs/guide/usage/formatter/config-file-reference), [실행 원본](followup-probes.json).

TS7.0.2 프로젝트에서 `oxlint --type-aware`로 `typescript/no-unsafe-assignment`, `no-unsafe-return`, `no-unsafe-call`, `no-unsafe-member-access`를 각각 error로 켰다. `any` 값을 할당·반환·호출·멤버 접근한 파일은 네 ID를 진단해 exit 1, `JSON.parse` 결과를 `unknown`으로 받고 타입을 좁힌 정상 파일 단독은 0, `tsc --noEmit -p tsconfig.json`도 0이었다. 이 검사는 규칙의 한 좁은 사례만 입증한다. Nest12 TS6에 대한 공식 지원 근거로 사용하지 않는다.

`import/no-cycle`은 상대 import 양방향 값 cycle을 프로젝트 디렉터리에서 `oxlint -c .oxlintrc.json -f json .`로 실행할 때 양쪽에서 `import(no-cycle)` 2 error였다. 같은 입력을 다른 작업 디렉터리에서 절대 경로 대상 지정으로 실행했을 때는 진단 0이었다. 이 재현은 명령의 작업 디렉터리·resolution 상태가 결과에 영향을 줄 수 있음을 보여준다. 이어 [Nest 공식 `forwardRef` 방식](https://docs.nestjs.com/fundamentals/circular-dependency)을 Nest core/common 12.1.0 + TS6.0.3의 두 provider에 적용했다. `npm run build` 0, `npm run start` 0, 실제 DI는 `{"aHasB":true,"bHasA":true}`였다. 같은 `src`에 `import/no-cycle:error`를 켠 Oxlint는 양쪽 import를 **2 error**로 막았다. 이 정상 Nest 패턴과 충돌하므로 Nest 전역 채택은 제거하고, 순환을 금지하는 프로젝트에서만 선택적으로 사용한다. [소스·설정·결과](followup-probes.json).

## 선별 구성의 추가 통합 실행

추가 실험은 `/tmp/oxc-config-audit.p8DvLr/`의 임시 클론·소비자·공식 스타터에서 했다. [`antfu/eslint-config` commit `df4d896`](https://github.com/antfu/eslint-config/commit/df4d896ed9b493ca0562fdf2c8c0fcd92fd16f6e)을 다시 직접 clone해 drift가 없음을 확인했다. Antfu 소스 분석 및 게시 패키지 소비 실행의 구분은 [별도 분석](../rule-ledger.md)과 [probe](antfu-consumer-probes.json)에 있다. 이 절의 `selected-next-config-prototype.json`은 **문서 증거용 임시 설정**이다. 저장소에 패키지를 구현하지 않았다.

### 공통 규칙·설정 합성

Oxlint 1.85.0에서 `correctness:off`, `plugins:['import']`를 놓고 [base 9개](base-rule-probes.json)를 각각 위반·정상·`--fix`로 실행했다. 전부 위반은 해당 ID error와 exit 1, 정상은 진단 0과 exit 0이었다. `import/no-duplicates`와 `sort-imports`만 이 fixture에서 fix가 파일을 바꿨다. `eqeqeq:['error','smart']`는 `x == 1`을 막고 `x == null`을 허용했다. 빈 Oxlint 설정의 `--print-config`에는 기본 warn 규칙 111개, `correctness:off`에는 0개였다. 명시적 import 규칙만 적고 `import` plugin을 빠뜨리면 그 규칙은 활성 목록에 나오지 않았다. 그래서 공유 base에 범주 off와 plugin 목록을 명시한다.

임시 tarball의 `oxlint.config.ts`에서 `defineConfig({extends:[base,typescript,testVitest]})`, `oxfmt.config.ts`에서 `defineConfig({...shared,ignorePatterns:['dist/**']})`가 타입 검사와 CLI 실행에 성공했다. `extends`의 뒤 항목과 소비자 루트 값이 앞 규칙을 덮었고 plugin 목록은 이 테스트에서 병합됐다. `--print-config`를 업데이트 시 snapshot과 비교해야 한다. `typeAware`·`typeCheck`는 루트 전용이다. Oxfmt 0.70.0에서 CSS·HTML·Markdown의 TS code fence·JSONC를 write→check로 실행했다. 포맷 가능성은 확인했지만 Antfu 외부 formatter와 출력 동등성은 시험하지 않았다.

### 공식 스타터 결과

| 스타터 / 선택 규칙 | 정상 코드와 명령 | 관찰 |
| --- | --- | --- |
| Next 16.3.6, React 19.2.8, TS5.9.3; 77개 | `create-next-app@16.3.6` 공식 App Router 생성물에 Client `useState` 컴포넌트, 키보드 이벤트가 있는 접근 가능 버튼, 정적 `GET`을 추가. `oxlint -c oxlint.config.json --deny-warnings -f json src`, `oxfmt --write src`→`--check src`, `tsc --noEmit`, `npm run build`. | 5 소스 파일 lint 0, 포맷 재검사 0, TS 0, 일반 build 0. 첫 빌드는 생성물의 `next/font/google` 다운로드 실패로 exit 1이었으며 임시 layout에서 외부 폰트를 제거한 뒤 재실행했다. |
| Next `output:'export'`; 같은 77개 | `images.unoptimized:true`, `GET`에 `dynamic='force-static'` 추가. 이어 키보드 ArrowUp/Down으로 선택하는 `role=listbox`·`role=option` Client 컴포넌트를 페이지에 렌더링했다. lint·format·TS·build 후 `out/index.html`의 절대 로컬 `src`/`href`를 출력 파일과 대조. | 6 소스 파일 lint 0, 포맷·TS·build 0, `out/api/status` 생성. 로컬 참조 14개 중 누락 0. 정적 배포 플랫폼의 실제 서빙은 `not_run`. |
| Nest 12.1.0, TS6.0.3; base+TS+Vitest 17개 | 공식 `@nestjs/cli@12.0.7` 생성물의 `src test` lint·Oxfmt, `tsc --noEmit -p tsconfig.build.json`, `npm run build`, `npm test`, `npm run test:e2e`, `PORT=4315 node dist/main.js`, HTTP `/`. | 6 소스 파일 lint 0, 포맷·TS·build 0, unit/e2e 각각 1/1 passed, HTTP 200 `Hello World!`. `*.e2e-spec.ts`를 Vitest override에 추가해야 생성 e2e 파일이 매치됐다. `focused.e2e-spec.ts` sentinel의 `.only`는 해당 ID error/exit 1, 제거 후 정상 lint 0이었다. |
| Hono Node 4.13.9, TS7.0.2; base+TS 10개 | 공식 `create-hono@0.19.5` Node 생성물에 typed `Variables`와 async middleware 추가. lint·Oxfmt·`npm run build`, Node HTTP `/api/me`. | lint 0, format·build 0, HTTP 200 `{"userId":"u1"}`. |
| Hono Workers 4.13.9, Wrangler 4.141.0, TS7.0.2; base+TS 10개 | 공식 Workers 생성물에 typed `MY_VAR` binding·async middleware 추가. lint·Oxfmt·`wrangler types`·`tsc --noEmit`·`wrangler deploy --dry-run`·`wrangler dev`, HTTP `/env/value`. | lint 0, format·타입 생성·TS·dry-run 0, local HTTP 200 `fixture`, `x-fixture: yes`. 처음 Wrangler는 sandbox의 host 로그 경로와 local bind 권한으로 실패했다. `WRANGLER_LOG_PATH`를 임시 경로로 두고 local port 권한을 허용해 성공했다. 실제 Cloudflare 배포는 `not_run`. |

Next의 77개 실제 ID·옵션·globs는 [Next 선택 설정](selected-next-config-prototype.json), backend 10개는 [공통 backend 설정](selected-backend-config-prototype.json), Nest 17개는 [Nest 선택 설정](selected-nest-config-prototype.json)에 보존했다. 각 스타터의 JSON 진단·버전·정상 소스 snippet·결과는 [통합 실행 증거](composition-probes.json)에 있다. Nest/Hono 설정은 Next snapshot의 root 9개와 TypeScript override 1개를 사용하고 React·Next override를 제외했다. Nest만 Vitest override 7개를 더했다. 61개 규칙별 *단독 정상* fixture를 통째로 합쳤을 때는 19개 교차 진단이 나왔다. 이 중 미정의 JSX 이름, 클릭 가능한 `div`의 키보드·label 누락 등은 단독 규칙 fixture가 완전한 앱 코드가 아닌 데서 왔다. 따라서 단독 정상 fixture 61개를 조합 통과 근거로 사용하지 않고 위 공식 스타터의 완성된 정상 패턴을 기준으로 삼았다.

TS7 Hono Node 스타터에서 `oxlint-tsgolint@7.0.2003`과 네 `no-unsafe-*` 후보를 **별도** 켰다. 정상 typed middleware는 0, `any` 할당·반환·호출 위반 파일은 `typescript(no-unsafe-assignment)`·`no-unsafe-return`·`no-unsafe-call` 3 error였다. 해당 입력에 member access는 없으므로 이 파일에서 네 번째 규칙이 진단하지 않은 것은 누락이 아니다. 네 ID 각각의 위반·정상은 앞선 분리 fixture에 있다. 이는 TS7의 좁은 공식 Hono 조합이 가능함을 보이지만 Next 생성물 TS5·Nest12 TS6에 공통 typed export를 합성할 근거는 아니다.

재현의 핵심 명령은 아래와 같다. 공식 생성 명령과 개별 패키지 버전은 위 표와 [기존 스타터 명령](#공식-스타터-재현-명령의-핵심)에 있다. `oxlint.config.json`에는 해당 환경의 위 snapshot을 복사한다. Oxfmt에는 `singleQuote:true`, `singleAttributePerLine:true`, `sortPackageJson:{sortScripts:true}`, `sortImports:false`와 해당 프로젝트의 생성물 ignore를 설정한다.

```sh
oxlint -c oxlint.config.json --deny-warnings -f json src
oxfmt --write src && oxfmt --check src
tsc --noEmit                     # Next / Workers; Nest는 -p tsconfig.build.json
npm run build                    # Next / Nest / Hono Node
npm test                         # Nest Vitest
wrangler types --env-interface CloudflareBindings
wrangler deploy --dry-run --outdir ./dry-run-dist
oxlint --type-aware -c oxlint.typed.json --deny-warnings -f json src/index.ts
```

### Antfu와 package manifest의 실행 의미

게시 Antfu 9.5.1 + ESLint 10.11.0 + TS6.0.3의 `antfu()`에서 TS 자동 감지·named override·CLI 예외를 직접 확인했다. TS만 7.0.2로 바꾸면 설정 import가 `ts-api-utils@2.5.0`의 `TypeFlags.Intrinsic` 접근에서 실패했다. 이것은 이 설치 해석의 결과다. [Antfu 분석](../rule-ledger.md)과 [소비자 JSON](antfu-consumer-probes.json)에 분리했다.

조건부 `exports`가 `{default:'./default.mjs', import:'./import.mjs'}`인 self-reference package에 게시 Antfu의 기본 `ESLint` `fix:true`를 실행했다. 정렬 뒤 키가 `import,default`가 되고 Node `import('manifest-probe')`의 결과가 `default`에서 `import`로 바뀌었다. Oxfmt 0.70.0의 `sortPackageJson:{sortScripts:true}`는 같은 입력에서 scripts만 `a,z`로 정렬하고 `exports`·Node 결과를 유지했다. 별도 `default,require,import,types` manifest도 Oxfmt 포맷 전후 순서를 유지했고 `npm pack`→소비자 설치 후 `import`·`require` 모두 `default.cjs`를 선택했다. 이 범위의 동작 비교를 근거로 Antfu의 package 정렬 규칙은 채택하지 않는다. [입력·출력](antfu-consumer-probes.json).

## 2026-09-28 보류 계약 재검증

[F10–F14a·T13의 입력·설정·명령·진단·임시 경로 정리](followup-2026-09-28.md)에 후속 실행을 분리해 기록했다. 이전 77개 스타터 조합의 결과를 현재 74개 공개 조각에 소급하지 않는다.

| 사례 | 실행 결과 | 현재 한계 |
| --- | --- | --- |
| F10 Commerce | 75개와 74개를 실제 `app/`·`components/`·`lib/`에 각각 적용: 64파일, 같은 5 error, exit 1. 고정 `src/**` 대조는 0진단·exit 0. | 앱 자체 test/build 및 공개 export 합성 `not_run`. |
| F11 Hono Node | TS7·tsgolint에서 미처리 Promise를 `typescript(no-floating-promises)` error로 검출. `node/no-sync`는 요청 경로와 정상 시작 함수를 모두 error로 진단. Node build·HTTP 200. | typed 공개 구성 `not_run`; 전역 `no-sync`는 부적합. |
| F12 Hono Workers | `nodejs_compat` 명시, 타입 생성·`tsc`·Wrangler dry-run exit 0, 로컬 HTTP 200, 20개 동시 요청 문맥 유지. | 원격 배포와 다른 날짜·Node API는 `not_run`. |
| F13 Next App Router | `beforeInteractive`의 page·중첩 layout 오배치를 Oxlint가 0진단; 일반·정적 `next build`도 exit 0. Pages 대조군은 해당 warn 1건. | App 배치 검사 책임자를 별도로 결정해야 함. |
| F13a 별도 검사 | 임시 JS 규칙이 24 fixture 중 직접 오배치 9건을 error로 검출하고 정상 root 7건을 허용. | 간접 사용 누락, JS plugin alpha, 공개 패키지 미구현. |
| F14 Next `src/` | 네 규칙 소형 설정에서 route-local·feature·shared 경로를 검출. 좁은 React 경로는 `src/server`를 놓쳐 전체 `src/**`로 넓힌 두 규칙에서 회복. | 이 소형 입력만으로 전체 React 19개 결과를 대체하지 않음. |
| F14a React 19개 | 공식 Next 스타터의 정상 9파일에 넓은 글롭으로 0진단; 위반 4파일에 목표 4 error. 좁은 글롭은 3건 누락. 타입·빌드·HTTP 3경로 통과. | 다른 OSS 코퍼스와 공개 builder는 `not_run`. |
| T13 Nest 테스트 타입 | TS6 생성물의 생산 코드 `tsc` 0, 전체 `tsc`는 test import TS2307·exit 2. import 수정 후 전체·테스트 전용 `tsc` 0, unit/e2e·build·HTTP 통과. | 통과는 수정한 임시 스타터에 한정됨. |

## 남은 검사

- 실제 `@sonsu/oxc-config` 배포물의 export·peerDependencies·lockfile·CI/editor·지원 Node 매트릭스: `not_run`.
- 실사용 앱의 브라우저 접근성·스크린리더·키보드, React Compiler, 실제 데이터베이스/Cloudflare 배포: `not_run`.
- 모든 ignore·옵션 조합의 완전 탐색, 폴더 존재·파일 위치용 별도 검사 스크립트: `not_run`.

이 한계 때문에 스타터와 규칙 fixture의 성공을 모든 제품 코드의 무충돌 또는 첫 릴리스 통과로 표시하지 않는다.
