import { useEffect, useState } from 'react';
import type { Task } from '@/core/task.types';
import { useTaskStore } from '@/store/taskStore';
import { BottomNav, type ScreenId } from '@/ui/components/BottomNav';
import { TaskDetailPanel } from '@/ui/components/TaskDetailPanel';
import { UndoToast } from '@/ui/components/UndoToast';
import { TodayScreen } from '@/ui/screens/TodayScreen';
import { InboxScreen } from '@/ui/screens/InboxScreen';
import { PlaceholderScreen } from '@/ui/screens/PlaceholderScreen';

export function App() {
  const [screen, setScreen] = useState<ScreenId>('today');
  const [openTask, setOpenTask] = useState<Task | null>(null);
  const [toast, setToast] = useState<'completed' | 'deleted' | null>(null);

  const tasks = useTaskStore((s) => s.tasks);
  const loaded = useTaskStore((s) => s.loaded);
  const load = useTaskStore((s) => s.load);
  const addTask = useTaskStore((s) => s.addTask);
  const updateTask = useTaskStore((s) => s.updateTask);
  const completeTask = useTaskStore((s) => s.completeTask);
  const uncompleteTask = useTaskStore((s) => s.uncompleteTask);
  const deleteTask = useTaskStore((s) => s.deleteTask);
  const undo = useTaskStore((s) => s.undo);
  const reorder = useTaskStore((s) => s.reorder);

  useEffect(() => {
    load();
  }, [load]);

  const visibleTasks = tasks.filter((t) => t.status === 'pending' || t.status === 'completed');

  function handleToggleComplete(id: string) {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;
    if (task.status === 'completed') {
      uncompleteTask(id);
    } else {
      completeTask(id);
      setToast('completed');
    }
  }

  function handleDelete(id: string) {
    deleteTask(id);
    setToast('deleted');
  }

  function handleUndo() {
    undo();
    setToast(null);
  }

  if (!loaded) return null;

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <main style={{ flex: 1, overflowY: 'auto' }}>
        {screen === 'today' && (
          <TodayScreen tasks={visibleTasks} onToggleComplete={handleToggleComplete} onOpen={setOpenTask} onReorder={reorder} />
        )}
        {screen === 'inbox' && (
          <InboxScreen
            tasks={visibleTasks}
            onAdd={(title) => addTask({ title })}
            onToggleComplete={handleToggleComplete}
            onOpen={setOpenTask}
            onReorder={reorder}
          />
        )}
        {screen === 'calendar' && <PlaceholderScreen messageKey="comingSoon.calendar" />}
        {screen === 'projects' && <PlaceholderScreen messageKey="comingSoon.projects" />}
        {screen === 'more' && <PlaceholderScreen messageKey="comingSoon.more" />}
      </main>

      <BottomNav active={screen} onChange={setScreen} />

      {openTask && (
        <TaskDetailPanel
          task={openTask}
          onSave={(id, patch) => updateTask(id, patch)}
          onDelete={handleDelete}
          onClose={() => setOpenTask(null)}
        />
      )}

      {toast && <UndoToast messageKey={`toast.${toast}`} onUndo={handleUndo} onDismiss={() => setToast(null)} />}
    </div>
  );
}
