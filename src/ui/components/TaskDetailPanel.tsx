import { useState, type CSSProperties } from 'react';
import type { Priority, Task } from '@/core/task.types';
import { PRIORITIES } from '@/core/task.types';
import { useTranslation } from '@/i18n/LanguageContext';

interface TaskDetailPanelProps {
  task: Task;
  onSave(id: string, patch: Partial<Task>): void;
  onDelete(id: string): void;
  onClose(): void;
}

export function TaskDetailPanel({ task, onSave, onDelete, onClose }: TaskDetailPanelProps) {
  const { t } = useTranslation();
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description);
  const [notes, setNotes] = useState(task.notes);
  const [dueDate, setDueDate] = useState(task.dueDate ?? '');
  const [dueTime, setDueTime] = useState(task.dueTime ?? '');
  const [deadline, setDeadline] = useState(task.deadline ?? '');
  const [priority, setPriority] = useState<Priority>(task.priority);

  function save() {
    onSave(task.id, {
      title: title.trim() || task.title,
      description,
      notes,
      dueDate: dueDate || null,
      dueTime: dueTime || null,
      deadline: deadline || null,
      priority,
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
    fontSize: 14,
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
      role="dialog"
      aria-modal="true"
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
          style={{ ...fieldStyle, fontSize: 19, fontWeight: 650, border: 'none', background: 'none', padding: '2px 0' }}
        />

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
