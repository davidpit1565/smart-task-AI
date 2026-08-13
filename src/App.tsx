import { useEffect, useState } from 'react';
import type { Task } from '@/core/task.types';
import { useTaskStore } from '@/store/taskStore';
import { useProjectStore } from '@/store/projectStore';
import { BottomNav, type ScreenId } from '@/ui/components/BottomNav';
import { TaskDetailPanel } from '@/ui/components/TaskDetailPanel';
import { UndoToast } from '@/ui/components/UndoToast';
import { TodayScreen } from '@/ui/screens/TodayScreen';
import { InboxScreen } from '@/ui/screens/InboxScreen';
import { ProjectsScreen } from '@/ui/screens/ProjectsScreen';
import { ProjectDetailScreen } from '@/ui/screens/ProjectDetailScreen';
import { MoreScreen, type MoreView } from '@/ui/screens/MoreScreen';
import { CompletedScreen } from '@/ui/screens/CompletedScreen';
import { ArchivedScreen } from '@/ui/screens/ArchivedScreen';
import { PlaceholderScreen } from '@/ui/screens/PlaceholderScreen';
import { CalendarIcon } from '@/ui/icons';

export function App() {
  const [screen, setScreen] = useState<ScreenId>('today');
  const [openTask, setOpenTask] = useState<Task | null>(null);
  const [toast, setToast] = useState<'completed' | 'deleted' | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [moreView, setMoreView] = useState<MoreView | null>(null);

  const tasks = useTaskStore((s) => s.tasks);
  const loaded = useTaskStore((s) => s.loaded);
  const load = useTaskStore((s) => s.load);
  const addTask = useTaskStore((s) => s.addTask);
  const updateTask = useTaskStore((s) => s.updateTask);
  const completeTask = useTaskStore((s) => s.completeTask);
  const uncompleteTask = useTaskStore((s) => s.uncompleteTask);
  const deleteTask = useTaskStore((s) => s.deleteTask);
  const restoreTask = useTaskStore((s) => s.restoreTask);
  const undo = useTaskStore((s) => s.undo);
  const reorder = useTaskStore((s) => s.reorder);

  const projects = useProjectStore((s) => s.projects);
  const projectsLoaded = useProjectStore((s) => s.loaded);
  const loadProjects = useProjectStore((s) => s.load);
  const addProject = useProjectStore((s) => s.addProject);
  const updateProject = useProjectStore((s) => s.updateProject);
  const archiveProject = useProjectStore((s) => s.archiveProject);
  const restoreProject = useProjectStore((s) => s.restoreProject);

  useEffect(() => {
    load();
    loadProjects();
  }, [load, loadProjects]);

  const visibleTasks = tasks.filter((t) => t.status === 'pending' || t.status === 'completed');
  const nonTrashedTasks = tasks.filter((t) => t.status !== 'trashed');
  const selectedProject = selectedProjectId ? projects.find((p) => p.id === selectedProjectId) ?? null : null;

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

  function openProject(projectId: string) {
    setSelectedProjectId(projectId);
    setScreen('projects');
  }

  if (!loaded || !projectsLoaded) return null;

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
        {screen === 'calendar' && <PlaceholderScreen messageKey="comingSoon.calendar" Icon={CalendarIcon} />}
        {screen === 'projects' &&
          (selectedProject ? (
            <ProjectDetailScreen
              project={selectedProject}
              tasks={visibleTasks}
              onBack={() => setSelectedProjectId(null)}
              onUpdate={(patch) => updateProject(selectedProject.id, patch)}
              onArchive={() => {
                archiveProject(selectedProject.id);
                setSelectedProjectId(null);
              }}
              onRestore={() => restoreProject(selectedProject.id)}
              onAddTask={(title) => addTask({ title, projectId: selectedProject.id })}
              onToggleComplete={handleToggleComplete}
              onOpenTask={setOpenTask}
              onReorder={reorder}
            />
          ) : (
            <ProjectsScreen projects={projects} tasks={visibleTasks} onAdd={(name) => addProject({ name })} onOpen={openProject} />
          ))}
        {screen === 'more' &&
          (moreView === 'completed' ? (
            <CompletedScreen tasks={nonTrashedTasks} onBack={() => setMoreView(null)} onUncomplete={uncompleteTask} />
          ) : moreView === 'archived' ? (
            <ArchivedScreen tasks={nonTrashedTasks} onBack={() => setMoreView(null)} onRestore={restoreTask} />
          ) : (
            <MoreScreen tasks={nonTrashedTasks} onOpen={setMoreView} />
          ))}
      </main>

      <BottomNav active={screen} onChange={setScreen} />

      {openTask && (
        <TaskDetailPanel
          task={openTask}
          allTasks={tasks}
          projects={projects}
          onSave={(id, patch) => updateTask(id, patch)}
          onDelete={handleDelete}
          onClose={() => setOpenTask(null)}
          onAddSubtask={(parentId, title) => addTask({ title, parentTaskId: parentId, projectId: openTask.projectId })}
          onToggleSubtaskComplete={handleToggleComplete}
        />
      )}

      {toast && <UndoToast messageKey={`toast.${toast}`} onUndo={handleUndo} onDismiss={() => setToast(null)} />}
    </div>
  );
}
