# jsonplaceholder — API test case catalogue (draft)

Base URL: `https://jsonplaceholder.typicode.com` · Auth: none · JSON headers on writes:
`Content-type: application/json; charset=UTF-8`

Every **Expected** value below was observed live against the API on 2026-10-15 — none are
assumed from REST conventions. Where the observed behaviour differs from what a well-behaved
REST API would return, the row is marked **⚠ quirk** and the test asserts the *observed*
behaviour (see "Known quirks" at the end).

**De-duplication rule used:** each case tests exactly one behaviour, and a behaviour is tested
once only. Behaviour that is the same for every endpoint (content-type, malformed JSON, writes
not persisting, collection-level writes, unknown routes) lives once in **Cross-cutting**
instead of being repeated under each endpoint. Within an endpoint, two invalid inputs are kept
only when they belong to different input classes (e.g. type vs. sign vs. boundary).

ID format: `TC_<GROUP>_<P|N|E><nn>` — P = positive, N = negative, E = edge.

**Automated:** all 61 cases, one Playwright test each (title starts with the ID), in
`src/apps/jsonplaceholder/tests/api/` — run `npm run test:jsonplaceholder`. Test data per case
lives in `data/testdata.xlsx`, one sheet per section below (see this app's `CLAUDE.md`).

---

## 1. GET `/posts` — list, filter, paginate, sort

| ID | Title | Request | Expected |
|---|---|---|---|
| TC_POSTS_LIST_P01 | List returns all posts with valid schema | `GET /posts` | 200; array of 100; every item has `userId` (number), `id` (number), `title` (string), `body` (string) |
| TC_POSTS_LIST_P02 | Post ids are unique and sequential | `GET /posts` | ids are exactly 1…100 with no gaps or duplicates |
| TC_POSTS_LIST_P03 | Filter by userId | `GET /posts?userId=1` | 200; 10 posts; every `userId` = 1 |
| TC_POSTS_LIST_P04 | Pagination returns the requested page | `GET /posts?_page=2&_limit=10` | 200; 10 posts, ids 11–20; header `x-total-count` = 100 |
| TC_POSTS_LIST_P05 | Sort descending by id | `GET /posts?_sort=id&_order=desc` | 200; 100 posts; first id 100, last id 1 |
| TC_POSTS_LIST_N01 | Filter value with no match | `GET /posts?userId=999` | 200; empty array `[]` |
| TC_POSTS_LIST_N02 | Filter value of wrong type | `GET /posts?userId=abc` | 200; empty array `[]` |
| TC_POSTS_LIST_E01 | Two filters combine with AND | `GET /posts?userId=1&id=3` | 200; exactly 1 post (id 3, userId 1) |
| TC_POSTS_LIST_E02 | `_limit=0` | `GET /posts?_limit=0` | 200; empty array |
| TC_POSTS_LIST_E03 | Page beyond last page | `GET /posts?_page=999&_limit=10` | 200; empty array |
| TC_POSTS_LIST_E04 | Slice overruns end of data | `GET /posts?_start=95&_end=105` | 200; only 5 posts (ids 96–100) — truncated, no error |
| TC_POSTS_LIST_E05 | Unknown query param is ignored | `GET /posts?unknown=x` | 200; all 100 posts |
| TC_POSTS_LIST_E06 | Trailing slash on collection | `GET /posts/` | 200; all 100 posts (same as without slash) |

## 2. GET `/posts/{id}` — single post

| ID | Title | Request | Expected |
|---|---|---|---|
| TC_POST_GET_P01 | Get post by id returns documented record | `GET /posts/1` | 200; `userId` 1, `id` 1, `title` = "sunt aut facere repellat provident occaecati excepturi optio reprehenderit", `body` starts "quia et suscipit" |
| TC_POST_GET_N01 | Id just past the last record | `GET /posts/101` | 404; body `{}` |
| TC_POST_GET_N02 | Non-numeric id | `GET /posts/abc` | 404; body `{}` |
| TC_POST_GET_N03 | Negative id | `GET /posts/-1` | 404; body `{}` |
| TC_POST_GET_E01 | Upper boundary id | `GET /posts/100` | 200; `id` 100, `userId` 10 |
| TC_POST_GET_E02 | Lower boundary − 1 (zero) | `GET /posts/0` | 404; body `{}` |
| TC_POST_GET_E03 | Decimal id | `GET /posts/1.5` | 404; body `{}` |
| TC_POST_GET_E04 | Leading-zero id is not normalised | `GET /posts/01` | 404; body `{}` |

## 3. GET `/posts/{id}/comments` — nested route

| ID | Title | Request | Expected |
|---|---|---|---|
| TC_POST_COMMENTS_P01 | Comments for a post with valid schema | `GET /posts/1/comments` | 200; 5 comments; every `postId` = 1; each has `postId`, `id`, `name`, `email`, `body` |
| TC_POST_COMMENTS_P02 | Comment emails are well-formed | `GET /posts/1/comments` | every `email` matches `local@domain.tld` |
| TC_POST_COMMENTS_N01 | Parent post does not exist ⚠ quirk | `GET /posts/9999/comments` | 200; `[]` (not 404) |
| TC_POST_COMMENTS_N02 | Non-numeric parent id ⚠ quirk | `GET /posts/abc/comments` | 200; `[]` (not 404) |
| TC_POST_COMMENTS_E01 | Comments for the last post | `GET /posts/100/comments` | 200; 5 comments, ids 496–500 |

## 4. GET `/comments?postId={id}` — filter route

| ID | Title | Request | Expected |
|---|---|---|---|
| TC_COMMENTS_FILTER_P01 | Filter route equals nested route | `GET /comments?postId=1` vs `GET /posts/1/comments` | both 200; identical arrays (same 5 ids, same content) |
| TC_COMMENTS_FILTER_P02 | Filter by a unique field | `GET /comments?email=Eliseo@gardner.biz` | 200; exactly 1 comment (id 1) |
| TC_COMMENTS_FILTER_N01 | Empty filter value | `GET /comments?postId=` | 200; `[]` |
| TC_COMMENTS_FILTER_E01 | Repeated param combines with OR | `GET /comments?postId=1&postId=2` | 200; 10 comments; every `postId` ∈ {1, 2} |
| TC_COMMENTS_FILTER_E02 | Filter param name is case-sensitive | `GET /comments?postid=1` | 200; filter ignored → all 500 comments |

## 5. POST `/posts` — create

| ID | Title | Request | Expected |
|---|---|---|---|
| TC_POST_CREATE_P01 | Create with valid body | `POST /posts` `{"title":"foo","body":"bar","userId":1}` | **201**; echoes `title`, `body`, `userId`; `id` = 101 |
| TC_POST_CREATE_N01 | POST to an item URL | `POST /posts/1` `{"title":"x"}` | 404; `{}` |
| TC_POST_CREATE_E01 | Empty body — no required-field validation ⚠ quirk | `POST /posts` `{}` | 201; `{"id":101}` (ideally 400) |
| TC_POST_CREATE_E02 | Wrong types + unknown fields — no schema validation ⚠ quirk | `POST /posts` `{"title":"x","body":"y","userId":"abc","extra":true}` | 201; all four fields echoed unchanged (`userId` stays string) + `id` 101 |
| TC_POST_CREATE_E03 | Client-supplied id is ignored | `POST /posts` `{"id":5,"title":"x","body":"y","userId":1}` | 201; `id` = 101, not 5 |
| TC_POST_CREATE_E04 | Unicode, emoji, HTML and 10,000-char body | `POST /posts` `{"title":"ü 😀 <script>","body":"a"×10000,"userId":1}` | 201; `title` and `body` echoed byte-for-byte (no escaping/truncation) |
| TC_POST_CREATE_E05 | Non-JSON content type | `POST /posts` `Content-type: text/plain`, body `title=foo` | 201; `{"id":101}` — body silently ignored |
| TC_POST_CREATE_E06 | Create via nested route ⚠ quirk | `POST /posts/1/comments` `{"name":"n","email":"e@x.com","body":"b"}` | 201; `postId` = `"1"` (**string**, not number); `id` = 501 |

## 6. PUT `/posts/{id}` — full replace

| ID | Title | Request | Expected |
|---|---|---|---|
| TC_POST_PUT_P01 | Replace with full valid body | `PUT /posts/1` `{"id":1,"title":"foo","body":"bar","userId":1}` | 200; echoes body exactly |
| TC_POST_PUT_N01 | Replace a non-existent post ⚠ quirk | `PUT /posts/9999` full body | **500**, non-JSON `TypeError` text (ideally 404) |
| TC_POST_PUT_E01 | Partial body drops omitted fields (true replace) | `PUT /posts/1` `{"title":"only"}` | 200; `{"title":"only","id":1}` — `userId`/`body` absent |
| TC_POST_PUT_E02 | Body id conflicts with URL id | `PUT /posts/1` `{"id":2,...}` | 200; response `id` = 1 (URL wins) |

## 7. PATCH `/posts/{id}` — partial update

| ID | Title | Request | Expected |
|---|---|---|---|
| TC_POST_PATCH_P01 | Patch one field | `PATCH /posts/1` `{"title":"foo"}` | 200; `title` = "foo"; `userId`, `id`, `body` unchanged from original |
| TC_POST_PATCH_N01 | Patch a non-existent post ⚠ quirk | `PATCH /posts/9999` `{"title":"x"}` | 200; `{"title":"x"}` (ideally 404) |
| TC_POST_PATCH_E01 | Empty patch is a no-op | `PATCH /posts/1` `{}` | 200; original post returned unchanged |
| TC_POST_PATCH_E02 | Unknown field is merged in | `PATCH /posts/1` `{"newField":"x"}` | 200; original fields + `newField` = "x" |
| TC_POST_PATCH_E03 | Body id overrides URL id ⚠ quirk | `PATCH /posts/1` `{"id":77}` | 200; response `id` = 77 (opposite of PUT, see TC_POST_PUT_E02) |
| TC_POST_PATCH_E04 | Null value is stored, not removed | `PATCH /posts/1` `{"title":null}` | 200; `title` = `null`, key still present |

## 8. DELETE `/posts/{id}`

| ID | Title | Request | Expected |
|---|---|---|---|
| TC_POST_DELETE_P01 | Delete existing post | `DELETE /posts/1` | 200; `{}` |
| TC_POST_DELETE_N01 | Delete non-existent post ⚠ quirk | `DELETE /posts/9999` | 200; `{}` (ideally 404) |
| TC_POST_DELETE_E01 | Delete is idempotent | `DELETE /posts/1` twice | both 200; `{}` |

## 9. Cross-cutting (asserted once, applies to every endpoint)

| ID | Title | Request | Expected |
|---|---|---|---|
| TC_API_P01 | Resource collection sizes | `GET` each of `/posts`, `/comments`, `/albums`, `/photos`, `/todos`, `/users` | 200; counts 100 / 500 / 100 / 5000 / 200 / 10 |
| TC_API_P02 | JSON content-type header | `GET /posts/1` | `content-type: application/json; charset=utf-8` |
| TC_API_N01 | Unknown resource | `GET /nonexistent` | 404; `{}` |
| TC_API_N02 | Write verbs on the collection URL | `PUT` / `PATCH` / `DELETE /posts` | 404; `{}` for each |
| TC_API_N03 | Malformed JSON body ⚠ quirk | `POST /posts`, `PUT /posts/1`, `PATCH /posts/1` with `{bad json` | **500**, non-JSON `SyntaxError` text (ideally 400) |
| TC_API_E01 | Writes are faked, not persisted | POST → `GET /posts/101`; PUT/PATCH/DELETE `/posts/1` → `GET /posts/1` | `GET /posts/101` = 404; `GET /posts/1` still returns the original record |
| TC_API_E02 | Resource path is case-insensitive | `GET /Posts/1` | 200; same record as `/posts/1` |
| TC_API_E03 | HEAD request | `HEAD /posts/1` | 200; empty body |
| TC_API_E04 | CORS preflight | `OPTIONS /posts` | 204; empty body |

---

## Summary

| Endpoint | Positive | Negative | Edge | Total |
|---|---|---|---|---|
| GET /posts | 5 | 2 | 6 | 13 |
| GET /posts/{id} | 1 | 3 | 4 | 8 |
| GET /posts/{id}/comments | 2 | 2 | 1 | 5 |
| GET /comments?postId= | 2 | 1 | 2 | 5 |
| POST /posts | 1 | 1 | 6 | 8 |
| PUT /posts/{id} | 1 | 1 | 2 | 4 |
| PATCH /posts/{id} | 1 | 1 | 4 | 6 |
| DELETE /posts/{id} | 1 | 1 | 1 | 3 |
| Cross-cutting | 2 | 3 | 4 | 9 |
| **Total** | **16** | **15** | **30** | **61** |

## Known quirks (observed, asserted as-is)

JSONPlaceholder is a json-server instance with no validation and no persistence. These cases
assert today's real behaviour; if the API ever "fixes" them, the test fails and flags the change:

- No request validation: empty / wrong-typed / extra-field bodies are accepted (TC_POST_CREATE_E01, E02).
- Not-found on writes is inconsistent: PUT → 500, PATCH → 200, DELETE → 200 (TC_POST_PUT_N01, TC_POST_PATCH_N01, TC_POST_DELETE_N01). Only GET returns 404.
- Nested routes never 404 for a missing parent (TC_POST_COMMENTS_N01, N02).
- Malformed JSON → 500 with a plain-text stack message instead of 400 (TC_API_N03).
- PUT keeps the URL id; PATCH lets the body overwrite it (TC_POST_PUT_E02 vs TC_POST_PATCH_E03).
- Nested POST stores `postId` as a string (TC_POST_CREATE_E06).
