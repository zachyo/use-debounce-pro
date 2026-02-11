# use-debounce-pro

[![npm version](https://img.shields.io/npm/v/use-debounce-pro.svg)](https://www.npmjs.com/package/use-debounce-pro)
[![bundle size](https://img.shields.io/badge/gzipped-759B-brightgreen)](https://github.com/zachyo/use-debounce-pro)
[![tree shaking](https://img.shields.io/badge/tree%20shaking-supported-brightgreen.svg)](https://github.com/zachyo/use-debounce-pro)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue.svg)](https://www.typescriptlang.org/)

A tiny (**759B** gzipped) React hook for debouncing and throttling — with full control.

## Features

- ⚡ **Tiny** — 759 bytes gzipped, zero dependencies
- 🎯 **Dual mode** — Debounce and throttle in one hook
- 🔄 **Edge control** — Leading, trailing, or both
- ⏱️ **Max wait** — Guarantee execution within a time window
- 🎮 **Full control** — `cancel()`, `flush()`, `isPending()`
- 💪 **TypeScript** — Strict types with full generic inference
- 🌳 **Tree-shakeable** — ESM + CJS dual builds, `sideEffects: false`
- 🧹 **Safe** — Automatic cleanup on unmount, no stale closures

## Installation

```bash
npm install use-debounce-pro
```

```bash
yarn add use-debounce-pro
```

```bash
pnpm add use-debounce-pro
```

## Quick Start

```tsx
import { useDebouncePro } from "use-debounce-pro";

function SearchBox() {
  const debouncedSearch = useDebouncePro(
    (query: string) => fetchResults(query),
    300,
  );

  return <input onChange={(e) => debouncedSearch(e.target.value)} />;
}
```

## API

### `useDebouncePro(callback, options)`

The primary hook. Returns a debounced/throttled function with control methods attached.

```tsx
const debouncedFn = useDebouncePro(callback, 300);
// or
const debouncedFn = useDebouncePro(callback, { wait: 300, leading: true });

debouncedFn("arg"); // Call the debounced function
debouncedFn.cancel(); // Cancel pending execution
debouncedFn.flush(); // Execute pending call immediately
debouncedFn.isPending(); // Check if a call is pending
```

### `useDebouncedCallback(callback, options)`

Alternative API that returns an object with named methods.

```tsx
const { run, cancel, flush, isPending } = useDebouncedCallback(
  (query: string) => searchAPI(query),
  { wait: 300 },
);

return <input onChange={(e) => run(e.target.value)} />;
```

### Options

| Option     | Type                       | Default      | Description                    |
| ---------- | -------------------------- | ------------ | ------------------------------ |
| `wait`     | `number`                   | `0`          | Delay in milliseconds          |
| `mode`     | `"debounce" \| "throttle"` | `"debounce"` | Operation mode                 |
| `leading`  | `boolean`                  | `false`      | Execute on the leading edge    |
| `trailing` | `boolean`                  | `true`       | Execute on the trailing edge   |
| `maxWait`  | `number`                   | `undefined`  | Max time a call can be delayed |

When passing a `number` instead of an options object, it is used as the `wait` value with default settings.

### Return Value

| Method         | Type                                   | Description                      |
| -------------- | -------------------------------------- | -------------------------------- |
| `(…args)`      | `(...args) => ReturnType \| undefined` | The debounced function           |
| `.cancel()`    | `() => void`                           | Cancel any pending invocation    |
| `.flush()`     | `() => ReturnType \| undefined`        | Immediately execute pending call |
| `.isPending()` | `() => boolean`                        | Whether a call is pending        |

## Common Patterns

### Search Input

Debounce API calls while the user types:

```tsx
function Search() {
  const [results, setResults] = useState([]);

  const search = useDebouncePro(async (query: string) => {
    const data = await fetch(`/api/search?q=${query}`);
    setResults(await data.json());
  }, 300);

  return <input onChange={(e) => search(e.target.value)} />;
}
```

### Scroll Handler

Throttle scroll events for performance:

```tsx
function InfiniteScroll() {
  const handleScroll = useDebouncePro(
    () => {
      const { scrollTop, scrollHeight, clientHeight } =
        document.documentElement;
      if (scrollTop + clientHeight >= scrollHeight - 200) {
        loadMore();
      }
    },
    { wait: 100, leading: true, trailing: true, maxWait: 100 },
  );

  useEffect(() => {
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);
}
```

### Form Auto-Save

Save drafts as the user edits:

```tsx
function Editor() {
  const autoSave = useDebouncePro((content: string) => saveDraft(content), {
    wait: 1000,
    maxWait: 5000,
  });

  return (
    <textarea
      onChange={(e) => autoSave(e.target.value)}
      onBlur={() => autoSave.flush()}
    />
  );
}
```

### Window Resize

Recalculate layout on resize without jank:

```tsx
function ResponsiveChart() {
  const recalc = useDebouncePro(() => {
    setDimensions({
      width: window.innerWidth,
      height: window.innerHeight,
    });
  }, 150);

  useEffect(() => {
    window.addEventListener("resize", recalc);
    return () => window.removeEventListener("resize", recalc);
  }, [recalc]);
}
```

## Comparison

| Feature            | use-debounce-pro |    use-debounce    | lodash.debounce  |
| ------------------ | :--------------: | :----------------: | :--------------: |
| Gzipped size       |     **759B**     |       ~1.4KB       |      ~5.3KB      |
| Debounce           |        ✅        |         ✅         |        ✅        |
| Throttle           |        ✅        | ❌ (separate hook) | ❌ (separate fn) |
| Leading/trailing   |        ✅        |         ✅         |        ✅        |
| `maxWait`          |        ✅        |         ✅         |        ✅        |
| `cancel` / `flush` |        ✅        |         ✅         |        ✅        |
| `isPending`        |        ✅        |         ❌         |        ❌        |
| React hook         |        ✅        |         ✅         |        ❌        |
| TypeScript         |   ✅ (strict)    |         ✅         |    ⚠️ @types     |
| Zero dependencies  |        ✅        |         ✅         |        ❌        |
| Tree-shakeable     |        ✅        |         ✅         |        ❌        |

## TypeScript

Full generic inference — your argument and return types are preserved:

```tsx
// Types are inferred automatically
const debouncedSearch = useDebouncePro(
  (query: string, page: number) => fetchResults(query, page),
  300,
);

debouncedSearch("hello", 1); // ✅ type-safe
debouncedSearch(123); // ❌ type error
```

## Requirements

- React ≥ 16.8.0 (hooks support)

## License

[MIT](./LICENSE)
