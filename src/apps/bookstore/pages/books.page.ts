import { Page } from '@playwright/test';
import { BasePage } from '../../../core/base.page';

export class BooksPage extends BasePage {
  private readonly searchBox = this.page.getByPlaceholder('Type to search');
  private readonly bookRows = this.page.locator('table tbody tr');
  private readonly bookTitleLinks = this.page.locator('table tbody tr td:nth-child(2) a');
  private readonly bookAuthorCells = this.page.locator('table tbody tr td:nth-child(3)');
  private readonly bookPublisherCells = this.page.locator('table tbody tr td:nth-child(4)');
  private readonly loginButton = this.page.locator('#login');

  constructor(page: Page) {
    super(page);
  }

  private bookTitleLink(title: string) {
    return this.page.getByRole('link', { name: title, exact: true });
  }

  async open(): Promise<void> {
    await this.navigateTo('/books');
  }

  async assertLoaded(): Promise<void> {
    await this.actions.assertVisible(this.searchBox, 'Book search box');
  }

  async search(term: string): Promise<void> {
    await this.actions.fill(this.searchBox, term, 'Book search box');
  }

  async getRowCount(): Promise<number> {
    return this.actions.count(this.bookRows);
  }

  async getBookTitles(): Promise<string[]> {
    return this.actions.getAllTexts(this.bookTitleLinks, 'Book title links');
  }

  async getBookAuthors(): Promise<string[]> {
    return this.actions.getAllTexts(this.bookAuthorCells, 'Book author cells');
  }

  async getBookPublishers(): Promise<string[]> {
    return this.actions.getAllTexts(this.bookPublisherCells, 'Book publisher cells');
  }

  async openBook(title: string): Promise<void> {
    await this.actions.click(this.bookTitleLink(title), `Book title link "${title}"`);
  }

  /** Captures a specific book's Title/Author/Publisher by matching its row index across the three parallel column locators - there's no per-row grouping locator since the table is a plain native `<table>` (see bookstore/CLAUDE.md). */
  async getBookSummary(title: string): Promise<{ title: string; author: string; publisher: string }> {
    const titles = await this.getBookTitles();
    const index = titles.indexOf(title);
    if (index === -1) {
      throw new Error(`Book "${title}" not found in the current book list: ${titles.join(', ')}`);
    }
    const authors = await this.getBookAuthors();
    const publishers = await this.getBookPublishers();
    return { title: titles[index], author: authors[index], publisher: publishers[index] };
  }

  async goToLogin(): Promise<void> {
    await this.actions.click(this.loginButton, 'Login button');
  }
}
