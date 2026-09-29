# 패키지 검증

이 문서는 현재 TS 소스·빌드 산출물·tarball 소비자를 확인하는 명령과 관찰 범위를 기록한다. 2026-09-29 환경은 macOS arm64, Node 24.21.0 LTS, pnpm 12.6.0, TypeScript 6.0.3, Oxlint 1.85.0, Oxfmt 0.70.0이다. 버전은 개발 의존성과 lockfile에 고정하며 소비자 verifier도 manifest의 값을 읽는다.

## 재현

```sh
pnpm install --frozen-lockfile
pnpm run verify
```

`verify`는 아래 순서로 실행하며 하나라도 실패하면 종료한다. pack과 소비자 설치는 pnpm으로 실행하며 설치에는 npm registry 접근이 필요하다. `.node-version`과 `packageManager`에 실행 버전을 고정하고 `pnpm-lock.yaml`로 설치를 재현한다.

| 단계                       | 확인하는 계약                                                                  |
| -------------------------- | ------------------------------------------------------------------------------ |
| `pnpm test`                | `dist/` 정리 후 strict TS 빌드·선언 emit, 생성 JS의 public contract 6개 테스트 |
| `pnpm run lint`            | 저장소 소스·스크립트·config에 JavaScript/import/TypeScript 조각 적용           |
| `pnpm run format:check`    | 유지하는 소스·설정·문서의 포맷; 연구 원본·회귀 fixture 제외                    |
| `pnpm run verify:consumer` | prepack 빌드, tarball 파일 목록, 실제 설치된 package imports·타입·lint·format  |

소비자 verifier는 시스템 임시 폴더에 별도 package와 pnpm store를 만든다. 완료 또는 실패 후 자기 임시 폴더를 제거한다. 보존하려면 `pnpm run verify:consumer -- --keep`을 사용한다.

## 이번 변경에서 확인하는 범위

- 배포 경로를 `dist`로 바꾼 기존 검사부터 실행해, 이전 패키지가 `tarball is missing dist/oxlint/index.js`로 실패함을 확인했다.
- 빌드는 TS 소스에서 JS와 `.d.ts`를 함께 생성한다. 기존 수동 선언 파일은 제거했다. 상대 `.ts` import를 배포 `.js`로 변환하므로 저장소의 TS config도 소스를 직접 읽을 수 있다.
- 계약 테스트 6개는 7개 runtime export, 현재 74개 ID·옵션의 누락/중복, 규칙별 error/warn 계약과 기본 lint의 경고 허용, correctness off, files 검증·복사, 호출별 규칙·중첩 옵션의 변경 격리, Oxfmt 옵션을 생성 JS에서 검사한다.
- tarball에는 package.json·README·dist만 허용하고 두 subpath의 JS·타입 선언 존재를 검사한다. 소비자 `tsc`는 `skipLibCheck` 없이 생성 선언을 확인한다.
- Oxlint 7개 영역을 각각 정상·위반 파일에 적용한다. error/warn, 범위 밖 파일, `.cts` 제외, 전체 조합, 뒤쪽 override, root React settings, 잘못된 glob의 로더 오류를 검사한다.
- 74개 전부의 정상·위반 소스를 설치된 tarball의 개별 규칙 값으로 실행하여 severity와 종료 코드를 확인한다. 입력은 과거 base/rule/followup evidence를 재사용한다. 과거 `valid-describe-callback`의 async "invalid" 입력은 실제로 정상 허용되어, 정상 회귀 사례로 보존하고 callback 인자를 받는 잘못된 사례를 위반 입력으로 쓴다.
- warning만 있으면 exit 0, 같은 warning에 `--deny-warnings`를 붙이면 severity는 warning인 채 exit 1, error는 옵션과 무관하게 exit 1, `off` override는 옵션을 붙여도 진단 없이 exit 0임을 설치 소비자로 확인한다. 결합 설정에서도 error와 warn이 각각 유지된다.
- 장식 이미지의 빈 alt·activedescendant의 음수 tabindex, Vitest hook assertion·간결한 describe의 비차단 warning, async describe의 진단 없음, polyfill의 알려진 URL 탐지/누락과 중복 polyfill 차단을 회귀 검사한다. Vitest runner나 브라우저 실행 검사는 아니다.
- Oxfmt의 quote·JSX attribute·scripts 정렬·import 선언 순서·파일별 override·생성물 ignore를 write 후 check로 확인한다.

2026-09-29 구조·pnpm 전환 실행 결과: TS 빌드와 계약 테스트 6/6, 저장소 lint·format, tarball 설치 소비자 검사가 모두 통과했다. 검사 명령과 tarball 소비자도 pnpm으로 전환했고 `pnpm install --frozen-lockfile`로 설치했다. 로컬 Markdown 링크의 대상 파일 존재를 확인했다. 독립 리뷰에서 발견한 호출 간 규칙 공유 문제는 재현 후 복사로 수정했고, 회귀 검사에서 기존 구현의 실패와 수정 후 통과를 확인했다. 이 결과의 적용 범위는 위 단계의 입력에 한정된다.

## Severity 재검토 결과

기본 `lint`를 `oxlint .`로 바꾸고 42 error / 32 warn을 적용했다. 변경 전에는 새 계약 검사가 imports의 기존 error에서 실패했고, severity 반영 뒤에는 기존 `--deny-warnings` 기본 명령에서 실패했다. 설치 소비자도 기존 imports의 error/exit 1을 검출해 실패했다. 이를 고친 뒤 설치 소비자 재실행에서 74개 규칙의 정상·위반 입력, CLI 종료 정책과 추가 정상 패턴 검사가 통과했다. 전체 검증은 `pnpm run verify`로 재현한다.

규칙 ID·옵션과 파일 범위는 유지했다. fix는 실행하지 않았다. 일부 원본 fixture는 검출력 실험을 위해 "invalid"로 명명되어 있어 이름과 실제 저장된 진단을 대조했다. `valid-describe-callback` async 입력은 예전에도 진단이 없었으며, 이번에 도구 동작이 바뀐 것으로 해석하지 않는다.

## 과거 실험 자료

이전 JSON 조합으로 진행한 프레임워크 빌드·런타임 실험은 이번 TS 패키지의 배포물 소비와 다르다. 그 결과를 새 tarball의 실제 앱 통합 성공으로 소급하지 않는다.

| 자료                                                                                                                                           | 내용                                                                                  |
| ---------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| [스타터 실행 기록](evidence/starter-verification-2026-09-28.md)                                                                                | Next 일반·static build, Nest TS6 빌드·DI, Hono Node와 Workers의 당시 명령·버전·한계   |
| [후속 실행](evidence/followup-2026-09-28.md)                                                                                                   | 실제 Commerce 경로, Hono Node/Workers, Next Script 누락, React 19개, Nest 테스트 타입 |
| [원본 규칙 fixture](evidence/rule-fixtures.json)                                                                                               | 원본 104개 ID의 정상·위반 소스와 개별 설정                                            |
| [원본 설정 목록](evidence/templates-inventory.json) · [실효 설정](evidence/effective-configs.json)                                             | 템플릿의 선언 위치·옵션과 암묵 활성 규칙                                              |
| [기본 규칙](evidence/base-rule-probes.json) · [합성](evidence/composition-probes.json) · [import 경계](evidence/restricted-import-probes.json) | 개별 위반·정상·옵션·우선순위 실험                                                     |
| [Vitest와 추가 후보](evidence/followup-probes.json) · [OSS](evidence/oss-logic-probes.json)                                                    | runner와 fix 반례, 실제 소스 정적 검사                                                |
| [Antfu 소비자](evidence/antfu-consumer-probes.json) · [Oxfmt 순서 반례](evidence/oxfmt-import-order.md)                                        | 자동 감지·override·조건부 exports 및 import 평가 순서                                 |

과거 77개·75개·backend·Nest 후보 JSON은 `docs/evidence/selected-*-prototype.json`과 `selected-next-config-oss-revised.json`에 남긴다. 현재 ID·옵션 회귀 기준은 [test fixture](../test/fixtures/selected-rules.json)로 옮겼다. 이번 재검토부터 이 test JSON은 기대 severity도 고정한다. 과거 severity 원본은 evidence JSON들에 남는다.

## 남은 범위

- 새 tarball을 실제 Next/Nest/Hono 앱에 넣은 전체 build·test·runtime 통합: `not_run`. 이번 소비자는 package/config API와 대표 진단·formatter 동작을 확인한다.
- 다른 Node·OS·TypeScript·Oxc 버전, editor와 원격 CI: `not_run`.
- registry 이름 소유권·publish·release 작업: `not_run`. 패키지는 `private: true`다.
- 74개 채택 규칙의 개별 정상·위반 입력은 재실행했다. 제외 규칙을 포함한 전체 연구 fixture, 모든 glob·옵션·사용자 정의 component 조합: `not_run`.
- typed lint, React Compiler 전체, 브라우저 접근성·스크린리더, 실제 DB·원격 Workers 배포: 이번 범위 밖이다.

빌드 성공은 설정 패키지의 출력과 타입을 확인한다. 소비 앱의 제품 동작은 해당 앱의 타입·테스트·빌드·런타임 검사로 확인한다.
