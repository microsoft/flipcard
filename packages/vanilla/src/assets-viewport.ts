import { FLIPCARD_SCHEMA_URL } from '@microsoft/flipcard-core';
import type { FlipCardAssetEntry } from './types';

import flightItineraryCard from './adaptive-card-samples/FlightItinerary.json';
import weatherCompactCard from './adaptive-card-samples/WeatherCompact.json';
import expenseReportCard from './adaptive-card-samples/ExpenseReport.json';
import stockUpdateCard from './adaptive-card-samples/StockUpdate.json';
import foodOrderCard from './adaptive-card-samples/FoodOrder.json';
import activityUpdateCard from './adaptive-card-samples/ActivityUpdate.json';
import inputFormCard from './adaptive-card-samples/InputForm.json';
import restaurantCard from './adaptive-card-samples/Restaurant.json';

const adaptiveCardPayloads: Record<string, Record<string, unknown>> = {
  'v1.5/Scenarios/FlightItinerary.json': flightItineraryCard as Record<string, unknown>,
  'v1.5/Scenarios/WeatherCompact.json': weatherCompactCard as Record<string, unknown>,
  'v1.5/Scenarios/ExpenseReport.json': expenseReportCard as Record<string, unknown>,
  'v1.5/Scenarios/StockUpdate.json': stockUpdateCard as Record<string, unknown>,
  'v1.5/Scenarios/FoodOrder.json': foodOrderCard as Record<string, unknown>,
  'v1.5/Scenarios/ActivityUpdate.json': activityUpdateCard as Record<string, unknown>,
  'v1.5/Scenarios/InputForm.json': inputFormCard as Record<string, unknown>,
  'v1.5/Scenarios/Restaurant.json': restaurantCard as Record<string, unknown>,
};

/**
 * FlipCards harvested from the OneDrive viewport drop:
 *   - flipcard-pattern-library.html (pattern, tile, portfolio, security, metric, faq)
 *   - unovis-gallery-flipcards.html  (chart)
 *   - viewport-grid(-Lappy6).html    (tile)
 *
 * Each entry follows the FlipCardAssetEntry contract so the existing renderer,
 * MCP server, and showcase catalog can consume them without special-casing.
 */

const UNOVIS_GALLERY_ROOT = 'https://unovis.dev/gallery';
const ADAPTIVE_CARDS_REPO = 'https://github.com/microsoft/AdaptiveCards';

interface UnovisChartSeed {
  id: string;
  title: string;
  pathname: string;
  collection: string;
  summary: string;
}

function unovisChart({ id, title, pathname, collection, summary }: UnovisChartSeed): FlipCardAssetEntry {
  return {
    id,
    category: 'chart',
    title,
    summary,
    theme: 'dark',
    accent: '#0284c7',
    manifest: {
      $schema: FLIPCARD_SCHEMA_URL,
      version: '0.1.0',
      id,
      title,
      design: {
        kind: 'chart',
        eyebrow: collection,
        headline: title,
        summary,
        badge: 'Unovis',
        items: [
          { label: 'Collection', value: collection },
          { label: 'Pathname', value: pathname },
          { label: 'Frameworks', value: 'React • Angular • Svelte • Vue • Solid' },
        ],
        bullets: [
          `Live demo: ${UNOVIS_GALLERY_ROOT}/${pathname}`,
          'Open-source @ github.com/f5/unovis',
        ],
      },
      schema: {
        gallery: 'unovis',
        collection,
        pathname,
        demoUrl: `${UNOVIS_GALLERY_ROOT}/${pathname}`,
        repo: 'https://github.com/f5/unovis',
        frameworks: ['react', 'angular', 'svelte', 'vue', 'solid'],
      },
      workflow: {
        onFlip: 'openUnovisGalleryItem',
        actions: [
          { id: 'open-demo', type: 'navigate', data: { target: `${UNOVIS_GALLERY_ROOT}/${pathname}` } },
        ],
      },
      metadata: {
        category: 'chart',
        theme: 'dark',
        tags: ['unovis', 'chart', collection.toLowerCase()],
        accent: '#0284c7',
        audience: 'Visualization engineers',
      },
    },
  };
}

interface AdaptiveCardSeed {
  id: string;
  title: string;
  sample: string;
  summary: string;
}

function adaptiveCardSample({ id, title, sample, summary }: AdaptiveCardSeed): FlipCardAssetEntry {
  const payload = adaptiveCardPayloads[sample];
  return {
    id,
    category: 'pattern',
    title,
    summary,
    theme: 'dark',
    accent: '#0284c7',
    manifest: {
      $schema: FLIPCARD_SCHEMA_URL,
      version: '0.1.0',
      id,
      title,
      design: {
        kind: 'pattern',
        eyebrow: 'Adaptive Cards',
        headline: title,
        summary,
        badge: 'v1.5 sample',
        adaptiveCard: payload,
        items: [
          { label: 'Schema', value: 'http://adaptivecards.io/schemas/adaptive-card.json' },
          { label: 'Sample path', value: sample },
          { label: 'Source', value: 'microsoft/AdaptiveCards' },
        ],
      },
      schema: payload ?? {
        $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
        type: 'AdaptiveCard',
        version: '1.5',
        sample,
        repo: ADAPTIVE_CARDS_REPO,
      },
      workflow: {
        onFlip: 'openAdaptiveCardSample',
        actions: [
          {
            id: 'open-sample',
            type: 'navigate',
            data: { target: `${ADAPTIVE_CARDS_REPO}/blob/main/samples/${sample}` },
          },
        ],
      },
      metadata: {
        category: 'pattern',
        theme: 'dark',
        tags: ['adaptive-cards', 'pattern', 'sample'],
        accent: '#0284c7',
        audience: 'Card authors',
      },
    },
  };
}

const patternLibraryAssets: FlipCardAssetEntry[] = [
  // -------- Reusable FlipCard component contract --------
  {
    id: 'flipcard-component-props',
    category: 'pattern',
    title: 'FlipCard component contract',
    summary: 'Shared component contract with front/back slots, JSON auto-rendering, and controlled state.',
    theme: 'dark',
    accent: '#00d4ff',
    manifest: {
      $schema: FLIPCARD_SCHEMA_URL,
      version: '0.1.0',
      id: 'flipcard-component-props',
      title: 'FlipCard component contract',
      design: {
        kind: 'pattern',
        eyebrow: 'Pattern',
        headline: 'FlipCard props',
        summary: 'Front/back faces, JSON auto-rendering of back, controlled flipped state, hint affordance.',
        badge: 'Component',
        items: [
          { label: 'Component', value: 'FlipCard' },
          { label: 'Front', value: 'ReactNode (required)' },
          { label: 'Back', value: 'ReactNode or backJson' },
          { label: 'Min height', value: '260px default' },
        ],
        bullets: [
          'Click to flip; supports controlled and uncontrolled modes',
          'backJson auto-renders pretty-printed manifest',
          'Source: src/components/ui/FlipCard.tsx',
        ],
      },
      schema: {
        component: 'FlipCard',
        props: [
          'front',
          'back',
          'backJson',
          'backTitle',
          'minHeight',
          'flipped',
          'onFlip',
          'flipHint',
          'showFlipHint',
          'defaultFlipped',
          'className',
        ],
        file: 'src/components/ui/FlipCard.tsx',
      },
      workflow: { onFlip: 'showComponentSpec', actions: [] },
      metadata: {
        category: 'pattern',
        theme: 'dark',
        tags: ['component', 'react', 'contract'],
        accent: '#00d4ff',
        audience: 'Component authors',
      },
    },
  },

  // -------- Adaptive Cards gallery (8) --------
  adaptiveCardSample({
    id: 'adaptive-card-flight-itinerary',
    title: 'Flight itinerary',
    sample: 'v1.5/Scenarios/FlightItinerary.json',
    summary: 'Official Adaptive Cards scenario sample for travel itineraries.',
  }),
  adaptiveCardSample({
    id: 'adaptive-card-weather-forecast',
    title: 'Weather forecast',
    sample: 'v1.5/Scenarios/WeatherCompact.json',
    summary: 'Compact weather scenario with current conditions.',
  }),
  adaptiveCardSample({
    id: 'adaptive-card-expense-report',
    title: 'Expense report',
    sample: 'v1.5/Scenarios/ExpenseReport.json',
    summary: 'Expense reporting and reimbursement workflow.',
  }),
  adaptiveCardSample({
    id: 'adaptive-card-stock-update',
    title: 'Stock update',
    sample: 'v1.5/Scenarios/StockUpdate.json',
    summary: 'Financial market data and stock quote display.',
  }),
  adaptiveCardSample({
    id: 'adaptive-card-food-order',
    title: 'Food order',
    sample: 'v1.5/Scenarios/FoodOrder.json',
    summary: 'Restaurant order placement and confirmation.',
  }),
  adaptiveCardSample({
    id: 'adaptive-card-activity-update',
    title: 'Activity update',
    sample: 'v1.5/Scenarios/ActivityUpdate.json',
    summary: 'User activity and engagement notification.',
  }),
  adaptiveCardSample({
    id: 'adaptive-card-input-form',
    title: 'Input form',
    sample: 'v1.5/Scenarios/InputForm.json',
    summary: 'Editable form controls and data entry patterns.',
  }),
  adaptiveCardSample({
    id: 'adaptive-card-restaurant',
    title: 'Restaurant',
    sample: 'v1.5/Scenarios/Restaurant.json',
    summary: 'Restaurant menu and dining information card.',
  }),

  // -------- Adaptive tiles (chart-shaped via ColumnSet) --------
  {
    id: 'tile-donut-chart',
    category: 'pattern',
    title: 'Donut chart tile',
    summary: 'Analytics tile schema using proportional columns to simulate a donut breakdown.',
    theme: 'dark',
    accent: '#0284c7',
    manifest: {
      $schema: FLIPCARD_SCHEMA_URL,
      version: '0.1.0',
      id: 'tile-donut-chart',
      title: 'Donut chart tile',
      design: {
        kind: 'pattern',
        eyebrow: 'Adaptive tiles',
        headline: 'Donut chart',
        summary: 'Pass / fail / skip breakdown rendered with proportional ColumnSet widths.',
        badge: 'Power Fx',
        bullets: [
          'Topic.EvalTitle, Topic.PassRate, Topic.FailRate, Topic.SkipRate',
          'Donut simulated via ColumnSet proportional widths',
        ],
      },
      schema: {
        tileType: 'donut-chart',
        binding: 'PowerFx',
        fields: ['Topic.EvalTitle', 'Topic.PassRate', 'Topic.FailRate', 'Topic.SkipRate'],
      },
      workflow: { onFlip: 'showTileManifest', actions: [] },
      metadata: {
        category: 'pattern',
        theme: 'dark',
        tags: ['adaptive-tiles', 'powerfx', 'donut'],
        accent: '#0284c7',
        audience: 'Tile authors',
      },
    },
  },
  {
    id: 'tile-horizontal-bar-chart',
    category: 'pattern',
    title: 'Horizontal bar chart tile',
    summary: 'Analytics tile schema using ColumnSet widths to encode score percentages.',
    theme: 'dark',
    accent: '#0284c7',
    manifest: {
      $schema: FLIPCARD_SCHEMA_URL,
      version: '0.1.0',
      id: 'tile-horizontal-bar-chart',
      title: 'Horizontal bar chart tile',
      design: {
        kind: 'pattern',
        eyebrow: 'Adaptive tiles',
        headline: 'Horizontal bar chart',
        summary: 'Relevance, completeness, coherence, and tool accuracy bars from BIC scores.',
        badge: 'Power Fx',
        bullets: ['Bound to Topic.BICScores', 'Bars rendered via proportional ColumnSet widths'],
      },
      schema: {
        tileType: 'bar-chart',
        binding: 'PowerFx',
        metrics: ['Relevance', 'Completeness', 'Coherence', 'Tool Accuracy'],
      },
      workflow: { onFlip: 'showTileManifest', actions: [] },
      metadata: {
        category: 'pattern',
        theme: 'dark',
        tags: ['adaptive-tiles', 'powerfx', 'bar-chart'],
        accent: '#0284c7',
        audience: 'Tile authors',
      },
    },
  },

  // -------- LiveTile Studio canvas (3 tiles) --------
  {
    id: 'livetile-eval-configs',
    category: 'tile',
    title: 'LiveTile · Eval configs',
    summary: 'KPI live tile showing evaluation configuration count and trend delta.',
    theme: 'dark',
    accent: '#00d4ff',
    manifest: {
      $schema: FLIPCARD_SCHEMA_URL,
      version: '0.1.0',
      id: 'livetile-eval-configs',
      title: 'LiveTile · Eval configs',
      design: {
        kind: 'tile',
        eyebrow: 'LiveTile',
        headline: '12 eval configs',
        summary: 'Quarter-over-quarter delta on configured evaluations in the environment.',
        badge: 'KPI',
        stats: [
          { label: 'Configs', value: '12', trend: '+2', tone: 'positive' },
        ],
        items: [
          { label: 'Grid', value: 'col 1 row 2 · 3×2' },
          { label: 'Tile type', value: 'kpi' },
        ],
      },
      schema: {
        id: 'm1',
        type: 'kpi',
        content: { label: 'Eval Configs', value: '12', delta: '+2', up: true },
        grid: { col: 1, row: 2, colSpan: 3, rowSpan: 2 },
      },
      workflow: { onFlip: 'showLiveTileSchema', actions: [] },
      metadata: {
        category: 'tile',
        theme: 'dark',
        tags: ['livetile', 'kpi', 'evaluation'],
        accent: '#00d4ff',
        audience: 'Studio authors',
      },
    },
  },
  {
    id: 'livetile-live-weather',
    category: 'tile',
    title: 'LiveTile · Live weather',
    summary: 'Live weather tile populated from Open-Meteo with conditions and forecast strip.',
    theme: 'dark',
    accent: '#00d4ff',
    manifest: {
      $schema: FLIPCARD_SCHEMA_URL,
      version: '0.1.0',
      id: 'livetile-live-weather',
      title: 'LiveTile · Live weather',
      design: {
        kind: 'tile',
        eyebrow: 'LiveTile',
        headline: 'Live weather',
        summary: 'Current conditions plus short forecast strip rendered from Open-Meteo.',
        badge: 'Open-Meteo',
        items: [
          { label: 'API', value: 'api.open-meteo.com/v1/forecast' },
          { label: 'Params', value: 'lat, lon, temperature_unit' },
        ],
      },
      schema: {
        tileType: 'weather',
        api: 'https://api.open-meteo.com/v1/forecast',
        params: ['latitude', 'longitude', 'temperature_unit'],
      },
      workflow: { onFlip: 'showLiveTileSchema', actions: [] },
      metadata: {
        category: 'tile',
        theme: 'dark',
        tags: ['livetile', 'weather', 'api'],
        accent: '#00d4ff',
        audience: 'Studio authors',
      },
    },
  },
  {
    id: 'livetile-bic-scores',
    category: 'tile',
    title: 'LiveTile · BIC scores',
    summary: 'Score breakdown live tile rendered as dashboard bars over a dark surface.',
    theme: 'dark',
    accent: '#f59e0b',
    manifest: {
      $schema: FLIPCARD_SCHEMA_URL,
      version: '0.1.0',
      id: 'livetile-bic-scores',
      title: 'LiveTile · BIC scores',
      design: {
        kind: 'tile',
        eyebrow: 'LiveTile',
        headline: 'BIC scores by dimension',
        summary: 'Score bars across multiple BIC evaluation dimensions.',
        badge: 'Bar chart',
        items: [
          { label: 'Grid', value: 'col 1 row 4 · 7×4' },
          { label: 'Data', value: 'BIC_DATA · score by dim' },
        ],
      },
      schema: {
        id: 'bar',
        type: 'bar-chart',
        content: { title: 'BIC Scores by Dimension', dataKey: 'score', xKey: 'dim', data: 'BIC_DATA' },
        grid: { col: 1, row: 4, colSpan: 7, rowSpan: 4 },
      },
      workflow: { onFlip: 'showLiveTileSchema', actions: [] },
      metadata: {
        category: 'tile',
        theme: 'dark',
        tags: ['livetile', 'bar-chart', 'evaluation'],
        accent: '#f59e0b',
        audience: 'Studio authors',
      },
    },
  },

  // -------- Component showcase --------
  {
    id: 'showcase-hello-world-card',
    category: 'pattern',
    title: 'Hello world card',
    summary: 'Minimal hello-world adaptive card demo used in the component showcase section.',
    theme: 'dark',
    accent: '#0284c7',
    manifest: {
      $schema: FLIPCARD_SCHEMA_URL,
      version: '0.1.0',
      id: 'showcase-hello-world-card',
      title: 'Hello world card',
      design: {
        kind: 'pattern',
        eyebrow: 'Showcase',
        headline: 'Hello world',
        summary: 'Smallest possible AdaptiveCard 1.5 payload — single TextBlock.',
        badge: 'Minimal',
      },
      schema: {
        $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
        type: 'AdaptiveCard',
        version: '1.5',
        body: [{ type: 'TextBlock', text: 'Hello World' }],
      },
      workflow: { onFlip: 'showSampleSource', actions: [] },
      metadata: {
        category: 'pattern',
        theme: 'dark',
        tags: ['adaptive-cards', 'demo', 'minimal'],
        accent: '#0284c7',
        audience: 'Demo viewers',
      },
    },
  },
  {
    id: 'showcase-dashboard-template',
    category: 'pattern',
    title: 'Dashboard template',
    summary: 'Dashboard template card showing a 12-column, 7-row layout populated with seven tiles.',
    theme: 'midnight-sapphire',
    accent: '#0284c7',
    manifest: {
      $schema: FLIPCARD_SCHEMA_URL,
      version: '0.1.0',
      id: 'showcase-dashboard-template',
      title: 'Dashboard template',
      design: {
        kind: 'pattern',
        eyebrow: 'Showcase',
        headline: '12×7 dashboard',
        summary: 'Reference dashboard layout with seven tile slots over the midnight-sapphire theme.',
        badge: 'Template',
        items: [
          { label: 'Grid', value: '12 cols × 7 rows' },
          { label: 'Tiles', value: '7' },
          { label: 'Theme', value: 'midnight-sapphire' },
        ],
      },
      schema: {
        template: 'dashboard',
        theme: 'midnight-sapphire',
        grid: { columns: 12, rows: 7 },
        tileCount: 7,
      },
      workflow: { onFlip: 'openDashboardTemplate', actions: [] },
      metadata: {
        category: 'pattern',
        theme: 'midnight-sapphire',
        tags: ['dashboard', 'template', 'midnight-sapphire'],
        accent: '#0284c7',
        audience: 'Studio authors',
      },
    },
  },

  // -------- Discover templates -> FAQ --------
  {
    id: 'discover-faq-chatbot-template',
    category: 'faq',
    title: 'FAQ chatbot template',
    summary: 'FAQ assistant template with ShowCard-based answers and Power Fx data bindings.',
    theme: 'dark',
    accent: '#0284c7',
    manifest: {
      $schema: FLIPCARD_SCHEMA_URL,
      version: '0.1.0',
      id: 'discover-faq-chatbot-template',
      title: 'FAQ chatbot template',
      design: {
        kind: 'faq',
        eyebrow: 'Discover template',
        headline: 'FAQ assistant',
        summary: 'ShowCard-driven FAQ pattern that reveals answers inline; Power Fx provides answers.',
        badge: 'Template',
        faq: [
          {
            question: 'What is Copilot Studio?',
            answer: 'Microsoft’s low-code platform for designing, deploying, and governing custom copilots.',
          },
          {
            question: 'How do I connect a knowledge source?',
            answer: 'Use the Knowledge tab to add SharePoint, public web, Dataverse, or file-based sources.',
          },
          {
            question: 'What authentication modes are supported?',
            answer: 'Entra ID SSO, end-user authentication, and unauthenticated public agents.',
          },
        ],
      },
      schema: {
        template: 'faq-chatbot',
        binding: 'PowerFx',
        body: [
          { type: 'Container', style: 'emphasis' },
          { type: 'TextBlock', text: 'FAQ ASSISTANT' },
        ],
        actions: [
          { type: 'Action.ShowCard', title: 'What is Copilot Studio?' },
          { type: 'Action.ShowCard', title: 'How do I connect a knowledge source?' },
          { type: 'Action.ShowCard', title: 'What authentication modes are supported?' },
        ],
      },
      workflow: { onFlip: 'openTemplateSource', actions: [] },
      metadata: {
        category: 'faq',
        theme: 'dark',
        tags: ['faq', 'template', 'copilot-studio'],
        accent: '#0284c7',
        audience: 'Studio authors',
      },
    },
  },

  // -------- Evaluation tiles -> Metric --------
  {
    id: 'eval-tile-eval-configs',
    category: 'metric',
    title: 'Eval configs metric',
    summary: 'Evaluation KPI tile summarizing configuration count for the environment.',
    theme: 'dark',
    accent: '#00d4ff',
    manifest: {
      $schema: FLIPCARD_SCHEMA_URL,
      version: '0.1.0',
      id: 'eval-tile-eval-configs',
      title: 'Eval configs metric',
      design: {
        kind: 'metric',
        eyebrow: 'Evaluation',
        headline: '12 native evaluation configs',
        summary: 'Native Copilot Studio evaluation configurations in the current environment.',
        badge: 'Environment',
        stats: [{ label: 'Configs', value: '12' }],
        items: [
          { label: 'Entity', value: 'msdyn_aievaluationconfigurations' },
          { label: 'Scope', value: 'Environment' },
        ],
      },
      schema: {
        id: 'eval-configs',
        label: 'Eval Configs',
        dataStream: 'msdyn_aievaluationconfigurations',
        count: 12,
      },
      workflow: { onFlip: 'openEvalConfigDataset', actions: [] },
      metadata: {
        category: 'metric',
        theme: 'dark',
        tags: ['evaluation', 'metric', 'copilot-studio'],
        accent: '#00d4ff',
        audience: 'Eval authors',
      },
    },
  },
  {
    id: 'eval-tile-pass-rate',
    category: 'metric',
    title: 'Eval pass rate',
    summary: 'Combined pass-rate KPI tile with run totals and week-over-week trend.',
    theme: 'dark',
    accent: '#22c55e',
    manifest: {
      $schema: FLIPCARD_SCHEMA_URL,
      version: '0.1.0',
      id: 'eval-tile-pass-rate',
      title: 'Eval pass rate',
      design: {
        kind: 'metric',
        eyebrow: 'Evaluation',
        headline: '87% pass rate',
        summary: 'Combined pass rate across recent evaluation runs.',
        badge: 'Trending up',
        stats: [
          { label: 'Pass rate', value: '87%', trend: '+3 pts', tone: 'positive' },
          { label: 'Runs', value: '48' },
        ],
      },
      schema: {
        id: 'pass-rate',
        label: 'Pass Rate',
        dataStream: 'agent_studio_eval_runs',
        value: 87,
        suffix: '%',
        totalRuns: 48,
        trend: '+3% wow',
      },
      workflow: { onFlip: 'openEvalRunHistory', actions: [] },
      metadata: {
        category: 'metric',
        theme: 'dark',
        tags: ['evaluation', 'metric', 'pass-rate'],
        accent: '#22c55e',
        audience: 'Eval authors',
      },
    },
  },

  // -------- Portfolio scope (4 layer cards) --------
  {
    id: 'portfolio-security-layer',
    category: 'portfolio',
    title: 'Security layer',
    summary: 'Identity, access policy, and agent-connectivity gates for the agent surface.',
    theme: 'dark',
    accent: '#ef4444',
    manifest: {
      $schema: FLIPCARD_SCHEMA_URL,
      version: '0.1.0',
      id: 'portfolio-security-layer',
      title: 'Security layer',
      design: {
        kind: 'portfolio',
        eyebrow: 'Portfolio',
        headline: 'Security layer',
        summary: 'Identity, access policy, and agent-connectivity gates.',
        badge: 'Role: Security',
        items: [
          { label: 'Degree', value: '12' },
          { label: 'Signals', value: '4' },
          { label: 'Schema', value: 'Security Schema' },
        ],
      },
      schema: {
        role: 'Security',
        degree: 12,
        signals: 4,
        connections: [
          { rel: 'has_layer', target: 'Studio Steve' },
          { rel: 'authenticates_users_for', target: 'Microsoft Teams' },
        ],
      },
      workflow: { onFlip: 'openPortfolioLayer', actions: [] },
      metadata: {
        category: 'portfolio',
        theme: 'dark',
        tags: ['portfolio', 'security', 'layer'],
        accent: '#ef4444',
        audience: 'Architects',
      },
    },
  },
  {
    id: 'portfolio-identity-layer',
    category: 'portfolio',
    title: 'Identity layer',
    summary: 'Inner-core identity surface for the agent ecosystem.',
    theme: 'dark',
    accent: '#0284c7',
    manifest: {
      $schema: FLIPCARD_SCHEMA_URL,
      version: '0.1.0',
      id: 'portfolio-identity-layer',
      title: 'Identity layer',
      design: {
        kind: 'portfolio',
        eyebrow: 'Portfolio',
        headline: 'Identity layer',
        summary: 'Inner core identity surface anchored in Dataverse.',
        badge: 'Role: Identity',
        items: [
          { label: 'Degree', value: '8' },
          { label: 'Signals', value: '4' },
          { label: 'Schema', value: 'Identity Schema' },
        ],
      },
      schema: {
        role: 'Identity',
        degree: 8,
        signals: 4,
        connections: [
          { rel: 'has_layer', target: 'Studio Steve' },
          { rel: 'stored_in', target: 'Dataverse Environment' },
        ],
      },
      workflow: { onFlip: 'openPortfolioLayer', actions: [] },
      metadata: {
        category: 'portfolio',
        theme: 'dark',
        tags: ['portfolio', 'identity', 'layer'],
        accent: '#0284c7',
        audience: 'Architects',
      },
    },
  },
  {
    id: 'portfolio-channel-layer',
    category: 'portfolio',
    title: 'Channel layer',
    summary: 'Where the agent surfaces to users and platforms.',
    theme: 'dark',
    accent: '#0284c7',
    manifest: {
      $schema: FLIPCARD_SCHEMA_URL,
      version: '0.1.0',
      id: 'portfolio-channel-layer',
      title: 'Channel layer',
      design: {
        kind: 'portfolio',
        eyebrow: 'Portfolio',
        headline: 'Channel layer',
        summary: 'Outbound surfaces — Teams, M365 Copilot, web, and beyond.',
        badge: 'Role: Channel',
        items: [
          { label: 'Degree', value: '12' },
          { label: 'Signals', value: '3' },
          { label: 'Schema', value: 'Channel Schema' },
        ],
      },
      schema: {
        role: 'Channel',
        degree: 12,
        signals: 3,
        connections: [
          { rel: 'publishes_to', target: 'Microsoft Teams' },
          { rel: 'publishes_to', target: 'Microsoft 365 Copilot' },
        ],
      },
      workflow: { onFlip: 'openPortfolioLayer', actions: [] },
      metadata: {
        category: 'portfolio',
        theme: 'dark',
        tags: ['portfolio', 'channel', 'layer'],
        accent: '#0284c7',
        audience: 'Architects',
      },
    },
  },
  {
    id: 'portfolio-ai-settings-layer',
    category: 'portfolio',
    title: 'AI settings layer',
    summary: 'Model, planner, grounding, and file-analysis controls.',
    theme: 'dark',
    accent: '#0284c7',
    manifest: {
      $schema: FLIPCARD_SCHEMA_URL,
      version: '0.1.0',
      id: 'portfolio-ai-settings-layer',
      title: 'AI settings layer',
      design: {
        kind: 'portfolio',
        eyebrow: 'Portfolio',
        headline: 'AI settings layer',
        summary: 'Model selection, planner toggles, grounding sources, file analysis, and generative actions.',
        badge: 'Role: AI Settings',
        items: [
          { label: 'Degree', value: '11' },
          { label: 'Signals', value: '5' },
          { label: 'Schema', value: 'AI Settings Schema' },
        ],
        bullets: [
          'Model: GPT51ChatThinky',
          'Use model knowledge: true',
          'Semantic search: true',
          'File analysis: true',
          'Generative actions: true',
        ],
      },
      schema: {
        role: 'AISettings',
        degree: 11,
        signals: 5,
        model: 'GPT51ChatThinky',
        useModelKnowledge: true,
        semanticSearch: true,
        fileAnalysis: true,
        generativeActions: true,
      },
      workflow: { onFlip: 'openPortfolioLayer', actions: [] },
      metadata: {
        category: 'portfolio',
        theme: 'dark',
        tags: ['portfolio', 'ai-settings', 'layer'],
        accent: '#0284c7',
        audience: 'Architects',
      },
    },
  },

  // -------- Security settings (7) --------
  {
    id: 'security-auth-mode',
    category: 'security',
    title: 'Authentication mode',
    summary: 'Require Entra ID authentication before any user can interact with the agent.',
    theme: 'dark',
    accent: '#22c55e',
    manifest: {
      $schema: FLIPCARD_SCHEMA_URL,
      version: '0.1.0',
      id: 'security-auth-mode',
      title: 'Authentication mode',
      design: {
        kind: 'security',
        eyebrow: 'Security',
        headline: 'Authenticate with Microsoft',
        summary: 'Enforce Entra ID SSO so only signed-in identities can interact.',
        badge: 'OK',
        items: [
          { label: 'Field', value: 'authenticationconfiguration.mode' },
          { label: 'Current', value: 'Authenticate with Microsoft', tone: 'positive' },
          { label: 'Target', value: 'Authenticate with Microsoft' },
        ],
      },
      schema: {
        id: 'auth-mode',
        schemaRef: 'BotAuthenticationConfiguration',
        state: 'ok',
        recommendation:
          "Keep authentication mode set to 'Authenticate with Microsoft' to enforce Entra ID SSO.",
      },
      workflow: { onFlip: 'openSecurityControl', actions: [] },
      metadata: {
        category: 'security',
        theme: 'dark',
        tags: ['security', 'authentication', 'entra'],
        accent: '#22c55e',
        audience: 'Security reviewers',
      },
    },
  },
  {
    id: 'security-auth-trigger',
    category: 'security',
    title: 'Authentication trigger',
    summary: "Controls when the auth prompt appears. 'Always' means every new session requires sign-in.",
    theme: 'dark',
    accent: '#22c55e',
    manifest: {
      $schema: FLIPCARD_SCHEMA_URL,
      version: '0.1.0',
      id: 'security-auth-trigger',
      title: 'Authentication trigger',
      design: {
        kind: 'security',
        eyebrow: 'Security',
        headline: 'Always prompt',
        summary: 'Every new session requires sign-in.',
        badge: 'OK',
        items: [
          { label: 'Field', value: 'authenticationconfiguration.trigger' },
          { label: 'Current', value: 'Always', tone: 'positive' },
          { label: 'Target', value: 'Always' },
        ],
      },
      schema: { id: 'auth-trigger', schemaRef: 'AuthenticationTrigger', state: 'ok' },
      workflow: { onFlip: 'openSecurityControl', actions: [] },
      metadata: {
        category: 'security',
        theme: 'dark',
        tags: ['security', 'authentication'],
        accent: '#22c55e',
        audience: 'Security reviewers',
      },
    },
  },
  {
    id: 'security-access-control',
    category: 'security',
    title: 'Access control',
    summary: 'Restricts which users or groups can interact with the agent.',
    theme: 'dark',
    accent: '#22c55e',
    manifest: {
      $schema: FLIPCARD_SCHEMA_URL,
      version: '0.1.0',
      id: 'security-access-control',
      title: 'Access control',
      design: {
        kind: 'security',
        eyebrow: 'Security',
        headline: 'Selected users only',
        summary: 'Audience scoped to specific users / groups.',
        badge: 'OK',
        items: [
          { label: 'Field', value: 'accesscontrol.audience' },
          { label: 'Current', value: 'Selected users', tone: 'positive' },
        ],
      },
      schema: { id: 'access-control', schemaRef: 'AccessControl', state: 'ok' },
      workflow: { onFlip: 'openSecurityControl', actions: [] },
      metadata: {
        category: 'security',
        theme: 'dark',
        tags: ['security', 'access-control'],
        accent: '#22c55e',
        audience: 'Security reviewers',
      },
    },
  },
  {
    id: 'security-web-channel',
    category: 'security',
    title: 'Web channel security',
    summary: 'When disabled, the Direct Line token endpoint is open and vulnerable.',
    theme: 'dark',
    accent: '#ef4444',
    manifest: {
      $schema: FLIPCARD_SCHEMA_URL,
      version: '0.1.0',
      id: 'security-web-channel',
      title: 'Web channel security',
      design: {
        kind: 'security',
        eyebrow: 'Security',
        headline: 'Direct Line token endpoint exposed',
        summary: 'Web channel security is disabled — token endpoint is callable without secret rotation.',
        badge: 'Critical',
        items: [
          { label: 'Field', value: 'iswebchannelsecurityenabled' },
          { label: 'Current', value: 'false', tone: 'critical' },
          { label: 'Target', value: 'true' },
        ],
      },
      schema: {
        id: 'web-channel',
        schemaRef: 'ChannelDefinition.webSecurity',
        state: 'critical',
        recommendation: 'Enable secured access on the web channel and rotate Direct Line secrets.',
      },
      workflow: { onFlip: 'openSecurityControl', actions: [] },
      metadata: {
        category: 'security',
        theme: 'dark',
        tags: ['security', 'channel', 'directline'],
        accent: '#ef4444',
        audience: 'Security reviewers',
      },
    },
  },
  {
    id: 'security-agent-connectable',
    category: 'security',
    title: 'Agent connectivity',
    summary: 'Allows other Copilot Studio agents to call this agent as a sub-agent.',
    theme: 'dark',
    accent: '#f59e0b',
    manifest: {
      $schema: FLIPCARD_SCHEMA_URL,
      version: '0.1.0',
      id: 'security-agent-connectable',
      title: 'Agent connectivity',
      design: {
        kind: 'security',
        eyebrow: 'Security',
        headline: 'Connectable from other agents',
        summary: 'Other Copilot Studio agents can invoke this one — review trust boundaries.',
        badge: 'Warn',
        items: [
          { label: 'Field', value: 'isagentconnectable' },
          { label: 'Current', value: 'true', tone: 'warning' },
        ],
      },
      schema: { id: 'agent-connectable', schemaRef: 'ConnectedAgent', state: 'warn' },
      workflow: { onFlip: 'openSecurityControl', actions: [] },
      metadata: {
        category: 'security',
        theme: 'dark',
        tags: ['security', 'connected-agents'],
        accent: '#f59e0b',
        audience: 'Security reviewers',
      },
    },
  },
  {
    id: 'security-generative-actions',
    category: 'security',
    title: 'Generative actions',
    summary: 'Lets the LLM autonomously select and invoke plugin actions without explicit topic routing.',
    theme: 'dark',
    accent: '#f59e0b',
    manifest: {
      $schema: FLIPCARD_SCHEMA_URL,
      version: '0.1.0',
      id: 'security-generative-actions',
      title: 'Generative actions',
      design: {
        kind: 'security',
        eyebrow: 'Security',
        headline: 'Autonomous action selection on',
        summary: 'LLM may pick and invoke plugin actions without topic gating.',
        badge: 'Warn',
        items: [
          { label: 'Field', value: 'aisettings.generativeActionsEnabled' },
          { label: 'Current', value: 'true', tone: 'warning' },
          { label: 'Layer', value: 'AI Settings' },
        ],
      },
      schema: {
        id: 'generative-actions',
        schemaRef: 'AISettings.generativeActions',
        state: 'warn',
        recommendation:
          'Disable for agents handling sensitive data unless every action is explicitly allow-listed.',
      },
      workflow: { onFlip: 'openSecurityControl', actions: [] },
      metadata: {
        category: 'security',
        theme: 'dark',
        tags: ['security', 'ai-settings', 'plugins'],
        accent: '#f59e0b',
        audience: 'Security reviewers',
      },
    },
  },
  {
    id: 'security-file-analysis',
    category: 'security',
    title: 'File upload analysis',
    summary: 'Allows users to upload files which the LLM will parse and analyze within conversation context.',
    theme: 'dark',
    accent: '#f59e0b',
    manifest: {
      $schema: FLIPCARD_SCHEMA_URL,
      version: '0.1.0',
      id: 'security-file-analysis',
      title: 'File upload analysis',
      design: {
        kind: 'security',
        eyebrow: 'Security',
        headline: 'Inline file analysis on',
        summary: 'Uploaded files are parsed by the LLM in-session.',
        badge: 'Warn',
        items: [
          { label: 'Field', value: 'aisettings.fileAnalysisEnabled' },
          { label: 'Current', value: 'true', tone: 'warning' },
          { label: 'Layer', value: 'AI Settings' },
        ],
      },
      schema: {
        id: 'file-analysis',
        schemaRef: 'AISettings.fileAnalysis',
        state: 'warn',
        recommendation: 'Disable if the agent handles sensitive environments.',
      },
      workflow: { onFlip: 'openSecurityControl', actions: [] },
      metadata: {
        category: 'security',
        theme: 'dark',
        tags: ['security', 'ai-settings', 'file-upload'],
        accent: '#f59e0b',
        audience: 'Security reviewers',
      },
    },
  },
];

const unovisAssets: FlipCardAssetEntry[] = [
  // Line charts (5)
  unovisChart({
    id: 'unovis-basic-line-chart',
    title: 'Basic line chart',
    pathname: 'basic-line-chart',
    collection: 'Line Charts',
    summary: 'Single-series line with default axis configuration.',
  }),
  unovisChart({
    id: 'unovis-multi-line-chart',
    title: 'Multi line chart',
    pathname: 'multi-line-chart',
    collection: 'Line Charts',
    summary: 'Multiple series with automatic color assignment.',
  }),
  unovisChart({
    id: 'unovis-line-chart-data-gaps',
    title: 'Line chart with data gaps',
    pathname: 'data-gap-line-chart',
    collection: 'Line Charts',
    summary: 'Graceful handling of null/undefined data points.',
  }),
  unovisChart({
    id: 'unovis-patchy-line-chart',
    title: 'Patchy line chart',
    pathname: 'patchy-line-chart',
    collection: 'Line Charts',
    summary: 'Segmented rendering for sparse time-series data.',
  }),
  unovisChart({
    id: 'unovis-basic-timeline',
    title: 'Basic timeline',
    pathname: 'basic-timeline',
    collection: 'Line Charts',
    summary: 'Horizontal timeline with event positioning.',
  }),
  // Area charts (5)
  unovisChart({
    id: 'unovis-non-stacked-area-chart',
    title: 'Non-stacked area chart',
    pathname: 'non-stacked-area-chart',
    collection: 'Area Charts',
    summary: 'Overlapping area series without stacking.',
  }),
  unovisChart({
    id: 'unovis-stacked-area-chart',
    title: 'Stacked area chart with XYLabels',
    pathname: 'stacked-area-chart',
    collection: 'Area Charts',
    summary: 'Cumulative stacking with inline axis labels.',
  }),
  unovisChart({
    id: 'unovis-stacked-area-with-attributes',
    title: 'Stacked area chart with attributes',
    pathname: 'stacked-area-chart-with-attributes',
    collection: 'Area Charts',
    summary: 'Custom fill / stroke attributes per series.',
  }),
  unovisChart({
    id: 'unovis-baseline-area-chart',
    title: 'Area with baseline',
    pathname: 'baseline-area-chart',
    collection: 'Area Charts',
    summary: 'Area fill relative to a configurable baseline value.',
  }),
  unovisChart({
    id: 'unovis-step-area-chart',
    title: 'Step area chart',
    pathname: 'step-area-chart',
    collection: 'Area Charts',
    summary: 'Discrete step interpolation for categorical data.',
  }),
  // Bar charts (2)
  unovisChart({
    id: 'unovis-basic-grouped-bar',
    title: 'Basic grouped bar chart',
    pathname: 'basic-grouped-bar',
    collection: 'Bar Charts',
    summary: 'Side-by-side grouped bars with category axis.',
  }),
  unovisChart({
    id: 'unovis-horizontal-stacked-bar',
    title: 'Horizontal stacked bar chart',
    pathname: 'horizontal-stacked-bar-chart',
    collection: 'Bar Charts',
    summary: 'Horizontal orientation with tooltip and interactive legend.',
  }),
  // Scatter plots (3)
  unovisChart({
    id: 'unovis-basic-scatter-plot',
    title: 'Basic scatter plot',
    pathname: 'basic-scatter-plot',
    collection: 'Scatter Plots',
    summary: 'Simple X/Y point distribution.',
  }),
  unovisChart({
    id: 'unovis-sized-scatter-plot',
    title: 'Scatter plot with varied size',
    pathname: 'sized-scatter-plot',
    collection: 'Scatter Plots',
    summary: 'Point radius mapped to a third variable.',
  }),
  unovisChart({
    id: 'unovis-shaped-scatter-plot',
    title: 'Scatter plot with varied shape',
    pathname: 'shaped-scatter-plot',
    collection: 'Scatter Plots',
    summary: 'Shape encoding for categorical differentiation.',
  }),
  // Maps (4)
  unovisChart({
    id: 'unovis-basic-leaflet-map',
    title: 'Basic Leaflet map',
    pathname: 'basic-leaflet-map',
    collection: 'Maps',
    summary: 'Tile-based interactive map with Leaflet integration.',
  }),
  unovisChart({
    id: 'unovis-leaflet-flow-map',
    title: 'Leaflet flow map',
    pathname: 'leaflet-flow-map',
    collection: 'Maps',
    summary: 'Directional flow lines overlaid on a Leaflet map.',
  }),
  unovisChart({
    id: 'unovis-advanced-leaflet-map',
    title: 'Advanced Leaflet map',
    pathname: 'advanced-leaflet-map',
    collection: 'Maps',
    summary: 'MapLibre GL rendering with advanced tile layers.',
  }),
  unovisChart({
    id: 'unovis-choropleth-world-map',
    title: 'Choropleth world map',
    pathname: 'topojson-map',
    collection: 'Maps',
    summary: 'TopoJSON geometry with color-coded regions and legend.',
  }),
  // Networks and flows (7)
  unovisChart({
    id: 'unovis-basic-sankey',
    title: 'Basic Sankey',
    pathname: 'basic-sankey',
    collection: 'Networks and Flows',
    summary: 'Flow diagram with proportional link widths.',
  }),
  unovisChart({
    id: 'unovis-expandable-sankey',
    title: 'Expandable Sankey',
    pathname: 'expandable-sankey',
    collection: 'Networks and Flows',
    summary: 'Interactive expand / collapse of Sankey node groups.',
  }),
  unovisChart({
    id: 'unovis-dagre-layout-graph',
    title: 'Dagre layout graph',
    pathname: 'dagre-graph',
    collection: 'Networks and Flows',
    summary: 'Directed acyclic graph using the Dagre layout engine.',
  }),
  unovisChart({
    id: 'unovis-force-layout-graph',
    title: 'Force layout graph',
    pathname: 'force-graph',
    collection: 'Networks and Flows',
    summary: 'Physics-based force-directed node placement.',
  }),
  unovisChart({
    id: 'unovis-parallel-layout-graph',
    title: 'Parallel layout graph',
    pathname: 'parallel-graph',
    collection: 'Networks and Flows',
    summary: 'Parallel (left-to-right) hierarchical graph layout.',
  }),
  unovisChart({
    id: 'unovis-elk-layered-graph',
    title: 'ELK layered graph',
    pathname: 'elk-layered-graph',
    collection: 'Networks and Flows',
    summary: 'Eclipse Layout Kernel layered algorithm.',
  }),
  unovisChart({
    id: 'unovis-custom-nodes-graph',
    title: 'Custom nodes graph with tooltips',
    pathname: 'custom-nodes-graph',
    collection: 'Networks and Flows',
    summary: 'SVG / HTML custom node rendering with hover tooltips.',
  }),
  // Circular charts (3)
  unovisChart({
    id: 'unovis-basic-donut-chart',
    title: 'Basic donut chart',
    pathname: 'basic-donut-chart',
    collection: 'Circular Charts',
    summary: 'Ring chart with proportional arc segments.',
  }),
  unovisChart({
    id: 'unovis-hierarchical-chord-diagram',
    title: 'Hierarchical chord diagram',
    pathname: 'hierarchical-chord-diagram',
    collection: 'Circular Charts',
    summary: 'Nested group chords showing inter-group flows.',
  }),
  unovisChart({
    id: 'unovis-sunburst-nested-donut',
    title: 'Sunburst nested donut',
    pathname: 'sunburst-nested-donut',
    collection: 'Circular Charts',
    summary: 'Multi-level concentric rings for hierarchical data.',
  }),
  // Treemap (1)
  unovisChart({
    id: 'unovis-treemap',
    title: 'Treemap',
    pathname: 'treemap',
    collection: 'Treemap',
    summary: 'Space-filling hierarchical rectangle layout.',
  }),
  // Composite charts (2)
  unovisChart({
    id: 'unovis-dual-axis-chart',
    title: 'Dual axis chart',
    pathname: 'dual-axis-chart',
    collection: 'Composite Charts',
    summary: 'Two Y-axes with independent scales and chart types.',
  }),
  unovisChart({
    id: 'unovis-range-plot',
    title: 'Range plot',
    pathname: 'range-plot',
    collection: 'Composite Charts',
    summary: 'Vertical range bands showing min / max intervals.',
  }),
  // Auxiliary components (5)
  unovisChart({
    id: 'unovis-chart-annotations',
    title: 'Chart annotations',
    pathname: 'basic-annotations',
    collection: 'Auxiliary Components',
    summary: 'Text and marker annotations on chart elements.',
  }),
  unovisChart({
    id: 'unovis-stacked-bar-crosshair',
    title: 'Stacked bar with crosshair',
    pathname: 'crosshair-stacked-bar',
    collection: 'Auxiliary Components',
    summary: 'Vertical crosshair cursor with value readout.',
  }),
  unovisChart({
    id: 'unovis-grouped-bar-brush-legend',
    title: 'Grouped bar with brush + legend',
    pathname: 'brush-grouped-bar',
    collection: 'Auxiliary Components',
    summary: 'Axis brush selection with legend-driven series toggle.',
  }),
  unovisChart({
    id: 'unovis-scatter-free-brush',
    title: 'Scatter plot with free brush',
    pathname: 'free-brush-scatters',
    collection: 'Auxiliary Components',
    summary: 'Rectangular free-form brush for point selection.',
  }),
  unovisChart({
    id: 'unovis-plotband-plotline',
    title: 'Plot bands and plot lines',
    pathname: 'plotband-plotline',
    collection: 'Auxiliary Components',
    summary: 'Shaded bands and reference lines overlaid on chart area.',
  }),
];

const viewportGridAssets: FlipCardAssetEntry[] = [
  {
    id: 'tile-a-accuracy',
    category: 'tile',
    title: 'Viewport tile · Accuracy',
    summary: 'Threshold-based pass-rate KPI tile with sparkline and trend indicator.',
    theme: 'dark',
    accent: '#00d4ff',
    manifest: {
      $schema: FLIPCARD_SCHEMA_URL,
      version: '0.1.0',
      id: 'tile-a-accuracy',
      title: 'Viewport tile · Accuracy',
      design: {
        kind: 'tile',
        eyebrow: 'Viewport grid',
        headline: '94.2% accuracy',
        summary: 'Threshold-driven KPI rendered in 2W × 4R tile slot.',
        badge: 'KPI',
        stats: [{ label: 'Accuracy', value: '94.2%', trend: 'up', tone: 'positive' }],
        items: [
          { label: 'Tile size', value: '2W × 4R · 70.4 × 60 px' },
          { label: 'BD count', value: '32' },
          { label: 'Runbook viewports', value: '4 · 8 · 16' },
        ],
      },
      schema: {
        thread: 'accuracy',
        size: { w: 2, r: 4, pxW: 70.4, pxH: 60 },
        bdCount: 32,
        contract: {
          value: '0-100 number',
          unit: '%',
          threshold: { warn: 90, critical: 80 },
          trend: 'up|down|stable',
        },
        runbookVp: [4, 8, 16],
        formats: ['tsx', 'json', 'yaml', 'md'],
      },
      workflow: { onFlip: 'openTileManifest', actions: [] },
      metadata: {
        category: 'tile',
        theme: 'dark',
        tags: ['viewport', 'tile', 'accuracy', 'kpi'],
        accent: '#00d4ff',
        audience: 'Operators',
      },
    },
  },
  {
    id: 'tile-b-events-sec',
    category: 'tile',
    title: 'Viewport tile · Events / sec',
    summary: 'Real-time throughput monitor with peak-capacity bar and activity history.',
    theme: 'dark',
    accent: '#f59e0b',
    manifest: {
      $schema: FLIPCARD_SCHEMA_URL,
      version: '0.1.0',
      id: 'tile-b-events-sec',
      title: 'Viewport tile · Events / sec',
      design: {
        kind: 'tile',
        eyebrow: 'Viewport grid',
        headline: '1,247 events / sec',
        summary: 'Throughput with peak utilization bar in a 4W × 8R tile slot.',
        badge: 'Throughput',
        stats: [{ label: 'Throughput', value: '1,247/s', tone: 'warning' }],
        items: [
          { label: 'Tile size', value: '4W × 8R · 140.8 × 120 px' },
          { label: 'BD count', value: '128' },
          { label: 'Runbook viewports', value: '4 · 8' },
        ],
      },
      schema: {
        thread: 'events-sec',
        size: { w: 4, r: 8, pxW: 140.8, pxH: 120 },
        bdCount: 128,
        contract: {
          value: 'current events/sec',
          peak: 'peak observed',
          baseline: 'expected normal',
          window: '1m|5m|15m',
          history: 'sparkline samples array',
        },
        runbookVp: [4, 8],
        formats: ['tsx', 'json', 'yaml', 'md'],
      },
      workflow: { onFlip: 'openTileManifest', actions: [] },
      metadata: {
        category: 'tile',
        theme: 'dark',
        tags: ['viewport', 'tile', 'throughput'],
        accent: '#f59e0b',
        audience: 'Operators',
      },
    },
  },
  {
    id: 'tile-c-status',
    category: 'tile',
    title: 'Viewport tile · Status',
    summary: 'System health board summarizing overall status and per-subsystem health with latency.',
    theme: 'dark',
    accent: '#a855f7',
    manifest: {
      $schema: FLIPCARD_SCHEMA_URL,
      version: '0.1.0',
      id: 'tile-c-status',
      title: 'Viewport tile · Status',
      design: {
        kind: 'tile',
        eyebrow: 'Viewport grid',
        headline: 'NOMINAL across 5 systems',
        summary: 'Overall health with per-subsystem status and latency in an 8W × 8R tile slot.',
        badge: 'Health',
        items: [
          { label: 'Tile size', value: '8W × 8R · 281.6 × 120 px' },
          { label: 'BD count', value: '256' },
          { label: 'Systems tracked', value: '5' },
        ],
      },
      schema: {
        thread: 'status',
        size: { w: 8, r: 8, pxW: 281.6, pxH: 120 },
        bdCount: 256,
        contract: {
          overall: 'nominal|degraded|outage|maintenance',
          systems: [{ name: 'string', status: 'SystemStatus', latencyMs: 'optional number' }],
          updatedAt: 'ISO 8601',
        },
        runbookVp: [4, 8],
        formats: ['tsx', 'json', 'yaml', 'md'],
      },
      workflow: { onFlip: 'openTileManifest', actions: [] },
      metadata: {
        category: 'tile',
        theme: 'dark',
        tags: ['viewport', 'tile', 'status', 'health'],
        accent: '#a855f7',
        audience: 'Operators',
      },
    },
  },
  {
    id: 'tile-d-kg-engine',
    category: 'tile',
    title: 'Viewport tile · KG engine',
    summary: 'Knowledge-graph engine detail panel: nodes, edges, dimensions, latency, status.',
    theme: 'dark',
    accent: '#22c55e',
    manifest: {
      $schema: FLIPCARD_SCHEMA_URL,
      version: '0.1.0',
      id: 'tile-d-kg-engine',
      title: 'Viewport tile · KG engine',
      design: {
        kind: 'tile',
        eyebrow: 'Viewport grid',
        headline: '3D-KG · 4.2M nodes',
        summary: '768-dim embeddings over 4.2M nodes / 18.7M edges in an 8W × 16R tile slot.',
        badge: 'Engine',
        stats: [
          { label: 'Nodes', value: '4.2M' },
          { label: 'Edges', value: '18.7M' },
          { label: 'Dimensions', value: '768' },
        ],
        items: [
          { label: 'Tile size', value: '8W × 16R · 281.6 × 240 px' },
          { label: 'BD count', value: '512' },
          { label: 'Runbook viewports', value: '4 · 8 · 16 · 32' },
        ],
      },
      schema: {
        thread: 'kg-engine',
        size: { w: 8, r: 16, pxW: 281.6, pxH: 240 },
        bdCount: 512,
        contract: {
          engineId: 'string',
          version: 'semver',
          type: '3D-KG|flat|hierarchical',
          stats: {
            nodes: 'integer',
            edges: 'integer',
            dimensions: 'integer',
            queryLatencyMs: 'number',
            indexedAt: 'ISO 8601',
          },
          status: 'online|indexing|offline',
        },
        runbookVp: [4, 8, 16, 32],
        formats: ['tsx', 'json', 'yaml', 'md'],
      },
      workflow: { onFlip: 'openTileManifest', actions: [] },
      metadata: {
        category: 'tile',
        theme: 'dark',
        tags: ['viewport', 'tile', 'knowledge-graph'],
        accent: '#22c55e',
        audience: 'Engineers',
      },
    },
  },
];

export const viewportFlipCardAssets: readonly FlipCardAssetEntry[] = [
  ...patternLibraryAssets,
  ...unovisAssets,
  ...viewportGridAssets,
];
