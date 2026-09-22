# Deploy depends on CI

**Status:** accepted.

Until now `deploy.yml` built and shipped on every push to `main` with no check in front of it, so a
broken commit reached production as easily as a good one, and the repo had no automated check at
all. The checks now live in one reusable workflow, `.github/workflows/ci.yml` — shared's build,
`web-client` lint + typecheck + `next build`, `server` lint + `nest build` + unit tests, and the
`server` e2e suite against a real MariaDB service container (same major as `docker-compose.yml`)
— and `deploy.yml` calls it as its first job, with `build-and-push` depending on it (`needs: ci`).
The same workflow also runs on every pull request.

Wiring CI *into* the deploy workflow, rather than only running it on pull requests, is the
point: it is the one place that also covers a direct push to `main` and a merge that is only
broken in combination with something else. When CI is red on `main`, the deploy never starts and
production keeps running the last good version.

## Considered Options

- **Branch protection ("require status checks") as the only mechanism**: rejected as the sole
  guard — it lives in GitHub's settings rather than in the repo, so it is invisible in review,
  and it doesn't stop a direct push. Still worth enabling on top of this, since it is what
  blocks the merge button while a PR is red.
- **Copy the steps into `deploy.yml`**: rejected — what a PR is checked against and what a deploy
  is checked against would drift apart.
- **Run CI on the PR only, not again before deploying**: rejected — the merge commit is not the
  commit that was tested. The cost is that a merged PR runs CI twice, a few minutes on a
  low-traffic personal site.
- **Trigger the deploy from CI via `workflow_run`**: rejected — an implicit, harder-to-follow
  chain; an explicit `needs:` reads top to bottom.

## Consequences

- Every deploy waits for CI, and a flaky check now blocks shipping. Fix or remove a flaky check
  rather than re-running until green.
- `npm run test --workspace=server` runs with `--passWithNoTests` because no `*.spec.ts` exists
  yet and vitest otherwise exits 1. Drop the flag when the first unit test lands, so an
  accidentally empty suite fails again.
- The `web-client` build reads the committed `.env.production`, so it may fetch the live Resume
  Profile from production; that fetch already falls back to `shared`'s seed on failure
  (`resumeProfileApi.ts`), so an unreachable API doesn't fail the build.
- The e2e job's credentials are throwaway CI values, not repository secrets; the database dies
  with the job and nothing calls the Anthropic API.
- Browser-level smoke tests (e.g. a hydration check on `/` and a Blog post) are not part of this
  workflow yet; they join it when they exist.
