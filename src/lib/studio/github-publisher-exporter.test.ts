import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  EXPORTER_OWNER,
  EXPORTER_REPO,
  EXPORTER_WORKFLOW,
  exporterRunsUrl,
  getExporterDispatchConfig,
} from './github-publisher';

/**
 * Helpers del dispatch de la Action `export-standalone.yml` (última milla del
 * milestone "Publish → Kiosk Standalone"). Solo testeamos las funciones puras
 * env-based; el `createWorkflowDispatch` real lo cubre la verificación E2E.
 */
describe('getExporterDispatchConfig', () => {
  const KEYS = [
    'EXPORTER_GITHUB_TOKEN',
    'EXPORTER_GITHUB_OWNER',
    'EXPORTER_GITHUB_REPO',
    'EXPORTER_GITHUB_WORKFLOW',
    'EXPORTER_GITHUB_REF',
  ] as const;
  const SAVED: Record<string, string | undefined> = {};

  beforeEach(() => {
    for (const k of KEYS) {
      SAVED[k] = process.env[k];
      delete process.env[k];
    }
  });
  afterEach(() => {
    for (const k of KEYS) {
      if (SAVED[k] === undefined) delete process.env[k];
      else process.env[k] = SAVED[k];
    }
  });

  it('devuelve null sin EXPORTER_GITHUB_TOKEN', () => {
    expect(getExporterDispatchConfig()).toBeNull();
  });

  it('usa los defaults de rubatrejo/kiosk-exporter cuando solo hay token', () => {
    process.env.EXPORTER_GITHUB_TOKEN = 'tok';
    const cfg = getExporterDispatchConfig();
    expect(cfg).toEqual({
      token: 'tok',
      owner: EXPORTER_OWNER,
      repo: EXPORTER_REPO,
      workflow: EXPORTER_WORKFLOW,
      ref: 'main',
    });
  });

  it('respeta overrides de owner/repo/workflow/ref', () => {
    process.env.EXPORTER_GITHUB_TOKEN = 'tok';
    process.env.EXPORTER_GITHUB_OWNER = 'acme';
    process.env.EXPORTER_GITHUB_REPO = 'builder';
    process.env.EXPORTER_GITHUB_WORKFLOW = 'other.yml';
    process.env.EXPORTER_GITHUB_REF = 'dev';
    expect(getExporterDispatchConfig()).toEqual({
      token: 'tok',
      owner: 'acme',
      repo: 'builder',
      workflow: 'other.yml',
      ref: 'dev',
    });
  });
});

describe('exporterRunsUrl', () => {
  it('apunta a la pestaña Actions del workflow', () => {
    const url = exporterRunsUrl({
      token: 't',
      owner: 'rubatrejo',
      repo: 'kiosk-exporter',
      workflow: 'export-standalone.yml',
      ref: 'main',
    });
    expect(url).toBe(
      'https://github.com/rubatrejo/kiosk-exporter/actions/workflows/export-standalone.yml',
    );
  });
});
