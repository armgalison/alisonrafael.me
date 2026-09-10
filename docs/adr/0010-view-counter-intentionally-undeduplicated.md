# Post view count is a best-effort, un-deduplicated counter

Each Post has a `viewCount` integer that is incremented once on every load of its reading
page, via a dedicated `POST /posts/:slug/views` fired from the Blog reading UI, using an
atomic `UPDATE ... SET viewCount = viewCount + 1` (not read-modify-write). There is no
de-duplication by IP, cookie, or session: a Visitor who refreshes the page ten times adds
ten views. This inflation is known and accepted — the number is a rough popularity signal
on a personal blog, not a metric anything depends on.

The increment is deliberately its **own** endpoint rather than a side effect of
`GET /posts/:slug`, so that `GET` stays idempotent and prefetching, HTTP caches, link
unfurlers, and crawlers reading a Post never move the counter.

## Considered Options

- De-duplicate by IP + day (store recent view keys): rejected — storing Visitor IPs is a
  privacy cost, and a whole table of view records is a lot of moving parts for a vanity
  number.
- Increment inside `GET /posts/:slug`: rejected — breaks GET idempotency; a prefetch or a
  crawler would silently inflate the count.
- A real analytics product: rejected — an external dependency and far more than this
  needs.
