'use client';

import type { PwaTripPlannerModuleConfig } from '@/lib/config';

import { PwaField, PwaGroup, PwaPanelHeader } from './pwa-ui';

/**
 * Editor de los textos mobile-only del Trip Planner. El CONTENIDO (listings/
 * events/preguntas AI) se hereda del kiosk; aquí solo se editan los labels que
 * introduce el diseño mobile.
 */

const EMPTY: PwaTripPlannerModuleConfig = {
  title: '',
  openUntilPrefix: '',
  toggle: { list: '', ai: '', map: '' },
  menu: { thingsToDo: '', restaurants: '', events: '', localListings: '' },
  welcome: { title: '', subtitle: '', body: '', cta: '' },
  myPlan: {
    title: '',
    intro: '',
    myPlanLabel: '',
    startTimeLabel: '',
    endTimeLabel: '',
    smartRoute: '',
    startPlan: '',
  },
  ai: { itineraryTitle: '', resultTitle: '' },
  top: { itinerary: '', remove: '' },
};

export function TripPlannerEditor({
  value,
  onChange,
}: {
  value: PwaTripPlannerModuleConfig | undefined;
  onChange: (next: PwaTripPlannerModuleConfig) => void;
}) {
  const v: PwaTripPlannerModuleConfig = {
    ...EMPTY,
    ...value,
    toggle: { ...EMPTY.toggle, ...value?.toggle },
    menu: { ...EMPTY.menu, ...value?.menu },
    welcome: { ...EMPTY.welcome, ...value?.welcome },
    myPlan: { ...EMPTY.myPlan, ...value?.myPlan },
    ai: { ...EMPTY.ai, ...value?.ai },
    top: { ...EMPTY.top, ...value?.top },
  };

  return (
    <div className="flex h-full flex-col">
      <PwaPanelHeader
        title="Trip Planner"
        description="Mobile labels for the Trip Planner. The itinerary content (listings, events, AI questions) is inherited from the kiosk."
      />
      <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6">
        <PwaGroup title="Header">
          <PwaField label="Title" value={v.title} onChange={(t) => onChange({ ...v, title: t })} />
          <PwaField
            label="“Open until” prefix"
            value={v.openUntilPrefix}
            onChange={(t) => onChange({ ...v, openUntilPrefix: t })}
          />
        </PwaGroup>

        <PwaGroup title="Bottom toggle">
          <PwaField
            label="List"
            value={v.toggle.list}
            onChange={(t) => onChange({ ...v, toggle: { ...v.toggle, list: t } })}
          />
          <PwaField
            label="AI"
            value={v.toggle.ai}
            onChange={(t) => onChange({ ...v, toggle: { ...v.toggle, ai: t } })}
          />
          <PwaField
            label="Map"
            value={v.toggle.map}
            onChange={(t) => onChange({ ...v, toggle: { ...v.toggle, map: t } })}
          />
        </PwaGroup>

        <PwaGroup title="Category menu">
          <PwaField
            label="Things to do"
            value={v.menu.thingsToDo}
            onChange={(t) => onChange({ ...v, menu: { ...v.menu, thingsToDo: t } })}
          />
          <PwaField
            label="Restaurants"
            value={v.menu.restaurants}
            onChange={(t) => onChange({ ...v, menu: { ...v.menu, restaurants: t } })}
          />
          <PwaField
            label="Events"
            value={v.menu.events}
            onChange={(t) => onChange({ ...v, menu: { ...v.menu, events: t } })}
          />
          <PwaField
            label="Local listings"
            value={v.menu.localListings}
            onChange={(t) => onChange({ ...v, menu: { ...v.menu, localListings: t } })}
          />
        </PwaGroup>

        <PwaGroup title="Welcome popup">
          <PwaField
            label="Title"
            value={v.welcome.title}
            onChange={(t) => onChange({ ...v, welcome: { ...v.welcome, title: t } })}
          />
          <PwaField
            label="Subtitle"
            value={v.welcome.subtitle}
            onChange={(t) => onChange({ ...v, welcome: { ...v.welcome, subtitle: t } })}
          />
          <PwaField
            label="Body"
            multiline
            value={v.welcome.body}
            onChange={(t) => onChange({ ...v, welcome: { ...v.welcome, body: t } })}
          />
          <PwaField
            label="CTA"
            value={v.welcome.cta}
            onChange={(t) => onChange({ ...v, welcome: { ...v.welcome, cta: t } })}
          />
        </PwaGroup>

        <PwaGroup title="My Plan">
          <PwaField
            label="Title"
            value={v.myPlan.title}
            onChange={(t) => onChange({ ...v, myPlan: { ...v.myPlan, title: t } })}
          />
          <PwaField
            label="Intro"
            value={v.myPlan.intro}
            onChange={(t) => onChange({ ...v, myPlan: { ...v.myPlan, intro: t } })}
          />
          <PwaField
            label="My plan label"
            value={v.myPlan.myPlanLabel}
            onChange={(t) => onChange({ ...v, myPlan: { ...v.myPlan, myPlanLabel: t } })}
          />
          <PwaField
            label="Start time label"
            value={v.myPlan.startTimeLabel}
            onChange={(t) => onChange({ ...v, myPlan: { ...v.myPlan, startTimeLabel: t } })}
          />
          <PwaField
            label="End time label"
            value={v.myPlan.endTimeLabel}
            onChange={(t) => onChange({ ...v, myPlan: { ...v.myPlan, endTimeLabel: t } })}
          />
          <PwaField
            label="Smart route"
            value={v.myPlan.smartRoute}
            onChange={(t) => onChange({ ...v, myPlan: { ...v.myPlan, smartRoute: t } })}
          />
          <PwaField
            label="Start plan"
            value={v.myPlan.startPlan}
            onChange={(t) => onChange({ ...v, myPlan: { ...v.myPlan, startPlan: t } })}
          />
        </PwaGroup>

        <PwaGroup title="AI flow">
          <PwaField
            label="Itinerary title"
            value={v.ai.itineraryTitle}
            onChange={(t) => onChange({ ...v, ai: { ...v.ai, itineraryTitle: t } })}
          />
          <PwaField
            label="Result title"
            value={v.ai.resultTitle}
            onChange={(t) => onChange({ ...v, ai: { ...v.ai, resultTitle: t } })}
          />
        </PwaGroup>

        <PwaGroup title="Top suggestions buttons">
          <PwaField
            label="Add to itinerary"
            value={v.top.itinerary}
            onChange={(t) => onChange({ ...v, top: { ...v.top, itinerary: t } })}
          />
          <PwaField
            label="Remove"
            value={v.top.remove}
            onChange={(t) => onChange({ ...v, top: { ...v.top, remove: t } })}
          />
        </PwaGroup>
      </div>
    </div>
  );
}
