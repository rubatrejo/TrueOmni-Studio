'use client';

import type { PwaScavengerHuntConfig, ScavengerHunt, ScavengerTask } from '@/lib/config';

import { move, PwaField, PwaGroup, PwaPanelHeader, ReorderButtons } from './pwa-ui';

/**
 * Editor del módulo Scavenger Hunt (PWA-only). v1 cubre los textos white-label
 * y los hunts/tasks (nombre, descripción, pregunta). Las coordenadas, imágenes
 * y radios de geofence (data técnica del setup) no se editan aquí todavía.
 */

const EMPTY: PwaScavengerHuntConfig = {
  title: '',
  welcome: { title: '', description: '', taskTypes: [], button: '' },
  howItWorks: { title: '', description: '', taskTypes: [] },
  hunts: [],
  completed: { title: '', correctTitle: '', remainingTasks: '', done: '', hashtag: '' },
  hundredPercent: { title: '', body: '', done: '' },
  taskDetail: {
    takePhoto: '',
    checkIn: '',
    seeDirections: '',
    descriptionLabel: '',
    cancel: '',
    continue: '',
    goToPoint: '',
  },
  dashboard: { tasksLabel: '', completedBanner: '' },
};

export function ScavengerHuntEditor({
  value,
  onChange,
}: {
  value: PwaScavengerHuntConfig | undefined;
  onChange: (next: PwaScavengerHuntConfig) => void;
}) {
  const v: PwaScavengerHuntConfig = {
    ...EMPTY,
    ...value,
    welcome: { ...EMPTY.welcome, ...value?.welcome },
    howItWorks: { ...EMPTY.howItWorks, ...value?.howItWorks },
    completed: { ...EMPTY.completed, ...value?.completed },
    hundredPercent: { ...EMPTY.hundredPercent, ...value?.hundredPercent },
    taskDetail: { ...EMPTY.taskDetail, ...value?.taskDetail },
    dashboard: { ...EMPTY.dashboard, ...value?.dashboard },
    hunts: value?.hunts ?? [],
  };

  const updateHunt = (i: number, patch: Partial<ScavengerHunt>) =>
    onChange({ ...v, hunts: v.hunts.map((h, idx) => (idx === i ? { ...h, ...patch } : h)) });

  const updateTask = (hi: number, ti: number, patch: Partial<ScavengerTask>) =>
    onChange({
      ...v,
      hunts: v.hunts.map((h, idx) =>
        idx === hi
          ? { ...h, tasks: h.tasks.map((t, j) => (j === ti ? { ...t, ...patch } : t)) }
          : h,
      ),
    });

  return (
    <div className="flex h-full flex-col">
      <PwaPanelHeader
        title="Scavenger Hunt"
        description="White-label texts and the hunts / tasks. Coordinates, images and geofence radii come from the initial setup."
      />
      <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6">
        <PwaGroup title="General">
          <PwaField label="Title" value={v.title} onChange={(t) => onChange({ ...v, title: t })} />
        </PwaGroup>

        <PwaGroup title="Welcome">
          <PwaField
            label="Title"
            value={v.welcome.title}
            onChange={(t) => onChange({ ...v, welcome: { ...v.welcome, title: t } })}
          />
          <PwaField
            label="Description"
            multiline
            value={v.welcome.description}
            onChange={(t) => onChange({ ...v, welcome: { ...v.welcome, description: t } })}
          />
          <PwaField
            label="Button"
            value={v.welcome.button}
            onChange={(t) => onChange({ ...v, welcome: { ...v.welcome, button: t } })}
          />
        </PwaGroup>

        <PwaGroup title="How it works">
          <PwaField
            label="Title"
            value={v.howItWorks.title}
            onChange={(t) => onChange({ ...v, howItWorks: { ...v.howItWorks, title: t } })}
          />
          <PwaField
            label="Description"
            multiline
            value={v.howItWorks.description}
            onChange={(t) => onChange({ ...v, howItWorks: { ...v.howItWorks, description: t } })}
          />
        </PwaGroup>

        <PwaGroup title="Hunts & tasks">
          {v.hunts.length === 0 ? (
            <p className="text-[12px] text-zinc-400 dark:text-zinc-500">No hunts configured.</p>
          ) : (
            v.hunts.map((h, hi) => (
              <div
                key={h.slug}
                className="space-y-3 rounded-lg border border-zinc-200 p-3 dark:border-zinc-800"
              >
                <div className="flex items-start gap-2">
                  <ReorderButtons
                    index={hi}
                    count={v.hunts.length}
                    onMove={(to) => onChange({ ...v, hunts: move(v.hunts, hi, to) })}
                  />
                  <div className="flex-1">
                    <PwaField
                      label={`Hunt · ${h.slug}`}
                      value={h.name}
                      onChange={(name) => updateHunt(hi, { name })}
                    />
                  </div>
                </div>
                {h.tasks.length > 0 ? (
                  <div className="ml-2 space-y-3 border-l border-zinc-200 pl-3 dark:border-zinc-800">
                    {h.tasks.map((t, ti) => (
                      <div key={t.slug} className="flex items-start gap-2">
                        <ReorderButtons
                          index={ti}
                          count={h.tasks.length}
                          onMove={(to) => updateHunt(hi, { tasks: move(h.tasks, ti, to) })}
                        />
                        <div className="flex-1 space-y-2">
                          <PwaField
                            label={`Task · ${t.type}`}
                            value={t.name}
                            onChange={(name) => updateTask(hi, ti, { name })}
                          />
                          <PwaField
                            label="Description"
                            multiline
                            value={t.description}
                            onChange={(description) => updateTask(hi, ti, { description })}
                          />
                          {t.type === 'question' ? (
                            <PwaField
                              label="Question"
                              value={t.question ?? ''}
                              onChange={(question) => updateTask(hi, ti, { question })}
                            />
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            ))
          )}
        </PwaGroup>

        <PwaGroup title="Task detail buttons">
          <PwaField
            label="Take photo"
            value={v.taskDetail.takePhoto}
            onChange={(t) => onChange({ ...v, taskDetail: { ...v.taskDetail, takePhoto: t } })}
          />
          <PwaField
            label="Check in"
            value={v.taskDetail.checkIn}
            onChange={(t) => onChange({ ...v, taskDetail: { ...v.taskDetail, checkIn: t } })}
          />
          <PwaField
            label="See directions"
            value={v.taskDetail.seeDirections}
            onChange={(t) => onChange({ ...v, taskDetail: { ...v.taskDetail, seeDirections: t } })}
          />
        </PwaGroup>

        <PwaGroup title="Completed screens">
          <PwaField
            label="Completed · title"
            value={v.completed.title}
            onChange={(t) => onChange({ ...v, completed: { ...v.completed, title: t } })}
          />
          <PwaField
            label="Completed · hashtag"
            value={v.completed.hashtag}
            onChange={(t) => onChange({ ...v, completed: { ...v.completed, hashtag: t } })}
          />
          <PwaField
            label="100% · title"
            value={v.hundredPercent.title}
            onChange={(t) => onChange({ ...v, hundredPercent: { ...v.hundredPercent, title: t } })}
          />
          <PwaField
            label="100% · body"
            multiline
            value={v.hundredPercent.body}
            onChange={(t) => onChange({ ...v, hundredPercent: { ...v.hundredPercent, body: t } })}
          />
        </PwaGroup>
      </div>
    </div>
  );
}
