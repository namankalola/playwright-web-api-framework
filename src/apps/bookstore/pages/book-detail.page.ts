import { Page } from '@playwright/test';
import { BasePage } from '../../../core/base.page';

export interface BookDetails {
  isbn: string;
  title: string;
  subTitle: string;
  author: string;
  publisher: string;
  totalPages: string;
}

export class BookDetailPage extends BasePage {
  // demoqa's book-detail value labels all share the same literal id
  // ("userName-value", copy-pasted across every field) so they can't be
  // selected directly - each field must be scoped through its own
  // "<field>-wrapper" container instead. Verified live.
  private readonly isbnValue = this.page.locator('#ISBN-wrapper .col-md-9 label');
  private readonly titleValue = this.page.locator('#title-wrapper .col-md-9 label');
  private readonly subTitleValue = this.page.locator('#subtitle-wrapper .col-md-9 label');
  private readonly authorValue = this.page.locator('#author-wrapper .col-md-9 label');
  private readonly publisherValue = this.page.locator('#publisher-wrapper .col-md-9 label');
  private readonly pagesValue = this.page.locator('#pages-wrapper .col-md-9 label');
  private readonly backToBookStoreButton = this.page.locator('#addNewRecordButton');

  constructor(page: Page) {
    super(page);
  }

  async assertLoaded(): Promise<void> {
    await this.actions.assertVisible(this.titleValue, 'Book detail Title field');
  }

  async getDetails(): Promise<BookDetails> {
    return {
      isbn: await this.actions.getText(this.isbnValue, 'ISBN'),
      title: await this.actions.getText(this.titleValue, 'Title'),
      subTitle: await this.actions.getText(this.subTitleValue, 'Sub Title'),
      author: await this.actions.getText(this.authorValue, 'Author'),
      publisher: await this.actions.getText(this.publisherValue, 'Publisher'),
      totalPages: await this.actions.getText(this.pagesValue, 'Total Pages'),
    };
  }

  async backToBookStore(): Promise<void> {
    await this.actions.click(this.backToBookStoreButton, 'Back To Book Store button');
  }
}
