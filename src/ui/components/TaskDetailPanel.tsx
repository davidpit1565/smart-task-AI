import { useRef, useState, type CSSProperties } from 'react';
import { useModalA11y } from '@/ui/hooks/useModalA11y';
import type { Priority, RecurrenceFrequency, Task } from '@/core/task.types';
import { PRIORITIES } from '@/core/task.types';
import type { Project } from '@/core/project.types';
import type { Goal } from '@/core/goal.types';
import type { CalendarEvent } from '@/core/calendar/calendarEvent.types';
import { selectSubtaskProgress, selectSubtasks } from '@/core/progress';
import { getBlockingTasks, wouldCreateCycle } from '@/core/dependencies';
import { useTranslation } from '@/i18n/LanguageContext';
import type { TranslationKey } from '@/i18n/translations';
import { CheckIcon, SparkleIcon, TimerIcon } from '@/ui/icons';
import { requestNotificationPermission } from '@/integrations/notifications/notificationManager';
import { requestTaskBreakdown } from '@/integrations/ai/aiBreakdownClient';
import { QuickAddBar } from './QuickAddBar';
import { ScheduleSection } from './ScheduleSection';

const RECURRENCE_OPTIONS: (RecurrenceFrequency | 'none')[] = ['none', 'daily', 'weekly', 'monthly', 'yearly', 'weekdays', 'custom'];
/** null = no reminder. MVP is a single reminder per task, not the full multi-reminder list from the spec. */
const REMINDER_OPTIONS: { offsetMinutes: number | null; labelKey: TranslationKey }[] = [
  { offsetMinutes: null, labelKey: 'reminder.none' },
  { offsetMinutes: 0, labelKey: 'reminder.atDueTime' },
  { offsetMinutes: 5, labelKey: 'reminder.5min' },
  { offsetMinutes: 15, labelKey: 'reminder.15min' },
  { offsetMinutes: 60, labelKey: 'reminder.1hour' },
  { offsetMinutes: 60 * 24, labelKey: 'reminder.1day' },
];
const WEEKDAY_KEYS: TranslationKey[] = [
  'recurrence.weekdayShort.sun',
  'recurrence.weekdayShort.mon',
  'recurrence.weekdayShort.tue',
  'recurrence.weekdayShort.wed',
  'recurrence.weekdayShort.thu',
  'recurrence.weekdayShort.fri',
  'recurrence.weekdayShort.sat',
];

interface TaskDetailPanelProps {
  task: Task;
  allTasks: Task[];
  projects: Project[];
  goals: Goal[];
  calendarEvents: CalendarEvent[];
  connectedCalendarId: string | null;
  /** Infinity for premium — see src/core/entitlement.types.ts. */
  aiQuotaRemaining: number;
  onSave(id: string, patch: Partial<Task>): void;
  onDelete(id: string): void;
  onClose(): void;
  onAddSubtask(parentId: string, title: string): void;
  onToggleSubtaskComplete(id: string): void;
  onScheduleTask(id: string, input: { connectedCalendarId: string; start: string; end: string }): Promise<void>;
  onUnscheduleTask(id: string): Promise<void>;
  onStartFocus(id: string): void;
  /** Call only after a successful AI breakdown — never on a failed call. */
  onAiBreakdownUsed(): Promise<void>;
}

export function TaskDetailPanel({
  task,
  allTasks,
  projects,
  goals,
  calendarEvents,
  connectedCalendarId,
  aiQuotaRemaining,
  onSave,
  onDelete,
  onClose,
  onAddSubtask,
  onToggleSubtaskComplete,
  onScheduleTask,
  onUnscheduleTask,
  onStartFocus,
  onAiBreakdownUsed,
}: TaskDetailPanelProps) {
  const { t } = useTranslation();
  const sheetRef = useRef<HTMLDivElement>(null);
  useModalA11y(sheetRef, onClose);
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description);
  const [notes, setNotes] = useState(task.notes);
  const [dueDate, setDueDate] = useState(task.dueDate ?? '');
  const [dueTime, setDueTime] = useState(task.dueTime ?? '');
  const [deadline, setDeadline] = useState(task.deadline ?? '');
  const [priority, setPriority] = useState<Priority>(task.priority);
  const [projectId, setProjectId] = useState(task.projectId ?? '');
  const [goalId, setGoalId] = useState(task.goalId ?? '');
  const [tags, setTags] = useState<string[]>(task.tags);
  const [tagInput, setTagInput] = useState('');
  const [frequency, setFrequency] = useState<RecurrenceFrequency | 'none'>(task.recurrenceRule?.frequency ?? 'none');
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>(task.recurrenceRule?.daysOfWeek ?? []);
  const [recurrenceEndDate, setRecurrenceEndDate] = useState(task.recurrenceRule?.endDate ?? '');
  const [reminderOffset, setReminderOffset] = useState<number | null>(task.reminders[0]?.offsetMinutes ?? null);
  const [dependsOn, setDependsOn] = useState<string[]>(task.dependsOn);
  const [breakdownLoading, setBreakdownLoading] = useState(false);
  const [breakdownError, setBreakdownError] = useState<string | null>(null);
  const [breakdownSuggestions, setBreakdownSuggestions] = useState<string[] | null>(null);
  const [breakdownChecked, setBreakdownChecked] = useState<boolean[]>([]);

  const subtasks = selectSubtasks(task.id, allTasks);
  const subtaskProgress = selectSubtaskProgress(task.id, allTasks);
  const isSubtask = Boolean(task.parentTaskId);
  const blockingTasks = getBlockingTasks({ ...task, dependsOn }, allTasks);
  const availableDependencies = allTasks.filter(
    (candidate) =>
      candidate.id !== task.id &&
      candidate.status !== 'trashed' &&
      !dependsOn.includes(candidate.id) &&
      !wouldCreateCycle(task.id, candidate.id, allTasks),
  );

  function addDependency(id: string) {
    if (!id || dependsOn.includes(id)) return;
    setDependsOn([...dependsOn, id]);
  }

  function removeDependency(id: string) {
    setDependsOn(dependsOn.filter((existing) => existing !== id));
  }

  function addTag() {
    const value = tagInput.trim().replace(/^#/, '');
    if (!value || tags.includes(value)) {
      setTagInput('');
      return;
    }
    setTags([...tags, value]);
    setTagInput('');
  }

  function removeTag(tag: string) {
    setTags(tags.filter((existing) => existing !== tag));
  }

  function toggleDayOfWeek(day: number) {
    setDaysOfWeek((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()));
  }

  function handleReminderChange(value: string) {
    const offset = value === '' ? null : Number(value);
    setReminderOffset(offset);
    // Only ask for permission right when the user actually turns a reminder on — never proactively.
    if (offset !== null) requestNotificationPermission();
  }

  async function handleBreakdown() {
    setBreakdownLoading(true);
    setBreakdownError(null);
    try {
      const suggestions = await requestTaskBreakdown(title, description);
      setBreakdownSuggestions(suggestions);
      setBreakdownChecked(suggestions.map(() => true));
      await onAiBreakdownUsed();
    } catch (error) {
      setBreakdownError(error instanceof Error ? error.message : 'AI breakdown failed.');
    } finally {
      setBreakdownLoading(false);
    }
  }

  function confirmBreakdown() {
    breakdownSuggestions?.forEach((suggestion, index) => {
      if (breakdownChecked[index]) onAddSubtask(task.id, suggestion);
    });
    setBreakdownSuggestions(null);
  }

  function save() {
    onSave(task.id, {
      title: title.trim() || task.title,
      description,
      notes,
      dueDate: dueDate || null,
      dueTime: dueTime || null,
      deadline: deadline || null,
      priority,
      projectId: projectId || null,
      goalId: goalId || null,
      tags,
      dependsOn,
      recurrenceRule:
        frequency === 'none'
          ? null
          : {
              frequency,
              daysOfWeek: frequency === 'custom' ? daysOfWeek : undefined,
              endDate: recurrenceEndDate || undefined,
            },
      reminders: reminderOffset === null ? [] : [{ id: task.reminders[0]?.id ?? crypto.randomUUID(), offsetMinutes: reminderOffset, method: 'push' }],
    });
    onClose();
  }

  const fieldStyle: CSSProperties = {
    width: '100%',
    padding: '9px 11px',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--color-border)',
    background: 'var(--color-bg)',
    color: 'var(--color-text)',
    fontSize: 16,
    transition: 'border-color 0.15s ease',
  };

  const labelStyle: CSSProperties = {
    fontSize: 11.5,
    fontWeight: 600,
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
    color: 'var(--color-text-faint)',
    marginBottom: 6,
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.4)',
        display: 'flex',
        alignItems: 'flex-end',
        zIndex: 50,
      }}
      onClick={onClose}
    >
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-label={t('task.detail.dialogLabel')}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--color-surface-raised)',
          borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0',
          boxShadow: 'var(--shadow-modal)',
          padding: '10px 20px 20px',
          width: '100%',
          maxWidth: 720,
          marginInline: 'auto',
          maxHeight: '85vh',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        <div
          aria-hidden="true"
          style={{ width: 36, height: 4, borderRadius: 999, background: 'var(--color-border-strong)', marginInline: 'auto' }}
        />

        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          aria-label={t('task.detail.titleLabel')}
          style={{ ...fieldStyle, fontSize: 19, fontWeight: 650, border: 'none', background: 'none', padding: '2px 0' }}
        />

        {blockingTasks.length > 0 && (
          <div
            style={{
              padding: '8px 12px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--color-accent-soft)',
              color: 'var(--color-text-muted)',
              fontSize: 13,
            }}
          >
            {t('task.blocked.banner')} {blockingTasks.map((b) => b.title).join(', ')}
          </div>
        )}

        <label>
          <div style={labelStyle}>{t('task.detail.description')}</div>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} style={fieldStyle} />
        </label>

        <label>
          <div style={labelStyle}>{t('task.detail.notes')}</div>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} style={fieldStyle} />
        </label>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <label>
            <div style={labelStyle}>{t('task.detail.dueDate')}</div>
            <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} style={fieldStyle} />
          </label>
          <label>
            <div style={labelStyle}>{t('task.detail.dueTime')}</div>
            <input type="time" value={dueTime} onChange={(e) => setDueTime(e.target.value)} style={fieldStyle} />
          </label>
        </div>

        <label>
          <div style={labelStyle}>{t('task.detail.deadline')}</div>
          <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} style={fieldStyle} />
        </label>

        <label>
          <div style={labelStyle}>{t('task.detail.priority')}</div>
          <select value={priority} onChange={(e) => setPriority(e.target.value as Priority)} style={fieldStyle}>
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {t(`task.priority.${p}`)}
              </option>
            ))}
          </select>
        </label>

        <button
          type="button"
          onClick={() => onStartFocus(task.id)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            width: '100%',
            padding: '11px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border)',
            background: 'var(--color-surface)',
            color: 'var(--color-text)',
            fontSize: 14.5,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          <TimerIcon width={17} height={17} />
          {t('focus.start')}
          {task.actualDuration != null && task.actualDuration > 0 && (
            <span style={{ color: 'var(--color-text-muted)', fontWeight: 500 }}>
              · {t('focus.timeSpent', { minutes: task.actualDuration })}
            </span>
          )}
        </button>

        {!isSubtask && (
          <ScheduleSection
            task={task}
            calendarEvents={calendarEvents}
            connectedCalendarId={connectedCalendarId}
            onSchedule={async (input) => {
              await onScheduleTask(task.id, input);
              setDueDate(input.start.slice(0, 10));
              setDueTime(input.start.slice(11, 16));
            }}
            onUnschedule={() => onUnscheduleTask(task.id)}
          />
        )}

        {!isSubtask && (
          <label>
            <div style={labelStyle}>{t('task.detail.project')}</div>
            <select value={projectId} onChange={(e) => setProjectId(e.target.value)} style={fieldStyle}>
              <option value="">{t('task.detail.project.none')}</option>
              {projects
                .filter((p) => p.status === 'active')
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
            </select>
          </label>
        )}

        {!isSubtask && goals.length > 0 && (
          <label>
            <div style={labelStyle}>{t('task.detail.goal')}</div>
            <select value={goalId} onChange={(e) => setGoalId(e.target.value)} style={fieldStyle}>
              <option value="">{t('task.detail.goal.none')}</option>
              {goals
                .filter((g) => g.status === 'active')
                .map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
            </select>
          </label>
        )}

        <div>
          <div style={labelStyle}>{t('task.detail.tags')}</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: tags.length ? 8 : 0 }}>
            {tags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => removeTag(tag)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '4px 10px',
                  borderRadius: 999,
                  border: 'none',
                  background: 'var(--color-accent-soft)',
                  color: 'var(--color-accent)',
                  fontSize: 12.5,
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                #{tag} ×
              </button>
            ))}
          </div>
          <input
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addTag();
              }
            }}
            onBlur={addTag}
            placeholder={t('task.detail.tags.placeholder')}
            style={fieldStyle}
          />
        </div>

        {!isSubtask && (
          <div>
            <div style={labelStyle}>{t('task.detail.dependsOn')}</div>
            {dependsOn.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                {dependsOn.map((id) => {
                  const dep = allTasks.find((candidate) => candidate.id === id);
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => removeDependency(id)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        padding: '4px 10px',
                        borderRadius: 999,
                        border: 'none',
                        background: 'var(--color-accent-soft)',
                        color: 'var(--color-accent)',
                        fontSize: 12.5,
                        fontWeight: 500,
                        cursor: 'pointer',
                      }}
                    >
                      {dep?.title ?? id} ×
                    </button>
                  );
                })}
              </div>
            )}
            {availableDependencies.length > 0 && (
              <select value="" onChange={(e) => addDependency(e.target.value)} style={fieldStyle}>
                <option value="">{t('task.detail.dependsOn.add')}</option>
                {availableDependencies.map((candidate) => (
                  <option key={candidate.id} value={candidate.id}>
                    {candidate.title}
                  </option>
                ))}
              </select>
            )}
          </div>
        )}

        {!isSubtask && (
          <div>
            <div style={labelStyle}>{t('task.detail.recurrence')}</div>
            <select value={frequency} onChange={(e) => setFrequency(e.target.value as RecurrenceFrequency | 'none')} style={fieldStyle}>
              {RECURRENCE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {t(`recurrence.${option}`)}
                </option>
              ))}
            </select>
            {frequency === 'custom' && (
              <div style={{ display: 'flex', gap: 4, marginTop: 8 }}>
                {WEEKDAY_KEYS.map((key, day) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => toggleDayOfWeek(day)}
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: '50%',
                      border: `1px solid ${daysOfWeek.includes(day) ? 'var(--color-accent)' : 'var(--color-border)'}`,
                      background: daysOfWeek.includes(day) ? 'var(--color-accent)' : 'none',
                      color: daysOfWeek.includes(day) ? 'var(--color-accent-contrast)' : 'var(--color-text-muted)',
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    {t(key)}
                  </button>
                ))}
              </div>
            )}
            {frequency !== 'none' && (
              <input
                type="date"
                value={recurrenceEndDate}
                onChange={(e) => setRecurrenceEndDate(e.target.value)}
                style={{ ...fieldStyle, marginTop: 8 }}
              />
            )}
          </div>
        )}

        <div>
          <div style={labelStyle}>{t('task.detail.reminder')}</div>
          <select value={reminderOffset ?? ''} onChange={(e) => handleReminderChange(e.target.value)} style={fieldStyle}>
            {REMINDER_OPTIONS.map((option) => (
              <option key={option.labelKey} value={option.offsetMinutes ?? ''}>
                {t(option.labelKey)}
              </option>
            ))}
          </select>
        </div>

        {!isSubtask && (
          <div>
            <div style={labelStyle}>
              {t('task.detail.subtasks')}
              {subtaskProgress.total > 0 && ` · ${subtaskProgress.completed}/${subtaskProgress.total}`}
            </div>
            {subtasks.length > 0 && (
              <ul style={{ margin: '0 0 8px', padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}>
                {subtasks.map((subtask) => (
                  <li key={subtask.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <button
                      type="button"
                      onClick={() => onToggleSubtaskComplete(subtask.id)}
                      aria-label={subtask.status === 'completed' ? t('task.action.markIncomplete') : t('task.action.markComplete')}
                      style={{
                        width: 20,
                        height: 20,
                        minWidth: 20,
                        borderRadius: '50%',
                        border: `1.5px solid ${subtask.status === 'completed' ? 'var(--color-success)' : 'var(--color-border-strong)'}`,
                        background: subtask.status === 'completed' ? 'var(--color-success)' : 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                      }}
                    >
                      {subtask.status === 'completed' && <CheckIcon width={11} height={11} stroke="white" />}
                    </button>
                    <span
                      style={{
                        fontSize: 13.5,
                        color: subtask.status === 'completed' ? 'var(--color-text-muted)' : 'var(--color-text)',
                        textDecoration: subtask.status === 'completed' ? 'line-through' : 'none',
                      }}
                    >
                      {subtask.title}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <QuickAddBar onAdd={(subtaskTitle) => onAddSubtask(task.id, subtaskTitle)} placeholder={t('task.detail.subtasks.placeholder')} />

            {aiQuotaRemaining > 0 ? (
              <>
                <button
                  type="button"
                  onClick={handleBreakdown}
                  disabled={breakdownLoading}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    width: '100%',
                    marginTop: 8,
                    padding: '9px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px dashed var(--color-border-strong)',
                    background: 'none',
                    color: 'var(--color-accent)',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: breakdownLoading ? 'default' : 'pointer',
                  }}
                >
                  <SparkleIcon width={14} height={14} />
                  {breakdownLoading ? t('task.detail.breakdown.loading') : t('task.detail.breakdown.action')}
                </button>
                {Number.isFinite(aiQuotaRemaining) && (
                  <p style={{ color: 'var(--color-text-faint)', fontSize: 11.5, margin: '4px 0 0', textAlign: 'center' }}>
                    {t('task.detail.breakdown.quotaRemaining', { count: aiQuotaRemaining })}
                  </p>
                )}
              </>
            ) : (
              <p
                style={{
                  color: 'var(--color-text-muted)',
                  fontSize: 12.5,
                  margin: '8px 0 0',
                  padding: '9px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px dashed var(--color-border-strong)',
                  textAlign: 'center',
                }}
              >
                {t('task.detail.breakdown.quotaExceeded')}
              </p>
            )}

            {breakdownError && (
              <p style={{ color: 'var(--color-danger)', fontSize: 12.5, margin: '6px 0 0' }}>{breakdownError}</p>
            )}

            {breakdownSuggestions && (
              <div
                style={{
                  marginTop: 8,
                  padding: 12,
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--color-border)',
                  background: 'var(--color-bg)',
                }}
              >
                <div style={{ fontSize: 11.5, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--color-text-faint)', marginBottom: 8 }}>
                  {t('task.detail.breakdown.previewTitle')}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 10 }}>
                  {breakdownSuggestions.map((suggestion, index) => (
                    <label key={index} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13.5, color: 'var(--color-text)' }}>
                      <input
                        type="checkbox"
                        checked={breakdownChecked[index] ?? false}
                        onChange={(e) =>
                          setBreakdownChecked((prev) => prev.map((checked, i) => (i === index ? e.target.checked : checked)))
                        }
                      />
                      {suggestion}
                    </label>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    type="button"
                    onClick={confirmBreakdown}
                    disabled={!breakdownChecked.some(Boolean)}
                    style={{
                      padding: '7px 14px',
                      borderRadius: 'var(--radius-sm)',
                      border: 'none',
                      background: 'var(--color-accent)',
                      color: 'var(--color-accent-contrast)',
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: breakdownChecked.some(Boolean) ? 'pointer' : 'default',
                    }}
                  >
                    {t('task.detail.breakdown.add')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setBreakdownSuggestions(null)}
                    style={{
                      padding: '7px 14px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--color-border)',
                      background: 'none',
                      color: 'var(--color-text-muted)',
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    {t('task.detail.breakdown.cancel')}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
          <button
            type="button"
            onClick={() => {
              onDelete(task.id);
              onClose();
            }}
            style={{ background: 'none', border: 'none', color: 'var(--color-danger)', cursor: 'pointer' }}
          >
            {t('task.detail.delete')}
          </button>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              onClick={onClose}
              style={{ background: 'none', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '8px 14px', color: 'var(--color-text)', cursor: 'pointer' }}
            >
              {t('task.detail.close')}
            </button>
            <button
              type="button"
              onClick={save}
              style={{ background: 'var(--color-accent)', border: 'none', borderRadius: 'var(--radius-md)', padding: '8px 14px', color: 'var(--color-accent-contrast)', fontWeight: 600, cursor: 'pointer' }}
            >
              {t('task.detail.save')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
