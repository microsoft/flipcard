import type { SidebarsConfig } from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  mainSidebar: [
    'intro',
    'getting-started',
    'concepts',
    {
      type: 'category',
      label: 'Packages',
      collapsed: false,
      items: [
        'packages/core',
        'packages/themes',
        'packages/react',
        'packages/vanilla',
        'packages/mcp-server',
      ],
    },
    {
      type: 'category',
      label: 'Guides',
      items: [
        'guides/categories-and-themes',
        'guides/authoring-manifests',
        'guides/agent-authoring',
      ],
    },
    {
      type: 'category',
      label: 'Reference',
      items: [
        'reference/manifest',
        'reference/architecture',
      ],
    },
    'contributing',
  ],
};

export default sidebars;
