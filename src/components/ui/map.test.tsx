import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { mapConstructor } = vi.hoisted(() => ({
  mapConstructor: vi.fn(),
}));

vi.mock("maplibre-gl/dist/maplibre-gl.css", () => ({}));

vi.mock("maplibre-gl", () => {
  return {
    default: {
      Map: mapConstructor,
    },
  };
});

import { Map } from "@/components/ui/map";

describe("Map", () => {
  beforeEach(() => {
    mapConstructor.mockReset();
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: vi.fn().mockImplementation(() => ({
        matches: false,
        media: "(prefers-color-scheme: dark)",
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  it("renders fallback content when map initialization throws", () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    mapConstructor.mockImplementation(function MockMap() {
      throw new Error("WebGL unavailable");
    });

    render(
      <Map
        center={[35.2137, 31.7683]}
        zoom={7.2}
        fallback={<div>Map unavailable fallback</div>}
      />,
    );

    expect(screen.getByText("Map unavailable fallback")).toBeInTheDocument();

    consoleErrorSpy.mockRestore();
  });
});
