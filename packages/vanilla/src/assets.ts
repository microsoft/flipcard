import { FLIPCARD_SCHEMA_URL } from '@microsoft/flipcard-core';
import type { FlipCardAssetCategory, FlipCardAssetEntry } from './types';
import { viewportFlipCardAssets } from './assets-viewport';
import { slideFlipCardAssets } from './assets-slides.generated';

export const flipCardCategoryLabels: Record<FlipCardAssetCategory, string> = {
  kpi: 'KPI',
  status: 'Status',
  profile: 'Profile',
  code: 'Code / JSON',
  timeline: 'Timeline',
  faq: 'FAQ',
  security: 'Security',
  media: 'Media',
  metric: 'Metric',
  chart: 'Chart',
  pattern: 'Pattern',
  tile: 'Tile',
  portfolio: 'Portfolio',
  slide: 'Adaptive Slide',
};

export const flipCardAssetLibrary: readonly FlipCardAssetEntry[] = [
  {
    id: 'kpi-quarterly-revenue',
    category: 'kpi',
    title: 'Quarterly revenue pulse',
    summary: 'Executive KPI card for quarterly revenue, target attainment, and pipeline quality.',
    theme: 'light',
    accent: '#2563eb',
    manifest: {
      $schema: FLIPCARD_SCHEMA_URL,
      version: '0.1.0',
      id: 'kpi-quarterly-revenue',
      title: 'Quarterly revenue pulse',
      design: {
        kind: 'kpi',
        eyebrow: 'Executive KPI',
        headline: '$24.8M revenue',
        summary: '92% of quarterly target landed with upside in enterprise renewals.',
        badge: 'On track',
        stats: [
          { label: 'QoQ growth', value: '+18.4%', trend: '+4.2 pts', tone: 'positive' },
          { label: 'Gross margin', value: '67%', trend: '+1.1 pts', tone: 'positive' },
          { label: 'Renewal risk', value: '3 accounts', trend: 'Needs review', tone: 'warning' }
        ],
        bullets: [
          'Top segment: regulated industries',
          'Fastest acceleration: partner-sourced deals',
          'Next action: close two stalled renewals before Friday'
        ]
      },
      schema: {
        metricId: 'rev.qtr.current',
        period: 'FY26-Q3',
        target: 27000000,
        actual: 24800000,
        source: 'finance-cube',
        owner: 'Commercial Insights'
      },
      workflow: {
        onFlip: 'openRevenueDrilldown',
        actions: [
          { id: 'open-scorecard', type: 'navigate', data: { target: '/scorecards/revenue' } },
          { id: 'share-brief', type: 'compose', data: { template: 'exec-brief' } }
        ]
      },
      metadata: {
        category: 'kpi',
        theme: 'light',
        tags: ['finance', 'executive', 'quarterly'],
        accent: '#2563eb',
        audience: 'Leadership'
      }
    }
  },
  {
    id: 'status-service-health',
    category: 'status',
    title: 'Platform health board',
    summary: 'Operational service health card spanning incidents, latency, and mitigations.',
    theme: 'dark',
    accent: '#60a5fa',
    manifest: {
      $schema: FLIPCARD_SCHEMA_URL,
      version: '0.1.0',
      id: 'status-service-health',
      title: 'Platform health board',
      design: {
        kind: 'status',
        eyebrow: 'Operations',
        headline: '3 regions stable',
        summary: 'EU West remains in mitigation while all customer-facing APIs stay above SLA.',
        badge: 'Mitigating',
        items: [
          { label: 'SLA', value: '99.96%', tone: 'positive' },
          { label: 'P95 latency', value: '284 ms', tone: 'warning' },
          { label: 'Open incidents', value: '1 Sev-2', tone: 'critical' }
        ],
        bullets: [
          'Traffic shifted 18% away from impacted cluster',
          'Comms posted to status page and TAM channel',
          'ETA for full recovery: 45 minutes'
        ]
      },
      schema: {
        service: 'FlipCard API gateway',
        statusPage: 'https://status.contoso.example/flipcard',
        regions: ['US East', 'US Central', 'EU West'],
        mitigationOwner: 'SRE on-call'
      },
      workflow: {
        onFlip: 'openIncidentCommandCenter',
        actions: [
          { id: 'join-bridge', type: 'deeplink', data: { target: 'teams://incident/bridge' } }
        ]
      },
      metadata: {
        category: 'status',
        theme: 'dark',
        tags: ['operations', 'sre', 'incident'],
        accent: '#60a5fa',
        audience: 'Engineering'
      }
    }
  },
  {
    id: 'profile-customer-success',
    category: 'profile',
    title: 'Customer success profile',
    summary: 'Reusable profile card for account context, owners, and expansion signals.',
    theme: 'light',
    accent: '#0f766e',
    manifest: {
      $schema: FLIPCARD_SCHEMA_URL,
      version: '0.1.0',
      id: 'profile-customer-success',
      title: 'Customer success profile',
      design: {
        kind: 'profile',
        eyebrow: 'Account profile',
        headline: 'Fabrikam Retail',
        summary: 'Healthy enterprise tenant with strong sponsor coverage and upsell momentum.',
        badge: 'Expansion-ready',
        person: {
          name: 'Avery Johnson',
          role: 'VP, Digital Commerce',
          team: 'Executive Sponsor',
          location: 'Seattle, WA'
        },
        items: [
          { label: 'CSM', value: 'Priya Raman' },
          { label: 'Health score', value: '82 / 100', tone: 'positive' },
          { label: 'Renewal window', value: '74 days' }
        ],
        bullets: [
          'Interested in store-associate copilots',
          'Needs legal review for expanded data retention',
          'Requested executive QBR follow-up next month'
        ]
      },
      schema: {
        tenantId: 'fabrikam-retail-prod',
        segment: 'Enterprise',
        seats: 18400,
        renewalDate: '2026-07-05',
        growthPlay: 'Store operations modernization'
      },
      workflow: {
        onFlip: 'openAccountWorkspace',
        actions: [
          { id: 'create-qbr', type: 'workflow', data: { template: 'qbr' } }
        ]
      },
      metadata: {
        category: 'profile',
        theme: 'light',
        tags: ['customer', 'profile', 'success'],
        accent: '#0f766e',
        audience: 'Customer success'
      }
    }
  },
  {
    id: 'code-api-payload',
    category: 'code',
    title: 'API payload inspector',
    summary: 'Code-focused card for payload previews, schema snippets, and contract checks.',
    theme: 'dark',
    accent: '#a78bfa',
    manifest: {
      $schema: FLIPCARD_SCHEMA_URL,
      version: '0.1.0',
      id: 'code-api-payload',
      title: 'API payload inspector',
      design: {
        kind: 'code',
        eyebrow: 'Payload preview',
        headline: 'OrderCreated v2',
        summary: 'Sample event shows new loyalty and geo enrichment fields in the contract.',
        badge: 'Schema changed',
        code: {
          language: 'json',
          snippet: '{\n  "event": "OrderCreated",\n  "version": "2.0",\n  "orderId": "SO-10482",\n  "loyaltyTier": "gold",\n  "geo": { "country": "US", "region": "WA" }\n}'
        },
        bullets: [
          'Back compat preserved for v1 consumers',
          'New fields are optional for 30-day transition',
          'Contract tests updated in CI gate'
        ]
      },
      schema: {
        api: 'events/order-created',
        owner: 'Commerce platform',
        version: '2.0.0',
        compatibility: 'backward-compatible'
      },
      workflow: {
        onFlip: 'openContractDiff',
        actions: [
          { id: 'copy-snippet', type: 'copy', data: { source: 'design.code.snippet' } }
        ]
      },
      metadata: {
        category: 'code',
        theme: 'dark',
        tags: ['api', 'json', 'contract'],
        accent: '#a78bfa',
        audience: 'Developers'
      }
    }
  },
  {
    id: 'timeline-release-readiness',
    category: 'timeline',
    title: 'Release readiness timeline',
    summary: 'Milestone-driven timeline card for staged launches and dependency tracking.',
    theme: 'midnight-sapphire',
    accent: '#4f8cff',
    manifest: {
      $schema: FLIPCARD_SCHEMA_URL,
      version: '0.1.0',
      id: 'timeline-release-readiness',
      title: 'Release readiness timeline',
      design: {
        kind: 'timeline',
        eyebrow: 'Launch plan',
        headline: 'Spring release train',
        summary: 'Feature complete this week, docs next, customer wave one starts Monday.',
        badge: 'Ready for sign-off',
        timeline: [
          { phase: 'Feature complete', date: 'Apr 24', status: 'Done' },
          { phase: 'Security review', date: 'Apr 25', status: 'In progress' },
          { phase: 'Docs and training', date: 'Apr 28', status: 'Queued' },
          { phase: 'Wave 1 rollout', date: 'Apr 29', status: 'Planned' }
        ],
        bullets: [
          'Two customer-specific mitigations remain',
          'Legal copy locked for launch announcement',
          'Monitoring dashboard published for on-call'
        ]
      },
      schema: {
        releaseId: 'spring-2026-wave1',
        changeWindow: '2026-04-29T17:00:00Z',
        dependencies: ['security-signoff', 'docs-publish', 'support-brief']
      },
      workflow: {
        onFlip: 'openReleaseChecklist',
        actions: [
          { id: 'view-runbook', type: 'navigate', data: { target: '/runbooks/release-wave1' } }
        ]
      },
      metadata: {
        category: 'timeline',
        theme: 'midnight-sapphire',
        tags: ['release', 'timeline', 'launch'],
        accent: '#4f8cff',
        audience: 'Program management'
      }
    }
  },
  {
    id: 'faq-deployment-playbook',
    category: 'faq',
    title: 'Deployment FAQ card',
    summary: 'Question-and-answer asset for onboarding, enablement, and field readiness.',
    theme: 'light',
    accent: '#ca8a04',
    manifest: {
      $schema: FLIPCARD_SCHEMA_URL,
      version: '0.1.0',
      id: 'faq-deployment-playbook',
      title: 'Deployment FAQ card',
      design: {
        kind: 'faq',
        eyebrow: 'Field enablement',
        headline: 'Top deployment questions',
        summary: 'Most common onboarding blockers answered for tenant admins and champions.',
        badge: 'Self-serve',
        faq: [
          {
            question: 'How long does first-time setup take?',
            answer: 'Most tenants finish setup in under 30 minutes using the guided checklist.'
          },
          {
            question: 'What permissions are required?',
            answer: 'Global reader plus app consent approval for the integration workspace.'
          },
          {
            question: 'Where do I validate success?',
            answer: 'Use the health dashboard and the audit events emitted after activation.'
          }
        ]
      },
      schema: {
        articleId: 'deployment-faq-v1',
        channel: 'Field readiness',
        locale: 'en-US'
      },
      workflow: {
        onFlip: 'openKnowledgeArticle',
        actions: [
          { id: 'open-faq', type: 'navigate', data: { target: '/knowledge/deployment-faq' } }
        ]
      },
      metadata: {
        category: 'faq',
        theme: 'light',
        tags: ['faq', 'deployment', 'support'],
        accent: '#ca8a04',
        audience: 'Admins'
      }
    }
  },
  {
    id: 'security-zero-trust',
    category: 'security',
    title: 'Zero trust posture',
    summary: 'Security card for control coverage, posture score, and remediation priorities.',
    theme: 'midnight-sapphire',
    accent: '#22c55e',
    manifest: {
      $schema: FLIPCARD_SCHEMA_URL,
      version: '0.1.0',
      id: 'security-zero-trust',
      title: 'Zero trust posture',
      design: {
        kind: 'security',
        eyebrow: 'Security posture',
        headline: '87% control coverage',
        summary: 'Identity controls are strong; data exfiltration policies need another sprint.',
        badge: 'Action required',
        stats: [
          { label: 'Open findings', value: '6', tone: 'warning' },
          { label: 'Criticals', value: '0', tone: 'positive' },
          { label: 'Owner SLA', value: '5 days', tone: 'neutral' }
        ],
        bullets: [
          'Conditional access enforced across all admin roles',
          'Two DLP policies still in pilot mode',
          'Next milestone: automate privileged access reviews'
        ]
      },
      schema: {
        scorecard: 'zero-trust-q2',
        controls: ['MFA', 'Conditional Access', 'PIM', 'DLP', 'Audit'],
        gapAreas: ['Endpoint exfiltration', 'Legacy service accounts']
      },
      workflow: {
        onFlip: 'openSecurityPlan',
        actions: [
          { id: 'create-remediation', type: 'workflow', data: { template: 'security-remediation' } }
        ]
      },
      metadata: {
        category: 'security',
        theme: 'midnight-sapphire',
        tags: ['security', 'compliance', 'zero-trust'],
        accent: '#22c55e',
        audience: 'Security'
      }
    }
  },
  {
    id: 'media-launch-recap',
    category: 'media',
    title: 'Launch recap media card',
    summary: 'Media asset for demo reels, campaign snippets, and event recordings.',
    theme: 'dark',
    accent: '#f97316',
    manifest: {
      $schema: FLIPCARD_SCHEMA_URL,
      version: '0.1.0',
      id: 'media-launch-recap',
      title: 'Launch recap media card',
      design: {
        kind: 'media',
        eyebrow: 'Media highlight',
        headline: 'Build keynote recap',
        summary: 'Condensed 90-second story focused on launch moments and customer proof points.',
        badge: 'Ready to share',
        media: {
          format: 'MP4',
          duration: '01:32',
          caption: 'Narrated event recap with product demo, customer quote, and CTA.'
        },
        quote: 'The recap cut is optimized for field sellers who need a fast narrative in customer meetings.'
      },
      schema: {
        assetId: 'media-build-recap-2026',
        owner: 'Integrated marketing',
        channels: ['Sales hub', 'Launch page', 'Social clips']
      },
      workflow: {
        onFlip: 'openMediaLibrary',
        actions: [
          { id: 'download-media', type: 'download', data: { target: 'media-build-recap-2026' } }
        ]
      },
      metadata: {
        category: 'media',
        theme: 'dark',
        tags: ['media', 'launch', 'video'],
        accent: '#f97316',
        audience: 'Marketing'
      }
    }
  },
  {
    id: 'metric-growth-loop',
    category: 'metric',
    title: 'Growth loop metric card',
    summary: 'Product growth card for activation, retention, and behavioral loop health.',
    theme: 'light',
    accent: '#7c3aed',
    manifest: {
      $schema: FLIPCARD_SCHEMA_URL,
      version: '0.1.0',
      id: 'metric-growth-loop',
      title: 'Growth loop metric card',
      design: {
        kind: 'metric',
        eyebrow: 'Product telemetry',
        headline: '41% weekly activation',
        summary: 'Activation rose after the new starter workflow, but seven-day retention is flat.',
        badge: 'Watch retention',
        stats: [
          { label: 'Activation', value: '41%', trend: '+6 pts', tone: 'positive' },
          { label: '7-day retention', value: '24%', trend: '-1 pt', tone: 'warning' },
          { label: 'Invites sent', value: '14.2K', trend: '+11%', tone: 'positive' }
        ],
        items: [
          { label: 'Growth loop', value: 'Create -> Share -> Review' },
          { label: 'Top segment', value: 'New admins' },
          { label: 'Next experiment', value: 'Contextual invite prompt' }
        ]
      },
      schema: {
        metricSet: 'growth-loop-v3',
        cohort: 'new-admins-last-28d',
        experiment: 'contextual-invite-prompt'
      },
      workflow: {
        onFlip: 'openGrowthDashboard',
        actions: [
          { id: 'view-cohort', type: 'navigate', data: { target: '/metrics/growth-loop' } }
        ]
      },
      metadata: {
        category: 'metric',
        theme: 'light',
        tags: ['growth', 'metric', 'telemetry'],
        accent: '#7c3aed',
        audience: 'Product'
      }
    }
  },
  ...viewportFlipCardAssets,
  ...slideFlipCardAssets,
];

export function getFlipCardAssetById(id: string): FlipCardAssetEntry | undefined {
  return flipCardAssetLibrary.find((asset) => asset.id === id);
}

export function getFlipCardAssetsByCategory(category: FlipCardAssetCategory): FlipCardAssetEntry[] {
  return flipCardAssetLibrary.filter((asset) => asset.category === category);
}

export function groupFlipCardAssetsByCategory(
  assets: readonly FlipCardAssetEntry[] = flipCardAssetLibrary,
): Record<FlipCardAssetCategory, FlipCardAssetEntry[]> {
  const grouped: Record<FlipCardAssetCategory, FlipCardAssetEntry[]> = {
    kpi: [],
    status: [],
    profile: [],
    code: [],
    timeline: [],
    faq: [],
    security: [],
    media: [],
    metric: [],
    chart: [],
    pattern: [],
    tile: [],
    portfolio: [],
    slide: [],
  };

  for (const asset of assets) {
    const bucket = grouped[asset.category];
    bucket.push(asset);
  }

  return grouped;
}
