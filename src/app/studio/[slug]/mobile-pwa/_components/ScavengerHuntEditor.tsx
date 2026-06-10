'use client';

import type {
  PwaScavengerHuntConfig,
  ScavengerHunt,
  ScavengerTask,
  ScavengerTaskType,
} from '@/lib/config';

import { useToast } from '../../../_components/Toast';

import { AddItemButton, DeleteItemButton, makeBlankHunt, makeBlankTask } from './pwa-list-helpers';
import { move, PwaField, PwaGroup, PwaNumberField, PwaPanelHeader, ReorderButtons } from './pwa-ui';
import { ScavengerCoordsField } from './ScavengerCoordsField';

/**
 * Editor del módulo Scavenger Hunt (PWA-only). Cubre textos white-label y la
 * gestión completa de hunts/tasks: añadir, eliminar, reordenar, tipo, coordenadas
 * y radio de geofence.
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
  mapboxToken,
}: {
  value: PwaScavengerHuntConfig | undefined;
  onChange: (next: PwaScavengerHuntConfig) => void;
  mapboxToken: string;
}) {
  const { show } = useToast();

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

  const addHunt = () => onChange({ ...v, hunts: [...v.hunts, makeBlankHunt()] });
  const removeHunt = (hi: number) => {
    const removed = v.hunts[hi];
    const prev = v.hunts;
    onChange({ ...v, hunts: v.hunts.filter((_, idx) => idx !== hi) });
    show(`Deleted hunt "${removed?.name || removed?.slug}"`, {
      variant: 'info',
      durationMs: 6000,
      action: { label: 'Undo', onClick: () => onChange({ ...v, hunts: prev }) },
    });
  };
  const addTask = (hi: number) =>
    updateHunt(hi, { tasks: [...v.hunts[hi]!.tasks, makeBlankTask()] });
  const removeTask = (hi: number, ti: number) => {
    const hunt = v.hunts[hi]!;
    const removed = hunt.tasks[ti];
    const prev = hunt.tasks;
    updateHunt(hi, { tasks: hunt.tasks.filter((_, j) => j !== ti) });
    show(`Deleted task "${removed?.name || removed?.slug}"`, {
      variant: 'info',
      durationMs: 6000,
      action: { label: 'Undo', onClick: () => updateHunt(hi, { tasks: prev }) },
    });
  };
  const setTaskType = (hi: number, ti: number, type: ScavengerTaskType) => {
    const patch: Partial<ScavengerTask> = { type };
    if (type === 'checkin') patch.checkinRadius = v.hunts[hi]!.tasks[ti]!.checkinRadius ?? 50;
    if (type === 'question') {
      patch.question = v.hunts[hi]!.tasks[ti]!.question ?? '';
      patch.options = v.hunts[hi]!.tasks[ti]!.options ?? ['', ''];
      patch.correctIndex = v.hunts[hi]!.tasks[ti]!.correctIndex ?? 0;
    }
    updateTask(hi, ti, patch);
  };

  return (
    <div className="flex h-full flex-col">
      <PwaPanelHeader
        title="Scavenger Hunt"
        description="White-label texts plus full hunts / tasks: add, remove, reorder, set type, coordinates and geofence radius."
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
                  <DeleteItemButton label="Delete hunt" onClick={() => removeHunt(hi)} />
                </div>
                <div className="ml-2 space-y-3 border-l border-zinc-200 pl-3 dark:border-zinc-800">
                  {h.tasks.map((t, ti) => (
                    <div key={t.slug} className="flex items-start gap-2">
                      <ReorderButtons
                        index={ti}
                        count={h.tasks.length}
                        onMove={(to) => updateHunt(hi, { tasks: move(h.tasks, ti, to) })}
                      />
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <select
                            aria-label="Task type"
                            value={t.type}
                            onChange={(e) =>
                              setTaskType(hi, ti, e.target.value as ScavengerTaskType)
                            }
                            className="rounded-lg border border-zinc-200 bg-white px-2 py-1 text-[12px] text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200"
                          >
                            <option value="photo">Photo</option>
                            <option value="checkin">Check-in</option>
                            <option value="question">Question</option>
                          </select>
                          <span className="text-[11px] text-zinc-400">{t.slug}</span>
                        </div>
                        <PwaField
                          label="Name"
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
                        {t.type === 'checkin' ? (
                          <ScavengerCoordsField
                            coords={t.coords}
                            mapboxToken={mapboxToken}
                            onChange={(coords) => updateTask(hi, ti, { coords })}
                          />
                        ) : null}
                        {t.type === 'checkin' ? (
                          <PwaNumberField
                            label="Check-in radius"
                            value={t.checkinRadius ?? 50}
                            min={0}
                            step={5}
                            suffix="m"
                            onChange={(checkinRadius) => updateTask(hi, ti, { checkinRadius })}
                          />
                        ) : null}
                      </div>
                      <DeleteItemButton label="Delete task" onClick={() => removeTask(hi, ti)} />
                    </div>
                  ))}
                  <AddItemButton label="Add task" onClick={() => addTask(hi)} />
                </div>
              </div>
            ))
          )}
          <AddItemButton label="Add hunt" onClick={addHunt} />
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
