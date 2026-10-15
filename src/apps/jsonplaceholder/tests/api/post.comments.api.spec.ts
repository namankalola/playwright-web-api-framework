import { test, expect } from '../../fixtures/api.fixture';
import { ApiResult } from '../../../../core/api.client';
import { ApiRecord, Comment } from '../../api/models/post.model';
import { PostApiService } from '../../api/services/post.api.service';
import { DataParser } from '../../utils/data.parser';
import { ListAssertions } from '../../utils/assertions';
import { TestData } from '../../utils/test.data';

const SHEET = 'PostCommentsData';

/** GET /posts/{id}/comments - nested route. Test cases: TEST_CASES.md section 3. */
test.describe('@api @regression GET /posts/{id}/comments', () => {
  test.beforeAll(async () => {
    await TestData.load();
  });

  async function runCommentsCase(
    postApiService: PostApiService,
    testCaseId: string,
  ): Promise<{ row: Map<string, string>; result: ApiResult; comments: ApiRecord[] }> {
    const row = await TestData.row(SHEET, testCaseId);
    const postId = row.get('postId') ?? '';
    const result = await test.step(`Send GET /posts/${postId}/comments`, () => postApiService.getPostComments(postId));
    await test.step('Verify status code', async () => {
      expect(result.status).toBe(DataParser.int(row.get('expectedStatus')));
    });
    const comments = result.as<ApiRecord[]>();
    await test.step('Verify comment count and id range', async () => {
      ListAssertions.expectIdRange(comments, row);
    });
    return { row, result, comments };
  }

  test('@smoke TC_POST_COMMENTS_P01 comments for a post with valid schema', async ({ postApiService }) => {
    const { row, comments } = await runCommentsCase(postApiService, 'TC_POST_COMMENTS_P01');
    await test.step('Verify every comment belongs to the requested post', async () => {
      ListAssertions.expectFieldIn(comments, 'postId', [row.get('postId') ?? '']);
    });
    await test.step('Verify every comment matches the schema', async () => {
      ListAssertions.expectSchema(comments, row.get('schema'));
    });
  });

  test('TC_POST_COMMENTS_P02 comment emails are well-formed', async ({ postApiService }) => {
    const { row, result } = await runCommentsCase(postApiService, 'TC_POST_COMMENTS_P02');
    await test.step('Verify every email matches the email pattern', async () => {
      const pattern = new RegExp(row.get('emailPattern') ?? '');
      const invalid = result.as<Comment[]>().filter((c) => !pattern.test(c.email)).map((c) => c.email);
      expect(invalid).toEqual([]);
    });
  });

  test('TC_POST_COMMENTS_N01 non-existent parent post returns 200 with empty array', async ({ postApiService }) => {
    await runCommentsCase(postApiService, 'TC_POST_COMMENTS_N01');
  });

  test('TC_POST_COMMENTS_N02 non-numeric parent id returns 200 with empty array', async ({ postApiService }) => {
    await runCommentsCase(postApiService, 'TC_POST_COMMENTS_N02');
  });

  test('TC_POST_COMMENTS_E01 comments for the last post', async ({ postApiService }) => {
    await runCommentsCase(postApiService, 'TC_POST_COMMENTS_E01');
  });
});
