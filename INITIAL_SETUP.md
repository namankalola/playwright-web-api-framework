# Initial Setup — New Maintainer Guide

This framework isn't just a Playwright test suite — most of the day-to-day work (picking up
Jira tickets, writing specs, updating Jira) is done *through Claude Code*, driven by the rules
in `CLAUDE.md`. This doc gets a new machine/maintainer from a fresh clone to being able to say
`pick up saucedemo SCRUM-12` and have it actually work. It assumes you've already read (or are
about to read) `README.md` for the architecture — this doc is about environment/tooling setup,
not the POM/Excel rules themselves, which live in `CLAUDE.md`.

---

## 1. Prerequisites

| Tool | Why | Notes |
|---|---|---|
| **Node.js 18+** (LTS recommended) | Runs everything — tests, ts-node scripts, tooling | `node -v` to check |
| **Git** | Repo access | — |
| **Claude Code CLI** | The AI agent that reads `CLAUDE.md` and does the pickup/redevelop workflow | `npm install -g @anthropic-ai/claude-code`, then `claude` to log in. See https://docs.claude.com/claude-code for the current install method. |
| **Java (JRE 8+)** | Only needed for `npm run allure:<app>:generate` / `:open` — `allure-commandline` is a JVM tool under the hood | Skip if you don't need Allure reports; HTML/JUnit reporting works without it |
| A **Jira Cloud account + API token** for the org's Jira instance | The automated workflow reads/writes real Jira tickets | See §4 |

This repo was developed on Windows (PowerShell), but nothing in it is Windows-specific — it
runs the same on macOS/Linux.

---

## 2. Clone and install

```bash
git clone <repo-url>
cd playwright-ts-automation-framework-api
npm install
npx playwright install --with-deps
```

## 3. Install the Playwright CLI (used for live selector inspection)

Step 5 of the `CLAUDE.md` workflow ("Use Playwright-CLI to inspect the app's base URL... and
find real selectors") refers to Microsoft's official Playwright CLI, installed globally — it's
not a project devDependency, so it won't come from `npm install`:

```bash
npm install -g @playwright/cli
```

This is what lets Claude actually open the live app and verify a selector exists before writing
a locator, instead of guessing from the DOM in its training data. Without it, Claude will still
attempt the workflow but selector accuracy will suffer.

## 4. Configure `.env`

**There is no `.env.example` checked into the repo yet** (a gap worth fixing at some point) —
`.env` is gitignored, so create one at the repo root with the variables below. Everything here
is cross-app infra (`src/core/env.config.ts`) plus each app's own block
(`src/apps/<app>/app.config.ts`) — apps never share a variable name.

```bash
# --- cross-app / infra (src/core/env.config.ts) ---
ENV=qa
HEADLESS=true
BROWSER=chromium
DEFAULT_TIMEOUT=30000
NAVIGATION_TIMEOUT=30000
RETRIES=1
WORKERS=4

JIRA_URL=https://<your-org>.atlassian.net
JIRA_EMAIL=<the Jira account's email>
JIRA_APIKEY=<Jira API token — create at id.atlassian.com/manage-profile/security/api-tokens>

# --- saucedemo (src/apps/saucedemo/app.config.ts) ---
BASE_URL=https://www.saucedemo.com
DEFAULT_USERNAME=standard_user
DEFAULT_PASSWORD=secret_sauce
TEST_DATA_FILE=src/apps/saucedemo/data/testdata.xlsx
API_BASE_URL=https://reqres.in          # demo API layer, see README "API testing layer"
API_AUTH_EMAIL=eve.holt@reqres.in
API_AUTH_PASSWORD=cityslicka

# --- orangehrms (src/apps/orangehrms/app.config.ts) ---
# base URL / creds are hardcoded defaults in app.config.ts (public demo instance,
# Admin/admin123) — no env vars required unless you want to override them

# --- bookstore (src/apps/bookstore/app.config.ts) ---
# BOOKSTORE_USERNAME / BOOKSTORE_PASSWORD only once you've registered a real
# demoqa.com account for a successful-login test (see src/apps/bookstore/CLAUDE.md —
# demoqa has no shared demo login)
```

Never hand this `.env` to anyone outside the team, and never commit it — it holds a live Jira
API token.

## 5. Jira access — two separate integration points

This repo talks to Jira in two different ways; you generally only need the first one.

**a) `src/core/jira.ts` (required for the automated workflow).** A plain REST client
authenticated with `JIRA_URL`/`JIRA_EMAIL`/`JIRA_APIKEY` from `.env`. This is what actually
fetches ticket descriptions, moves tickets to In Progress/Done, and appends the
"Implemented Steps" block — every `pick up`/`redevelop` run goes through it. There is
**no CLI entry point wired up in `package.json`** for it (see §7 below) — Claude writes a
throwaway `_tmp_*.ts` runner at the repo root each time it needs to call it, then deletes it.
That's expected, not a bug.

**b) The Atlassian remote MCP server (optional, interactive-only).** If you want to ask Claude
ad hoc questions about Jira tickets outside the pickup/redevelop workflow (browse, search,
read a ticket you don't have the key for), register Atlassian's official MCP server:

```bash
claude mcp add --transport sse atlassian https://mcp.atlassian.com/v1/sse
```

Then authenticate via the OAuth flow Claude Code prompts for on first use. This is unrelated to
`jira.ts` and not required for the `CLAUDE.md` workflow to function.

## 6. Verify the install

```bash
npm run typecheck
npm run lint
npm run generate:testdata:saucedemo
npm run test:saucedemo:smoke
```

If all four are clean, the environment is good. Then confirm Claude itself is wired up:

```
pick up saucedemo <a real "Ready For Automation" ticket key in your Jira project>
```

and watch it move the ticket to In Progress, generate a spec, run it, and move it to Done. This
is the real end-to-end smoke test — a green `npm test` alone doesn't prove Jira/Claude Code
integration works.

---

## 7. How Claude actually reads this repo

- **`CLAUDE.md` at the repo root** is the framework-wide rulebook — POM rules, Excel rules,
  Jira rules, the exact step-by-step workflow, and the trigger phrases (`pick up <app>
  <TASK-KEY>`, `redevelop <app> <TASK-KEY> <spec-filename>`). Read it before touching anything;
  it's the source of truth this doc summarizes.
- **Each app's own `src/apps/<app>/CLAUDE.md`** holds only what's specific to that AUT — base
  URL, Jira project key, page object inventory, Excel sheet/column names. The root file always
  gets read first, then the one app's file, per the "App registry" table.
- **`README.md`** is the architecture reference (folder layout, layer responsibilities, the
  POM/WebActions/ApiClient separation diagrammed).
- Adding a new app or app-scoped npm script follows the "Adding a new application" section in
  root `CLAUDE.md` — it's additive-only, no existing app's files get touched.

## 8. Claude's memory is per-machine, not part of this repo

Claude Code keeps a persistent memory folder outside this repo (per-user, per-project-path, not
checked into git). A new maintainer starts with **no memory** — Claude will not automatically
know about things like the OrangeHRMS demo server's flakiness or the Bookstore reCAPTCHA block
below until it rediscovers them (or you tell it, at which point it should save that as a
memory). §9 below hands you the operational knowledge accumulated so far so you don't have to
rediscover it firsthand.

---

## 9. Known operational gotchas (read before your first pickup/redevelop)

- **No CLI wrapper around `jira.ts`.** Claude handles this itself by writing a temporary
  `_tmp_*.ts` at the repo root, running it via `npx ts-node`, then deleting it — this is the
  established pattern, not a workaround to "fix" by wiring up a permanent script.
- **OrangeHRMS demo server (`opensource-demo.orangehrmlive.com`) is a shared public instance
  and gets flaky/slow under load.** Known symptoms: intermittent Reference Id mismatches on
  claim-search tests (parallel workers racing sequential server-assigned IDs) and occasional
  raw navigation/click timeouts unrelated to any code change. If an OrangeHRMS test fails this
  way on a run that didn't touch the relevant logic, re-run isolated (`--workers=1`, single
  `--project`) before assuming something broke.
- **Firefox can't launch locally on the original dev machine** (`Host system is missing
  dependencies! msvcp140_1.dll`) — reproduces on every existing spec, not test-specific. Check
  whether this is still true on your machine before spending time debugging a firefox-only
  failure.
- **Bookstore's ARISE-2 (`register to Book Store`) is deliberately left In Progress, not Done.**
  demoqa.com's register/login pages hit a client-side reCAPTCHA crash that makes the UI-visible
  success signal unreliable through Playwright's test runner (server-side account
  creation/login genuinely succeeds every time — only the client signal is broken). Full
  writeup is in `src/apps/bookstore/CLAUDE.md`'s "BLOCKED" section. Don't re-attempt this ticket
  by tweaking selectors/waits — the code isn't the problem.
- **`src/apps/saucedemo/tests/checkout_validation.spec.ts` is a deliberate anti-pattern
  reference, not a template.** It's called out by name in root `CLAUDE.md` for violating the
  POM/data rules (raw `page.` calls, inline locators, hardcoded test data) — never copy its
  structure for a new test.

## 10. Cheat sheet

```bash
npm run test:<app>                 # full suite, all browsers
npm run test:<app>:smoke           # @smoke only
npm run test:<app>:regression      # @regression only
npm run test:<app>:chrome          # chromium only
npm run report:<app>               # open last HTML report
npm run allure:<app>:generate && npm run allure:<app>:open
npm run generate:testdata:<app>    # regenerate that app's testdata.xlsx
npm run typecheck                  # repo-wide
npm run lint / lint:fix            # repo-wide
```

`<app>` is currently one of `saucedemo`, `orangehrms`, `bookstore` — see the "App registry"
table in root `CLAUDE.md` for the authoritative list as it grows.
