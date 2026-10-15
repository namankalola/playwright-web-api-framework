import { test, expect } from '../../fixtures/api.fixture';
import { ApiResult } from '../../../../core/api.client';
import { PostApiService } from '../../api/services/post.api.service';
import { DataParser } from '../../utils/data.parser';
import { TestData } from '../../utils/test.data';

const SHEET = 'PostReplaceData';

/** PUT /posts/{id} - full replace. Test cases: TEST_CASES.md section 6. */
test.describe('@api @regression PUT /posts/{id}', () => {
  test.beforeAll(async () => {
    await TestData.load();
  });

  async function sendReplace(
    postApiService: PostApiService,
    testCaseId: string,
  ): Promise<{ row: Map<string, string>; result: ApiResult }> {
    const row = await TestData.row(SHEET, testCaseId);
    const postId = row.get('postId') ?? '';
    const result = await test.step(`Send PUT /posts/${postId}`, () =>
      postApiService.replacePost(postId, DataParser.json(row.get('requestBody'))),
    );
    await test.step('Verify status code', async () => {
      expect(result.status).toBe(DataParser.int(row.get('expectedStatus')));
    });
    return { row, result };
  }

  async function expectExactResponse(result: ApiResult, row: Map<string, string>): Promise<void> {
    await test.step('Verify response body', async () => {
      expect(result.body).toEqual(DataParser.json(row.get('expectedResponse')));
    });
  }

  test('@smoke TC_POST_PUT_P01 replace with full valid body', async ({ postApiService }) => {
    const { row, result } = await sendReplace(postApiService, 'TC_POST_PUT_P01');
    await expectExactResponse(result, row);
  });

  test('TC_POST_PUT_N01 replace a non-existent post returns 500', async ({ postApiService }) => {
    const { row, result } = await sendReplace(postApiService, 'TC_POST_PUT_N01');
    await test.step('Verify plain-text server error', async () => {
      expect(result.body).toBeUndefined();
      expect(result.text).toContain(row.get('expectedErrorText'));
    });
  });

  test('TC_POST_PUT_E01 partial body drops omitted fields', async ({ postApiService }) => {
    const { row, result } = await sendReplace(postApiService, 'TC_POST_PUT_E01');
    await expectExactResponse(result, row);
    await test.step('Verify omitted fields are absent', async () => {
      for (const field of DataParser.list(row.get('absentFields'))) {
        expect(result.body).not.toHaveProperty(field);
      }
    });
  });

  test('TC_POST_PUT_E02 body id conflicting with URL id - URL wins', async ({ postApiService }) => {
    const { row, result } = await sendReplace(postApiService, 'TC_POST_PUT_E02');
    await expectExactResponse(result, row);
  });
});
