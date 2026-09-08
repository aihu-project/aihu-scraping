# Changelog

## 0.2.1

- Move `@aihu/scraping` into the standalone `aihu-project/aihu-scraping`
  repository.
- Correct package metadata and document the optional server-side boundary.
- Add release tag validation, packed-manifest checks, and idempotent npm
  publishing with provenance.

## 0.2.0

- Make the rate limiter fail closed when it cannot account for a request,
  including a new key at map capacity or an internal error.

## 0.1.0

- Add the O(1) in-process rate limiter and Fetch API bot-detection middleware.
