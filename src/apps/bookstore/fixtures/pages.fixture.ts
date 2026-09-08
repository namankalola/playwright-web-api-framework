import { test as base } from '@playwright/test';
import { LoginPage } from '../pages/login.page';
import { BooksPage } from '../pages/books.page';
import { RegisterPage } from '../pages/register.page';
import { BookDetailPage } from '../pages/book-detail.page';

interface PageFixtures {
  loginPage: LoginPage;
  booksPage: BooksPage;
  registerPage: RegisterPage;
  bookDetailPage: BookDetailPage;
}

export const test = base.extend<PageFixtures>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  booksPage: async ({ page }, use) => {
    await use(new BooksPage(page));
  },
  registerPage: async ({ page }, use) => {
    await use(new RegisterPage(page));
  },
  bookDetailPage: async ({ page }, use) => {
    await use(new BookDetailPage(page));
  },
});

export { expect } from '@playwright/test';
