import { test, expect } from '../../fixtures/api.fixture';
import { ApiResult } from '../../../../core/api.client';
import { ApiRecord } from '../../api/models/post.model';
import { DataParser } from '../../utils/data.parser';
import { ListAssertions } from '../../utils/assertions';
import { TestData } from '../../utils/test.data';

const SHEET = 'PostsListData';

/**
 * GET /posts - list, filter, paginate, sort. Test cases: TEST_CASES.md section 1.
 * Each case sends the request, checks the status, then checks count/first/last id
 * from its Excel row before its own case-specific assertion.
 */
test.describe('@api @regression GET /posts', () => {
  test.beforeAll(async () => {
    await TestData.load();
  });

  async function runListCase(
    testCaseId: string,
    send: (query: string) => Promise<ApiResult>,
  ): Promise<{ row: Map<string, string>; result: ApiResult; posts: ApiRecord[] }> {
    const row = await TestData.row(SHEET, testCaseId);
    const result = await test.step(`Send GET /posts with query "${row.get('query')}"`, () => send(row.get('query') ?? ''));
    await test.step('Verify status code', async () => {
      expect(result.status).toBe(DataParser.int(row.get('expectedStatus')));
    });
    const posts = result.as<ApiRecord[]>();
    await test.step('Verify post count and id range', async () => {
      ListAssertions.expectIdRange(posts, row);
    });
    return { row, result, posts };
  }

  test('@smoke TC_POSTS_LIST_P01 list returns all posts with valid schema', async ({ postApiService }) => {
    const { row, posts } = await runListCase('TC_POSTS_LIST_P01', (q) => postApiService.listPosts(q));
    await test.step('Verify every post matches the schema', async () => {
      ListAssertions.expectSchema(posts, row.get('schema'));
    });
  });

  test('TC_POSTS_LIST_P02 post ids are unique and sequential', async ({ postApiService }) => {
    const { row, posts } = await runListCase('TC_POSTS_LIST_P02', (q) => postApiService.listPosts(q));
    await test.step('Verify ids run first..last with no gaps or duplicates', async () => {
      const first = DataParser.int(row.get('expectedFirstId'));
      const expectedIds = Array.from({ length: DataParser.int(row.get('expectedCount')) }, (_, i) => first + i);
      expect(posts.map((p) => p.id)).toEqual(expectedIds);
    });
  });

  test('@smoke TC_POSTS_LIST_P03 filter by userId', async ({ postApiService }) => {
    const { row, posts } = await runListCase('TC_POSTS_LIST_P03', (q) => postApiService.listPosts(q));
    await test.step('Verify every post matches the filter value', async () => {
      ListAssertions.expectFieldIn(posts, row.get('filterField') ?? '', [row.get('filterValue') ?? '']);
    });
  });

  test('TC_POSTS_LIST_P04 pagination returns the requested page', async ({ postApiService }) => {
    const { row, result } = await runListCase('TC_POSTS_LIST_P04', (q) => postApiService.listPosts(q));
    await test.step('Verify x-total-count header reports the full collection size', async () => {
      expect(result.header('x-total-count')).toBe(row.get('expectedTotalCount'));
    });
  });

  test('TC_POSTS_LIST_P05 sort descending by id', async ({ postApiService }) => {
    const { posts } = await runListCase('TC_POSTS_LIST_P05', (q) => postApiService.listPosts(q));
    await test.step('Verify ids are in strictly descending order', async () => {
      const ids = posts.map((p) => p.id);
      expect(ids).toEqual([...ids].sort((a, b) => b - a));
    });
  });

  test('TC_POSTS_LIST_N01 filter value with no match returns empty array', async ({ postApiService }) => {
    await runListCase('TC_POSTS_LIST_N01', (q) => postApiService.listPosts(q));
  });

  test('TC_POSTS_LIST_N02 filter value of wrong type returns empty array', async ({ postApiService }) => {
    await runListCase('TC_POSTS_LIST_N02', (q) => postApiService.listPosts(q));
  });

  test('TC_POSTS_LIST_E01 two filters combine with AND', async ({ postApiService }) => {
    const { row, posts } = await runListCase('TC_POSTS_LIST_E01', (q) => postApiService.listPosts(q));
    await test.step('Verify the match also satisfies the first filter', async () => {
      ListAssertions.expectFieldIn(posts, row.get('filterField') ?? '', [row.get('filterValue') ?? '']);
    });
  });

  test('TC_POSTS_LIST_E02 _limit=0 returns empty array', async ({ postApiService }) => {
    await runListCase('TC_POSTS_LIST_E02', (q) => postApiService.listPosts(q));
  });

  test('TC_POSTS_LIST_E03 page beyond last page returns empty array', async ({ postApiService }) => {
    await runListCase('TC_POSTS_LIST_E03', (q) => postApiService.listPosts(q));
  });

  test('TC_POSTS_LIST_E04 slice overrunning end of data is truncated', async ({ postApiService }) => {
    await runListCase('TC_POSTS_LIST_E04', (q) => postApiService.listPosts(q));
  });

  test('TC_POSTS_LIST_E05 unknown query param is ignored', async ({ postApiService }) => {
    await runListCase('TC_POSTS_LIST_E05', (q) => postApiService.listPosts(q));
  });

  test('TC_POSTS_LIST_E06 trailing slash on collection returns full list', async ({ postApiService }) => {
    await runListCase('TC_POSTS_LIST_E06', () => postApiService.listPostsWithTrailingSlash());
  });
});
