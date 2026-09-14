import { themes as prismThemes } from 'prism-react-renderer';
import type { Config } from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const githubPages = process.env.GITHUB_PAGES === 'true';

const config: Config = {
  title: 'FlipCard',
  tagline: 'The first primitive in an adaptive, manifest schema-driven, composable UI system',
  favicon: 'img/favicon.ico',

  future: {
    v4: true,
  },

  url: 'https://microsoft.github.io',
  // GitHub Pages publishes the wiki at microsoft.github.io/flipcard/.
  // Locally the site still serves from /.
  baseUrl: githubPages ? '/flipcard/' : '/',

  organizationName: 'microsoft',
  projectName: 'flipcard',
  trailingSlash: false,

  onBrokenLinks: 'throw',
  markdown: {
    hooks: {
      onBrokenMarkdownLinks: 'warn',
    },
  },

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          routeBasePath: '/',
          sidebarPath: './sidebars.ts',
          editUrl: 'https://github.com/microsoft/flipcard/tree/main/docs/',
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    image: 'img/docusaurus-social-card.jpg',
    colorMode: {
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: 'FlipCard',
      logo: {
        alt: 'FlipCard',
        src: 'img/logo.svg',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'mainSidebar',
          position: 'left',
          label: 'Docs',
        },
        {
          href: 'https://microsoft.github.io/flipcard/flipdeck/',
          label: 'FlipDeck',
          position: 'left',
        },
        {
          href: 'https://github.com/microsoft/flipcard',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Docs',
          items: [
            { label: 'Introduction', to: '/' },
            { label: 'Getting started', to: '/getting-started' },
            { label: 'Manifest schema', to: '/reference/manifest' },
          ],
        },
        {
          title: 'Packages',
          items: [
            { label: '@microsoft/flipcard-core', to: '/packages/core' },
            { label: '@microsoft/flipcard-react', to: '/packages/react' },
            { label: '@microsoft/flipcard (vanilla)', to: '/packages/vanilla' },
            { label: '@microsoft/flipcard-themes', to: '/packages/themes' },
            { label: '@microsoft/flipcard-mcp', to: '/packages/mcp-server' },
          ],
        },
        {
          title: 'More',
          items: [
            { label: 'FlipDeck', href: 'https://microsoft.github.io/flipcard/flipdeck/' },
            { label: 'GitHub', href: 'https://github.com/microsoft/flipcard' },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Microsoft Corporation. Licensed under MIT.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['bash', 'json', 'tsx', 'typescript'],
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
