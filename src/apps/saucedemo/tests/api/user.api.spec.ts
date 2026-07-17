// import { test, expect } from '../../src/fixtures/api.fixture';

// /**
//  * API test cases only ever call `userApiService.*` and assert on the typed
//  * POJO results it returns. No route strings, headers, tokens, or raw
//  * request/response objects appear here - that's the whole point of the
//  * Service -> Client -> SpecBuilder/TokenManager -> Routes layering below.
//  */
// test.describe('@api @regression User API', () => {
//   test('@smoke lists users on page 2', async ({ userApiService }) => {
//     const { result, users } = await userApiService.listUsers(2);

//     expect(result.status).toBe(200);
//     expect(users.length).toBeGreaterThan(0);
//     expect(users[0].email).toContain('@');
//   });

//   test('gets a single user by id', async ({ userApiService }) => {
//     const { result, user } = await userApiService.getUserById(2);

//     expect(result.status).toBe(200);
//     expect(user).not.toBeNull();
//     expect(user?.fullName).toBeTruthy();
//   });

//   test('returns 404 for a non-existent user', async ({ userApiService }) => {
//     const { result, user } = await userApiService.getUserById(9999);

//     expect(result.status).toBe(404);
//     expect(user).toBeNull();
//   });

//   test('@smoke creates a new user (authenticated)', async ({ userApiService }) => {
//     const { result, created } = await userApiService.createUser({ name: 'Jane Doe', job: 'QA Automation Lead' });

//     expect(result.status).toBe(201);
//     expect(created?.name).toBe('Jane Doe');
//     expect(created?.id).toBeTruthy();
//   });

//   test('updates an existing user (authenticated)', async ({ userApiService }) => {
//     const { result, updated } = await userApiService.updateUser(2, { job: 'Principal SDET' });

//     expect(result.status).toBe(200);
//     expect(updated?.job).toBe('Principal SDET');
//   });

//   test('deletes a user (authenticated)', async ({ userApiService }) => {
//     const result = await userApiService.deleteUser(2);
//     expect(result.status).toBe(204);
//   });

//   test('reuses a cached token across multiple authenticated calls', async ({ userApiService, tokenManager }) => {
//     const tokenBefore = await tokenManager.getToken();
//     await userApiService.createUser({ name: 'Reuse Check', job: 'Tester' });
//     const tokenAfter = await tokenManager.getToken();

//     expect(tokenAfter).toBe(tokenBefore); // same worker, within TTL -> no re-login
//   });
// });
