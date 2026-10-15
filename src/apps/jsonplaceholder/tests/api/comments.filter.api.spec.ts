import { test, expect } from '../../fixtures/api.fixture';
import { ApiResult } from '../../../../core/api.client';
import { ApiRecord } from '../../api/models/post.model';
import { CommentApiService } from '../../api/services/comment.api.service';
import { DataParser } from '../../utils/data.parser';
import { ListAssertions } from '../../utils/assertions';
import { TestData } from '../../utils/test.data';

const SHEET = 'CommentsFilterData';

/** GET /comments?... - filter route. Test cases: TEST_CASES.md section 4. */
test.describe('@api @regression GET /comments filter', () => {
  test.beforeAll(async () => {
    await TestData.load();
  });

  async function runFilterCase(
    commentApiService: CommentApiService,
    testCaseId: string,
  ): Promise<{ row: Map<string, string>; result: ApiResult; comments: ApiRecord[] }> {
    const row = await TestData.row(SHEET, testCaseId);
    const query = row.get('query') ?? '';
    const result = await test.step(`Send GET /comments?${query}`, () => commentApiService.filterComments(query));
    await test.step('Verify status code', async () => {
      expect(result.status).toBe(DataParser.int(row.get('expectedStatus')));
    });
    const comments = result.as<ApiRecord[]>();
    await test.step('Verify comment count and id range', async () => {
      ListAssertions.expectIdRange(comments, row);
    });
    return { row, result, comments };
  }

  test('@smoke TC_COMMENTS_FILTER_P01 filter route equals nested route', async ({ commentApiService, postApiService }) => {
    const { row, comments } = await runFilterCase(commentApiService, 'TC_COMMENTS_FILTER_P01');
    const postId = row.get('comparePostId') ?? '';
    const nested = await test.step(`Send GET /posts/${postId}/comments`, () => postApiService.getPostComments(postId));
    await test.step('Verify both routes return identical comments', async () => {
      expect(comments).toEqual(nested.body);
    });
  });

  test('TC_COMMENTS_FILTER_P02 filter by a unique field returns one comment', async ({ commentApiService }) => {
    await runFilterCase(commentApiService, 'TC_COMMENTS_FILTER_P02');
  });

  test('TC_COMMENTS_FILTER_N01 empty filter value returns empty array', async ({ commentApiService }) => {
    await runFilterCase(commentApiService, 'TC_COMMENTS_FILTER_N01');
  });

  test('TC_COMMENTS_FILTER_E01 repeated param combines with OR', async ({ commentApiService }) => {
    const { row, comments } = await runFilterCase(commentApiService, 'TC_COMMENTS_FILTER_E01');
    await test.step('Verify every comment belongs to one of the requested posts', async () => {
      ListAssertions.expectFieldIn(comments, 'postId', DataParser.list(row.get('allowedPostIds')));
    });
  });

  test('TC_COMMENTS_FILTER_E02 filter param name is case-sensitive', async ({ commentApiService }) => {
    await runFilterCase(commentApiService, 'TC_COMMENTS_FILTER_E02');
  });
});
