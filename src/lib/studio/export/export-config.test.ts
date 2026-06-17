import { existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { localizeConfig } from './export-config';
import { createFsDeps } from './materialize-assets-fs';

const tmp = (p: string) => mkdtempSync(join(tmpdir(), p));

describe('localizeConfig (E2E con adaptador fs real, sin red)', () => {
  it('copia un asset relativo, decodifica un data: y deja los links intactos', async () => {
    const clientAssetsDir = tmp('cli-');
    const defaultAssetsDir = tmp('def-');
    const destClientDir = tmp('dest-');
    writeFileSync(join(defaultAssetsDir, 'logo.png'), 'LOGO');

    const deps = createFsDeps({ clientAssetsDir, defaultAssetsDir, destClientDir });
    const cfg = {
      branding: { logo: 'assets/logo.png' },
      avatar: `data:image/png;base64,${Buffer.from('AV').toString('base64')}`,
      website: 'https://example.com',
    };

    const { config, report } = await localizeConfig(cfg, deps);

    // asset relativo: copiado al destino, path local conservado
    expect(config.branding.logo).toBe('assets/logo.png');
    expect(existsSync(join(destClientDir, 'assets/logo.png'))).toBe(true);
    expect(readFileSync(join(destClientDir, 'assets/logo.png')).toString()).toBe('LOGO');

    // data: decodificado a assets/Inline/ + archivo escrito
    expect(config.avatar).toMatch(/^assets\/Inline\/[a-f0-9]+\.png$/);
    expect(existsSync(join(destClientDir, config.avatar))).toBe(true);

    // link externo intacto
    expect(config.website).toBe('https://example.com');

    expect(report).toMatchObject({ copied: 1, inlined: 1, downloaded: 0, failed: [] });
  });
});
