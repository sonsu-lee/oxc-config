# 규칙 결정

상속 규칙은 설치된 Oxlint의 `correctness` category이고, 차이(옵션·`warn`·`off`·category 밖 규칙)는 [영역별 TS 소스](../src/oxlint/configs/)가 정본이다. [실효 규칙 표](../test/fixtures/effective-rules.json)는 둘을 합친 규칙별 값과 출처를 고정한다. fixture와 소비자 검사가 통과해도 모든 정상 제품 패턴의 무오탐이나 출시 적합성이 증명되지는 않는다.

## 개별 검증한 규칙과 강제 수준

아래 74개는 0.1.x에서 직접 나열해 개별 검증한 규칙이다. 2026-09-29 재검토 값(**42 error / 32 warn**)을 preset 전환 뒤에도 그대로 유지한다. 상속 값(`error`)과 같은 규칙은 소스에서 빠졌고, `warn`·옵션·category 밖 규칙만 조정으로 남았다. `error`는 공통으로 차단할 근거가 있는 계약 위반, `warn`은 진단을 보고 소비자가 문맥에 따라 판단할 항목이다. warning의 중요도가 항상 낮다는 뜻은 아니다. 기본 lint에서는 `--deny-warnings`를 제거하여 이 차이가 종료 코드에도 반영되게 했다.

다음 표의 규칙명에는 해당 영역의 접두사가 붙는다(JavaScript와 `sort-imports` 제외).

| 영역       | 수준  | 규칙                                                                                                                                                     | 판단 근거                                                                                                                                      |
| ---------- | ----- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| JavaScript | error | `no-debugger`, `no-eval`                                                                                                                                 | 배포 코드의 debugger와 동적 코드 실행은 공통 금지 정책을 유지한다.                                                                             |
| JavaScript | error | `no-unreachable`, `no-const-assign`, `no-duplicate-case`, `no-async-promise-executor`                                                                    | 실행 불가능 코드·재할당 오류·도달하지 않는 case·Promise 오류 전달 누락.                                                                        |
| JavaScript | error | `eqeqeq: smart`                                                                                                                                          | 의도치 않은 coercion을 차단하고 `x == null` 등 smart 예외는 허용한다.                                                                          |
| imports    | warn  | `import/no-duplicates`, `sort-imports`                                                                                                                   | 중복 선언·named specifier 정렬은 정리 정책이다. 선언 평가 순서는 바꾸지 않는다.                                                                |
| TypeScript | warn  | `no-require-imports`                                                                                                                                     | ESM 작성 권고. `.ts/.tsx/.mts` 대상, `.cts` 제외; typed lint가 아니다.                                                                         |
| React      | error | `rules-of-hooks`, `set-state-in-render`                                                                                                                  | Hook 순서와 무조건적 state 갱신에 따른 렌더 반복을 차단한다.                                                                                   |
| React      | error | `globals`, `immutability`, `purity`                                                                                                                      | 렌더의 외부 상태 변경·props/state 직접 변경·비결정적 호출은 React 렌더 계약 위반으로 채택한다. Compiler 최적화 활성 여부와 별개다.             |
| React      | error | `jsx-key`, `jsx-no-duplicate-props`, `jsx-no-undef`, `no-danger-with-children`, `no-this-in-sfc`, `void-dom-elements-no-children`                        | 잘못된 JSX 식별·props 충돌·reconciliation key·DOM 자식 계약을 차단한다.                                                                        |
| React      | warn  | `exhaustive-deps`, `error-boundaries`, `refs`                                                                                                            | stale closure·잘못된 오류 처리·ref 접근 위험을 알리되 custom hook/Compiler 추론과 코드 문맥을 검토한다.                                        |
| React      | warn  | `static-components`, `use-memo`, `void-use-memo`                                                                                                         | 컴포넌트 identity·memo 작성 진단은 의미가 있지만 의도한 remount, Promise 반환·결과 사용 맥락이 필요하다.                                       |
| React      | warn  | `no-children-prop`, `jsx-props-no-spread-multi`                                                                                                          | JSX 표현 방식과 props 우선순위 복원 의도까지 일괄 차단하지 않는다.                                                                             |
| JSX 접근성 | error | `aria-props`, `aria-proptypes`, `aria-role`, `aria-unsupported-elements`, `role-has-required-aria-props`, `role-supports-aria-props`                     | 잘못된 ARIA 이름·값·role·속성 조합 및 필수 속성 누락.                                                                                          |
| JSX 접근성 | error | `alt-text`, `anchor-has-content`, `heading-has-content`, `html-has-lang`, `iframe-has-title`, `lang`                                                     | native 요소의 접근 가능한 이름·언어 계약. 장식 이미지의 빈 alt는 허용한다.                                                                     |
| JSX 접근성 | error | `aria-activedescendant-has-tabindex`, `no-aria-hidden-on-focusable`, `no-interactive-element-to-noninteractive-role`, `scope`, `no-distracting-elements` | 포커스와 숨김/role의 직접 충돌, 표 scope 오용, blink/marquee를 차단한다. activedescendant의 `tabIndex={-1}`는 허용한다.                        |
| JSX 접근성 | warn  | `anchor-is-valid`, `control-has-associated-label`, `label-has-associated-control`                                                                        | router, custom component 매핑과 label 탐색 깊이가 필요하다.                                                                                    |
| JSX 접근성 | warn  | `click-events-have-key-events`, `mouse-events-have-key-events`, `no-noninteractive-element-interactions`, `no-static-element-interactions`               | 이벤트 위임·보조 포인터 동작과 실제 조작 대상의 구별이 필요하다.                                                                               |
| JSX 접근성 | warn  | `interactive-supports-focus`, `no-noninteractive-tabindex`, `tabindex-no-positive`, `no-autofocus`, `no-access-key`                                      | composite widget, dialog 및 관리된 포커스·단축키 정책을 소비자가 확인한다.                                                                     |
| JSX 접근성 | warn  | `media-has-caption`, `img-redundant-alt`, `no-redundant-roles`                                                                                           | 미디어 내용·대체 제공과 텍스트/중복 의미 판단이 필요하다.                                                                                      |
| Next       | error | `inline-script-id`, `no-assign-module-variable`, `no-async-client-component`                                                                             | Script 추적 ID, 예약 module 변수와 Client Component 실행 계약.                                                                                 |
| Next       | error | `no-unwanted-polyfillio`                                                                                                                                 | 알려진 unsafe polyfill URL을 차단한다. 같은 ID가 안전한 CDN의 중복 polyfill도 검사하므로 그 진단 역시 error다. 탐지 범위는 아래 한계를 따른다. |
| Next       | warn  | `no-html-link-for-pages`, `no-sync-scripts`                                                                                                              | 클라이언트 전환·스크립트 로딩 성능 정책.                                                                                                       |
| Vitest     | error | `no-focused-tests`, `valid-expect`, `require-awaited-expect-poll`                                                                                        | 빠진 테스트 실행·잘못된 assertion·await 없는 비동기 검증을 차단한다.                                                                           |
| Vitest     | warn  | `no-identical-title`, `valid-title`                                                                                                                      | 제목 식별·표현 정책. `valid-title`의 공백/접두어 검사까지 공통 차단하지 않는다.                                                                |
| Vitest     | warn  | `no-standalone-expect`, `valid-describe-callback`                                                                                                        | 정상 hook assertion과 간결한 describe callback까지 진단하는 범위가 있으므로 기본 옵션에서는 문맥 검토가 필요하다.                              |

React의 [공식 lint 설명](https://react.dev/reference/eslint-plugin-react-hooks)은 Compiler 진단의 점진적 적용을 허용한다. 모든 Compiler 규칙을 error로 올리지는 않았다. 다만 채택한 렌더 mutation/purity 규칙은 실제 렌더 계약으로 판단했다. [`refs`](https://react.dev/reference/eslint-plugin-react-hooks/lints/refs)는 이름과 `.current` 접근에 따른 추론의 오탐 가능성이 명시되어 있어 warn을 유지한다. 기존 정상 패턴 관찰과 이번 개별 fixture 통과는 모든 앱의 무오탐 보장이 아니다.

접근성의 [label 검사](https://oxc.rs/docs/guide/usage/linter/rules/jsx_a11y/label-has-associated-control)와 [focus 검사](https://oxc.rs/docs/guide/usage/linter/rules/jsx_a11y/interactive-supports-focus)는 탐색 깊이와 component/role 설정에 영향을 받는다. 실제 브라우저·스크린리더 검증을 대체하지 않는다.

Oxlint 1.85.0의 [polyfill 구현](https://github.com/oxc-project/oxc/blob/oxlint_v1.85.0/crates/oxc_linter/src/rules/nextjs/no_unwanted_polyfillio.rs)은 좁은 URL prefix를 검사한다. 현재 실행에서 `https://polyfill.io/v3/polyfill.min.js`는 검출했지만 `https://cdn.polyfill.io/v3/polyfill.min.js`는 놓쳤다. URL alias·동적 문자열·모든 unsafe 도메인을 포괄하는 보안 검사는 아니다. 안전한 Cloudflare URL도 Next가 제공하는 `Array.prototype.includes`를 요청하면 error이고, `IntersectionObserver` 사례는 통과했다.

React `jsx-key`는 `checkFragmentShorthand`, `checkKeyMustBeforeSpread`, `warnOnDuplicates`를 모두 명시한다. Oxlint 1.85.0의 기본 문자열 설정은 이 세 위반을 놓쳤다. `additionalHooks`와 광역 custom component mapping은 공통값으로 추정하지 않는다.

JavaScript/import 선택의 9개 위반·정상·fix 관찰은 [base probes](evidence/base-rule-probes.json), 원본 104개 규칙의 소스·설정은 [rule fixtures](evidence/rule-fixtures.json)에 있다. 원본 선언 목록과 옵션은 [templates inventory](evidence/templates-inventory.json)로 조회한다.

## preset 상속 전환과 템플릿 대조

2026-10-09에 직접 나열 방식을 Oxlint `correctness` category 상속으로 바꿨다. 기준은 `sonsu-lee/templates`의 5개 `.oxlintrc.json`이다. 현재 템플릿 파일은 [templates inventory](evidence/templates-inventory.json)의 기록과 같다. 템플릿은 `plugins: [typescript, oxc, unicorn, import, node]`, `categories.correctness: error`를 두고 그 위에 규칙을 추가한다. 이 패키지도 같은 구조를 따르며, 업그레이드 때 상속 변화는 [실효 규칙 표](../test/fixtures/effective-rules.json)의 diff로 검토한다. 0.1.x의 "146개 ID는 개별 검증 없이 승계하지 않는다"는 결정을 이 방식으로 대체했다. `node` plugin은 correctness 규칙이 없어 선언하지 않는다.

Oxlint 1.85.0 기준 결과는 다음과 같다(템플릿 관찰은 [effective configs](evidence/effective-configs.json)의 Oxlint 1.82.0).

- 기본 세트가 상속하는 type-aware가 아닌 correctness 92개는 모두 템플릿에서 이미 `error`로 켜져 있던 규칙이다(`no-unused-vars`, `no-dupe-keys`, `valid-typeof`, `oxc/*`, `unicorn/*`, `import/default`·`import/namespace` 등).
- React는 템플릿이 `error`로 쓰던 legacy API 7개(`no-direct-mutation-state`, `no-find-dom-node`, `no-is-mounted`, `no-render-return-value`, `no-string-refs`, `no-unsafe`, `no-will-update-set-state`)를 상속한다. React 19 코드에 해당 API가 없으면 진단하지 않는다.
- Next는 템플릿이 쓰던 13개 중 12개를 상속하고 `no-img-element`는 `off`로 둔다. 값은 템플릿을 따른다. font·GA·CSS·custom font·`_document` styled-jsx·title·`no-typos` 8개는 `warn`, `_document`/head 계열 4개는 `error`다.
- Vitest는 템플릿에 없던 8개를 상속한다. `warn-todo`는 의도된 `it.todo`를 `error`로 보고해 `warn`으로, `require-mock-type-parameters`는 타입 인자 없는 `vi.fn()`(JS 테스트 포함)을 `error`로 보고해 `off`로 조정했다. 나머지 6개(`hoisted-apis-on-top`, `no-conditional-tests`, `prefer-snapshot-hint`, `require-local-test-context-for-concurrent-snapshots`, `require-to-throw-message`, `valid-expect-in-promise`)는 [followup probes](evidence/followup-probes.json)의 정상 패턴 13개와 `vi.mock`·`describe.each`·`skipIf`·`resolves`·`toThrow('x')`·inline snapshot·`it.concurrent` 정상 사용에서 진단이 없어 상속 `error`로 둔다.
- type-aware correctness 15개(`await-thenable`, `no-floating-promises` 등)는 상속되지만 소비자가 `options.typeAware`를 켤 때만 실행된다.
- 템플릿과 값이 다른 29개는 위 표의 0.1.x 재검토 값을 유지한다. 템플릿은 React·접근성 규칙과 `sort-imports`·`typescript/no-require-imports`를 모두 `error`로 두었고, Next `no-async-client-component`·`no-unwanted-polyfillio`는 `warn`이었다.
- 템플릿에서 켜져 있지만 여기서 켜지 않는 23개는 아래 표의 제외 규칙, 경로 정책(`no-restricted-imports`, `import/no-nodejs-modules`, `node/no-sync`, `unicorn/no-process-exit`), typed 규칙이다.

## off 조정과 켜지 않는 정책

상속 규칙 중 아래 근거가 있는 것은 영역 모듈에서 `off`로 조정한다. category 밖 규칙은 켜지 않는다.

| 규칙·정책                                                                                 | 결정 근거                                                                                                                                   |
| ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| React `set-state-in-effect` (`off`)                                                       | Commerce의 경로 변경 메뉴 닫기·cart modal 열기까지 차단했다. 공통 error에서 제외하고 프로젝트 성능 정책에서 선택한다.                       |
| React `incompatible-library`, `unsupported-syntax`, `preserve-manual-memoization` (`off`) | Compiler 맥락이 필요하다. 정상 TanStack Table을 막거나 공식 invalid 예제도 놓친 사례가 있다.                                                |
| React `forward-ref-uses-ref` (`off`)                                                      | 받은 ref의 실제 전달 누락을 보장하지 않는다. React 19 신규 코드의 공통 범위에 넣지 않는다.                                                  |
| React `no-did-mount-set-state`, `no-did-update-set-state` (`off`)                         | 정상 DOM 측정과 조건부 state reset도 차단한다.                                                                                              |
| Next `no-before-interactive-script-outside-document` (`off`)                              | App page와 중첩 layout의 오배치를 놓친다. Next build도 해당 반례를 놓쳤다. 임시 별도 검사도 간접 사용을 놓쳐 공통 패키지에 포함하지 않았다. |
| Next `no-head-element` (`off`)                                                            | Pages용 fixture를 App Router 보장으로 옮기지 않는다.                                                                                        |
| Next `no-img-element` (`off`)                                                             | 정상 SVG도 차단한다.                                                                                                                        |
| `jsx-a11y/autocomplete-valid` (`off`)                                                     | 정상 `username webauthn` 오탐.                                                                                                              |
| `jsx-a11y/no-noninteractive-element-to-interactive-role`, `prefer-tag-over-role` (`off`)  | 정상 ARIA widget 패턴과 충돌한다.                                                                                                           |
| typed TypeScript 규칙                                                                     | tsgolint와 TS 호환을 별도 확인해야 한다. `options.typeAware`를 켜지 않는다.                                                                 |
| `typescript/consistent-type-imports` 일괄 fix                                             | Nest decorator metadata와 DI 런타임 영향을 확인해야 하므로 켜지 않는다.                                                                     |
| `node/no-sync`, `unicorn/no-process-exit`                                                 | 정상 시작 단계·CLI 종료까지 막는다. 필요한 요청 경로나 앱 정책에서 선택한다.                                                                |
| 전역 `node:*` 금지                                                                        | Workers `nodejs_compat`의 정상 사용을 막을 수 있다. 환경별 API 계약이 필요하다.                                                             |
| `no-restricted-imports`, filename·folder 규칙                                             | alias·실제 경로를 소비자가 안다. filename 규칙은 폴더 존재나 구조를 보장하지 않는다.                                                        |

직접 관찰은 [OSS probes](evidence/oss-logic-probes.json), [경계 probes](evidence/restricted-import-probes.json), [후속 실행](evidence/followup-2026-09-28.md)에 보존했다. Commerce는 실제 `app/`, `components/`, `lib/`에 적용하면 5진단, 잘못된 `src/**` 대조는 0진단이었다. 따라서 builder가 프레임워크 경로를 고정하지 않는다. 이 OSS들의 앱 자체 test/build는 실행하지 않았다.

## Vitest 결정

Vitest 조각에서 개별 검증한 7개 중 `no-focused-tests`, `valid-expect`, `require-awaited-expect-poll`은 상속 `error`이고, 나머지 4개는 `warn` 조정이다. 정상 `it.each`, `skipIf`, `expect.poll` 4개 실행은 Vitest 5.0.2에서 통과했고 같은 파일의 채택 규칙 진단은 0이었다. `.only`는 runner가 1 passed·1 skipped로 성공 종료해도 lint는 error로 검출했다. 상세 입력·결과는 [followup probes](evidence/followup-probes.json)에 있다.

| 후보                           | 결정                                                                                                 |
| ------------------------------ | ---------------------------------------------------------------------------------------------------- |
| `consistent-test-it`           | 켜지 않음(category 밖). fix가 호출을 `it()`으로 바꾸고 `import {test}`를 남겨 `ReferenceError` 발생. |
| `prefer-lowercase-title`       | 켜지 않음(category 밖). 정상 약어·제품 용어도 수정.                                                  |
| `no-disabled-tests`            | `off`. 의도한 skip을 공통 차단할 근거 부족.                                                          |
| `prefer-hooks-in-order`        | 켜지 않음(category 밖). 런타임 hook 순서가 아닌 선언 정렬 정책.                                      |
| `expect-expect`                | `off`. 정상 assertion helper를 오탐; 프로젝트 설정 필요.                                             |
| `no-conditional-expect`        | `off`. 플랫폼별 정상 assertion 분기도 차단.                                                          |
| `no-import-node-test`          | 켜지 않음(category 밖). Vitest 전용 경로가 확정된 프로젝트에서만 선택.                               |
| `warn-todo`                    | `warn`. 의도된 `it.todo`를 차단하지 않고 표시만 한다.                                                |
| `require-mock-type-parameters` | `off`. 타입 인자 없는 `vi.fn()`을 차단하며 JS 테스트는 이를 지킬 수 없다.                            |

이 패키지 자체 검사는 Node 내장 test runner를 사용한다. Vitest 조각이 Jest·Playwright·Node test까지 지원한다는 뜻은 아니다.

## Antfu에서 참고한 점

[Antfu 고정 소스](https://github.com/antfu/eslint-config/tree/df4d896ed9b493ca0562fdf2c8c0fcd92fd16f6e)에서 TS 기반 모듈화, 명시적인 예외, 마지막 사용자 override를 참고했다. Antfu도 TypeScript·React·Next 등은 plugin 추천 preset을 펼친 뒤 덮어쓴다. 이 패키지는 그 대신 Oxlint category를 상속한다. 설치 상태에 따른 자동 감지, plugin prefix 변경, editor별 severity는 가져오지 않았다.

게시 Antfu 9.5.1 소비자에서는 TS6.0.3과 ESLint10.11.0 조합의 lint를 실행했다. TS만 7.0.2로 바꾼 설치에서는 `ts-api-utils`에서 설정 import가 실패했다. 이 특정 설치 관찰을 모든 Antfu 버전의 지원 선언으로 확대하지 않는다. [실행 원본](evidence/antfu-consumer-probes.json).

## Oxfmt 결정

`singleQuote:true`, `singleAttributePerLine:true`, `sortPackageJson:{sortScripts:true}`를 유지한다. `sortImports:false`는 import 선언 이동으로 ESM 평가 순서가 바뀐 [반례](evidence/oxfmt-import-order.md)에 따른다. `sortSideEffects:false`만으로는 일반 import가 side-effect import 사이를 넘어 이동하는 것을 막지 못했다.

Antfu의 조건부 `exports` 키 정렬은 Node가 고르는 실제 import 대상을 바꿨다. 해당 정책은 가져오지 않는다. Oxfmt 0.70.0의 위 옵션은 검사한 두 manifest에서 scripts만 정렬하고 조건 순서와 Node import/require 선택을 유지했다([원본](evidence/antfu-consumer-probes.json)). 현재 패키지 manifest와 subpath는 별도 tarball 소비자 검사로 확인한다.

## 변경 시 기준

조정을 추가·변경할 때와 Oxlint 업그레이드로 상속 규칙이 바뀔 때마다 위반과 정상 반례, 실제 파일 범위, 소비자 override를 확인한다. 업그레이드는 `pnpm run rules:update`의 변경 목록을 이 문서에 기록한다. fixer를 도입하거나 변경할 때는 fix 후 타입·test/build 영향도 확인한다. 현재 재현 명령과 남은 범위는 [검증 기록](verification.md)에 있다.

## Oxlint 업그레이드 기록

- 2026-10-10, 1.85.0 → 1.87.0: `pnpm run rules:update`의 실효 규칙 변경은 0건이다. 전체 규칙 목록에서는 `typescript/no-generated-empty-object-type`(suspicious, type-aware)이 추가됐고 `node/no-exports-assign`이 style에서 suspicious로 재분류됐다. 앞의 규칙은 correctness 밖이라 상속되지 않고, node 플러그인은 켜지 않았으므로 둘 다 이 패키지의 결과에 영향이 없다.
