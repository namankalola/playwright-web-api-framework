import { test, expect } from '../../fixtures/api.fixture';
import { ApiResult } from '../../../../core/api.client';
import { PostApiService } from '../../api/services/post.api.service';
import { DataParser } from '../../utils/data.parser';
import { TestData } from '../../utils/test.data';

const SHEET = 'PostPatchData';

/**
 * PATCH /posts/{id} - partial update. Test cases: TEST_CASES.md section 7.
 * Expected response = record before the patch (GET) merged with the patch body.
 */
test.describe('@api @regression PATCH /posts/{id}', () => {
  test.beforeAll(async () => {
    await TestData.load();
  });

  async function runPatchCase(
    postApiService: PostApiService,
    testCaseId: string,
  ): Promise<{ row: Map<string, string>; result: ApiResult }> {
    const row = await TestData.row(SHEET, testCaseId);
    const postId = row.get('postId') ?? '';
    const patch = DataParser.json<object>(row.get('requestBody'));
    const original = await test.step(`Fetch original /posts/${postId}`, () => postApiService.getPost(postId));
    const result = await test.step(`Send PATCH /posts/${postId}`, () => postApiService.patchPost(postId, patch));
    await test.step('Verify status code', async () => {
      expect(result.status).toBe(DataParser.int(row.get('expectedStatus')));
    });
    await test.step('Verify response is the original record merged with the patch', async () => {
      expect(result.body).toEqual({ ...(original.body as object), ...patch });
    });
    return { row, result };
  }

  async function expectId(result: ApiResult, row: Map<string, string>): Promise<void> {
    await test.step('Verify response id', async () => {
      expect(result.body).toHaveProperty('id', DataParser.int(row.get('expectedId')));
    });
  }

  test('@smoke TC_POST_PATCH_P01 patch one field', async ({ postApiService }) => {
    const { row, result } = await runPatchCase(postApiService, 'TC_POST_PATCH_P01');
    await expectId(result, row);
  });

  test('TC_POST_PATCH_N01 patch a non-existent post returns 200 with only the patch', async ({ postApiService }) => {
    const { result } = await runPatchCase(postApiService, 'TC_POST_PATCH_N01');
    await test.step('Verify no record id is returned', async () => {
      expect(result.body).not.toHaveProperty('id');
    });
  });

  test('TC_POST_PATCH_E01 empty patch is a no-op', async ({ postApiService }) => {
    const { row, result } = await runPatchCase(postApiService, 'TC_POST_PATCH_E01');
    await expectId(result, row);
  });

  test('TC_POST_PATCH_E02 unknown field is merged in', async ({ postApiService }) => {
    const { row, result } = await runPatchCase(postApiService, 'TC_POST_PATCH_E02');
    await expectId(result, row);
  });

  test('TC_POST_PATCH_E03 body id overrides URL id', async ({ postApiService }) => {
    const { row, result } = await runPatchCase(postApiService, 'TC_POST_PATCH_E03');
    await expectId(result, row);
  });

  test('TC_POST_PATCH_E04 null value is stored, not removed', async ({ postApiService }) => {
    const { row, result } = await runPatchCase(postApiService, 'TC_POST_PATCH_E04');
    await expectId(result, row);
  });
});
