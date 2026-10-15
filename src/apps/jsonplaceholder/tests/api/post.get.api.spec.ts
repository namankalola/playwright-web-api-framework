import { test, expect } from '../../fixtures/api.fixture';
import { Post } from '../../api/models/post.model';
import { PostApiService } from '../../api/services/post.api.service';
import { DataParser } from '../../utils/data.parser';
import { TestData } from '../../utils/test.data';

const SHEET = 'PostByIdData';

/** GET /posts/{id} - single post. Test cases: TEST_CASES.md section 2. */
test.describe('@api @regression GET /posts/{id}', () => {
  test.beforeAll(async () => {
    await TestData.load();
  });

  async function expectFoundPost(postApiService: PostApiService, testCaseId: string): Promise<void> {
    const row = await TestData.row(SHEET, testCaseId);
    const postId = row.get('postId') ?? '';
    const result = await test.step(`Send GET /posts/${postId}`, () => postApiService.getPost(postId));
    await test.step('Verify status code', async () => {
      expect(result.status).toBe(DataParser.int(row.get('expectedStatus')));
    });
    const post = result.as<Post>();
    await test.step('Verify id, userId and title match the expected record', async () => {
      expect(post.id).toBe(DataParser.int(postId));
      expect(post.userId).toBe(DataParser.int(row.get('expectedUserId')));
      expect(post.title).toBe(row.get('expectedTitle'));
    });
    if (row.get('expectedBodyPrefix')) {
      await test.step('Verify body starts with the expected text', async () => {
        expect(post.body.startsWith(row.get('expectedBodyPrefix') ?? '')).toBe(true);
      });
    }
  }

  async function expectNotFound(postApiService: PostApiService, testCaseId: string): Promise<void> {
    const row = await TestData.row(SHEET, testCaseId);
    const postId = row.get('postId') ?? '';
    const result = await test.step(`Send GET /posts/${postId}`, () => postApiService.getPost(postId));
    await test.step('Verify status code is not-found', async () => {
      expect(result.status).toBe(DataParser.int(row.get('expectedStatus')));
    });
    await test.step('Verify response body is empty object', async () => {
      expect(result.body).toEqual(DataParser.json(row.get('expectedResponse')));
    });
  }

  test('@smoke TC_POST_GET_P01 get post by id returns documented record', async ({ postApiService }) => {
    await expectFoundPost(postApiService, 'TC_POST_GET_P01');
  });

  test('TC_POST_GET_N01 id just past the last record returns 404', async ({ postApiService }) => {
    await expectNotFound(postApiService, 'TC_POST_GET_N01');
  });

  test('TC_POST_GET_N02 non-numeric id returns 404', async ({ postApiService }) => {
    await expectNotFound(postApiService, 'TC_POST_GET_N02');
  });

  test('TC_POST_GET_N03 negative id returns 404', async ({ postApiService }) => {
    await expectNotFound(postApiService, 'TC_POST_GET_N03');
  });

  test('TC_POST_GET_E01 upper boundary id returns the last post', async ({ postApiService }) => {
    await expectFoundPost(postApiService, 'TC_POST_GET_E01');
  });

  test('TC_POST_GET_E02 zero id returns 404', async ({ postApiService }) => {
    await expectNotFound(postApiService, 'TC_POST_GET_E02');
  });

  test('TC_POST_GET_E03 decimal id returns 404', async ({ postApiService }) => {
    await expectNotFound(postApiService, 'TC_POST_GET_E03');
  });

  test('TC_POST_GET_E04 leading-zero id is not normalised', async ({ postApiService }) => {
    await expectNotFound(postApiService, 'TC_POST_GET_E04');
  });
});
