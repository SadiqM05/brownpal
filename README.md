# ResLink

**A private, real-time staff hub for Resident Assistants.** ResLink replaces the scattered group chats, email threads and paper flyers a residence-hall team runs on with one place to post updates, plan programs and see what is happening in the building this week.

Built for the RA staff of Brown Hall as a full-stack, serverless web app: React 19 and TypeScript on the front end, AWS Amplify Gen 2 (Cognito, AppSync, DynamoDB, S3) on the back end, with the entire backend defined as code in this repository.

---

## What it does

### Staff forum
- Five purpose-built categories: Building Updates, Programs & Events, RA Questions, General Announcements, and Lost & Found.
- **Live feed.** New posts, comments, pins and deletions reach every signed-in RA instantly over GraphQL subscriptions, with no refresh.
- **Per-person read tracking.** Latest / Unread / Seen / Pinned tabs with live counts, so nobody misses a building update.
- **Organised by semester.** The feed shows the current term, and earlier semesters are one click away.
- Rich posts: header image, up to five attachments (images or PDFs), and for events a date, time, location and flyer.
- Threaded replies, nested to any depth.
- Authors can edit, pin and delete their own posts, and edit or delete their own comments. Edited content is labelled, and a deleted comment that has replies leaves a placeholder so the conversation under it survives.

### Shared operations calendar
- Month grid and hourly week timeline, with previous / next / today navigation.
- Staff create, edit and delete events with attachments.
- **Forum and calendar are one picture.** Every Programs & Events post appears on the calendar automatically, colour-coded and linked back to its post, so an RA announces a program once and it shows up in both places.

### Profiles
- Display name, birthday and profile picture for every RA.
- An in-browser avatar cropper (zoom and focus point) that stores the crop as data rather than re-encoding the image, so the original photo is never degraded.

### Access
- Email sign-in through Amazon Cognito.
- **Accounts are created by administrators only.** Self sign-up is disabled in the user pool itself, not just hidden in the UI.

---

## Architecture

```
React 19 + TypeScript (Vite)
│
├── pages/         route-level screens
├── components/    presentational and form components (CSS modules)
├── hooks/         context + data hooks: load once, stay live, expose actions
├── utils/         API wrappers, storage, date maths, pure feed/filter logic
└── types/         types derived directly from the backend schema
        │
        ▼
AWS Amplify Gen 2  (infrastructure as code, in /amplify)
├── Auth      Amazon Cognito user pool, admin-created accounts only
├── Data      AWS AppSync (GraphQL) + DynamoDB, real-time subscriptions
├── Storage   Amazon S3, per-user folders
└── Function  AWS Lambda on DynamoDB Streams: server-side clean-up
```

**Data model:** `Post`, `Comment`, `Profile`, `PostRead` and `CalendarEvent`, defined in [amplify/data/resource.ts](amplify/data/resource.ts).

### Engineering decisions worth a look

| Decision | Why |
| --- | --- |
| **End-to-end type safety** | Front-end types are derived from the Amplify schema (`Schema["Post"]["type"]`), so a backend change that breaks the UI fails at compile time, not in production. |
| **Authorization enforced on the server** | Every model uses owner-based rules: any signed-in RA can read, only the owner can write. S3 paths are scoped to the uploader's identity. The UI hides buttons; the backend refuses the request. |
| **Unforgeable authorship** | The author of every post, comment and event is stamped by the backend from the signed-in user's token, and a field-level rule stops it from ever being rewritten. Names come from live profiles, so a renamed RA is renamed everywhere. |
| **Event-driven clean-up** | A Lambda on the DynamoDB streams removes a deleted post's comments, read receipts and files, a cascade no single user is permitted to perform from the browser. |
| **Loading scoped by semester** | Posts and comments are fetched through secondary indexes one academic term at a time, so load time tracks the current semester rather than the app's whole history. |
| **Subscribe before fetch** | Each data hook opens its subscriptions before the initial load and merges by `updatedAt`, so a record created mid-load is never dropped and a stale copy never overwrites a newer one. |
| **Calendar entries are projected, not duplicated** | Event posts are mapped onto the calendar at render time instead of being copied into a second table, so there is no sync job and no way for the two to disagree. |
| **Optimistic updates with rollback** | Read receipts update the UI immediately and roll back if the write fails. |
| **S3 keys stored, URLs generated at render** | Signed URLs are short-lived and cached per key, so files stay private and many avatars of the same person cost one request. |
| **Upload clean-up on failure** | If creating a post fails after its files were uploaded, the files are removed rather than left orphaned in the bucket. |
| **Pure logic kept out of components** | Feed filtering, comment-tree building and date maths live in dependency-free functions that are straightforward to test. |
| **Accessibility as a default** | Semantic landmarks, labelled controls, `aria-pressed` toggles, live status and alert regions, and visible focus rings throughout. |

---

## Tech stack

| Layer | Technology |
| --- | --- |
| UI | React 19, TypeScript 5.9, React Router 7, CSS Modules |
| Build | Vite 8, ESLint 10 with typescript-eslint |
| Auth | Amazon Cognito (Amplify Auth) |
| API and database | AWS AppSync (GraphQL), Amazon DynamoDB |
| File storage | Amazon S3 |
| Infrastructure | AWS Amplify Gen 2 (TypeScript, on AWS CDK) |

---

## Running it locally

**Prerequisites:** Node.js 20 or later and an AWS account with credentials configured.

```bash
# 1. Install dependencies
npm install

# 2. Deploy a personal cloud sandbox (creates amplify_outputs.json)
npx ampx sandbox

# 3. In a second terminal, start the app
npm run dev
```

Because self sign-up is disabled, create your first user in the Amazon Cognito console (User pools → your sandbox pool → Create user), then sign in with that email.

### Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Type-check and build for production |
| `npm run lint` | Run ESLint |
| `npm run verify` | Pre-deploy gate: lockfile check, lint and build |

---

## Roadmap

- Paging within a semester, if a single term ever grows large
- Admin and user dashboards with role-based permissions
- Automated tests for the pure logic layer and the main user flows

---

## Author

Built by **Sadiq Mohammed** · [github.com/SadiqM05](https://github.com/SadiqM05)
