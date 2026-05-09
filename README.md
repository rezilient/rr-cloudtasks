# CloudTasks

A serverless personal task management app built on AWS. Users can create, update, delete, and search tasks with statuses of **To Do**, **In Progress**, **Blocked**, **On Hold**, and **Completed**.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend                             │
│           React + Vite  ·  AWS Amplify (Cognito)            │
│                  Hosted on S3 + CloudFront                  │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTPS + JWT
┌──────────────────────────────▼──────────────────────────────┐
│               Amazon API Gateway (HTTP API)                 │
│            Cognito JWT Authorizer on all routes             │
└──────┬──────────────┬──────────────┬──────────────┬─────────┘
       │              │              │              │
  POST /tasks    GET /tasks    PUT /tasks/{id}  DELETE /tasks/{id}
       │              │              │              │
┌──────▼──────────────▼──────────────▼──────────────▼─────────┐
│                    AWS Lambda (Node.js 20)                   │
│     createTask · listTasks · updateTask · deleteTask        │
└──────────────────────────────┬──────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────┐
│                    Amazon DynamoDB                          │
│         Table: CloudTasks-{stage}                           │
│         PK: userId  ·  SK: taskId                          │
│         Encrypted at rest  ·  Point-in-time recovery        │
└─────────────────────────────────────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────┐
│                   Amazon Cognito                            │
│           User Pool with email/password auth                │
└─────────────────────────────────────────────────────────────┘
```

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, AWS Amplify UI |
| Backend | AWS Lambda (Node.js 20) |
| API | Amazon API Gateway HTTP API |
| Database | Amazon DynamoDB (on-demand) |
| Auth | Amazon Cognito User Pool |
| IaC | AWS SAM |
| CI/CD | GitHub Actions |
| Security | CodeQL, Dependabot, Dependency Review, Secret Scanning |

## Features

- **Create tasks** with a title, description, and status
- **List & search** tasks by keyword or filter by status
- **Update** task title, description, or status inline
- **Delete** tasks with confirmation
- **Secure** — every API call requires a valid Cognito JWT; tasks are scoped to the authenticated user
- **Deploy on merge** — pushing to `main` automatically builds and deploys backend + frontend

## Task Statuses

| Status | Description |
|---|---|
| `todo` | Not yet started |
| `in_progress` | Actively being worked on |
| `blocked` | Blocked by an external dependency |
| `on_hold` | Paused intentionally |
| `completed` | Done |

## Project Structure

```
rr-cloudtasks/
├── frontend/                   # React + Vite app
│   ├── src/
│   │   ├── api/tasks.js        # API client (fetch + Amplify auth)
│   │   ├── components/         # TaskDashboard, TaskCard, TaskForm, SearchBar
│   │   ├── App.jsx             # Amplify Authenticator wrapper
│   │   └── main.jsx            # Entry point + Amplify.configure()
│   ├── .env.example            # Required env vars
│   └── package.json
├── backend/                    # Lambda functions
│   ├── src/
│   │   ├── handlers/           # createTask, listTasks, updateTask, deleteTask
│   │   └── utils/              # DynamoDB client, HTTP response helpers
│   └── package.json
├── infrastructure/
│   ├── template.yaml           # AWS SAM template (all AWS resources)
│   └── samconfig.toml          # SAM deploy config
├── .github/
│   ├── workflows/
│   │   ├── deploy.yml          # Deploy on push to main
│   │   ├── codeql.yml          # CodeQL scanning on PRs + weekly
│   │   └── dependency-review.yml  # Block PRs with vulnerable deps
│   └── dependabot.yml          # Weekly dependency updates
└── README.md
```

## Getting Started

### Prerequisites

- Node.js 20+
- AWS CLI configured (`aws configure`)
- AWS SAM CLI (`brew install aws-sam-cli` or [docs](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html))

### Deploy Backend

```bash
cd infrastructure
sam build --template template.yaml
sam deploy --guided
```

Note the outputs — you'll need `ApiUrl`, `UserPoolId`, and `UserPoolClientId` for the frontend.

### Run Frontend Locally

```bash
cd frontend
cp .env.example .env
# Fill in .env with values from the SAM deploy outputs
npm install
npm run dev
```

### GitHub Actions Setup

Add the following secrets to your GitHub repository (`Settings → Secrets → Actions`):

| Secret | Description |
|---|---|
| `AWS_DEPLOY_ROLE_ARN` | IAM role ARN for GitHub Actions OIDC deployment |
| `SAM_ARTIFACTS_BUCKET` | S3 bucket for SAM build artifacts |
| `FRONTEND_BUCKET` | S3 bucket for the React build |
| `CLOUDFRONT_DISTRIBUTION_ID` | CloudFront distribution ID |
| `VITE_API_URL` | API Gateway URL (from SAM outputs) |
| `VITE_USER_POOL_ID` | Cognito User Pool ID |
| `VITE_USER_POOL_CLIENT_ID` | Cognito App Client ID |

> **AWS Auth:** The deploy workflow uses [OIDC federation](https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/configuring-openid-connect-in-amazon-web-services) — no long-lived AWS keys are stored in GitHub.

## API Reference

All endpoints require `Authorization: Bearer <access_token>` header.

| Method | Path | Description |
|---|---|---|
| `POST` | `/tasks` | Create a task |
| `GET` | `/tasks` | List tasks (optional: `?search=&status=`) |
| `PUT` | `/tasks/{taskId}` | Update a task |
| `DELETE` | `/tasks/{taskId}` | Delete a task |

### Create Task — `POST /tasks`
```json
{ "title": "My task", "description": "Optional", "status": "todo" }
```

### Update Task — `PUT /tasks/{taskId}`
```json
{ "status": "in_progress" }
```

## Security

| Control | Implementation |
|---|---|
| Authentication | Amazon Cognito User Pool (email + password) |
| Authorization | JWT validated by API Gateway on every request |
| Data isolation | DynamoDB queries scoped to `userId` from JWT |
| Encryption at rest | DynamoDB SSE enabled |
| HTTPS only | API Gateway + CloudFront enforce TLS |
| Dependency alerts | Dependabot (weekly scans) |
| Code scanning | GitHub CodeQL (on PRs + weekly schedule) |
| Dependency review | Blocks PRs introducing vulnerable packages |
| Secret scanning | GitHub native secret scanning enabled |

## Contributing

1. Fork the repo and create a feature branch (`git checkout -b feature/my-feature`)
2. Commit your changes
3. Open a pull request against `main`
4. CI runs CodeQL scan and dependency review automatically
5. Once approved and merged, the deploy workflow ships to production

## License

MIT
