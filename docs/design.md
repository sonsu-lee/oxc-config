# 패키지 설계

현재 기본 사용법은 `/oxlint`의 default export인 `sonsu()`다. JavaScript·import·TypeScript 기본 세트를 제공하고 React·접근성·Next.js·Vitest는 실제 파일 경로를 지정해 선택한다. 기본 세트 없이 일부 영역만 조합하는 소비자를 위해 기존 7개 named export도 공개 API로 유지한다. 규칙은 Oxlint `correctness` category를 preset으로 상속하고, 이 패키지는 그 위의 차이(옵션·`warn`·`off`·category 밖 규칙)만 둔다. 실효 규칙은 [실효 규칙 표](../test/fixtures/effective-rules.json)에 고정한다. Oxfmt는 `shared` 객체를 그대로 제공한다. 패키지 scope와 작성자 표기는 `sonsu-lee`, 홈페이지는 [sonsu.dev](https://sonsu.dev)로 통일한다. MIT 라이선스로 npm에 공개 배포한다. 토큰 없이 설치할 수 있게 하려고 처음 게시한 GitHub Packages에서 옮겼다([#1](https://github.com/sonsu-lee/oxc-config/issues/1)).

## 소스와 배포 구조

```text
src/oxlint/index.ts
  ├─ factory.ts          기본 세트와 명시적 옵션을 native extends로 구성
  ├─ configs/javascript.ts
  ├─ configs/imports.ts
  ├─ configs/typescript.ts
  ├─ configs/react.ts       ┐
  ├─ configs/jsx-a11y.ts    ├─ scoped.ts
  ├─ configs/nextjs.ts      │
  └─ configs/vitest.ts     ┘
src/oxfmt/index.ts
         │ tsc
         ▼
dist/**/*.js + dist/**/*.d.ts
         │ pnpm pack (prepack → build)
         ▼
@sonsu-lee/oxc-config/oxlint · @sonsu-lee/oxc-config/oxfmt
```

- 기본 조각(`javascript`, `imports`, `typescript`)은 `categories.correctness: 'error'`와 자기 plugin을 선언하고 차이만 가진다. 영역 모듈은 자신의 plugin·차이·적용 범위를 함께 가진다. 규칙을 바꿀 때 한 영역 파일에서 판단할 수 있다.
- `scoped.ts`는 네 builder의 `files` 검사와 동일한 override 구조만 공유한다. 경로 추론과 glob 해석은 하지 않는다.
- `index.ts`는 공개 export와 기존 type alias를 유지한다. 내부 모듈은 package exports로 열지 않는다.
- `factory.ts`는 기본 세트와 선택한 조각을 모으고 native 설정 필드는 root에 둔다. 차이의 정본은 `configs/` 모듈이고, 상속 규칙의 정본은 설치된 Oxlint의 category 목록이다.
- `scripts/effective-rules.mjs`는 `oxlint --rules`의 category 목록, 활성 plugin, 조정을 합쳐 실효 규칙 표를 계산한다. 조정이 설치된 Oxlint에 없는 규칙 ID를 가리키면 실패한다.
- `tsc`의 strict 검사와 Oxc 공식 설정 타입으로 소스와 옵션을 확인한다. 선언 파일은 같은 소스에서 생성한다.
- `scripts/build.mjs`는 지정된 `dist/`를 비우고 로컬 TypeScript compiler를 실행한다. 소스 이동 후 오래된 파일이 tarball에 남지 않는다.
- ESM과 타입 선언만 필요하므로 번들러 없이 `tsc`를 사용한다. type-only import는 JS 출력에서 사라진다. 소스의 상대 `.ts` import는 `rewriteRelativeImportExtensions`로 배포 JS에서 `.js`로 변환한다.
- `files`에는 `dist`와 README만 지정하고, npm·pnpm이 `LICENSE`를 자동으로 포함한다. `dist`, `node_modules`, 로컬 작업 기록은 Git에서 제외한다.
- 배포는 `package.json`의 `version`을 올린 PR의 병합으로 시작한다. 릴리스 PR은 `version`과 README 설치 절에 적힌 이 패키지의 버전(`pnpm add` 명령과 `devDependencies` 예시)만 바꾼다. 설치 안내가 그 README가 속한 릴리스와 검증된 도구 버전을 함께 가리키게 하기 위해서다. main push의 `Verify`가 통과하면 `Publish` job이 `pnpm publish`로 npm에 게시하고, `verify:consumer --published`로 registry에서 다시 설치해 확인한 뒤 그 커밋에 `vX.Y.Z` Release를 만든다. `Verify`가 검사한 `pnpm pack` 결과와 같은 도구로 tarball을 만들기 위해 npm CLI 대신 pnpm을 쓴다. 인증은 npm trusted publishing(OIDC)이다. job의 `id-token: write`로 받은 단기 토큰만 쓰므로 저장소에 npm secret을 두지 않고, provenance도 함께 게시한다. `publishConfig`에 registry를 명시해 사용자 설정의 scope 라우팅과 무관하게 npm으로 게시한다.
- 게시·검증·Release는 부모 커밋과 `version`이 다른 커밋의 run에서만 실행한다. 그래서 나중의 main push가 이미 게시된 버전을 다른 커밋에 tag하거나 다시 검증하지 않는다. 실패하면 그 커밋의 run을 다시 실행한다. 이미 게시된 버전과 이미 있는 Release는 건너뛰므로 재실행해도 재게시하지 않는다.
- npm은 package metadata를 CDN으로 제공하므로 방금 게시한 버전이 몇 분간 보이지 않을 수 있다. 설치는 축약 metadata를, `pnpm view`는 전체 metadata를 먼저 읽고 CDN은 두 문서를 따로 캐시한다. 그래서 registry 설치 검증 전에 두 문서 모두에 새 버전이 보일 때까지 30초 간격으로 최대 10분 기다린다. 그래도 보이지 않으면 마지막 오류를 출력하고 job을 실패시킨다. 나중에 다시 실행하면 게시는 건너뛰고 대기·검증·Release를 이어서 한다.

Antfu도 TypeScript 소스에서 배포 JS와 선언 파일을 만든다. [고정 소스](https://github.com/antfu/eslint-config/tree/df4d896ed9b493ca0562fdf2c8c0fcd92fd16f6e/src)의 영역별 구성을 참고했다. [Factory 설계 #4](https://github.com/sonsu-lee/oxc-config/issues/4)는 기본 사용을 한 번의 호출로 줄이되, 설치된 의존성이나 폴더로 프레임워크를 자동 감지하지 않는다. 합성은 Oxlint의 native `extends`에 맡기고 별도 deep merge 엔진이나 설치 wizard를 만들지 않는다.

## 합성과 파일 범위

`sonsu(options?: SonsuOptions)`는 기존 세 기본 조각, 선택한 `react`·`jsxA11y`·`nextjs`·`vitest`, 소비자 `extends` 순서로 설정을 구성한다. 프레임워크 옵션은 `FilesPresetOptions`이며 생략하면 비활성이다. `true`·`false` 축약형은 지원하지 않는다. 옵션의 나머지 native Oxlint 필드는 root 설정으로 전달한다.

호출별 기본 조각은 복사하여 반환된 설정을 수정해도 다음 호출이나 공개 원본 조각으로 전파되지 않게 한다. 사용자 제공 설정에 별도의 deep clone이나 병합 규칙을 추가하지 않는다.

`javascript`, `imports`, `typescript`는 설정 객체이고 각각 `categories.correctness: 'error'`와 자기 plugin(`oxc`·`unicorn`, `import`, `typescript`)을 선언한다. category는 root 설정이라 활성 plugin 전체에 적용된다. override에서 켠 영역 plugin(`react` 등)의 correctness 규칙은 그 override의 파일에서만 켜진다. `react`, `jsxA11y`, `nextjs`, `vitest`는 `{ files: readonly string[] }`를 받아 `overrides` 하나만 반환하고 category를 두지 않는다. 뒤쪽 `extends`의 category가 앞의 값을 덮어쓰므로, 영역 builder에 category를 두면 기본 조각의 preset을 바꾼다. 기본 조각 없이 영역 builder만 쓰면 Oxlint 기본값(correctness `warn`)이 상속 규칙에 적용된다. 0.1.x는 반대로 모든 조각에 `correctness: 'off'`를 두고 74개를 직접 나열했다([초기 합성 반례](evidence/oxlint-module-composition.md)). 전환 근거는 [규칙 결정](rule-ledger.md)에 있다.

`files`는 누락·빈 배열·sparse 배열·비문자열·빈 문자열·앞뒤 공백을 거부하고 유효한 배열은 복사한다. `src/[` 같은 glob 문법 오류는 Oxlint 로더가 판단한다. 각 호출의 규칙 데이터와 중첩 옵션도 복사하여 한 결과의 수정이 다음 결과에 전파되지 않게 한다. 소비자는 `src/`, `app/`, `components/`, workspace 및 실제 Vitest 경로를 명시한다. Nest의 `*.e2e-spec.ts`나 접미사 없는 테스트도 runner 대상에 맞춰 추가한다.

소비자의 root `rules`는 확장 설정의 root 규칙보다 우선하지만, matching override의 scoped 규칙보다 우선하지 않는다. scoped preset을 바꾸려면 뒤쪽 root `overrides`에서 파일 경로와 규칙을 지정한다. 소비자 override는 preset override 뒤에 적용되고 같은 파일에 일치하는 항목 중 뒤쪽이 우선한다. plugin rule을 바꿀 때 해당 override에 `plugins`도 명시한다.

`extends` 배열은 기본 세트 뒤에 소비자가 지정한 순서로 추가한다. `ignorePatterns`는 소비자가 제공하는 root 목록이며 factory의 기본 ignore는 없다. `settings`와 다른 native 필드의 의미는 Oxlint가 결정한다. root settings와 실제 진단을 함께 검사하며, `--print-config` 출력만으로 파일별 최종 적용을 단정하지 않는다.

## 강제 수준

Oxlint 1.87.0에서 모든 영역을 켜면 **error 151개 / warn 41개**이고 17개를 `off`로 조정한다. type-aware correctness 15개는 소비자가 `options.typeAware`를 켤 때만 실행된다. 언어·렌더링·프레임워크·테스트의 명확한 오류와 native 접근성 계약 위반은 차단한다. 문맥 의존 검사, 작성 방식·성능 권고는 경고로 보고한다. warning도 실제 버그를 찾을 수 있으므로 무시하라는 뜻은 아니다. 영역별 일괄 강제 수준 대신 [규칙 결정](rule-ledger.md)에 조정마다 이유를 기록한다.

예외는 `nextjs/no-unwanted-polyfillio`다. 하나의 규칙 ID가 unsafe URL과 안전한 CDN의 중복 polyfill을 함께 보고한다. 공통값에서는 unsafe URL 차단을 우선하여 성능 문제인 중복 polyfill도 error로 처리한다. 두 진단에 서로 다른 severity를 줄 수 없으므로, 소비자가 이 규칙을 warn으로 재정의하면 unsafe URL 진단도 비차단이 된다. 이 선택과 URL 탐지 한계는 [규칙 결정](rule-ledger.md)에 기록한다.

차이는 TS 소스가 정본이다. [실효 규칙 표](../test/fixtures/effective-rules.json)는 규칙마다 값과 출처(`preset`·`adjusted`), type-aware 여부를 담는 테스트 계약이다. 계약 테스트와 설치 소비자 검사는 실제 계산이 표와 같아야 통과한다. 이 계산은 Oxlint의 category 해석을 다시 구현한 것이므로, 저장된 입력이 있는 규칙은 설치 소비자에서 실제 진단으로 대조한다. Oxlint를 올릴 때는 `pnpm run rules:update`가 출력하는 추가·제거·변경을 검토하고 표를 함께 커밋한다. 과거 후보 설정은 `docs/evidence/`에 따로 보존한다. 규칙 수는 Oxlint 버전에 따른 현재 값이며 영구 API 숫자가 아니다.

기본 `lint`와 `verify`는 경고만으로 실패하지 않는다. `--deny-warnings`는 진단 severity를 바꾸지 않고 경고가 남으면 종료 코드를 비정상으로 만드는 별도의 zero-warning CI 정책이다([Oxlint CLI](https://oxc.rs/docs/guide/usage/linter/cli#handle-warnings)). 이 패키지에서는 기본 명령에 붙이지 않는다. 소비자는 필요한 규칙만 `error`로 override하거나 모든 경고 해결을 요구할 때 명시적으로 선택한다. `off`는 규칙 진단을 끈다. 정상 코드를 막거나 실제 위반을 놓친 것으로 관찰된 상속 규칙은 `off`로 조정한다.

조정을 추가·변경하거나 Oxlint 업그레이드로 상속 규칙이 바뀔 때는 목표 위반, 정상 제품 패턴, 파일 범위와 override를 확인한다. severity 변경은 fixer 동작을 바꾸지 않으며 이번에 자동 fix를 실행하지 않았다. 정상 코드를 반복해서 차단하거나 실제 경로를 놓치면 옵션·범위를 조정하거나 `off`로 둔다.

## 의존성과 책임

Oxlint 1.87.0, Oxfmt 0.72.0, TypeScript 6.0.3을 개발 의존성으로 고정하고 `pnpm-lock.yaml`을 보관한다. `packageManager`는 pnpm 12.6.0, `.node-version`은 확인한 Node 24 LTS의 24.21.0을 고정한다. Oxlint와 Oxfmt는 검사한 정확한 버전의 optional peer다. 사용하는 subpath에 맞는 도구를 소비자가 설치한다. 이 패키지의 런타임 의존성은 없다.

| 책임                                              | 소유 위치                       |
| ------------------------------------------------- | ------------------------------- |
| 공통 규칙·기본 severity·formatter 옵션            | 이 패키지의 TS 소스             |
| 실제 폴더·alias·프레임워크 settings·예외          | 소비자 config                   |
| 타입 오류·테스트 동작·Next/Nest 빌드·Workers 배포 | 소비자 도구와 CI                |
| 폴더 생성·파일 배치·예약 export                   | 템플릿 또는 프로젝트 자체 검사  |
| typed lint 활성화와 TS/tsgolint 호환              | 향후 별도 설계; 현재 API에 없음 |

프레임워크별 preset, TS 버전 감지, plugin prefix 변경, React Compiler 강제, custom JS plugin, import declaration 정렬은 추가하지 않았다. Oxfmt는 `sortImports:false`로 두며 [실행 순서 반례](evidence/oxfmt-import-order.md)를 보존한다.

## 문서와 검증

README는 사용법과 개발 명령, 이 문서는 구조와 책임, `rule-ledger.md`는 규칙 결정, `verification.md`는 현재 재현 명령과 관찰 범위를 맡는다. 중복 계획·체크리스트·조사 요약은 여기에 통합했다. 고유한 실험 입력·출력은 `docs/evidence/`, 자동 테스트의 기대 계약은 `test/fixtures/`에 둔다. 소비자 검사는 중복 복사 없이 `docs/evidence/`의 기존 규칙 입력도 재사용한다.

원본 문서·소스는 정리 전에 로컬 `.engineering/archives/before-typescript-layout.tar.gz`에 보존했다. 이 복구용 파일은 배포물이나 유지할 설계 문서가 아니다. 현재 저장소에 첫 커밋이 없으므로 이번 정리로 원본을 복구할 수 없게 만들지 않도록 남겼다.

검사는 소스 타입 검사 → 빌드 산출물의 public contract → 저장소 lint/format → tarball 설치 소비자로 이어진다. 과거 스타터의 평탄화 JSON 실험과 현재 패키지 검증의 범위는 [검증 기록](verification.md)에서 구분한다.
