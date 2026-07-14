import { Page } from '@playwright/test';
import { WebActions } from './web.actions';

export abstract class BasePage {
  protected readonly actions: WebActions;

  protected constructor(protected readonly page: Page) {
    this.actions = new WebActions(page);
  }

  protected async navigateTo(path = ''): Promise<void> {
    await this.actions.goto(path);
  }

  async getPageTitle(): Promise<string> {
    return this.actions.getTitle();
  }

  async getCurrentUrl(): Promise<string> {
    return this.actions.getCurrentUrl();
  }
}
