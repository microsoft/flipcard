import { FlipCardController, type FlipState } from '@microsoft/flipcard-core';
import {
  Fragment,
  type CSSProperties,
  type KeyboardEvent,
  type ReactNode,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { AdaptiveCardSurface } from './AdaptiveCardSurface';
import type {
  FlipCardAssetDesign,
  FlipCardRenderableAsset,
  FlipCardAssetTheme,
  FlipCardAssetTone,
  FlipCardProps,
} from './types';

function getThemeClassName(theme: FlipCardAssetTheme): string {
  switch (theme) {
    case 'dark':
      return 'fc-theme-dark';
    case 'midnight-sapphire':
      return 'fc-theme-midnight-sapphire';
    case 'light':
    default:
      return 'fc-theme-light';
  }
}

function toneClassName(tone: FlipCardAssetTone = 'neutral'): string {
  return `fc-tone-pill fc-tone-${tone}`;
}

function lightenHex(hex: string, amount: number): string {
  const h = hex.replace('#', '');
  if (h.length !== 6) return hex;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  const lr = Math.min(255, Math.round(r + (255 - r) * amount));
  const lg = Math.min(255, Math.round(g + (255 - g) * amount));
  const lb = Math.min(255, Math.round(b + (255 - b) * amount));
  return `#${lr.toString(16).padStart(2, '0')}${lg.toString(16).padStart(2, '0')}${lb.toString(16).padStart(2, '0')}`;
}

function buildSlideHostConfig(theme: Record<string, unknown> | undefined): Record<string, unknown> | null {
  if (!theme) return null;
  const bg = (theme.backgroundColor as string) || '#0f1729';
  const primary = (theme.primaryColor as string) || '#6366f1';
  const accent = (theme.accentColor as string) || '#a78bfa';
  const fontFamily = (theme.fontFamily as string) || 'Segoe UI, system-ui, sans-serif';
  const emphasisBg = lightenHex(bg, 0.10);

  const baseFg = {
    default:   { default: '#ffffff', subtle: '#ffffffbb' },
    dark:      { default: '#ffffff', subtle: '#ffffffbb' },
    light:     { default: '#ffffff', subtle: '#ffffffee' },
    accent:    { default: accent,    subtle: accent },
    good:      { default: '#4ade80', subtle: '#4ade80cc' },
    warning:   { default: '#fbbf24', subtle: '#fbbf24cc' },
    attention: { default: '#f87171', subtle: '#f87171cc' },
  };
  const whiteFg = {
    default:   { default: '#ffffff', subtle: '#ffffffdd' },
    dark:      { default: '#ffffff', subtle: '#ffffffdd' },
    light:     { default: '#ffffff', subtle: '#ffffffee' },
    accent:    { default: '#ffffff', subtle: '#ffffffdd' },
    good:      { default: '#ffffff', subtle: '#ffffffdd' },
    warning:   { default: '#ffffff', subtle: '#ffffffdd' },
    attention: { default: '#ffffff', subtle: '#ffffffdd' },
  };

  return {
    supportsInteractivity: false,
    fontFamily,
    spacing: {
      small: 4,
      default: 8,
      medium: 12,
      large: 16,
      extraLarge: 22,
      padding: 12,
    },
    separator: {
      lineThickness: 1,
      lineColor: 'rgba(255, 255, 255, 0.16)',
    },
    containerStyles: {
      default:   { backgroundColor: bg,        foregroundColors: baseFg },
      emphasis:  { backgroundColor: emphasisBg, foregroundColors: baseFg },
      accent:    { backgroundColor: primary,    foregroundColors: whiteFg },
      good:      { backgroundColor: '#16a34a',  foregroundColors: whiteFg },
      attention: { backgroundColor: '#dc2626',  foregroundColors: whiteFg },
      warning:   { backgroundColor: '#d97706',  foregroundColors: whiteFg },
    },
  };
}

interface SlideAuxiliaries {
  styleVars: CSSProperties;
  audience: string;
  meta: string;
}

function getSlideAuxiliaries(asset: FlipCardRenderableAsset): SlideAuxiliaries | null {
  if (asset.category !== 'slide') return null;
  const schema = asset.manifest.schema as Record<string, unknown> | undefined;
  const theme = schema?.theme as Record<string, unknown> | undefined;
  const slide = schema?.slide as Record<string, unknown> | undefined;
  const layoutMode =
    ((slide?.layout as Record<string, unknown> | undefined)?.mode as string | undefined) ?? 'stack';
  const gradient = (slide?.background as Record<string, unknown> | undefined)?.gradient as
    | { type?: string; colors?: string[]; angle?: number }
    | undefined;

  const themeBg = (theme?.backgroundColor as string | undefined) ?? '#0f1729';
  let bg: string = themeBg;
  if (gradient && Array.isArray(gradient.colors) && gradient.colors.length >= 2) {
    const angle = typeof gradient.angle === 'number' ? gradient.angle : 135;
    bg = `linear-gradient(${angle}deg, ${gradient.colors.join(', ')})`;
  }

  const accent = (theme?.accentColor as string | undefined) ?? '#a78bfa';
  const primary = (theme?.primaryColor as string | undefined) ?? '#6366f1';
  const fontFamily = (theme?.fontFamily as string | undefined) ?? 'Segoe UI, system-ui, sans-serif';

  const adaptiveCard = (asset.manifest.design as Record<string, unknown> | undefined)?.adaptiveCard as
    | { version?: string }
    | undefined;
  const adaptiveVersion = adaptiveCard?.version ?? '1.6';
  const audienceRaw =
    ((asset.manifest.metadata as Record<string, unknown> | undefined)?.audience as string | undefined) ??
    'Adaptive Slide';

  const styleVars = {
    ['--fc-slide-bg' as string]: bg,
    ['--fc-slide-accent' as string]: accent,
    ['--fc-slide-primary' as string]: primary,
    ['--fc-slide-font' as string]: fontFamily,
  } as CSSProperties;

  return {
    styleVars,
    audience: audienceRaw.toUpperCase(),
    meta: `AC ${adaptiveVersion} · ${layoutMode.toUpperCase()}`,
  };
}

const defaultChartPalette = {
  solid: '#0284c7',
  soft: 'rgba(2, 132, 199, 0.14)',
  translucent: '#0284c799',
};

function chartAccentPalette(collection: string) {
  const palettes: Record<string, { solid: string; soft: string; translucent: string }> = {
    'Line Charts': defaultChartPalette,
    'Area Charts': { solid: '#0f766e', soft: 'rgba(15, 118, 110, 0.14)', translucent: '#0f766e99' },
    'Bar Charts': { solid: '#7c3aed', soft: 'rgba(124, 58, 237, 0.14)', translucent: '#7c3aed99' },
    'Scatter Plots': { solid: '#b45309', soft: 'rgba(180, 83, 9, 0.14)', translucent: '#b4530999' },
    Maps: { solid: '#047857', soft: 'rgba(4, 120, 87, 0.14)', translucent: '#04785799' },
    'Networks and Flows': { solid: '#be123c', soft: 'rgba(190, 18, 60, 0.14)', translucent: '#be123c99' },
    'Circular Charts': { solid: '#4338ca', soft: 'rgba(67, 56, 202, 0.14)', translucent: '#4338ca99' },
    Treemap: { solid: '#6d28d9', soft: 'rgba(109, 40, 217, 0.14)', translucent: '#6d28d999' },
    'Composite Charts': { solid: '#0f766e', soft: 'rgba(15, 118, 110, 0.14)', translucent: '#0f766e99' },
    'Auxiliary Components': { solid: '#374151', soft: 'rgba(55, 65, 81, 0.14)', translucent: '#37415199' },
  };

  return palettes[collection] ?? defaultChartPalette;
}

function chartHeroSvg(collection: string): ReactNode {
  const accent = chartAccentPalette(collection);
  const axis = accent.soft;

  switch (collection) {
    case 'Line Charts':
      {
        const linePoints = [55, 40, 48, 22, 35, 18, 30, 12] as const;
      return (
        <svg viewBox="0 0 260 80" aria-hidden="true">
          <line x1="20" y1="70" x2="240" y2="70" stroke={axis} strokeWidth="1" />
          <line x1="20" y1="10" x2="20" y2="70" stroke={axis} strokeWidth="1" />
          <polyline points="30,55 60,40 90,48 120,22 150,35 180,18 210,30 240,12" stroke={accent.solid} strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <polyline points="30,60 60,52 90,58 120,42 150,50 180,38 210,45 240,35" stroke={accent.translucent} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="4 3" />
          {[30, 60, 90, 120, 150, 180, 210, 240].map((x, index) => (
            <circle key={x} cx={x} cy={linePoints[index] ?? linePoints[0]} r="3" fill={accent.solid} />
          ))}
        </svg>
      );
      }
    case 'Area Charts':
      return (
        <svg viewBox="0 0 260 80" aria-hidden="true">
          <line x1="20" y1="70" x2="240" y2="70" stroke={axis} strokeWidth="1" />
          <path d="M30,55 Q70,20 120,35 T210,18 L240,25 L240,70 L30,70 Z" fill={accent.soft} />
          <path d="M30,55 Q70,20 120,35 T210,18 L240,25" stroke={accent.solid} strokeWidth="2" fill="none" strokeLinecap="round" />
          <path d="M30,62 Q80,40 130,50 T220,35 L240,40 L240,70 L30,70 Z" fill={accent.translucent} fillOpacity="0.15" />
          <path d="M30,62 Q80,40 130,50 T220,35 L240,40" stroke={accent.translucent} strokeWidth="1.5" fill="none" strokeLinecap="round" />
        </svg>
      );
    case 'Bar Charts':
      {
        const bars: ReadonlyArray<readonly [number, number]> = [
          [35, 25],
          [55, 40],
          [80, 15],
          [100, 35],
          [125, 45],
          [145, 20],
          [170, 30],
          [190, 50],
        ];
      return (
        <svg viewBox="0 0 260 80" aria-hidden="true">
          <line x1="20" y1="70" x2="240" y2="70" stroke={axis} strokeWidth="1" />
          {bars.map(([x, height], index) => (
            <rect key={`${x}-${height}`} x={x} y={70 - height} width="14" height={height} rx="3" fill={index % 2 === 0 ? accent.solid : accent.translucent} />
          ))}
        </svg>
      );
      }
    case 'Scatter Plots':
      {
        const points: ReadonlyArray<readonly [number, number, number]> = [
          [40, 50, 4],
          [65, 35, 6],
          [90, 55, 3],
          [110, 25, 5],
          [135, 42, 7],
          [160, 18, 4],
          [180, 48, 5],
          [205, 30, 6],
          [230, 15, 4],
          [55, 62, 3],
          [145, 58, 3],
          [195, 40, 4],
        ];
      return (
        <svg viewBox="0 0 260 80" aria-hidden="true">
          <line x1="20" y1="70" x2="240" y2="70" stroke={axis} strokeWidth="1" />
          <line x1="20" y1="10" x2="20" y2="70" stroke={axis} strokeWidth="1" />
          {points.map(([cx, cy, radius]) => (
            <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={radius} fill={accent.solid} fillOpacity="0.5" stroke={accent.solid} strokeWidth="1" />
          ))}
        </svg>
      );
      }
    case 'Maps':
      return (
        <svg viewBox="0 0 260 80" aria-hidden="true">
          <rect x="25" y="8" width="210" height="64" rx="6" fill={accent.soft} stroke={axis} strokeWidth="1" />
          <path d="M60,20 Q80,15 95,22 Q110,30 100,40 Q90,48 70,45 Q55,40 60,30 Z" fill={accent.soft} stroke={accent.translucent} strokeWidth="1" />
          <path d="M120,18 Q145,12 160,20 Q175,30 170,42 Q160,52 140,48 Q125,42 120,30 Z" fill={accent.soft} stroke={accent.translucent} strokeWidth="1" />
          <path d="M180,25 Q195,18 210,28 Q215,38 200,42 Q185,40 180,32 Z" fill={accent.soft} stroke={accent.translucent} strokeWidth="1" />
          <circle cx="85" cy="32" r="3" fill={accent.solid} />
          <circle cx="150" cy="30" r="3" fill={accent.solid} />
          <circle cx="195" cy="32" r="3" fill={accent.solid} />
          <line x1="85" y1="32" x2="150" y2="30" stroke={accent.solid} strokeWidth="1" strokeDasharray="3 2" />
          <line x1="150" y1="30" x2="195" y2="32" stroke={accent.solid} strokeWidth="1" strokeDasharray="3 2" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 260 80" aria-hidden="true">
          <rect x="30" y="10" width="200" height="60" rx="8" fill={accent.soft} stroke={accent.translucent} strokeWidth="1" />
          <text x="130" y="45" textAnchor="middle" fontSize="12" fill={accent.solid}>{collection}</text>
        </svg>
      );
  }
}

function getChartCollection(asset: FlipCardRenderableAsset): string | undefined {
  const schemaCollection = asset.manifest.schema?.collection;
  const designEyebrow = asset.manifest.design?.eyebrow;
  return typeof schemaCollection === 'string' ? schemaCollection : designEyebrow;
}

function ChartCardFront({ asset }: { asset: FlipCardRenderableAsset }) {
  const collection = getChartCollection(asset) ?? 'Charts';
  const accent = chartAccentPalette(collection);
  const pathname = typeof asset.manifest.schema?.pathname === 'string' ? asset.manifest.schema.pathname : asset.id;
  const frameworks = Array.isArray(asset.manifest.schema?.frameworks)
    ? asset.manifest.schema.frameworks.filter((value): value is string => typeof value === 'string')
    : ['React', 'Angular', 'Svelte', 'Vue', 'Solid'];

  return (
    <>
      <header className="fc-chart-header">
        <div className="fc-chart-badge-row">
          <span className="fc-chart-badge">{collection.toUpperCase()}</span>
          <span className="fc-chart-badge">CHART</span>
        </div>
        <span className="fc-chart-brand">Unovis</span>
      </header>
      <div className="fc-chart-hero" style={{ ['--fc-chart-accent' as string]: accent.solid, ['--fc-chart-accent-soft' as string]: accent.soft }}>
        {chartHeroSvg(collection)}
      </div>
      <div className="fc-chart-body">
        <h3 className="fc-chart-title">{asset.title}</h3>
        <p className="fc-chart-summary">{asset.summary}</p>
        <span className="fc-chart-path">{pathname}</span>
        <div className="fc-chart-meta-grid">
          <div className="fc-chart-meta-cell">
            <span className="fc-chart-meta-label">Position</span>
            <div className="fc-chart-position-bar">
              <span className="fc-chart-position-pip active" />
              <span className="fc-chart-position-pip" />
              <span className="fc-chart-position-pip" />
            </div>
          </div>
          <div className="fc-chart-meta-cell">
            <span className="fc-chart-meta-label">Source</span>
            <span className="fc-chart-meta-value">{pathname}.tsx</span>
          </div>
        </div>
        <div className="fc-chart-lang-row">
          {frameworks.map((framework) => (
            <span key={framework} className="fc-chart-lang-badge">{framework}</span>
          ))}
        </div>
        <div className="fc-chart-link-row">
          <a className="fc-chart-link" href={`https://unovis.dev/gallery/view?collection=${encodeURIComponent(collection)}&title=${encodeURIComponent(asset.title)}`} target="_blank" rel="noreferrer" onClick={(event) => event.stopPropagation()}>
            Gallery
          </a>
          <a className="fc-chart-link" href={`https://github.com/f5/unovis/tree/main/packages/shared/examples/${pathname}`} target="_blank" rel="noreferrer" onClick={(event) => event.stopPropagation()}>
            Source
          </a>
        </div>
      </div>
    </>
  );
}

type ChartBackTab = 'details' | 'schema';

function ChartCardBack({ asset }: { asset: FlipCardRenderableAsset }) {
  const [tab, setTab] = useState<ChartBackTab>('details');
  const collection = getChartCollection(asset) ?? 'Charts';
  const schema = asset.manifest.schema ?? {};
  const detailRows = [
    ['Collection', collection],
    ['Pathname', typeof schema.pathname === 'string' ? schema.pathname : asset.id],
    ['Demo URL', typeof schema.demoUrl === 'string' ? schema.demoUrl : ''],
    ['Repo', typeof schema.repo === 'string' ? schema.repo : ''],
  ].filter(([, value]) => Boolean(value));

  const frameworks = Array.isArray(schema.frameworks)
    ? schema.frameworks.filter((value): value is string => typeof value === 'string')
    : [];

  return (
    <div className="fc-asset-face-shell fc-asset-back-shell fc-chart-back-shell">
      <div className="fc-chart-back-header-row">
        <span className="fc-asset-eyebrow">Unovis card</span>
        <div className="fc-chart-back-tabs" role="tablist" aria-label={`${asset.title} back face tabs`}>
          <button type="button" role="tab" className={`fc-chart-back-tab${tab === 'details' ? ' is-active' : ''}`} aria-selected={tab === 'details'} onClick={(event) => { event.stopPropagation(); setTab('details'); }}>
            Details
          </button>
          <button type="button" role="tab" className={`fc-chart-back-tab${tab === 'schema' ? ' is-active' : ''}`} aria-selected={tab === 'schema'} onClick={(event) => { event.stopPropagation(); setTab('schema'); }}>
            Schema
          </button>
        </div>
      </div>
      <h3 className="fc-asset-headline">{asset.manifest.title}</h3>
      {tab === 'details' ? (
        <div className="fc-chart-back-details">
          <p className="fc-chart-back-summary">{asset.summary}</p>
          <dl className="fc-chart-back-list">
            {detailRows.map(([label, value]) => (
              <Fragment key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </Fragment>
            ))}
            {frameworks.length ? (
              <>
                <dt>Frameworks</dt>
                <dd>{frameworks.join(' • ')}</dd>
              </>
            ) : null}
          </dl>
          <div className="fc-chart-link-row fc-chart-back-links">
            {typeof schema.demoUrl === 'string' ? (
              <a className="fc-chart-link" href={schema.demoUrl} target="_blank" rel="noreferrer" onClick={(event) => event.stopPropagation()}>
                Open demo
              </a>
            ) : null}
            {typeof schema.repo === 'string' ? (
              <a className="fc-chart-link" href={schema.repo} target="_blank" rel="noreferrer" onClick={(event) => event.stopPropagation()}>
                Repository
              </a>
            ) : null}
          </div>
        </div>
      ) : (
        <pre className="fc-asset-json">{JSON.stringify(asset.manifest, null, 2)}</pre>
      )}
    </div>
  );
}

function renderStats(stats: NonNullable<FlipCardAssetDesign['stats']>) {
  return (
    <div className="fc-asset-stats">
      {stats.map((stat) => (
        <section key={`${stat.label}-${stat.value}`} className="fc-asset-stat">
          <span className="fc-asset-stat-label">{stat.label}</span>
          <strong className="fc-asset-stat-value">{stat.value}</strong>
          {stat.trend ? <span className={toneClassName(stat.tone)}>{stat.trend}</span> : null}
        </section>
      ))}
    </div>
  );
}

function renderItems(items: NonNullable<FlipCardAssetDesign['items']>) {
  return (
    <dl className="fc-asset-list">
      {items.map((item) => (
        <Fragment key={item.label}>
          <dt key={`${item.label}-label`} className="fc-asset-list-label">
            {item.label}
          </dt>
          <dd key={`${item.label}-value`} className="fc-asset-list-value">
            <span className={toneClassName(item.tone)}>{item.value}</span>
          </dd>
        </Fragment>
      ))}
    </dl>
  );
}

type TileVariant = 'kpi' | 'weather' | 'bar-chart' | 'throughput' | 'status' | 'engine' | 'generic';

function getTileVariant(design: FlipCardAssetDesign, schema?: Record<string, unknown>): TileVariant {
  const badge = (design.badge ?? '').toLowerCase();
  const schemaType = typeof schema?.type === 'string' ? (schema.type as string).toLowerCase() : '';
  const tileType = typeof schema?.tileType === 'string' ? (schema.tileType as string).toLowerCase() : '';

  if (tileType === 'weather' || badge.includes('open-meteo') || badge.includes('weather')) return 'weather';
  if (badge.includes('bar chart') || schemaType.includes('bar')) return 'bar-chart';
  if (badge.includes('throughput')) return 'throughput';
  if (badge.includes('health') || badge.includes('status')) return 'status';
  if (badge.includes('engine')) return 'engine';
  if (badge.includes('kpi') || schemaType === 'kpi') return 'kpi';
  return 'generic';
}

function Sparkline({ points, accent }: { points: ReadonlyArray<number>; accent: string }) {
  const width = 120;
  const height = 32;
  const max = Math.max(...points);
  const min = Math.min(...points);
  const span = Math.max(max - min, 1);
  const step = width / (points.length - 1);
  const coords = points.map((value, index) => {
    const x = index * step;
    const y = height - ((value - min) / span) * (height - 4) - 2;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const linePath = `M ${coords.join(' L ')}`;
  const areaPath = `${linePath} L ${width},${height} L 0,${height} Z`;
  return (
    <svg className="fc-tile-sparkline" viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
      <path d={areaPath} fill={accent} fillOpacity="0.18" />
      <path d={linePath} fill="none" stroke={accent} strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

function KpiTile({ design, accent }: { design: FlipCardAssetDesign; accent: string }) {
  const primary = design.stats?.[0];
  const trendUp = primary?.trend?.startsWith('+') || primary?.trend === 'up';
  const trendValue = primary?.trend && primary.trend !== 'up' && primary.trend !== 'down' ? primary.trend : null;
  return (
    <div className="fc-tile fc-tile-kpi" style={{ ['--fc-tile-accent' as string]: accent }}>
      <div className="fc-tile-kpi-row">
        <div className="fc-tile-kpi-value-group">
          {primary?.label ? <span className="fc-tile-kpi-label">{primary.label}</span> : null}
          <strong className="fc-tile-kpi-value">{primary?.value ?? design.headline}</strong>
          {trendValue ? (
            <span className={`fc-tile-trend fc-tile-trend-${trendUp ? 'up' : 'down'}`}>
              <span aria-hidden="true">{trendUp ? '\u25B2' : '\u25BC'}</span>
              {trendValue}
            </span>
          ) : null}
        </div>
        <Sparkline points={[12, 14, 13, 16, 18, 17, 21, 19, 22, 24, 23, 26]} accent={accent} />
      </div>
    </div>
  );
}

function WeatherTile({ accent }: { accent: string }) {
  const days = [
    { day: 'Mon', temp: 68, glyph: 'sun' },
    { day: 'Tue', temp: 72, glyph: 'sun' },
    { day: 'Wed', temp: 64, glyph: 'cloud' },
    { day: 'Thu', temp: 59, glyph: 'rain' },
  ];
  return (
    <div className="fc-tile fc-tile-weather" style={{ ['--fc-tile-accent' as string]: accent }}>
      <div className="fc-tile-weather-now">
        <svg viewBox="0 0 48 48" aria-hidden="true" className="fc-tile-weather-glyph">
          <circle cx="24" cy="24" r="9" fill={accent} />
          {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => {
            const rad = (deg * Math.PI) / 180;
            const x1 = 24 + Math.cos(rad) * 14;
            const y1 = 24 + Math.sin(rad) * 14;
            const x2 = 24 + Math.cos(rad) * 19;
            const y2 = 24 + Math.sin(rad) * 19;
            return <line key={deg} x1={x1} y1={y1} x2={x2} y2={y2} stroke={accent} strokeWidth="2" strokeLinecap="round" />;
          })}
        </svg>
        <div className="fc-tile-weather-temp-group">
          <strong className="fc-tile-weather-temp">72&deg;F</strong>
          <span className="fc-tile-weather-cond">Mostly sunny</span>
        </div>
      </div>
      <div className="fc-tile-weather-strip">
        {days.map((d) => (
          <div key={d.day} className="fc-tile-weather-day">
            <span className="fc-tile-weather-daylabel">{d.day}</span>
            <svg viewBox="0 0 16 16" aria-hidden="true" className="fc-tile-weather-day-glyph">
              {d.glyph === 'sun' ? <circle cx="8" cy="8" r="4" fill={accent} /> : null}
              {d.glyph === 'cloud' ? <ellipse cx="8" cy="9" rx="5.5" ry="3" fill={accent} fillOpacity="0.6" /> : null}
              {d.glyph === 'rain' ? (
                <>
                  <ellipse cx="8" cy="6" rx="5" ry="2.5" fill={accent} fillOpacity="0.55" />
                  <line x1="6" y1="11" x2="6" y2="14" stroke={accent} strokeWidth="1.2" strokeLinecap="round" />
                  <line x1="10" y1="11" x2="10" y2="14" stroke={accent} strokeWidth="1.2" strokeLinecap="round" />
                </>
              ) : null}
            </svg>
            <span className="fc-tile-weather-daytemp">{d.temp}&deg;</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function BarChartTile({ accent }: { accent: string }) {
  const bars = [
    { label: 'Relevance', value: 92 },
    { label: 'Completeness', value: 84 },
    { label: 'Coherence', value: 78 },
    { label: 'Tool acc.', value: 88 },
  ];
  return (
    <div className="fc-tile fc-tile-bars" style={{ ['--fc-tile-accent' as string]: accent }}>
      {bars.map((b) => (
        <div key={b.label} className="fc-tile-bar-row">
          <span className="fc-tile-bar-label">{b.label}</span>
          <div className="fc-tile-bar-track">
            <div className="fc-tile-bar-fill" style={{ width: `${b.value}%` }} />
          </div>
          <span className="fc-tile-bar-value">{b.value}</span>
        </div>
      ))}
    </div>
  );
}

function ThroughputTile({ design, accent }: { design: FlipCardAssetDesign; accent: string }) {
  const primary = design.stats?.[0];
  const utilization = 71;
  return (
    <div className="fc-tile fc-tile-throughput" style={{ ['--fc-tile-accent' as string]: accent }}>
      <div className="fc-tile-throughput-readout">
        <strong className="fc-tile-throughput-value">{primary?.value ?? design.headline}</strong>
        <span className="fc-tile-throughput-label">events / second</span>
      </div>
      <div className="fc-tile-meter" aria-label={`Capacity ${utilization} percent`}>
        <div className="fc-tile-meter-fill" style={{ width: `${utilization}%` }} />
        <span className="fc-tile-meter-marker" style={{ left: '90%' }} />
      </div>
      <div className="fc-tile-throughput-foot">
        <span>Capacity {utilization}%</span>
        <span>Peak 1.6k/s</span>
      </div>
      <Sparkline points={[820, 940, 880, 1020, 1180, 1090, 1247, 1190, 1310, 1247]} accent={accent} />
    </div>
  );
}

function StatusTile({ accent }: { accent: string }) {
  const systems = [
    { name: 'Ingest', latency: 38 },
    { name: 'Index', latency: 52 },
    { name: 'Query', latency: 24 },
    { name: 'Auth', latency: 19 },
    { name: 'Stream', latency: 41 },
  ];
  return (
    <div className="fc-tile fc-tile-status" style={{ ['--fc-tile-accent' as string]: accent }}>
      <div className="fc-tile-status-header">
        <span className="fc-tile-status-pill">NOMINAL</span>
        <span className="fc-tile-status-meta">all 5 systems healthy</span>
      </div>
      <ul className="fc-tile-status-list">
        {systems.map((s) => (
          <li key={s.name} className="fc-tile-status-row">
            <span className="fc-tile-status-dot" aria-hidden="true" />
            <span className="fc-tile-status-name">{s.name}</span>
            <span className="fc-tile-status-latency">{s.latency} ms</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function EngineTile({ design, accent }: { design: FlipCardAssetDesign; accent: string }) {
  const stats = design.stats ?? [];
  return (
    <div className="fc-tile fc-tile-engine" style={{ ['--fc-tile-accent' as string]: accent }}>
      <svg viewBox="0 0 220 70" aria-hidden="true" className="fc-tile-engine-graph">
        {[
          [40, 35], [80, 18], [80, 52], [120, 12], [120, 35], [120, 58], [160, 24], [160, 46], [195, 35],
        ].map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="3.2" fill={accent} />
        ))}
        {[
          [40, 35, 80, 18], [40, 35, 80, 52], [80, 18, 120, 12], [80, 18, 120, 35],
          [80, 52, 120, 35], [80, 52, 120, 58], [120, 12, 160, 24], [120, 35, 160, 24],
          [120, 35, 160, 46], [120, 58, 160, 46], [160, 24, 195, 35], [160, 46, 195, 35],
        ].map(([x1, y1, x2, y2], i) => (
          <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={accent} strokeOpacity="0.45" strokeWidth="1" />
        ))}
      </svg>
      <div className="fc-tile-engine-stats">
        {stats.slice(0, 3).map((s) => (
          <div key={s.label} className="fc-tile-engine-stat">
            <span className="fc-tile-engine-stat-label">{s.label}</span>
            <strong className="fc-tile-engine-stat-value">{s.value}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}

function TileFace({ design, accent }: { design: FlipCardAssetDesign; accent: string }) {
  const variant = getTileVariant(design);
  switch (variant) {
    case 'kpi':
      return <KpiTile design={design} accent={accent} />;
    case 'weather':
      return <WeatherTile accent={accent} />;
    case 'bar-chart':
      return <BarChartTile accent={accent} />;
    case 'throughput':
      return <ThroughputTile design={design} accent={accent} />;
    case 'status':
      return <StatusTile accent={accent} />;
    case 'engine':
      return <EngineTile design={design} accent={accent} />;
    default:
      return design.stats?.length ? renderStats(design.stats) : null;
  }
}

function renderDesignBody(design?: FlipCardAssetDesign, accent?: string) {
  if (!design) {
    return null;
  }

  if (design.kind === 'tile') {
    return (
      <div className="fc-asset-body fc-asset-body-tile">
        <TileFace design={design} accent={accent ?? 'var(--fc-accent, #00d4ff)'} />
      </div>
    );
  }

  return (
    <div className="fc-asset-body">
      {design.kind === 'profile' && design.person ? (
        <div className="fc-asset-profile">
          <strong className="fc-asset-profile-name">{design.person.name}</strong>
          <span className="fc-asset-profile-role">{design.person.role}</span>
          {design.person.team ? <span className="fc-asset-profile-meta">{design.person.team}</span> : null}
          {design.person.location ? (
            <span className="fc-asset-profile-meta">{design.person.location}</span>
          ) : null}
        </div>
      ) : null}

      {design.kind === 'code' && design.code ? (
        <>
          <div className="fc-asset-inline-meta">
            <span className={toneClassName()}>{design.code.language.toUpperCase()}</span>
          </div>
          <pre className="fc-asset-code">{design.code.snippet}</pre>
        </>
      ) : null}

      {design.kind === 'timeline' && design.timeline?.length ? (
        <ol className="fc-asset-timeline">
          {design.timeline.map((item) => (
            <li key={`${item.phase}-${item.date}`} className="fc-asset-timeline-item">
              <div className="fc-asset-timeline-phase">{item.phase}</div>
              <div className="fc-asset-timeline-meta">
                <span>{item.date}</span>
                <span className={toneClassName()}>{item.status}</span>
              </div>
            </li>
          ))}
        </ol>
      ) : null}

      {design.kind === 'faq' && design.faq?.length ? (
        <div className="fc-asset-faq">
          {design.faq.slice(0, 3).map((item) => (
            <section key={item.question} className="fc-asset-faq-item">
              <strong className="fc-asset-faq-question">{item.question}</strong>
              <p className="fc-asset-faq-answer">{item.answer}</p>
            </section>
          ))}
        </div>
      ) : null}

      {design.kind === 'media' && design.media ? (
        <div className="fc-asset-media">
          <div className="fc-asset-inline-meta">
            <span className={toneClassName()}>{design.media.format}</span>
            <span className={toneClassName()}>{design.media.duration}</span>
          </div>
          <p className="fc-asset-media-caption">{design.media.caption}</p>
          {design.quote ? <blockquote className="fc-asset-quote">{design.quote}</blockquote> : null}
        </div>
      ) : null}

      {design.stats?.length ? renderStats(design.stats) : null}
      {design.items?.length ? renderItems(design.items) : null}
      {design.bullets?.length ? (
        <ul className="fc-asset-bullets">
          {design.bullets.map((bullet) => (
            <li key={bullet}>{bullet}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function nextState(currentState: FlipState): FlipState {
  return currentState === 'front' ? 'back' : 'front';
}

function isAdaptiveCardPayload(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && (value as { type?: unknown }).type === 'AdaptiveCard';
}

function getAdaptiveCardPayload(asset: FlipCardRenderableAsset): Record<string, unknown> | undefined {
  const designPayload = asset.manifest.design?.adaptiveCard;
  if (designPayload) {
    return designPayload;
  }

  return isAdaptiveCardPayload(asset.manifest.schema) ? asset.manifest.schema : undefined;
}

export function FlipCard({ asset, defaultState = 'front', interactive = true, className, onFlip }: FlipCardProps) {
  const controller = useMemo(() => new FlipCardController({ defaultState }), [defaultState]);
  const [state, setState] = useState<FlipState>(controller.state);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const frontShellRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => controller.subscribe(setState), [controller]);

  useLayoutEffect(() => {
    const root = rootRef.current;
    const shell = frontShellRef.current;
    if (!root || !shell) {
      return;
    }

    const updateHeight = () => {
      root.style.setProperty('--fc-face-height', `${Math.max(shell.scrollHeight, 320)}px`);
    };

    updateHeight();

    const images = Array.from(shell.querySelectorAll('img'));
    const removeImageListeners = images.map((image) => {
      const listener = () => updateHeight();
      image.addEventListener('load', listener);
      return () => image.removeEventListener('load', listener);
    });

    if (typeof ResizeObserver === 'undefined') {
      return () => {
        removeImageListeners.forEach((removeListener) => removeListener());
      };
    }

    const observer = new ResizeObserver(() => updateHeight());
    observer.observe(shell);

    return () => {
      observer.disconnect();
      removeImageListeners.forEach((removeListener) => removeListener());
    };
  }, [asset]);

  const handleFlip = () => {
    const stateAfterFlip = interactive ? controller.flip() : controller.state;
    onFlip?.(stateAfterFlip);
  };

  const design = asset.manifest.design;
  const adaptiveCardPayload = getAdaptiveCardPayload(asset);
  const isChartCard = asset.category === 'chart';
  const isSlideCard = asset.category === 'slide';
  const slideHostConfig = useMemo(() => {
    if (asset.category !== 'slide' || !adaptiveCardPayload) return undefined;
    const slideTheme = asset.manifest.schema?.['theme'] as Record<string, unknown> | undefined;
    return buildSlideHostConfig(slideTheme) ?? undefined;
  }, [asset.category, asset.manifest.schema, adaptiveCardPayload]);
  const slideAux = useMemo(() => getSlideAuxiliaries(asset), [asset]);
  const classes = ['flip-card', 'fc-asset-card', getThemeClassName(asset.theme), className]
    .filter(Boolean)
    .join(' ');

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!interactive) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleFlip();
    }
  };

  return (
    <div
      ref={rootRef}
      role="button"
      tabIndex={0}
      className={classes}
      data-state={state}
      aria-pressed={state === 'back'}
      aria-label={`${asset.title} flip card showing ${nextState(state)} on click`}
      style={asset.accent ? ({ ['--fc-accent' as string]: asset.accent } as CSSProperties) : undefined}
      onClick={handleFlip}
      onKeyDown={handleKeyDown}
    >
      <div className="flip-inner">
        <div className="flip-front fc-asset-face">
          {isChartCard ? (
            <div ref={frontShellRef} className="fc-asset-face-shell fc-chart-face-shell">
              <ChartCardFront asset={asset} />
            </div>
          ) : isSlideCard && adaptiveCardPayload && slideAux ? (
            <div
              ref={frontShellRef}
              className="fc-asset-face-shell fc-slide-face-shell"
              style={slideAux.styleVars}
            >
              <header className="fc-slide-header">
                <span className="fc-slide-eyebrow-brand">{slideAux.audience}</span>
                <span className="fc-slide-meta">{slideAux.meta}</span>
              </header>
              <div className="fc-slide-stage">
                <AdaptiveCardSurface payload={adaptiveCardPayload} hostConfig={slideHostConfig} />
              </div>
              <footer className="fc-slide-footer">
                <span className="fc-slide-footer-title">{design?.headline ?? asset.title}</span>
                {design?.badge ? <span className="fc-slide-footer-badge">{design.badge}</span> : null}
              </footer>
            </div>
          ) : (
            <div
              ref={frontShellRef}
              className={adaptiveCardPayload ? 'fc-asset-face-shell fc-asset-face-shell-adaptive' : 'fc-asset-face-shell'}
            >
              {adaptiveCardPayload ? (
                <AdaptiveCardSurface payload={adaptiveCardPayload} hostConfig={slideHostConfig} />
              ) : (
                <>
                  <header className="fc-asset-header">
                    <div className="fc-asset-eyebrow-group">
                      {design?.eyebrow ? <span className="fc-asset-eyebrow">{design.eyebrow}</span> : null}
                      <span className={toneClassName()}>{asset.category.toUpperCase()}</span>
                    </div>
                    {design?.badge ? <span className={toneClassName()}>{design.badge}</span> : null}
                  </header>
                  <h3 className="fc-asset-headline">{design?.headline ?? asset.title}</h3>
                  <p className="fc-asset-summary">{design?.summary ?? asset.summary}</p>
                  {renderDesignBody(design, asset.accent)}
                </>
              )}
            </div>
          )}
        </div>
        <div className="flip-back fc-asset-face">
          {isChartCard ? <ChartCardBack asset={asset} /> : (
            <div className="fc-asset-face-shell fc-asset-back-shell">
              <span className="fc-asset-eyebrow">Manifest</span>
              <h3 className="fc-asset-headline">{asset.manifest.title}</h3>
              <pre className="fc-asset-json">{JSON.stringify(asset.manifest, null, 2)}</pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}