/**
 * Single source of truth for the color-theme catalog.
 *
 * The CSS variables themselves live in `src/app/globals.css` under
 * `html[data-theme="..."]` blocks — that file is the one we paste
 * theme tokens into. This module only carries the metadata the UI
 * (settings picker, no-flash boot script) needs.
 *
 * Adding a new theme is a two-step change:
 *   1. Append the new `html[data-theme="<id>"]` block in globals.css
 *      with every token from an existing theme — including the full
 *      `--n-*` neutral ramp (use sky as the shape reference).
 *   2. Add an entry below. The order here drives the picker grid.
 */

export const THEME_IDS = ["sky", "pine", "indigo"] as const;

export type ThemeId = (typeof THEME_IDS)[number];

export const DEFAULT_THEME: ThemeId = "sky";

export const STORAGE_KEY = "wacrm.theme";

export interface ThemeMeta {
  id: ThemeId;
  name: string;
  tagline: string;
  /**
   * Static swatch color for the picker chip. Hard-coded so the boot
   * script / picker cards don't need a getComputedStyle round trip
   * before the page settles. Must mirror `--primary` of the same
   * theme in globals.css.
   */
  swatch: string;
}

export const THEMES: ReadonlyArray<ThemeMeta> = [
  {
    id: "sky",
    name: "Sky",
    tagline: "Cool blue-grey and light azure — the default. Fresh and calm.",
    swatch: "oklch(0.72 0.13 232)",
  },
  {
    id: "pine",
    name: "Pine",
    tagline: "Green-grey and deep spruce — a calm nod to messaging.",
    swatch: "oklch(0.62 0.115 162)",
  },
  {
    id: "indigo",
    name: "Indigo",
    tagline: "Blue-grey and true indigo — clean, product-y B2B.",
    swatch: "oklch(0.585 0.16 252)",
  },
];

export function isThemeId(value: unknown): value is ThemeId {
  return (
    typeof value === "string" &&
    (THEME_IDS as ReadonlyArray<string>).includes(value)
  );
}
