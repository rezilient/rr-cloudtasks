# Backlog

Living list of technical debt, feature enhancements, and deferred work for `rr-cloudtasks`. Reviewed regularly so nothing slips through the cracks.

> **Conventions:** Each item is tagged `[Tech Debt]`, `[Feature]`, `[Enhancement]`, or `[Bug]`. Include context (why deferred) and acceptance criteria when possible.

---

## Open

### [Tech Debt] Stop using AWS root account; create IAM admin user with MFA
- **Context:** Initial AWS setup was performed from the AWS root account because that was already logged in. Root accounts have unscoped access and are a high-value target if credentials leak. Best practice: create an IAM admin user (or IAM Identity Center user), enable MFA, and lock root credentials away.
- **Acceptance criteria:**
  - IAM admin user (or Identity Center user) created with MFA enforced.
  - Daily AWS CLI / Console access uses that user, not root.
  - Root account has hardware or virtual MFA enabled.
  - Root credentials stored in a secure password manager and not used for daily work.
  - Optional: enable AWS Organizations + create separate dev/prod accounts.
- **Risk if left unaddressed:** Root credential compromise = full account takeover, potentially uncapped billing exposure.

### [Tech Debt] Replace `dynalite` (in-memory shim) with real DynamoDB Local
- **Context:** Initial dev environment uses [`dynalite`](https://github.com/mhart/dynalite) (a pure Node.js DynamoDB-protocol emulator) because Docker Desktop and Java are blocked on the developer machine by corporate group policy (no WSL2, no Hyper-V, no DISM access). `dynalite` is faithful enough for our PK+SK access patterns but is not the real engine.
- **Acceptance criteria:**
  - Docker Desktop or a Java runtime becomes available on dev machines.
  - Switch local dev to either:
    - DynamoDB Local Docker container (`amazon/dynamodb-local`) via `docker-compose.yml` (already drafted in repo), **or**
    - DynamoDB Local Java JAR run as a standalone process.
  - Validate that all 4 Lambda handlers behave identically against the real engine.
  - Update `package.json` `dev` script to use the chosen path.
  - Remove `dynalite` dependency.
- **Risk if left unaddressed:** Edge-case query semantics (e.g. complex `FilterExpression` cases, transactions) may diverge between local dev and production.

### [Tech Debt] Wire SAM Local for Lambda emulation (instead of Express wrapper)
- **Context:** Local dev currently runs Lambda handlers behind a thin Express wrapper because SAM Local requires Docker. Once Docker is available, swap the Express wrapper for `sam local start-api` to emulate API Gateway + Lambda exactly.
- **Acceptance criteria:**
  - `npm run sam:start` works end-to-end against the SAM template.
  - Cognito JWT authorizer behavior is exercised locally (instead of mocked via `x-mock-user-id` header).
  - Express wrapper (`local-server.js`) is removed.

### [Feature] Production AWS deployment
- **Context:** SAM template (`infrastructure/template.yaml`) and GitHub Actions deploy workflow (`.github/workflows/deploy.yml`) are written but not yet executed against a real AWS account.
- **Acceptance criteria:**
  - AWS account configured with OIDC trust to GitHub Actions.
  - All 7 GitHub Actions secrets populated (see README "GitHub Actions Setup").
  - First successful deploy to `dev` stage.
  - Smoke test: signup via Cognito, create/list/update/delete a task end-to-end.

### [Tech Debt] Tighten API Gateway CORS to the CloudFront domain
- **Context:** API Gateway HTTP API CORS currently allows `AllowOrigins: ["*"]`. Once the CloudFront distribution exists, restrict to that domain only.
- **Acceptance criteria:**
  - SAM template `CorsConfiguration.AllowOrigins` references the CloudFront distribution domain (and any custom domain) only.
  - Local dev still works (option: add `http://localhost:5173` and `http://localhost:5174` to allowed origins for dev stage; restrict tighter for prod stage).

### [Feature] Configure Cognito to send verification emails via Amazon SES
- **Context:** User pool currently uses Cognito's default email service (`no-reply@verificationemail.com`), which has a 50/day limit and no branding/customization. Production users will see emails from a generic AWS address that may be flagged as spam.
- **Acceptance criteria:**
  - SES sender domain or email verified (DKIM/SPF DNS records added).
  - SES out of sandbox (production access via AWS support ticket).
  - SAM template updated to set `EmailConfiguration` on the User Pool with `EmailSendingAccount: DEVELOPER` and the verified SES `From` address.
  - Verification emails arrive from the branded sender.
  - Optional: customize email templates (subject + HTML body) via `VerificationMessageTemplate`.

### [Enhancement] Friendly empty state for first-time users
- **Context:** When a freshly signed-up user has no tasks yet, the UI currently shows a generic "No tasks found. Create one to get started!" message (only when API call succeeds with empty list — currently masked by a separate Lambda packaging bug). Want a more welcoming first-time experience.
- **Acceptance criteria:**
  - When `tasks.length === 0` AND no filters/search are active, show: **"Welcome! Click + New Task to start getting your life organized."**
  - When `tasks.length === 0` AND a filter or search IS active, show the existing "no matches" message.
  - Distinguish using props/state in `TaskList` or `TaskDashboard`.

### [Enhancement] Add unit tests for Lambda handlers
- **Context:** Handlers have no test coverage yet. `package.json` references `jest` as a dev dependency but no tests are written.
- **Acceptance criteria:**
  - One test file per handler (`createTask.test.js`, etc.).
  - Cover happy path + at least 2 error branches per handler.
  - Mock DynamoDB client via `aws-sdk-client-mock`.
  - CI runs tests on every PR (add step to a workflow).

### [Enhancement] Add frontend tests (Vitest + React Testing Library)
- **Context:** No frontend tests yet.
- **Acceptance criteria:** Smoke tests for `TaskDashboard`, `TaskCard`, `TaskForm` rendering and basic interaction.

### [Enhancement] Pagination for task list
- **Context:** `listTasks` currently returns all tasks for a user in one query. Fine for personal task lists, but DynamoDB will paginate at 1MB.
- **Acceptance criteria:** Support `LastEvaluatedKey` cursor in API response and frontend "Load more" UX.

### [Enhancement] Optimistic UI updates
- **Context:** Currently every mutation triggers a full re-fetch. Snappier UX would update local state optimistically and reconcile on response.

### [Enhancement] Dark mode
- **Context:** UI is light-theme only.

### [Enhancement] Task due dates and reminders
- **Context:** Currently only status; could add `dueDate` field, sort/filter by it, and EventBridge-scheduled reminders via SNS/email.

---

## Recently Completed

_(Move resolved items here with completion date; prune after ~5 entries to keep the list focused.)_

- **2026-05-09 — [Feature] CloudFront + S3 frontend hosting.** Added S3 bucket, CloudFront distribution with Origin Access Control, SPA error rewrites, and bucket policy to SAM template. Deploy workflow now builds frontend with stack-output env vars, syncs to S3 with split caching policies, and invalidates CloudFront.
- **2026-05-09 — [Bug] Lambda packaging missing `utils/` directory.** Fixed `CodeUri` in SAM template so handlers can resolve `require("../utils/dynamodb")`.
- **2026-05-09 — [Tech Debt] `samconfig.toml` missing `version` key.** Removed unused config file (deploy params passed via CLI flags instead).
