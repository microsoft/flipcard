import { FlipCardController, type FlipState } from '@microsoft/flipcard-core';
import type {
  CreateFlipCardElementOptions,
  FlipCardAssetDesign,
  FlipCardAssetEntry,
  FlipCardAssetTheme,
  FlipCardAssetTone,
} from './types';

export function getThemeClassName(theme: FlipCardAssetTheme): string {
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

export function serializeManifest(manifest: FlipCardAssetEntry['manifest']): string {
  return JSON.stringify(manifest, null, 2);
}

function createElement<K extends keyof HTMLElementTagNameMap>(
  tagName: K,
  className?: string,
  textContent?: string,
): HTMLElementTagNameMap[K] {
  const element = document.createElement(tagName);
  if (className) {
    element.className = className;
  }
  if (textContent) {
    element.textContent = textContent;
  }
  return element;
}

function createTonePill(text: string, tone: FlipCardAssetTone = 'neutral'): HTMLSpanElement {
  return createElement('span', `fc-tone-pill fc-tone-${tone}`, text);
}

function appendKeyValueList(container: HTMLElement, items: ReadonlyArray<NonNullable<FlipCardAssetDesign['items']>[number]>): void {
  const list = createElement('dl', 'fc-asset-list');
  for (const item of items) {
    list.append(createElement('dt', 'fc-asset-list-label', item.label));
    const dd = createElement('dd', 'fc-asset-list-value');
    dd.append(createTonePill(item.value, item.tone));
    list.append(dd);
  }
  container.append(list);
}

function appendStats(container: HTMLElement, stats: ReadonlyArray<NonNullable<FlipCardAssetDesign['stats']>[number]>): void {
  const grid = createElement('div', 'fc-asset-stats');
  for (const stat of stats) {
    const card = createElement('section', 'fc-asset-stat');
    card.append(createElement('span', 'fc-asset-stat-label', stat.label));
    card.append(createElement('strong', 'fc-asset-stat-value', stat.value));
    if (stat.trend) {
      card.append(createTonePill(stat.trend, stat.tone));
    }
    grid.append(card);
  }
  container.append(grid);
}

function appendBullets(container: HTMLElement, bullets: ReadonlyArray<string>): void {
  const list = createElement('ul', 'fc-asset-bullets');
  for (const bullet of bullets) {
    list.append(createElement('li', '', bullet));
  }
  container.append(list);
}

function renderDesignBody(design: FlipCardAssetDesign): HTMLElement {
  const body = createElement('div', 'fc-asset-body');

  switch (design.kind) {
    case 'profile': {
      if (design.person) {
        const hero = createElement('div', 'fc-asset-profile');
        hero.append(createElement('strong', 'fc-asset-profile-name', design.person.name));
        hero.append(createElement('span', 'fc-asset-profile-role', design.person.role));
        if (design.person.team) {
          hero.append(createElement('span', 'fc-asset-profile-meta', design.person.team));
        }
        if (design.person.location) {
          hero.append(createElement('span', 'fc-asset-profile-meta', design.person.location));
        }
        body.append(hero);
      }
      break;
    }
    case 'code': {
      if (design.code) {
        const meta = createElement('div', 'fc-asset-inline-meta');
        meta.append(createTonePill(design.code.language.toUpperCase()));
        body.append(meta);
        body.append(createElement('pre', 'fc-asset-code', design.code.snippet));
      }
      break;
    }
    case 'timeline': {
      if (design.timeline?.length) {
        const timeline = createElement('ol', 'fc-asset-timeline');
        for (const item of design.timeline) {
          const row = createElement('li', 'fc-asset-timeline-item');
          const title = createElement('div', 'fc-asset-timeline-phase', item.phase);
          const meta = createElement('div', 'fc-asset-timeline-meta');
          meta.append(createElement('span', '', item.date));
          meta.append(createTonePill(item.status));
          row.append(title, meta);
          timeline.append(row);
        }
        body.append(timeline);
      }
      break;
    }
    case 'faq': {
      if (design.faq?.length) {
        const list = createElement('div', 'fc-asset-faq');
        for (const item of design.faq.slice(0, 3)) {
          const row = createElement('section', 'fc-asset-faq-item');
          row.append(createElement('strong', 'fc-asset-faq-question', item.question));
          row.append(createElement('p', 'fc-asset-faq-answer', item.answer));
          list.append(row);
        }
        body.append(list);
      }
      break;
    }
    case 'media': {
      if (design.media) {
        const media = createElement('div', 'fc-asset-media');
        media.append(createTonePill(design.media.format));
        media.append(createTonePill(design.media.duration));
        media.append(createElement('p', 'fc-asset-media-caption', design.media.caption));
        body.append(media);
      }
      if (design.quote) {
        body.append(createElement('blockquote', 'fc-asset-quote', design.quote));
      }
      break;
    }
    default:
      break;
  }

  if (design.stats?.length) {
    appendStats(body, design.stats);
  }
  if (design.items?.length) {
    appendKeyValueList(body, design.items);
  }
  if (design.bullets?.length) {
    appendBullets(body, design.bullets);
  }

  return body;
}

function renderFrontFace(asset: FlipCardAssetEntry): HTMLElement {
  const front = createElement('div', 'fc-asset-face-shell');
  const { design } = asset.manifest;

  const header = createElement('header', 'fc-asset-header');
  const eyebrowGroup = createElement('div', 'fc-asset-eyebrow-group');
  if (design.eyebrow) {
    eyebrowGroup.append(createElement('span', 'fc-asset-eyebrow', design.eyebrow));
  }
  eyebrowGroup.append(createTonePill(asset.category.toUpperCase()));
  header.append(eyebrowGroup);
  if (design.badge) {
    header.append(createTonePill(design.badge));
  }

  front.append(header);
  front.append(createElement('h3', 'fc-asset-headline', design.headline));
  if (design.summary) {
    front.append(createElement('p', 'fc-asset-summary', design.summary));
  }
  front.append(renderDesignBody(design));

  return front;
}

function renderBackFace(asset: FlipCardAssetEntry): HTMLElement {
  const back = createElement('div', 'fc-asset-face-shell fc-asset-back-shell');
  back.append(createElement('span', 'fc-asset-eyebrow', 'Manifest'));
  back.append(createElement('h3', 'fc-asset-headline', asset.manifest.title));
  back.append(createElement('pre', 'fc-asset-json', serializeManifest(asset.manifest)));
  return back;
}

function syncState(element: HTMLElement, state: FlipState): void {
  element.dataset.state = state;
  element.setAttribute('aria-pressed', String(state === 'back'));
}

function syncFrontFaceHeight(element: HTMLElement, frontFaceShell: HTMLElement): void {
  const updateHeight = () => {
    element.style.setProperty('--fc-face-height', `${Math.max(frontFaceShell.scrollHeight, 320)}px`);
  };

  updateHeight();

  const images = Array.from(frontFaceShell.querySelectorAll('img'));
  for (const image of images) {
    image.addEventListener('load', updateHeight);
  }

  if (typeof ResizeObserver === 'undefined') {
    return;
  }

  const observer = new ResizeObserver(() => updateHeight());
  observer.observe(frontFaceShell);
}

export function createFlipCardElement(
  asset: FlipCardAssetEntry,
  options: CreateFlipCardElementOptions = {},
): HTMLButtonElement {
  const element = createElement(
    'button',
    `flip-card fc-asset-card ${getThemeClassName(asset.theme)}`,
  ) as HTMLButtonElement;
  const controller = new FlipCardController({ defaultState: options.defaultState ?? 'front' });
  const inner = createElement('div', 'flip-inner');
  const front = createElement('div', 'flip-front fc-asset-face');
  const back = createElement('div', 'flip-back fc-asset-face');
  const frontFaceShell = renderFrontFace(asset);

  element.type = 'button';
  element.setAttribute('aria-label', `${asset.title} flip card`);
  if (asset.accent) {
    element.style.setProperty('--fc-accent', asset.accent);
  }

  front.append(frontFaceShell);
  back.append(renderBackFace(asset));
  inner.append(front, back);
  element.append(inner);
  syncFrontFaceHeight(element, frontFaceShell);

  syncState(element, controller.state);
  controller.subscribe((state) => syncState(element, state));

  if (options.interactive ?? true) {
    element.addEventListener('click', () => {
      controller.flip();
    });
  } else {
    element.disabled = true;
  }

  return element;
}