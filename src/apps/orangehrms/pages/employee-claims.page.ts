import { Locator, Page } from '@playwright/test';
import { BasePage } from '../../../core/base.page';

export interface ClaimSearchResult {
  referenceId: string;
  employeeName: string;
  event: string;
  remarks: string;
  currency: string;
  status: string;
  amount: string;
}

export class EmployeeClaimsPage extends BasePage {
  private readonly referenceIdSearchInput = this.page
    .locator('.oxd-input-group', { hasText: 'Reference Id' })
    .locator('input');
  private readonly searchButton = this.page.getByRole('button', { name: 'Search' });
  private readonly resultRow = this.page.locator('.oxd-table-card').first();
  // On narrow (mobile) viewports the filter panel starts collapsed behind this
  // chevron toggle; on wider viewports it's already expanded and this is a no-op.
  private readonly filterToggleButton = this.page
    .locator('button.oxd-icon-button')
    .filter({ has: this.page.locator('.bi-caret-down-fill') });

  constructor(page: Page) {
    super(page);
  }

  async open(): Promise<void> {
    await this.navigateTo('/web/index.php/claim/viewAssignClaim');
  }

  private async ensureFiltersExpanded(): Promise<void> {
    // Wait for the form to exist in the DOM before checking visibility - the SPA
    // hasn't necessarily finished mounting it immediately after navigation, and on
    // narrow viewports the Reference Id input is legitimately never "visible"
    // until the filter toggle below is clicked, so visibility can't be the signal
    // that the form itself has rendered. Waited on via the CSS-based input locator
    // rather than the role-based Search button - a collapsed panel drops its
    // contents out of the accessibility tree, so a role locator never resolves
    // "attached" until after the toggle click that this very wait is guarding.
    await this.actions.waitForAttached(this.referenceIdSearchInput, 'Reference Id search field');
    const filtersVisible = await this.actions.isVisible(this.referenceIdSearchInput);
    if (!filtersVisible) {
      await this.actions.click(this.filterToggleButton, 'Expand filters toggle');
    }
  }

  async searchByReferenceId(referenceId: string): Promise<void> {
    await this.ensureFiltersExpanded();
    await this.actions.fill(this.referenceIdSearchInput, referenceId, 'Reference Id search field');
    await this.actions.click(this.searchButton, 'Search button');
  }

  private resultCell(index: number) {
    return this.resultRow.locator('.oxd-table-cell').nth(index);
  }

  private mobileCardCell(headerLabel: string) {
    return this.resultRow
      .locator('.oxd-table-card-cell')
      .filter({ has: this.page.locator('.header', { hasText: headerLabel }) });
  }

  async assertSearchResultVisible(): Promise<void> {
    await this.actions.assertVisible(this.resultRow, 'Employee Claims search result row');
  }

  /**
   * The result row renders two structurally different ways depending on
   * viewport, verified live: a flat set of `.oxd-table-cell`s at fixed column
   * indices on wide viewports (no header labels in the DOM at all - and the
   * column order/count differs from the mobile layout, e.g. Amount and
   * Status swap positions), or `.oxd-table-card-cell`s on narrow/mobile
   * viewports, each carrying an explicit `.header` label plus either a
   * `.data` div (plain fields) or a bare `.oxd-text` span (Event/Description)
   * holding the value. Look up by label when the card layout is present -
   * that's immune to the column reordering - and fall back to the
   * wide-viewport column index otherwise, since there's no label to match.
   */
  private async cellValue(desktopIndex: number, mobileHeaderLabel: string, name: string): Promise<string> {
    const mobileCell = this.mobileCardCell(mobileHeaderLabel);
    if ((await this.actions.count(mobileCell)) > 0) {
      const dataDiv = mobileCell.locator('.data');
      if ((await this.actions.count(dataDiv)) > 0) {
        return this.actions.getText(dataDiv, name);
      }
      return this.actions.getText(mobileCell.locator('.oxd-text'), name);
    }
    return this.readDesktopCellText(this.resultCell(desktopIndex), name);
  }

  /**
   * Long values (e.g. Remarks) render truncated on the desktop/wide-viewport
   * cell with a "...Show More" toggle appended to the DOM - verified live:
   * clicking it swaps the truncated preview for the full value in the same
   * span. Reading the raw cell text without expanding first would pick up
   * the truncated preview plus the toggle's own label text.
   */
  private async readDesktopCellText(cell: Locator, name: string): Promise<string> {
    const showMoreToggle = cell.locator('.oxd-table-card-cell-show-more');
    if ((await this.actions.count(showMoreToggle)) > 0) {
      await this.actions.click(showMoreToggle, `Expand truncated "${name}"`);
      return this.actions.getText(cell.locator('.oxd-text').first(), name);
    }
    return this.actions.getText(cell, name);
  }

  /**
   * Wide-viewport column order (0-indexed): Reference Id, Employee Name,
   * Event, Remarks, Currency, <blank>, Status, Amount, Actions.
   */
  async getSearchResult(): Promise<ClaimSearchResult> {
    return {
      referenceId: await this.cellValue(0, 'Reference Id', 'Search result Reference Id'),
      employeeName: await this.cellValue(1, 'Employee Name', 'Search result Employee Name'),
      event: await this.cellValue(2, 'Event Name', 'Search result Event'),
      remarks: await this.cellValue(3, 'Description', 'Search result Remarks'),
      currency: await this.cellValue(4, 'Currency', 'Search result Currency'),
      status: await this.cellValue(6, 'Status', 'Search result Status'),
      amount: await this.cellValue(7, 'Amount', 'Search result Amount'),
    };
  }
}
