import { readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const buildDirectory = resolve(repositoryRoot, 'www', 'browser');
const indexPath = resolve(buildDirectory, 'index.html');
const configPath = resolve(buildDirectory, 'assets', 'config', 'seo.json');
const startMarker = '<!-- SEO_CONFIG_START';
const endMarker = '<!-- SEO_CONFIG_END -->';

function escapeAttribute(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

function absoluteUrl(value, canonicalUrl) {
  if (!value) {
    return '';
  }

  try {
    return new URL(value, canonicalUrl).href;
  } catch {
    return value;
  }
}

function renderTags(config) {
  const title = escapeAttribute(config.title);
  const description = escapeAttribute(config.description);
  const canonicalUrl = escapeAttribute(config.canonicalUrl);
  const image = escapeAttribute(absoluteUrl(config.image, config.canonicalUrl));
  const imageAlt = escapeAttribute(config.imageAlt || config.title);
  const keywords = escapeAttribute((config.keywords || []).join(', '));

  return `<!-- SEO_CONFIG_START: generated from assets/config/seo.json. -->
  <title>${title}</title>
  <meta name="description" content="${description}" />
  <meta name="keywords" content="${keywords}" />
  <link rel="canonical" href="${canonicalUrl}" />
  <meta property="og:type" content="website" />
  <meta property="og:title" content="${title}" />
  <meta property="og:description" content="${description}" />
  <meta property="og:url" content="${canonicalUrl}" />
  <meta property="og:image" content="${image}" />
  <meta property="og:image:alt" content="${imageAlt}" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${title}" />
  <meta name="twitter:description" content="${description}" />
  <meta name="twitter:image" content="${image}" />
  <meta name="twitter:image:alt" content="${imageAlt}" />
  ${endMarker}`;
}

const [indexHtml, configJson] = await Promise.all([
  readFile(indexPath, 'utf8'),
  readFile(configPath, 'utf8'),
]);
const config = JSON.parse(configJson);
const start = indexHtml.indexOf(startMarker);
const end = indexHtml.indexOf(endMarker);

if (start === -1 || end === -1 || end < start) {
  throw new Error('SEO marker block was not found in the generated index.html.');
}

const updatedHtml = `${indexHtml.slice(0, start)}${renderTags(config)}${indexHtml.slice(end + endMarker.length)}`;
await writeFile(indexPath, updatedHtml, 'utf8');
console.log(`Injected static SEO metadata for ${config.canonicalUrl || 'the configured site'}.`);
