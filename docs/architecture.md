# OctoFit Tracker architecture

OctoFit Tracker is a three-tier application for a school fitness program. The starter code includes API contracts and intentionally incomplete implementation points so you can use GitHub Copilot agent mode in a test-driven loop.

![Three-tier OctoFit architecture](../.github/images/octofit-architecture.svg)

## Tier boundaries

- **Presentation tier**: React 19, Vite, React Router, Bootstrap, and a shared API client in `octofit-tracker/frontend/src`.
- **Logic tier**: Express and TypeScript routes/services in `octofit-tracker/backend/src` expose `/api/*` behavior on port `8000`.
- **Data tier**: Mongoose models and seed data in `octofit-tracker/backend/src/models` and `src/scripts/seed.ts` persist to MongoDB on port `27017`.

## Ports and environment rules

- MongoDB: `27017`
- Express API: `8000`
- Vite frontend: `5173`
- The browser calls relative `/api` paths. Vite proxies them to `http://localhost:8000`, so the unauthenticated API port stays private in Codespaces. `VITE_API_BASE_URL` can override the base URL.

## API contract

| Capability | Method and path | Expected behavior |
| --- | --- | --- |
| Activity tracking | `GET /api/activities`, `POST /api/activities` | List and create valid activity records. POST accepts `userId`, `teamId`, `type`, and `minutes`; `userId` and `teamId` must be well-formed IDs for an existing user and team; otherwise respond with a deliberate 4xx (never a 500 from a cast error). A created activity stores the submitted `user`, `team`, `type`, and `minutes` plus computed `points` and `occurredAt`. |
| Teams | `GET /api/teams`, `POST /api/teams` | List and create teams with members. Created and listed teams keep the submitted `name` and `mascot`. Reject a team without a name with `400`. |
| Leaderboard | `GET /api/leaderboard` | Return teams ordered by the sum of their activity points, highest first. Each entry has `teamName`, `totalPoints`, and a 1-based `rank`. |
| Workout suggestions | `GET /api/workouts/suggestions/:userEmail` | Recommend workouts from recent activity patterns for the matching seeded user's email address. The first suggestion's `focus` matches that user's goal or recent activity, with a `reason` explaining why. An email with no matching user returns a deliberate 4xx (for example, `404`). |

## Implementation decisions

Record your plan here before editing code.

- Data tier decision: Add required-field validation to `User`, `Team`, `Activity`, and `Workout`.
  Preserve the existing seed behavior and idempotency for seeded and unrelated records.
 - Logic tier decision: Implement API contracts one capability at a time: activities, teams, leaderboard,
  then workout suggestions. Keep Mongoose or cast failures from becoming HTTP 500s.
- Presentation tier decision: Use `getJson` from the shared API client. Each route must provide loading, populated, empty, and accessible error states.
- Activity tracking approach: Validate request fields and ObjectIds before querying. Verify that referenced users
  and teams exist, reject invalid input with 400s, calculate points and set
  `occurredAt`, then expose create/list responses.
- Team management approach:Reject teams without a name with 400. Accept name, mascot, and member ObjectIds,
  verify or preserve the submitted member references appropriately, and expose created and listed members consistently.
- Leaderboard approach:Aggregate activity `points` by team, sort descending, and assign consecutive
  1-based ranks. Return `teamName`, `totalPoints`, and `rank`.
- Workout suggestions approach: Find the seeded user by email. Determine the first workout from the user's goal or
  recent activity pattern and include a reason tied to that pattern or goal. Return
  a deliberate 4xx for unknown emails.

## Test plan

Record the commands you run and what each failure means.

- Data-tier command: `npm run test:data --prefix octofit-tracker/backend`
   Baseline: 4 of 5 fail. Required-field validation is missing on the models. The idempotent seed test passes and must keep passing
- API command: `npm run test:api --prefix octofit-tracker/backend`
    Baseline: 4 of 4 fail. Invalid requests return 501 instead of 400, the leaderboard is empty, and workout suggestions lack a `reason`.
- Frontend command: `npm test --prefix octofit-tracker/frontend`
    Baseline: 15 of 15 fail. API content is not rendered, and the loading, empty, and error states are missing on all four routes.
- Backend build command: `npm run build --prefix octofit-tracker/backend`
    Must succeed after each backend change (TypeScript compiles).
- Frontend build command: `npm run build --prefix octofit-tracker/frontend`
 Must succeed after the presentation changes.