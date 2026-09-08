import { test, expect } from '../../fixtures/pages.fixture';
import { ExcelReader } from '../../../../core/excel.reader';
import { bookstoreConfig } from '../../app.config';

test.beforeAll(async () => {
  await ExcelReader.loadWorkbook(bookstoreConfig.testDataFile);
});

test('@smoke @regression ARISE-3 Capture and verify book details, then return to Book Store', async ({
  booksPage,
  bookDetailPage,
}) => {
  const row = await ExcelReader.getTestDataRow(bookstoreConfig.testDataFile, 'BookDetailData', 'TC_BOOKDETAIL_01');
  const bookTitle = row.get('bookTitle') ?? '';

  await test.step('Navigate to the Book Store', async () => {
    await booksPage.open();
    await booksPage.assertLoaded();
  });

  const captured = await test.step(`Capture Title, Author, Publisher for the book - "${bookTitle}"`, async () => {
    return booksPage.getBookSummary(bookTitle);
  });

  await test.step(`Click on Book title - "${bookTitle}"`, async () => {
    await booksPage.openBook(bookTitle);
  });

  await test.step('Verify the book details page opens with matching details', async () => {
    await bookDetailPage.assertLoaded();
    const details = await bookDetailPage.getDetails();
    expect(details.title).toBe(captured.title);
    expect(details.author).toBe(captured.author);
    expect(details.publisher).toBe(captured.publisher);
    expect(details.isbn.length).toBeGreaterThan(0);
    expect(details.subTitle.length).toBeGreaterThan(0);
    expect(details.totalPages.length).toBeGreaterThan(0);
  });

  await test.step('Click Back To Book Store and verify the books list opens', async () => {
    await bookDetailPage.backToBookStore();
    await booksPage.assertLoaded();
  });
});
