import { test as base } from '@playwright/test';
import { LoginPage } from '../pages/login.page';
import { ClaimPage } from '../pages/claim.page';
import { EmployeeClaimsPage } from '../pages/employee-claims.page';
import { DashboardPage } from '../pages/dashboard.page';

interface PageFixtures {
  loginPage: LoginPage;
  claimPage: ClaimPage;
  employeeClaimsPage: EmployeeClaimsPage;
  dashboardPage: DashboardPage;
}

export const test = base.extend<PageFixtures>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  claimPage: async ({ page }, use) => {
    await use(new ClaimPage(page));
  },
  employeeClaimsPage: async ({ page }, use) => {
    await use(new EmployeeClaimsPage(page));
  },
  dashboardPage: async ({ page }, use) => {
    await use(new DashboardPage(page));
  },
});

export { expect } from '@playwright/test';
