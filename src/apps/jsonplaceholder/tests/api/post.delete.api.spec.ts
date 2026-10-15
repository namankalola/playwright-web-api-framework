import { test, expect } from '../../fixtures/api.fixture';
import { PostApiService } from '../../api/services/post.api.service';
import { DataParser } from '../../utils/data.parser';
import { TestData } from '../../utils/test.data';

const SHEET = 'PostDeleteData';

/** DELETE /posts/{id}. Test cases: TEST_CASES.md section 8. */
test.describe('@api @regression DELETE /posts/{id}', () => {
  test.beforeAll(async () => {
    await TestData.load();
  });

  /** Sends DELETE `repeat` times; every attempt must return the same status and body. */
  async function runDeleteCase(postApiService: PostApiService, testCaseId: string): Promise<void> {
    const row = await TestData.row(SHEET, testCaseId);
    const postId = row.get('postId') ?? '';
    const repeat = DataParser.int(row.get('repeat'));
    for (let attempt = 1; attempt <= repeat; attempt++) {
      const result = await test.step(`Send DELETE /posts/${postId} (attempt ${attempt} of ${repeat})`, () =>
        postApiService.deletePost(postId),
      );
      await test.step(`Verify status code and body (attempt ${attempt})`, async () => {
        expect(result.status).toBe(DataParser.int(row.get('expectedStatus')));
        expect(result.body).toEqual(DataParser.json(row.get('expectedResponse')));
      });
    }
  }

  test('@smoke TC_POST_DELETE_P01 delete existing post', async ({ postApiService }) => {
    await runDeleteCase(postApiService, 'TC_POST_DELETE_P01');
  });

  test('TC_POST_DELETE_N01 delete non-existent post returns 200', async ({ postApiService }) => {
    await runDeleteCase(postApiService, 'TC_POST_DELETE_N01');
  });

  test('TC_POST_DELETE_E01 delete is idempotent', async ({ postApiService }) => {
    await runDeleteCase(postApiService, 'TC_POST_DELETE_E01');
  });
});
