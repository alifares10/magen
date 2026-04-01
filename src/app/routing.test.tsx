import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { localizedDashboardShellMock, redirectMock } = vi.hoisted(() => ({
  localizedDashboardShellMock: vi.fn(() => null),
  redirectMock: vi.fn(),
}));

vi.mock("@/components/layout/localized-dashboard-shell", () => ({
  LocalizedDashboardShell: localizedDashboardShellMock,
}));

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
}));

import LocalizedDashboardPage from "@/app/[locale]/dashboard/page";
import LocaleHomePage from "@/app/[locale]/page";
import DashboardRedirectPage from "@/app/dashboard/page";

describe("dashboard routing", () => {
  beforeEach(() => {
    localizedDashboardShellMock.mockClear();
    redirectMock.mockClear();
  });

  it("renders shared localized dashboard shell on /[locale]", async () => {
    render(await LocaleHomePage({ params: Promise.resolve({ locale: "he" }) }));

    expect(localizedDashboardShellMock).toHaveBeenCalledTimes(1);
  });

  it("renders shared localized dashboard shell on /[locale]/dashboard", async () => {
    render(
      await LocalizedDashboardPage({ params: Promise.resolve({ locale: "he" }) }),
    );

    expect(localizedDashboardShellMock).toHaveBeenCalledTimes(1);
  });

  it("redirects /dashboard to /en/dashboard", () => {
    DashboardRedirectPage();

    expect(redirectMock).toHaveBeenCalledWith("/en/dashboard");
  });
});
