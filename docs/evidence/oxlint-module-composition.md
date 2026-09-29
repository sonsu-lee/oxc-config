# Oxlint 규칙 영역별 `extends` 합성 소형 실험

2026-09-27, macOS arm64, Node 24.18.1, Oxlint **1.85.0**. 당시 설계에서 제안한 독립 규칙 조각이 Oxlint의 기본 합성 기능으로 같이 동작하는지 확인했다. 프로젝트 패키지 구현이나 당시 75개(현재 [74개](../../test/fixtures/selected-rules.json)) 규칙 전체 통합 검사는 아니다.

## 임시 실행 환경

작업 경로는 `/private/tmp/oxc-config-architecture.IWXteQ/`였다. 사용자 저장소에 의존성을 설치하지 않았다. `npm install --offline oxlint@1.85.0`은 npm의 registry metadata cache 부재로 `ENOTCACHED`였고, URL tarball 방식은 사용자 npm cache 쓰기 권한 오류 `EPERM`이었다. 이미 저장된 공식 npm tarball `oxlint-1.85.0.tgz`와 `@oxlint/binding-darwin-arm64` 1.85.0을 npm의 `cacache.get`으로 **읽기만 하여** 해당 임시 경로에 추출했다. `node node_modules/oxlint/bin/oxlint --version`은 `1.85.0`을 출력했다. 일반 환경에서 재현할 때는 같은 버전을 임시 소비자에 설치하면 된다.

## 입력

두 설정 조각과 소비자 설정의 핵심은 다음과 같다. 첫 조각은 `categories.correctness:'off'`, `plugins:['import']`, `import/no-duplicates:error`; 둘째는 `categories.correctness:'off'`, `plugins:['typescript']`, `typescript/no-require-imports:error`다. 둘째 조각에 category 설정을 빠뜨린 초기 대조도 별도로 실행했다.

```ts
// import.config.mts
export default {
  plugins: ['import'],
  categories: { correctness: 'off' },
  rules: { 'import/no-duplicates': 'error' },
}

// typescript.config.mts
export default {
  plugins: ['typescript'],
  categories: { correctness: 'off' },
  rules: { 'typescript/no-require-imports': 'error' },
}

// oxlint.config.mts
import { defineConfig } from 'oxlint'
import imports from './import.config.mts'
import typescript from './typescript.config.mts'

export default defineConfig({ extends: [imports, typescript] })
```

두 번째 조합은 각 조각의 `plugins`·`rules`를 각각 `overrides:[{files:['**/*.ts'], ...}]` 안으로 옮기고 소비자 `oxlint.overrides.config.mts`에서 같은 순서로 `extends`했다. 실행한 override 조각은 다음과 같다.

```ts
// import-override.config.mts
export default {
  categories: { correctness: 'off' },
  overrides: [{
    files: ['**/*.ts'],
    plugins: ['import'],
    rules: { 'import/no-duplicates': 'error' },
  }],
}

// typescript-override.config.mts
export default {
  overrides: [{
    files: ['**/*.ts'],
    plugins: ['typescript'],
    rules: { 'typescript/no-require-imports': 'error' },
  }],
}

// oxlint.overrides.config.mts
import { defineConfig } from 'oxlint'
import imports from './import-override.config.mts'
import typescript from './typescript-override.config.mts'

export default defineConfig({ extends: [imports, typescript] })
```

나머지 입력은 다음과 같다. `excluded.js`의 소스는 `probe.ts`와 같고 확장자만 다르다. 전체 파일은 실험 후 임시 경로와 함께 삭제했다.

```ts
// probe.ts / excluded.js
import { foo } from './module'
import { bar } from './module'

const loaded = require('./module')
void [foo, bar, loaded]

// clean.ts
import { foo } from './module'

void foo
```

| 명령 (`<temp>`에서 실행) | exit | JSON 관찰 |
| --- | ---: | --- |
| `node node_modules/oxlint/bin/oxlint -c oxlint.config.mts -f json probe.ts` | 1 | `import(no-duplicates)` 1, `typescript(no-require-imports)` 1; 2 rules |
| 같은 설정으로 `clean.ts` | 0 | 진단 0; 2 rules |
| `node node_modules/oxlint/bin/oxlint -c import.config.mts -f json probe.ts` | 1 | `import(no-duplicates)` 1; 1 rule |
| `node node_modules/oxlint/bin/oxlint -c typescript.config.mts -f json probe.ts` | 1 | `typescript(no-require-imports)` 1; 1 rule |
| 같은 TS 조각으로 `clean.ts` | 0 | 진단 0; 1 rule |
| `node node_modules/oxlint/bin/oxlint -c oxlint.overrides.config.mts -f json probe.ts` | 1 | 동일한 두 ID 각 1; 2 rules |
| 같은 override 설정으로 `clean.ts` | 0 | 진단 0 |
| 같은 override 설정으로 `excluded.js` | 0 | 진단 0 |

`categories.correctness`를 **둘째 TS 조각에서 생략한 초기 실행**은 같은 목표 진단 1개를 내면서 `number_of_rules:70`이었다. `categories.correctness:'off'`를 명시한 뒤에는 단독 실행이 `number_of_rules:1`, 전체 `extends`는 `number_of_rules:2`였다. 이것이 각 조각의 독립 소비에서 암묵 규칙을 막아야 하는 근거다.

`node node_modules/oxlint/bin/oxlint -c oxlint.config.mts --print-config`는 root 합성에서 `import`·`typescript` 플러그인과 두 명시 규칙을 출력했다. `-c oxlint.overrides.config.mts --print-config`는 두 `files:['**/*.ts']` 블록을 **분리해서** 출력했다. 이는 특정 파일에 대한 최종 합성 결과를 출력한 것이 아니므로 실제 진단을 별도로 확인했다. 이 소형 실험에서는 두 조각의 plugin 선언이 서로의 규칙을 비활성화하지 않았다.

## 적용 한계

- React·JSX 접근성·Next·Vitest까지 포함한 전체 7영역의 `extends` 합성, 같은 ID의 뒤쪽 override 우선순위, custom component `settings`, 빈 `files` 처리, 실제 패키지 `npm pack` 소비는 **not_run**이다.
- `categories.correctness:'off'`의 단독 소비 효과는 위 두 조각에서만 확인했다. React·JSX 접근성·Next·Vitest 조각의 category·plugin 상속은 별도 검증한다.
- Oxlint 1.85.0의 관찰이며 향후 버전에서 동일한 합성 결과를 보장하지 않는다. 출시 전 설치한 버전으로 동일한 정상·위반·범위 밖 fixture를 다시 실행한다.

실험 후 경로를 확인한 `/private/tmp/oxc-config-architecture.IWXteQ/`만 삭제했고 `test ! -e`는 exit 0이었다. 사용자 저장소와 npm cache의 파일은 삭제하지 않았다.
