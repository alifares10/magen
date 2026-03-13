import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LocaleSwitcher } from "@/components/i18n/locale-switcher";

const {
  localeState,
  pathnameState,
  searchParamsState,
  replaceMock,
} = vi.hoisted(() => ({
  localeState: { value: "en" },
  pathnameState: { value: "/dashboard" },
  searchParamsState: { value: new URLSearchParams("region=Center&q=tel-aviv") },
  replaceMock: vi.fn(),
}));

vi.mock("next-intl", () => ({
  useLocale: () => localeState.value,
  useTranslations: () => (key: string) => {
    const labels: Record<string, string> = {
      label: "Language",
      "locales.en": "English",
      "locales.he": "Hebrew",
    };

    return labels[key] ?? key;
  },
}));

vi.mock("next/navigation", () => ({
  useSearchParams: () => searchParamsState.value,
}));

vi.mock("@/i18n/navigation", () => ({
  usePathname: () => pathnameState.value,
  useRouter: () => ({
    replace: replaceMock,
  }),
}));

describe("LocaleSwitcher", () => {
  beforeEach(() => {
    localeState.value = "en";
    pathnameState.value = "/dashboard";
    searchParamsState.value = new URLSearchParams("region=Center&q=tel-aviv");
    replaceMock.mockClear();
  });

  it("renders locale options and keeps current locale selected", () => {
    render(<LocaleSwitcher />);

    const select = screen.getByLabelText("Language");

    expect(select).toHaveValue("en");
    expect(screen.getByRole("option", { name: "English" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Hebrew" })).toBeInTheDocument();
  });

  it("switches locale while preserving pathname and query", async () => {
    const user = userEvent.setup();
    render(<LocaleSwitcher />);

    await user.selectOptions(screen.getByLabelText("Language"), "he");

    expect(replaceMock).toHaveBeenCalledWith(
      {
        pathname: "/dashboard",
        query: {
          region: "Center",
          q: "tel-aviv",
        },
      },
      {
        locale: "he",
      },
    );
  });

  it("falls back to default locale when current locale is unsupported", () => {
    localeState.value = "fr";

    render(<LocaleSwitcher />);

    expect(screen.getByLabelText("Language")).toHaveValue("en");
  });
});
