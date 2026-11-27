// @ts-check
import { readFileSync } from "node:fs";
import starlight from "@astrojs/starlight";
import { defineConfig } from "astro/config";

const plugin = JSON.parse(readFileSync(new URL("../.claude-plugin/plugin.json", import.meta.url), "utf8"));

export default defineConfig({
  vite: {
    define: {
      __VERSION__: JSON.stringify(plugin.version),
    },
  },
  integrations: [
    starlight({
      title: "boundary model",
      description: "Agent skills that keep a shared map of your system, for you and your agent, and plan changes against it.",
      // No search box: the site has six pages.
      pagefind: false,
      // No list of the page's sections, on the right or at the top on phones.
      tableOfContents: false,
      sidebar: [
        { label: "What it is and why", link: "/" },
        "model",
        "skills",
        "install",
        "walkthrough",
        "in-the-wild",
      ],
      customCss: ["@fontsource-variable/geist", "@fontsource-variable/geist-mono", "./src/styles/theme.css"],
      components: {
        Header: "./src/components/starlight/Header.astro",
        Hero: "./src/components/starlight/Hero.astro",
        PageTitle: "./src/components/starlight/PageTitle.astro",
        Sidebar: "./src/components/starlight/Sidebar.astro",
        SiteTitle: "./src/components/starlight/SiteTitle.astro",
        ThemeProvider: "./src/components/starlight/ThemeProvider.astro",
        ThemeSelect: "./src/components/starlight/ThemeSelect.astro",
      },
      expressiveCode: {
        themes: ["min-dark", "min-light"],
        // No colour: text in the theme's ink, comments and markup punctuation in grey.
        customizeTheme(theme) {
          const dark = theme.type === "dark";
          for (const rule of theme.settings) {
            if (!rule.settings?.foreground) continue;
            const scopes = [rule.scope ?? []].flat().join(" ");
            const quiet = /comment|punctuation/.test(scopes);
            rule.settings.foreground = quiet ? (dark ? "#858585" : "#888888") : dark ? "#ededed" : "#111111";
          }
          return theme;
        },
        useStarlightUiThemeColors: true,
        defaultProps: { wrap: true, frame: "code" },
        styleOverrides: {
          borderRadius: "10px",
          borderColor: "var(--bm-line)",
          codeBackground: "var(--bm-panel)",
          codeFontFamily: "var(--__sl-font-mono)",
          codeFontSize: "0.8125rem",
          uiFontFamily: "var(--__sl-font)",
          frames: {
            shadowColor: "transparent",
            editorTabBarBackground: "var(--bm-panel)",
            editorActiveTabBackground: "var(--bm-panel)",
            editorActiveTabIndicatorTopColor: "transparent",
            editorActiveTabIndicatorBottomColor: "var(--bm-fg)",
            terminalTitlebarBackground: "var(--bm-panel)",
            terminalTitlebarBorderBottomColor: "var(--bm-line)",
            terminalTitlebarDotsOpacity: "0",
          },
        },
      },
    }),
  ],
});
