'use client';

import type { PwaDealsModuleConfig } from '@/lib/config';

import { PwaField, PwaGroup, PwaPanelHeader } from './pwa-ui';

/**
 * Editor del módulo "Deals" de la PWA. Pantalla única (`DealsGridScreen`): grid de
 * cupones + barra de búsqueda inline, con overlay de orden, overlay de filtros y
 * sheet de canje. Edita solo los textos white-label de `PwaDealsModuleConfig`; los
 * cupones vienen del setup (`home.modules.deals`).
 */

const EMPTY: PwaDealsModuleConfig = {
  title: '',
  searchPlaceholder: '',
  expiresPrefix: '',
  empty: '',
  redeem: { useCode: '', viewOffer: '', share: '' },
  sort: { title: '', expiringSoon: '', recent: '', alphabetical: '', bestDiscount: '' },
  filters: { title: '', features: '', clearAll: '', apply: '' },
};

export function DealsModuleEditor({
  value,
  onChange,
}: {
  value: PwaDealsModuleConfig | undefined;
  onChange: (next: PwaDealsModuleConfig) => void;
}) {
  const v: PwaDealsModuleConfig = {
    ...EMPTY,
    ...value,
    redeem: { ...EMPTY.redeem, ...value?.redeem },
    sort: { ...EMPTY.sort, ...value?.sort },
    filters: { ...EMPTY.filters, ...value?.filters },
  };
  const r = v.redeem;
  const s = v.sort;
  const f = v.filters;
  const setRedeem = (patch: Partial<PwaDealsModuleConfig['redeem']>) =>
    onChange({ ...v, redeem: { ...r, ...patch } });
  const setSort = (patch: Partial<PwaDealsModuleConfig['sort']>) =>
    onChange({ ...v, sort: { ...s, ...patch } });
  const setFilters = (patch: Partial<PwaDealsModuleConfig['filters']>) =>
    onChange({ ...v, filters: { ...f, ...patch } });

  return (
    <div className="flex h-full flex-col">
      <PwaPanelHeader
        title="Deals"
        description="White-label texts of the deals grid, sort / filter overlays and redeem sheet. Coupons come from the setup."
      />
      <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6">
        <PwaGroup title="General">
          <PwaField label="Title" value={v.title} onChange={(title) => onChange({ ...v, title })} />
          <PwaField
            label="Search placeholder"
            value={v.searchPlaceholder}
            onChange={(searchPlaceholder) => onChange({ ...v, searchPlaceholder })}
          />
          <PwaField
            label="Expires prefix"
            value={v.expiresPrefix}
            onChange={(expiresPrefix) => onChange({ ...v, expiresPrefix })}
          />
          <PwaField
            label="Empty state"
            value={v.empty}
            onChange={(empty) => onChange({ ...v, empty })}
          />
        </PwaGroup>

        <PwaGroup title="Redeem sheet">
          <PwaField
            label="Use code pill"
            value={r.useCode}
            onChange={(useCode) => setRedeem({ useCode })}
          />
          <PwaField
            label="View offer button"
            value={r.viewOffer}
            onChange={(viewOffer) => setRedeem({ viewOffer })}
          />
          <PwaField
            label="Share button"
            value={r.share}
            onChange={(share) => setRedeem({ share })}
          />
        </PwaGroup>

        <PwaGroup title="Sort">
          <PwaField label="Title" value={s.title} onChange={(title) => setSort({ title })} />
          <PwaField
            label="Expiring soon"
            value={s.expiringSoon}
            onChange={(expiringSoon) => setSort({ expiringSoon })}
          />
          <PwaField label="Recent" value={s.recent} onChange={(recent) => setSort({ recent })} />
          <PwaField
            label="Alphabetical"
            value={s.alphabetical}
            onChange={(alphabetical) => setSort({ alphabetical })}
          />
          <PwaField
            label="Best discount"
            value={s.bestDiscount}
            onChange={(bestDiscount) => setSort({ bestDiscount })}
          />
        </PwaGroup>

        <PwaGroup title="Filters">
          <PwaField label="Title" value={f.title} onChange={(title) => setFilters({ title })} />
          <PwaField
            label="Features heading"
            value={f.features}
            onChange={(features) => setFilters({ features })}
          />
          <PwaField
            label="Clear all"
            value={f.clearAll}
            onChange={(clearAll) => setFilters({ clearAll })}
          />
          <PwaField label="Apply" value={f.apply} onChange={(apply) => setFilters({ apply })} />
        </PwaGroup>
      </div>
    </div>
  );
}
