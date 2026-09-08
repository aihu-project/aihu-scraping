# @aihu/scraping

Optional, server-side controls for Aihu agent services: an O(1) in-process
rate limiter and Fetch API-compatible bot-detection middleware.

```bash
npm install @aihu/scraping
# or
bun add @aihu/scraping
```

## Rate limiting

```ts
import { createRateLimiter } from '@aihu/scraping'

const limiter = createRateLimiter()
const allowed = limiter.checkRateLimit('100/min', `${verifiedSubject}:tool-name`)
```

The limiter uses a bounded in-memory map and fails closed when it cannot
account for a request. The store is per process; use a shared store or a
deployment-specific adapter when quota must span multiple instances.

## Bot detection

```ts
import { createBotDetectionMiddleware } from '@aihu/scraping'

const detectBots = createBotDetectionMiddleware({ allowNoUserAgent: false })
const response = await detectBots(request, () => new Response('OK'))
```

The default policy blocks common automation and scraping user-agent markers,
including requests without a user-agent. Add application-specific substrings
with `blockList`, or explicitly allow missing user agents when your transport
requires it.

This package is optional. It does not install or configure an Aihu server,
router, auth provider, or storage backend. For security-sensitive paths, derive
rate-limit keys from a verified principal before calling the limiter.

## Development

```bash
bun install --frozen-lockfile
bun run check
```

The published package contains only `dist`, this README, and the MIT license.

## License

MIT — see [LICENSE](LICENSE).
