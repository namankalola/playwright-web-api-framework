import { test, expect } from '../../fixtures/api.fixture';
import { ApiResult } from '../../../../core/api.client';
import { ApiRecord } from '../../api/models/post.model';
import { PostApiService } from '../../api/services/post.api.service';
import { DataParser } from '../../utils/data.parser';
import { TestData } from '../../utils/test.data';

const SHEET = 'PostCreateData';

/**
 * POST /posts - create. Test cases: TEST_CASES.md section 5.
 * Expected response per row: `expectEcho=Y` -> request body + server id;
 * otherwise the exact `expectedResponse` JSON.
 */
test.describe('@api @regression POST /posts', () => {
  test.beforeAll(async () => {
    await TestData.load();
  });

  async function runCreateCase(
    postApiService: PostApiService,
    testCaseId: string,
  ): Promise<{ row: Map<string, string>; result: ApiResult; created: ApiRecord }> {
    const row = await TestData.row(SHEET, testCaseId);
    const postId = row.get('postId') ?? '';
    const payload = DataParser.body(row.get('requestBody'), row.get('bodyType'));
    const result = await test.step(`Send POST to ${row.get('target')} target`, () => {
      switch (row.get('target')) {
        case 'item':
          return postApiService.createAtPost(postId, payload);
        case 'nestedComments':
          return postApiService.createPostComment(postId, payload);
        default:
          return postApiService.createPost(payload, row.get('contentType'));
      }
    });
    await test.step('Verify status code', async () => {
      expect(result.status).toBe(DataParser.int(row.get('expectedStatus')));
    });
    await test.step('Verify response body', async () => {
      const expected =
        row.get('expectEcho') === 'Y'
          ? { ...DataParser.json<object>(row.get('requestBody')), id: DataParser.int(row.get('expectedId')) }
          : DataParser.json(row.get('expectedResponse'));
      expect(result.body).toEqual(expected);
    });
    return { row, result, created: result.as<ApiRecord>() };
  }

  test('@smoke TC_POST_CREATE_P01 create with valid body', async ({ postApiService }) => {
    await runCreateCase(postApiService, 'TC_POST_CREATE_P01');
  });

  test('TC_POST_CREATE_N01 POST to an item URL returns 404', async ({ postApiService }) => {
    await runCreateCase(postApiService, 'TC_POST_CREATE_N01');
  });

  test('TC_POST_CREATE_E01 empty body is accepted without validation', async ({ postApiService }) => {
    await runCreateCase(postApiService, 'TC_POST_CREATE_E01');
  });

  test('TC_POST_CREATE_E02 wrong types and unknown fields are echoed unchanged', async ({ postApiService }) => {
    const { row, created } = await runCreateCase(postApiService, 'TC_POST_CREATE_E02');
    await test.step('Verify wrongly-typed userId keeps its original type', async () => {
      const requested = DataParser.json<ApiRecord>(row.get('requestBody'));
      expect(typeof created.userId).toBe(typeof requested?.userId);
    });
  });

  test('TC_POST_CREATE_E03 client-supplied id is ignored', async ({ postApiService }) => {
    const { row, created } = await runCreateCase(postApiService, 'TC_POST_CREATE_E03');
    await test.step('Verify server-assigned id differs from the requested id', async () => {
      expect(created.id).not.toBe(DataParser.json<ApiRecord>(row.get('requestBody'))?.id);
    });
  });

  test('TC_POST_CREATE_E04 unicode, emoji, HTML and long body are echoed byte-for-byte', async ({ postApiService }) => {
    const { row, created } = await runCreateCase(postApiService, 'TC_POST_CREATE_E04');
    await test.step('Verify long body length is preserved', async () => {
      const requested = DataParser.json<ApiRecord>(row.get('requestBody'));
      expect(String(created.body).length).toBe(String(requested?.body).length);
    });
  });

  test('TC_POST_CREATE_E05 non-JSON content type body is ignored', async ({ postApiService }) => {
    await runCreateCase(postApiService, 'TC_POST_CREATE_E05');
  });

  test('TC_POST_CREATE_E06 create via nested route stores postId as string', async ({ postApiService }) => {
    const { row, created } = await runCreateCase(postApiService, 'TC_POST_CREATE_E06');
    await test.step('Verify postId type', async () => {
      expect(typeof created.postId).toBe(row.get('expectedPostIdType'));
    });
  });
});
