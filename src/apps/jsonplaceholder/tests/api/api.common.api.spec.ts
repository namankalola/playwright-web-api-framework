import { test, expect } from '../../fixtures/api.fixture';
import { ApiResult } from '../../../../core/api.client';
import { WriteMethod } from '../../api/models/post.model';
import { PostApiService } from '../../api/services/post.api.service';
import { DataParser } from '../../utils/data.parser';
import { TestData } from '../../utils/test.data';

const SHEET = 'ApiCommonData';

/**
 * Cross-cutting behaviour asserted once for the whole API (TEST_CASES.md
 * section 9) instead of being repeated under every endpoint.
 */
test.describe('@api @regression Cross-cutting API behaviour', () => {
  test.beforeAll(async () => {
    await TestData.load();
  });

  /** Dispatches a write verb against /posts (POST) or /posts/{postId} (PUT/PATCH/DELETE). */
  function writePost(postApiService: PostApiService, row: Map<string, string>): Promise<ApiResult> {
    const postId = row.get('postId') ?? '';
    const payload = DataParser.body(row.get('requestBody'), row.get('bodyType'));
    switch (row.get('method') as WriteMethod) {
      case 'POST':
        return postApiService.createPost(payload);
      case 'PUT':
        return postApiService.replacePost(postId, payload);
      case 'PATCH':
        return postApiService.patchPost(postId, payload);
      case 'DELETE':
        return postApiService.deletePost(postId);
    }
  }

  test('@smoke TC_API_P01 resource collection sizes', async ({ resourceApiService }) => {
    for (const row of await TestData.rows(SHEET, 'TC_API_P01')) {
      const resource = row.get('resource') ?? '';
      const result = await test.step(`Send GET /${resource}`, () => resourceApiService.listResource(resource));
      await test.step(`Verify /${resource} status and size`, async () => {
        expect(result.status).toBe(DataParser.int(row.get('expectedStatus')));
        expect(result.as<unknown[]>()).toHaveLength(DataParser.int(row.get('expectedCount')));
      });
    }
  });

  test('TC_API_P02 JSON content-type header', async ({ postApiService }) => {
    const row = await TestData.row(SHEET, 'TC_API_P02');
    const result = await test.step(`Send GET /posts/${row.get('postId')}`, () => postApiService.getPost(row.get('postId') ?? ''));
    await test.step('Verify status code', async () => {
      expect(result.status).toBe(DataParser.int(row.get('expectedStatus')));
    });
    await test.step('Verify content-type header', async () => {
      expect(result.header(row.get('headerName') ?? '')).toBe(row.get('headerValue'));
    });
  });

  test('TC_API_N01 unknown resource returns 404', async ({ resourceApiService }) => {
    const row = await TestData.row(SHEET, 'TC_API_N01');
    const result = await test.step(`Send GET /${row.get('resource')}`, () => resourceApiService.listResource(row.get('resource') ?? ''));
    await test.step('Verify 404 with empty object body', async () => {
      expect(result.status).toBe(DataParser.int(row.get('expectedStatus')));
      expect(result.body).toEqual(DataParser.json(row.get('expectedResponse')));
    });
  });

  test('TC_API_N02 write verbs on the collection URL return 404', async ({ resourceApiService }) => {
    for (const row of await TestData.rows(SHEET, 'TC_API_N02')) {
      const method = row.get('method') as WriteMethod;
      const resource = row.get('resource') ?? '';
      const result = await test.step(`Send ${method} /${resource}`, () =>
        resourceApiService.writeToCollection(method, resource, DataParser.body(row.get('requestBody'), row.get('bodyType'))),
      );
      await test.step(`Verify ${method} /${resource} returns 404 with empty object body`, async () => {
        expect(result.status).toBe(DataParser.int(row.get('expectedStatus')));
        expect(result.body).toEqual(DataParser.json(row.get('expectedResponse')));
      });
    }
  });

  test('TC_API_N03 malformed JSON body returns 500', async ({ postApiService }) => {
    for (const row of await TestData.rows(SHEET, 'TC_API_N03')) {
      const method = row.get('method');
      const result = await test.step(`Send ${method} with malformed JSON body`, () => writePost(postApiService, row));
      await test.step(`Verify ${method} returns plain-text parser error`, async () => {
        expect(result.status).toBe(DataParser.int(row.get('expectedStatus')));
        expect(result.body).toBeUndefined();
        expect(result.text).toContain(row.get('expectedErrorText'));
      });
    }
  });

  test('TC_API_E01 writes are faked, not persisted', async ({ postApiService }) => {
    for (const row of await TestData.rows(SHEET, 'TC_API_E01')) {
      const method = row.get('method');
      const verifyId = row.get('verifyPostId') ?? '';
      const before = await test.step(`Fetch /posts/${verifyId} before ${method}`, () => postApiService.getPost(verifyId));
      const write = await test.step(`Send ${method}`, () => writePost(postApiService, row));
      await test.step(`Verify ${method} status code`, async () => {
        expect(write.status).toBe(DataParser.int(row.get('expectedStatus')));
      });
      const after = await test.step(`Fetch /posts/${verifyId} after ${method}`, () => postApiService.getPost(verifyId));
      await test.step(`Verify /posts/${verifyId} is unchanged by ${method}`, async () => {
        expect(after.status).toBe(DataParser.int(row.get('verifyStatus')));
        expect(after.body).toEqual(before.body);
      });
    }
  });

  test('TC_API_E02 resource path is case-insensitive', async ({ resourceApiService, postApiService }) => {
    const row = await TestData.row(SHEET, 'TC_API_E02');
    const mixedCase = await test.step(`Send GET ${row.get('path')}`, () => resourceApiService.getPath(row.get('path') ?? ''));
    const canonical = await test.step(`Send GET /posts/${row.get('postId')}`, () => postApiService.getPost(row.get('postId') ?? ''));
    await test.step('Verify both paths return the same record', async () => {
      expect(mixedCase.status).toBe(DataParser.int(row.get('expectedStatus')));
      expect(mixedCase.body).toEqual(canonical.body);
    });
  });

  test('TC_API_E03 HEAD request returns status with empty body', async ({ postApiService }) => {
    const row = await TestData.row(SHEET, 'TC_API_E03');
    const result = await test.step(`Send HEAD /posts/${row.get('postId')}`, () => postApiService.headPost(row.get('postId') ?? ''));
    await test.step('Verify status code and empty body', async () => {
      expect(result.status).toBe(DataParser.int(row.get('expectedStatus')));
      expect(result.text).toBe(row.get('expectedResponse'));
    });
  });

  test('TC_API_E04 CORS preflight returns 204', async ({ resourceApiService }) => {
    const row = await TestData.row(SHEET, 'TC_API_E04');
    const result = await test.step(`Send OPTIONS /${row.get('resource')}`, () =>
      resourceApiService.preflightResource(row.get('resource') ?? ''),
    );
    await test.step('Verify status code and empty body', async () => {
      expect(result.status).toBe(DataParser.int(row.get('expectedStatus')));
      expect(result.text).toBe(row.get('expectedResponse'));
    });
  });
});
