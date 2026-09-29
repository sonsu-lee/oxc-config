# `sortImports`의 런타임 순서 반례

2026-09-27, Node 24.18.1에서 Oxfmt **0.67.0**(templates 고정 버전)의 원본 옵션 `sortImports:true`와 Oxfmt **0.70.0**의 `sortImports:{sortSideEffects:false}`를 각각 시험했다. 둘 다 `oxfmt --write main.mjs` exit 0, 포맷 전후 `node main.mjs` exit 0이었다. `main.mjs`의 import 선언은 다음과 같았다.

```js
import './z-polyfill.mjs'
import z from './z.mjs'
import './a-polyfill.mjs'
import a from './a.mjs'
console.log(JSON.stringify(globalThis.events))
void z
void a
```

네 모듈은 각각 `globalThis.events.push('<자기 이름>')`을 top level에서 실행한다. 두 Oxfmt 옵션 모두 다음 순서로 선언을 바꿨다.

```js
import './z-polyfill.mjs'
import a from './a.mjs'
import './a-polyfill.mjs'
import z from './z.mjs'
```

| 실행 | `globalThis.events` |
| --- | --- |
| 포맷 전 | `["z-polyfill","z","a-polyfill","a"]` |
| Oxfmt 0.67.0 `sortImports:true` 후 | `["z-polyfill","a","a-polyfill","z"]` |
| Oxfmt 0.70.0 `sortSideEffects:false` 후 | `["z-polyfill","a","a-polyfill","z"]` |
| Oxfmt 0.67.0 `sortImports:false` 후 | `["z-polyfill","z","a-polyfill","a"]` |

`sortSideEffects:false`는 두 side effect import 사이의 **상대 순서**는 보존했지만 일반 import가 그 사이를 넘어 이동했다. ESM의 평가 순서가 실제로 바뀌므로 `sortImports`는 제품 코드에 대해 의미 보존 포맷 옵션이라고 볼 수 없다. 대조군 `sortImports:false`에서는 선언 순서와 Node 출력이 보존됐다. 첫 공통 Oxfmt 설정에서는 **끄고**, 독립 모듈로 평가 순서 무관성이 입증된 프로젝트에서만 선택적으로 사용한다. `sort-imports` 규칙의 `ignoreDeclarationSort:true`는 선언 순서 이동 없이 named specifier 순서만 검사하므로 별개로 고려할 수 있다.

추가로 `sortPackageJson:{sortScripts:true}`에서 `exports["."]`의 `browser`, `node`, `default` 조건 순서는 이 fixture에서 포맷 전후 동일했다. 이는 **한 조건부 export 예제**의 결과이며 모든 package manifest의 의미 보존 보증은 아니다.
