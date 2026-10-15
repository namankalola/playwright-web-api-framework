import ExcelJS from 'exceljs';
import * as path from 'path';

/**
 * One-time/CI-time generator for jsonplaceholder test data.
 * Run with: npm run generate:testdata:jsonplaceholder
 *
 * One sheet per endpoint group, one row (or row group) per test case in
 * `src/apps/jsonplaceholder/TEST_CASES.md`. Every expected value was observed
 * live against https://jsonplaceholder.typicode.com - see TEST_CASES.md
 * "Known quirks" for where that differs from textbook REST behaviour.
 *
 * Cells holding request bodies / expected responses are JSON text, parsed by
 * `DataParser` in the spec. Blank cell = column not used by that row.
 */
type Row = Record<string, string | number>;

function addSheet(workbook: ExcelJS.Workbook, name: string, headers: string[], rows: Row[]): void {
  const sheet = workbook.addWorksheet(name);
  sheet.columns = headers.map((header) => ({ header, key: header, width: header === 'testCaseId' ? 26 : 18 }));
  sheet.addRows(rows);
}

const POST_SCHEMA = 'userId:number|id:number|title:string|body:string';
const COMMENT_SCHEMA = 'postId:number|id:number|name:string|email:string|body:string';
const POST_1_TITLE = 'sunt aut facere repellat provident occaecati excepturi optio reprehenderit';
const VALID_POST = JSON.stringify({ title: 'foo', body: 'bar', userId: 1 });
const FULL_POST_1 = JSON.stringify({ id: 1, title: 'foo', body: 'bar', userId: 1 });

async function generateSampleData(): Promise<void> {
  const workbook = new ExcelJS.Workbook();

  // ---- GET /posts : list, filter, paginate, sort ----
  addSheet(
    workbook,
    'PostsListData',
    ['testCaseId', 'query', 'expectedStatus', 'expectedCount', 'expectedFirstId', 'expectedLastId', 'expectedTotalCount', 'schema', 'filterField', 'filterValue'],
    [
      { testCaseId: 'TC_POSTS_LIST_P01', query: '', expectedStatus: 200, expectedCount: 100, expectedFirstId: 1, expectedLastId: 100, schema: POST_SCHEMA },
      { testCaseId: 'TC_POSTS_LIST_P02', query: '', expectedStatus: 200, expectedCount: 100, expectedFirstId: 1, expectedLastId: 100 },
      { testCaseId: 'TC_POSTS_LIST_P03', query: 'userId=1', expectedStatus: 200, expectedCount: 10, filterField: 'userId', filterValue: 1 },
      { testCaseId: 'TC_POSTS_LIST_P04', query: '_page=2&_limit=10', expectedStatus: 200, expectedCount: 10, expectedFirstId: 11, expectedLastId: 20, expectedTotalCount: 100 },
      { testCaseId: 'TC_POSTS_LIST_P05', query: '_sort=id&_order=desc', expectedStatus: 200, expectedCount: 100, expectedFirstId: 100, expectedLastId: 1 },
      { testCaseId: 'TC_POSTS_LIST_N01', query: 'userId=999', expectedStatus: 200, expectedCount: 0 },
      { testCaseId: 'TC_POSTS_LIST_N02', query: 'userId=abc', expectedStatus: 200, expectedCount: 0 },
      { testCaseId: 'TC_POSTS_LIST_E01', query: 'userId=1&id=3', expectedStatus: 200, expectedCount: 1, expectedFirstId: 3, expectedLastId: 3, filterField: 'userId', filterValue: 1 },
      { testCaseId: 'TC_POSTS_LIST_E02', query: '_limit=0', expectedStatus: 200, expectedCount: 0 },
      { testCaseId: 'TC_POSTS_LIST_E03', query: '_page=999&_limit=10', expectedStatus: 200, expectedCount: 0 },
      { testCaseId: 'TC_POSTS_LIST_E04', query: '_start=95&_end=105', expectedStatus: 200, expectedCount: 5, expectedFirstId: 96, expectedLastId: 100 },
      { testCaseId: 'TC_POSTS_LIST_E05', query: 'unknown=x', expectedStatus: 200, expectedCount: 100, expectedFirstId: 1, expectedLastId: 100 },
      { testCaseId: 'TC_POSTS_LIST_E06', query: '', expectedStatus: 200, expectedCount: 100, expectedFirstId: 1, expectedLastId: 100 },
    ],
  );

  // ---- GET /posts/{id} ----
  // postId is text on purpose: 'abc', '1.5', '01', '-1' must reach the URL verbatim.
  addSheet(
    workbook,
    'PostByIdData',
    ['testCaseId', 'postId', 'expectedStatus', 'expectedUserId', 'expectedTitle', 'expectedBodyPrefix', 'expectedResponse'],
    [
      { testCaseId: 'TC_POST_GET_P01', postId: '1', expectedStatus: 200, expectedUserId: 1, expectedTitle: POST_1_TITLE, expectedBodyPrefix: 'quia et suscipit' },
      { testCaseId: 'TC_POST_GET_N01', postId: '101', expectedStatus: 404, expectedResponse: '{}' },
      { testCaseId: 'TC_POST_GET_N02', postId: 'abc', expectedStatus: 404, expectedResponse: '{}' },
      { testCaseId: 'TC_POST_GET_N03', postId: '-1', expectedStatus: 404, expectedResponse: '{}' },
      { testCaseId: 'TC_POST_GET_E01', postId: '100', expectedStatus: 200, expectedUserId: 10, expectedTitle: 'at nam consequatur ea labore ea harum' },
      { testCaseId: 'TC_POST_GET_E02', postId: '0', expectedStatus: 404, expectedResponse: '{}' },
      { testCaseId: 'TC_POST_GET_E03', postId: '1.5', expectedStatus: 404, expectedResponse: '{}' },
      { testCaseId: 'TC_POST_GET_E04', postId: '01', expectedStatus: 404, expectedResponse: '{}' },
    ],
  );

  // ---- GET /posts/{id}/comments ----
  addSheet(
    workbook,
    'PostCommentsData',
    ['testCaseId', 'postId', 'expectedStatus', 'expectedCount', 'expectedFirstId', 'expectedLastId', 'schema', 'emailPattern'],
    [
      { testCaseId: 'TC_POST_COMMENTS_P01', postId: '1', expectedStatus: 200, expectedCount: 5, expectedFirstId: 1, expectedLastId: 5, schema: COMMENT_SCHEMA },
      { testCaseId: 'TC_POST_COMMENTS_P02', postId: '1', expectedStatus: 200, expectedCount: 5, emailPattern: '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$' },
      { testCaseId: 'TC_POST_COMMENTS_N01', postId: '9999', expectedStatus: 200, expectedCount: 0 },
      { testCaseId: 'TC_POST_COMMENTS_N02', postId: 'abc', expectedStatus: 200, expectedCount: 0 },
      { testCaseId: 'TC_POST_COMMENTS_E01', postId: '100', expectedStatus: 200, expectedCount: 5, expectedFirstId: 496, expectedLastId: 500 },
    ],
  );

  // ---- GET /comments?... (filter route) ----
  addSheet(
    workbook,
    'CommentsFilterData',
    ['testCaseId', 'query', 'comparePostId', 'expectedStatus', 'expectedCount', 'expectedFirstId', 'expectedLastId', 'allowedPostIds'],
    [
      { testCaseId: 'TC_COMMENTS_FILTER_P01', query: 'postId=1', comparePostId: '1', expectedStatus: 200, expectedCount: 5, expectedFirstId: 1, expectedLastId: 5 },
      { testCaseId: 'TC_COMMENTS_FILTER_P02', query: 'email=Eliseo@gardner.biz', expectedStatus: 200, expectedCount: 1, expectedFirstId: 1, expectedLastId: 1 },
      { testCaseId: 'TC_COMMENTS_FILTER_N01', query: 'postId=', expectedStatus: 200, expectedCount: 0 },
      { testCaseId: 'TC_COMMENTS_FILTER_E01', query: 'postId=1&postId=2', expectedStatus: 200, expectedCount: 10, expectedFirstId: 1, expectedLastId: 10, allowedPostIds: '1,2' },
      { testCaseId: 'TC_COMMENTS_FILTER_E02', query: 'postid=1', expectedStatus: 200, expectedCount: 500, expectedFirstId: 1, expectedLastId: 500 },
    ],
  );

  // ---- POST /posts ----
  // target: collection = /posts, item = /posts/{postId}, nestedComments = /posts/{postId}/comments
  // expectEcho=Y -> expected response is { ...requestBody, id: expectedId }; otherwise expectedResponse is exact.
  addSheet(
    workbook,
    'PostCreateData',
    ['testCaseId', 'target', 'postId', 'requestBody', 'bodyType', 'contentType', 'expectedStatus', 'expectEcho', 'expectedId', 'expectedResponse', 'expectedPostIdType'],
    [
      { testCaseId: 'TC_POST_CREATE_P01', target: 'collection', requestBody: VALID_POST, bodyType: 'json', expectedStatus: 201, expectEcho: 'Y', expectedId: 101 },
      { testCaseId: 'TC_POST_CREATE_N01', target: 'item', postId: '1', requestBody: JSON.stringify({ title: 'x' }), bodyType: 'json', expectedStatus: 404, expectEcho: 'N', expectedResponse: '{}' },
      { testCaseId: 'TC_POST_CREATE_E01', target: 'collection', requestBody: '{}', bodyType: 'json', expectedStatus: 201, expectEcho: 'N', expectedResponse: JSON.stringify({ id: 101 }) },
      { testCaseId: 'TC_POST_CREATE_E02', target: 'collection', requestBody: JSON.stringify({ title: 'x', body: 'y', userId: 'abc', extra: true }), bodyType: 'json', expectedStatus: 201, expectEcho: 'Y', expectedId: 101 },
      { testCaseId: 'TC_POST_CREATE_E03', target: 'collection', requestBody: JSON.stringify({ id: 5, title: 'x', body: 'y', userId: 1 }), bodyType: 'json', expectedStatus: 201, expectEcho: 'Y', expectedId: 101 },
      { testCaseId: 'TC_POST_CREATE_E04', target: 'collection', requestBody: JSON.stringify({ title: 'ü 😀 <script>', body: 'a'.repeat(10000), userId: 1 }), bodyType: 'json', expectedStatus: 201, expectEcho: 'Y', expectedId: 101 },
      { testCaseId: 'TC_POST_CREATE_E05', target: 'collection', requestBody: 'title=foo', bodyType: 'raw', contentType: 'text/plain', expectedStatus: 201, expectEcho: 'N', expectedResponse: JSON.stringify({ id: 101 }) },
      {
        testCaseId: 'TC_POST_CREATE_E06', target: 'nestedComments', postId: '1',
        requestBody: JSON.stringify({ name: 'n', email: 'e@x.com', body: 'b' }), bodyType: 'json', expectedStatus: 201, expectEcho: 'N',
        expectedResponse: JSON.stringify({ name: 'n', email: 'e@x.com', body: 'b', postId: '1', id: 501 }), expectedPostIdType: 'string',
      },
    ],
  );

  // ---- PUT /posts/{id} ----
  addSheet(
    workbook,
    'PostReplaceData',
    ['testCaseId', 'postId', 'requestBody', 'expectedStatus', 'expectedResponse', 'expectedErrorText', 'absentFields'],
    [
      { testCaseId: 'TC_POST_PUT_P01', postId: '1', requestBody: FULL_POST_1, expectedStatus: 200, expectedResponse: FULL_POST_1 },
      { testCaseId: 'TC_POST_PUT_N01', postId: '9999', requestBody: JSON.stringify({ id: 9999, title: 'foo', body: 'bar', userId: 1 }), expectedStatus: 500, expectedErrorText: 'TypeError' },
      { testCaseId: 'TC_POST_PUT_E01', postId: '1', requestBody: JSON.stringify({ title: 'only' }), expectedStatus: 200, expectedResponse: JSON.stringify({ title: 'only', id: 1 }), absentFields: 'userId,body' },
      { testCaseId: 'TC_POST_PUT_E02', postId: '1', requestBody: JSON.stringify({ id: 2, title: 'foo', body: 'bar', userId: 1 }), expectedStatus: 200, expectedResponse: FULL_POST_1 },
    ],
  );

  // ---- PATCH /posts/{id} ----
  // Expected response = { ...GET /posts/{postId} before the patch, ...requestBody }.
  addSheet(
    workbook,
    'PostPatchData',
    ['testCaseId', 'postId', 'requestBody', 'expectedStatus', 'expectedId'],
    [
      { testCaseId: 'TC_POST_PATCH_P01', postId: '1', requestBody: JSON.stringify({ title: 'foo' }), expectedStatus: 200, expectedId: 1 },
      { testCaseId: 'TC_POST_PATCH_N01', postId: '9999', requestBody: JSON.stringify({ title: 'x' }), expectedStatus: 200 },
      { testCaseId: 'TC_POST_PATCH_E01', postId: '1', requestBody: '{}', expectedStatus: 200, expectedId: 1 },
      { testCaseId: 'TC_POST_PATCH_E02', postId: '1', requestBody: JSON.stringify({ newField: 'x' }), expectedStatus: 200, expectedId: 1 },
      { testCaseId: 'TC_POST_PATCH_E03', postId: '1', requestBody: JSON.stringify({ id: 77 }), expectedStatus: 200, expectedId: 77 },
      { testCaseId: 'TC_POST_PATCH_E04', postId: '1', requestBody: JSON.stringify({ title: null }), expectedStatus: 200, expectedId: 1 },
    ],
  );

  // ---- DELETE /posts/{id} ----
  addSheet(
    workbook,
    'PostDeleteData',
    ['testCaseId', 'postId', 'repeat', 'expectedStatus', 'expectedResponse'],
    [
      { testCaseId: 'TC_POST_DELETE_P01', postId: '1', repeat: 1, expectedStatus: 200, expectedResponse: '{}' },
      { testCaseId: 'TC_POST_DELETE_N01', postId: '9999', repeat: 1, expectedStatus: 200, expectedResponse: '{}' },
      { testCaseId: 'TC_POST_DELETE_E01', postId: '1', repeat: 2, expectedStatus: 200, expectedResponse: '{}' },
    ],
  );

  // ---- Cross-cutting ----
  // Multi-row test cases (P01, N02, N03, E01) share a testCaseId and are read with getAllRowsForTestID.
  addSheet(
    workbook,
    'ApiCommonData',
    ['testCaseId', 'method', 'resource', 'postId', 'path', 'requestBody', 'bodyType', 'expectedStatus', 'expectedCount', 'expectedResponse', 'expectedErrorText', 'headerName', 'headerValue', 'verifyPostId', 'verifyStatus'],
    [
      { testCaseId: 'TC_API_P01', method: 'GET', resource: 'posts', expectedStatus: 200, expectedCount: 100 },
      { testCaseId: 'TC_API_P01', method: 'GET', resource: 'comments', expectedStatus: 200, expectedCount: 500 },
      { testCaseId: 'TC_API_P01', method: 'GET', resource: 'albums', expectedStatus: 200, expectedCount: 100 },
      { testCaseId: 'TC_API_P01', method: 'GET', resource: 'photos', expectedStatus: 200, expectedCount: 5000 },
      { testCaseId: 'TC_API_P01', method: 'GET', resource: 'todos', expectedStatus: 200, expectedCount: 200 },
      { testCaseId: 'TC_API_P01', method: 'GET', resource: 'users', expectedStatus: 200, expectedCount: 10 },
      { testCaseId: 'TC_API_P02', method: 'GET', postId: '1', expectedStatus: 200, headerName: 'content-type', headerValue: 'application/json; charset=utf-8' },
      { testCaseId: 'TC_API_N01', method: 'GET', resource: 'nonexistent', expectedStatus: 404, expectedResponse: '{}' },
      { testCaseId: 'TC_API_N02', method: 'PUT', resource: 'posts', requestBody: JSON.stringify({ title: 'x' }), bodyType: 'json', expectedStatus: 404, expectedResponse: '{}' },
      { testCaseId: 'TC_API_N02', method: 'PATCH', resource: 'posts', requestBody: JSON.stringify({ title: 'x' }), bodyType: 'json', expectedStatus: 404, expectedResponse: '{}' },
      { testCaseId: 'TC_API_N02', method: 'DELETE', resource: 'posts', expectedStatus: 404, expectedResponse: '{}' },
      { testCaseId: 'TC_API_N03', method: 'POST', requestBody: '{bad json', bodyType: 'raw', expectedStatus: 500, expectedErrorText: 'SyntaxError' },
      { testCaseId: 'TC_API_N03', method: 'PUT', postId: '1', requestBody: '{bad json', bodyType: 'raw', expectedStatus: 500, expectedErrorText: 'SyntaxError' },
      { testCaseId: 'TC_API_N03', method: 'PATCH', postId: '1', requestBody: '{bad json', bodyType: 'raw', expectedStatus: 500, expectedErrorText: 'SyntaxError' },
      { testCaseId: 'TC_API_E01', method: 'POST', requestBody: VALID_POST, bodyType: 'json', expectedStatus: 201, verifyPostId: '101', verifyStatus: 404 },
      { testCaseId: 'TC_API_E01', method: 'PUT', postId: '1', requestBody: FULL_POST_1, bodyType: 'json', expectedStatus: 200, verifyPostId: '1', verifyStatus: 200 },
      { testCaseId: 'TC_API_E01', method: 'PATCH', postId: '1', requestBody: JSON.stringify({ title: 'foo' }), bodyType: 'json', expectedStatus: 200, verifyPostId: '1', verifyStatus: 200 },
      { testCaseId: 'TC_API_E01', method: 'DELETE', postId: '1', expectedStatus: 200, verifyPostId: '1', verifyStatus: 200 },
      { testCaseId: 'TC_API_E02', method: 'GET', path: '/Posts/1', postId: '1', expectedStatus: 200 },
      { testCaseId: 'TC_API_E03', method: 'HEAD', postId: '1', expectedStatus: 200, expectedResponse: '' },
      { testCaseId: 'TC_API_E04', method: 'OPTIONS', resource: 'posts', expectedStatus: 204, expectedResponse: '' },
    ],
  );

  const outputPath = path.resolve(__dirname, '../data/testdata.xlsx');
  await workbook.xlsx.writeFile(outputPath);
  // eslint-disable-next-line no-console
  console.log(`Sample test data written to ${outputPath}`);
}

generateSampleData().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
