import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { build } from 'vite';

export const ROOT = fileURLToPath(new URL('../', import.meta.url));
export const BUILDS = join(ROOT, '.playwright/builds');

export default async function setup() {
  // Builds load a fixed test catalog so default stream data changes do not affect tests.
  const catalogPath = join(ROOT, 'src/data/turkish-streams.json');
  const catalog = JSON.parse(await readFile(join(ROOT, 'tests/fixtures/catalog.json'), 'utf8'));
  for (const base of ['/', '/broadcasts/']) {
    for (const version of ['a', 'b']) {
      await build({
        root: ROOT,
        base,
        logLevel: 'error',
        build: {
          outDir: join(BUILDS, base === '/' ? 'root' : 'subpath', version),
          emptyOutDir: true,
        },
        plugins: [
          {
            name: 'update-test-fixture',
            enforce: 'pre',
            transformIndexHtml(html) {
              return html.replace(
                '</head>',
                `<meta name="test-build" content="${version}"></head>`
              );
            },
            load(id) {
              if (id !== catalogPath) return;
              const next = structuredClone(catalog);
              if (version === 'b') {
                next.sources.find((source) => source.id === 'bravo').playback.videoId =
                  'abcdefghijk';
              }
              return JSON.stringify(next);
            },
          },
        ],
      });
    }
  }
}
