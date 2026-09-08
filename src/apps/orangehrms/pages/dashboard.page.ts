import { Page } from '@playwright/test';
import { BasePage } from '../../../core/base.page';

export class DashboardPage extends BasePage {
  // On narrow (mobile) viewports the sidebar starts collapsed behind this topbar
  // hamburger toggle; on wider viewports it's already expanded and clicking this
  // would be a no-op.
  private readonly sidebarToggleButton = this.page.locator('.oxd-topbar-header-hamburger');
  private readonly sidebarPanel = this.page.locator('.oxd-sidepanel').first();

  constructor(page: Page) {
    super(page);
  }

  async open(): Promise<void> {
    await this.navigateTo('/web/index.php/dashboard/index');
  }

  private menuLink(name: string) {
    return this.page.locator('.oxd-main-menu-item', { hasText: name }).first();
  }

  private quickLaunchCard(name: string) {
    return this.page.locator('.orangehrm-quick-launch-card', { hasText: name }).first();
  }

  /**
   * Collapsed vs expanded can't be read off the menu link itself - verified live,
   * `.oxd-main-menu-item` reports `isVisible(): true` with a non-zero bounding box
   * in *both* states (collapsed renders a clipped icon-only strip, not a hidden
   * element), so checking its visibility never detects the collapsed case and the
   * toggle silently never gets clicked. `.oxd-sidepanel`'s own bounding box does
   * distinguish them cleanly: width is exactly 0 when collapsed and 256 when
   * expanded (both on desktop, which is always 256, and mobile, verified on the
   * Pixel 7 Playwright project), so that's the box this checks instead.
   */
  private async ensureSidebarExpanded(name: string): Promise<void> {
    await this.actions.waitForAttached(this.menuLink(name), `"${name}" dashboard menu link`);
    const panelBox = await this.actions.getBoundingBox(this.sidebarPanel, 'Sidebar panel');
    const collapsed = !panelBox || panelBox.width === 0;
    if (collapsed) {
      await this.actions.click(this.sidebarToggleButton, 'Sidebar hamburger toggle');
    }
  }

  async clickMenuLink(name: string): Promise<void> {
    await this.ensureSidebarExpanded(name);
    await this.actions.click(this.menuLink(name), `"${name}" dashboard menu link`);
  }

  /**
   * The Quick Launch widget loads its cards asynchronously after the dashboard
   * shell mounts (a loading spinner renders first, verified live) - waiting for
   * the card to be attached before clicking avoids racing that.
   */
  async clickQuickLaunchLink(name: string): Promise<void> {
    const card = this.quickLaunchCard(name);
    await this.actions.waitForAttached(card, `"${name}" Quick Launch card`);
    await this.actions.click(card.locator('button'), `"${name}" Quick Launch link`);
  }

  async assertModulePageOpened(urlFragment: string): Promise<void> {
    await this.actions.assertUrlContains(urlFragment);
  }
}
