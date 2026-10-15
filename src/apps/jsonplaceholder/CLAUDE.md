# jsonplaceholder — app-specific workflow reference

Read alongside the root `CLAUDE.md`, which owns the framework-wide POM/Excel rules. This file
only holds what's specific to JSONPlaceholder (a public fake REST API, json-server based).

- **API base URL**: `https://jsonplaceholder.typicode.com` (`jsonplaceholderConfig.apiBaseUrl`,
  `src/apps/jsonplaceholder/app.config.ts`). No auth, no API key.
- **Jira project key**: none — this app is not tracked in Jira. The test case catalogue is
  `src/apps/jsonplaceholder/TEST_CASES.md` (61 cases: 16 positive / 15 negative / 30 edge), and
  each test title starts with its `TC_...` id from that file. Skip every Jira step of the root
  workflow for this app.
- **API-only**: no UI, so no `pages/` and no `pages.fixture.ts`. Specs import `test`/`expect`
  from `fixtures/api.fixture.ts` — this replaces the root rule's `pages.fixture.ts` for this app.
- **Playwright config**: `playwright.jsonplaceholder.config.ts` runs a single browserless `api`
  project (via `createConfig({ projects })`), so each test runs once, not once per browser.
  Run with `npm run test:jsonplaceholder` (or `:smoke` / `:regression`).
- **Spec location**: `src/apps/jsonplaceholder/tests/api/` — one spec per endpoint group.

## Writes are faked

POST/PUT/PATCH/DELETE return realistic responses but never change server data. A test can only
assert on the response of the write itself; never chain "create then read back". The
`TC_API_E01` case asserts this non-persistence explicitly.

## Expected values are observed, not assumed

Every expected status/body was observed live. Several differ from textbook REST (no request
validation, PUT/PATCH/DELETE on a missing id return 500/200/200 instead of 404, malformed JSON
returns 500 plain text, nested routes never 404). Those cases assert today's real behaviour and
are marked ⚠ quirk in `TEST_CASES.md` — if one starts failing, the API changed; re-probe it
before "fixing" the test.

## API layer (`src/apps/jsonplaceholder/api/`)

Check these for reuse before adding a method.

- **`ApiRoutes`** (`routes/api.routes.ts`) — `POSTS.LIST`, `POSTS.LIST_TRAILING_SLASH`,
  `POSTS.BY_ID(id)`, `POSTS.COMMENTS(id)`, `COMMENTS.LIST`, `RESOURCES.LIST(name)`,
  `withQuery(path, query)`. Queries are raw strings appended to the path (not SpecBuilder params)
  because repeated keys (`postId=1&postId=2`) can't be expressed as a key/value object.
- **`PostApiService`** — `listPosts(query)`, `listPostsWithTrailingSlash()`, `getPost(id)`,
  `getPostComments(id)`, `headPost(id)`, `createPost(body, contentType?)`, `createAtPost(id, body)`,
  `createPostComment(id, body)`, `replacePost(id, body)`, `patchPost(id, body)`, `deletePost(id)`.
  Ids are `string | number` so negative cases can pass `abc`, `1.5`, `01` verbatim.
- **`CommentApiService`** — `filterComments(query)`.
- **`ResourceApiService`** — `listResource(name)`, `getPath(path)` (routing-behaviour cases
  only, e.g. path casing), `preflightResource(name)` (OPTIONS), `writeToCollection(method, name, body)`.
- **Models** (`models/post.model.ts`) — `Post`, `Comment`, `ApiRecord`, `WriteMethod`.

## Utils (`src/apps/jsonplaceholder/utils/`)

- **`TestData`** — `load()`, `row(sheet, id)`, `rows(sheet, id)`; throws on an unknown testCaseId.
- **`DataParser`** — `json(cell)`, `body(requestBody, bodyType)`, `int`, `list`, `schema`.
  `bodyType=raw` sends the cell as a Buffer — required for malformed JSON, since a plain string
  under a JSON content type gets re-serialized as a JSON string literal.
- **`ListAssertions`** — `expectIdRange(records, row)`, `expectSchema(records, schemaCell)`,
  `expectFieldIn(records, field, allowed)`.

## Excel sheets (`src/apps/jsonplaceholder/data/testdata.xlsx`)

JSON bodies / expected responses are stored as JSON text; a blank cell means "not used by this row".

| Sheet | Spec | Columns |
|---|---|---|
| `PostsListData` | `posts.list.api.spec.ts` | testCaseId, query, expectedStatus, expectedCount, expectedFirstId, expectedLastId, expectedTotalCount, schema, filterField, filterValue |
| `PostByIdData` | `post.get.api.spec.ts` | testCaseId, postId, expectedStatus, expectedUserId, expectedTitle, expectedBodyPrefix, expectedResponse |
| `PostCommentsData` | `post.comments.api.spec.ts` | testCaseId, postId, expectedStatus, expectedCount, expectedFirstId, expectedLastId, schema, emailPattern |
| `CommentsFilterData` | `comments.filter.api.spec.ts` | testCaseId, query, comparePostId, expectedStatus, expectedCount, expectedFirstId, expectedLastId, allowedPostIds |
| `PostCreateData` | `post.create.api.spec.ts` | testCaseId, target (collection/item/nestedComments), postId, requestBody, bodyType, contentType, expectedStatus, expectEcho, expectedId, expectedResponse, expectedPostIdType |
| `PostReplaceData` | `post.put.api.spec.ts` | testCaseId, postId, requestBody, expectedStatus, expectedResponse, expectedErrorText, absentFields |
| `PostPatchData` | `post.patch.api.spec.ts` | testCaseId, postId, requestBody, expectedStatus, expectedId (expected body = GET before patch merged with patch) |
| `PostDeleteData` | `post.delete.api.spec.ts` | testCaseId, postId, repeat, expectedStatus, expectedResponse |
| `ApiCommonData` | `api.common.api.spec.ts` | testCaseId, method, resource, postId, path, requestBody, bodyType, expectedStatus, expectedCount, expectedResponse, expectedErrorText, headerName, headerValue, verifyPostId, verifyStatus — multi-row cases share a testCaseId |

Regenerate/extend via `src/apps/jsonplaceholder/utils/generate-sample-data.ts` +
`npm run generate:testdata:jsonplaceholder`. When adding a case, add it to `TEST_CASES.md` first
and check it doesn't duplicate an existing behaviour (see the de-duplication rule there).
