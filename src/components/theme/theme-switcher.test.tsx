import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { ThemeSwitcher } from "@/components/theme/theme-switcher";

const content = {
  label: "Theme",
  dark: "Dark",
  light: "Light",
};

describe("ThemeSwitcher", () => {
  it("toggles document theme class", async () => {
    const user = userEvent.setup();

    render(
      <ThemeProvider>
        <ThemeSwitcher content={content} />
      </ThemeProvider>,
    );

    await waitFor(() => {
      expect(document.documentElement.classList.contains("dark")).toBe(true);
    });

    await user.click(screen.getByRole("checkbox", { name: content.label }));

    await waitFor(() => {
      expect(document.documentElement.classList.contains("light")).toBe(true);
    });
  });
});
