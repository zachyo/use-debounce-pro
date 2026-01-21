# use-debounce-pro

A lightweight React hook for debouncing and throttling with advanced features.

**Status:** 🚧 Under Development

## Features

- ⚡ Lightweight (<0.8kb gzipped)
- 🎯 Debounce and throttle modes
- 🔄 Leading and trailing edge support
- ⏱️ Max wait option for throttling
- 🎮 Full control with cancel and flush
- 📦 Zero dependencies
- 💪 TypeScript support
- ✅ Fully tested

## Installation

```bash
npm install use-debounce-pro
```

## Quick Start

```typescript
import { useDebouncePro } from "use-debounce-pro";

function SearchComponent() {
  const debouncedSearch = useDebouncePro(searchFn, 300);

  return <input onChange={(e) => debouncedSearch(e.target.value)} />;
}
```

## Documentation

Coming soon...

## License

MIT
