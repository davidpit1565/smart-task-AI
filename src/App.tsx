import { useEffect, useState } from 'react';
import type { CalendarEvent } from '@/core/calendar/calendarEvent.types';
import { useTaskStore } from '@/store/taskStore';
import { useProjectStore } from '@/store/projectStore';
import { useGoalStore } from '@/store/goalStore';
import { useCalendarStore } from '@/store/calendarStore';
import { BottomNav, type ScreenId } from '@/ui/components/BottomNav';
import { TaskDetailPanel } from '@/ui/components/TaskDetailPanel';
import { FocusModeScreen } from '@/ui/components/FocusModeScreen';
import { UndoToast } from '@/ui/components/UndoToast';
import { TodayScreen } from '@/ui/screens/TodayScreen';
import { InboxScreen } from '@/ui/screens/InboxScreen';
import { ProjectsScreen } from '@/ui/screens/ProjectsScreen';
import { ProjectDetailScreen } from '@/ui/screens/ProjectDetailScreen';
import { MoreScreen, type MoreView } from '@/ui/screens/MoreScreen';
import { CompletedScreen } from '@/ui/screens/CompletedScreen';
import { ArchivedScreen } from '@/ui/screens/ArchivedScreen';
import { SearchScreen } from '@/ui/screens/SearchScreen';
import { GoalsScreen } from '@/ui/screens/GoalsScreen';
import { GoalDetailScreen } from '@/ui/screens/GoalDetailScreen';
import { CalendarScreen } from '@/ui/screens/CalendarScreen';
import { useDueReminders } from '@/ui/hooks/useDueReminders';

export function App() {
  const [screen, setScreen] = useState<ScreenId>('today');
  const [openTaskId, setOpenTaskId] = useState<string | null>(null);
  const [focusTaskId, setFocusTaskId] = useState<string | null>(null);
  const [toast, setToast] = useState<'completed' | 'deleted' | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
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

  useDueReminders(tasks);

  const projects = useProjectStore((s) => s.projects);
  const projectsLoaded = useProjectStore((s) => s.loaded);
  const loadProjects = useProjectStore((s) => s.load);
  const addProject = useProjectStore((s) => s.addProject);
  const updateProject = useProjectStore((s) => s.updateProject);
  const archiveProject = useProjectStore((s) => s.archiveProject);
  const restoreProject = useProjectStore((s) => s.restoreProject);

  const goals = useGoalStore((s) => s.goals);
  const goalsLoaded = useGoalStore((s) => s.loaded);
  const loadGoals = useGoalStore((s) => s.load);
  const addGoal = useGoalStore((s) => s.addGoal);
  const updateGoal = useGoalStore((s) => s.updateGoal);
  const archiveGoal = useGoalStore((s) => s.archiveGoal);
  const restoreGoal = useGoalStore((s) => s.restoreGoal);

  const calendarConnections = useCalendarStore((s) => s.connections);
  const connectedCalendars = useCalendarStore((s) => s.connectedCalendars);
  const calendarEvents = useCalendarStore((s) => s.events);
  const calendarLoaded = useCalendarStore((s) => s.loaded);
  const calendarConnecting = useCalendarStore((s) => s.connecting);
  const calendarError = useCalendarStore((s) => s.error);
  const loadCalendar = useCalendarStore((s) => s.load);
  const connectGoogle = useCalendarStore((s) => s.connectGoogle);
  const disconnectCalendar = useCalendarStore((s) => s.disconnect);
  const syncCalendarProvider = useCalendarStore((s) => s.syncProvider);
  const setCalendarEnabled = useCalendarStore((s) => s.setCalendarEnabled);
  const createEventForTask = useCalendarStore((s) => s.createEventForTask);
  const deleteEventForTask = useCalendarStore((s) => s.deleteEventForTask);
  const linkEventToTask = useCalendarStore((s) => s.linkEventToTask);

  useEffect(() => {
    load();
    loadProjects();
    loadGoals();
    loadCalendar();
  }, [load, loadProjects, loadGoals, loadCalendar]);

  const visibleTasks = tasks.filter((t) => t.status === 'pending' || t.status === 'completed');
  const nonTrashedTasks = tasks.filter((t) => t.status !== 'trashed');
  const selectedProject = selectedProjectId ? projects.find((p) => p.id === selectedProjectId) ?? null : null;
  const selectedGoal = selectedGoalId ? goals.find((g) => g.id === selectedGoalId) ?? null : null;
  const openTask = openTaskId ? tasks.find((t) => t.id === openTaskId) ?? null : null;
  const focusTask = focusTaskId ? tasks.find((t) => t.id === focusTaskId) ?? null : null;
  const defaultConnectedCalendarId = connectedCalendars.find((c) => c.enabled)?.id ?? null;

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

  function handleStartFocus(taskId: string) {
    setFocusTaskId(taskId);
    setOpenTaskId(null);
  }

  function handleFinishFocus(minutesSpent: number) {
    if (focusTaskId) {
      const task = tasks.find((t) => t.id === focusTaskId);
      if (task) updateTask(focusTaskId, { actualDuration: (task.actualDuration ?? 0) + minutesSpent });
    }
    setFocusTaskId(null);
  }

  function openProject(projectId: string) {
    setSelectedProjectId(projectId);
    setMoreView(null);
    setScreen('projects');
  }

  async function handleScheduleTask(taskId: string, input: { connectedCalendarId: string; start: string; end: string }) {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;
    const event = await createEventForTask({
      connectedCalendarId: input.connectedCalendarId,
      title: task.title,
      description: task.description,
      location: '',
      start: input.start,
      end: input.end,
      allDay: false,
      recurrenceRule: null,
      taskId,
    });
    await updateTask(taskId, {
      dueDate: input.start.slice(0, 10),
      dueTime: input.start.slice(11, 16),
      calendarEventId: event.id,
    });
  }

  async function handleUnscheduleTask(taskId: string) {
    const task = tasks.find((t) => t.id === taskId);
    if (!task?.calendarEventId) return;
    await deleteEventForTask(task.calendarEventId);
    await updateTask(taskId, { calendarEventId: null });
  }

  async function handleConvertEventToTask(event: CalendarEvent) {
    const task = await addTask({
      title: event.title,
      description: event.description,
      dueDate: event.start.slice(0, 10),
      dueTime: event.allDay ? null : event.start.slice(11, 16),
      calendarEventId: event.id,
    });
    await linkEventToTask(event.id, task.id);
  }

  if (!loaded || !projectsLoaded || !goalsLoaded || !calendarLoaded) return null;

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <main style={{ flex: 1, overflowY: 'auto' }}>
        {screen === 'today' && (
          <TodayScreen tasks={visibleTasks} onToggleComplete={handleToggleComplete} onOpen={(task) => setOpenTaskId(task.id)} onReorder={reorder} />
        )}
        {screen === 'inbox' && (
          <InboxScreen
            tasks={visibleTasks}
            onAdd={(title) => addTask({ title })}
            onToggleComplete={handleToggleComplete}
            onOpen={(task) => setOpenTaskId(task.id)}
            onReorder={reorder}
          />
        )}
        {screen === 'calendar' && (
          <CalendarScreen
            connections={calendarConnections}
            connectedCalendars={connectedCalendars}
            events={calendarEvents}
            connecting={calendarConnecting}
            error={calendarError}
            onConnectGoogle={connectGoogle}
            onDisconnectGoogle={() => disconnectCalendar('google')}
            onSync={() => syncCalendarProvider('google')}
            onToggleCalendar={setCalendarEnabled}
            onConvertToTask={handleConvertEventToTask}
          />
        )}
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
              onOpenTask={(task) => setOpenTaskId(task.id)}
              onReorder={reorder}
            />
          ) : (
            <ProjectsScreen projects={projects} tasks={visibleTasks} onAdd={(name) => addProject({ name })} onOpen={openProject} />
          ))}
        {screen === 'more' &&
          (moreView === 'search' ? (
            <SearchScreen
              tasks={nonTrashedTasks}
              projects={projects}
              onBack={() => setMoreView(null)}
              onToggleComplete={handleToggleComplete}
              onOpen={(task) => setOpenTaskId(task.id)}
            />
          ) : moreView === 'goals' ? (
            selectedGoal ? (
              <GoalDetailScreen
                goal={selectedGoal}
                projects={projects}
                tasks={visibleTasks}
                onBack={() => setSelectedGoalId(null)}
                onUpdate={(patch) => updateGoal(selectedGoal.id, patch)}
                onArchive={() => {
                  archiveGoal(selectedGoal.id);
                  setSelectedGoalId(null);
                }}
                onRestore={() => restoreGoal(selectedGoal.id)}
                onAddTask={(title) => addTask({ title, goalId: selectedGoal.id })}
                onOpenProject={openProject}
                onToggleComplete={handleToggleComplete}
                onOpenTask={(task) => setOpenTaskId(task.id)}
                onReorder={reorder}
              />
            ) : (
              <GoalsScreen
                goals={goals}
                projects={projects}
                tasks={visibleTasks}
                onBack={() => setMoreView(null)}
                onAdd={(name) => addGoal({ name })}
                onOpen={setSelectedGoalId}
              />
            )
          ) : moreView === 'completed' ? (
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
          goals={goals}
          calendarEvents={calendarEvents}
          connectedCalendarId={defaultConnectedCalendarId}
          onSave={(id, patch) => updateTask(id, patch)}
          onDelete={handleDelete}
          onClose={() => setOpenTaskId(null)}
          onAddSubtask={(parentId, title) => addTask({ title, parentTaskId: parentId, projectId: openTask.projectId })}
          onToggleSubtaskComplete={handleToggleComplete}
          onScheduleTask={handleScheduleTask}
          onUnscheduleTask={handleUnscheduleTask}
          onStartFocus={handleStartFocus}
        />
      )}

      {focusTask && <FocusModeScreen task={focusTask} onFinish={handleFinishFocus} />}

      {toast && <UndoToast messageKey={`toast.${toast}`} onUndo={handleUndo} onDismiss={() => setToast(null)} />}
    </div>
  );
}
