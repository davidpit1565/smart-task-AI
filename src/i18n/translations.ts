export type Language = 'en' | 'he';

export const LANGUAGES: { code: Language; dir: 'ltr' | 'rtl'; label: string }[] = [
  { code: 'en', dir: 'ltr', label: 'English' },
  { code: 'he', dir: 'rtl', label: 'עברית' },
];

const en = {
  'nav.today': 'Today',
  'nav.inbox': 'Inbox',
  'nav.calendar': 'Calendar',
  'nav.projects': 'Projects',
  'nav.more': 'More',

  'today.greeting.morning': 'Good morning',
  'today.greeting.afternoon': 'Good afternoon',
  'today.greeting.evening': 'Good evening',
  'today.progress': "Today's progress",
  'today.overdue': 'Overdue',
  'today.tasksToday': 'Today',
  'today.remaining': 'remaining',
  'today.completedOf': '{completed} of {total} completed',
  'today.empty': 'Nothing scheduled for today. Add something from your Inbox, or enjoy the quiet.',

  'inbox.title': 'Inbox',
  'inbox.quickAdd.placeholder': 'Add a task…',
  'inbox.empty': 'Inbox is empty. Great job — or time to plan ahead.',

  'comingSoon.title': 'Coming soon',
  'comingSoon.calendar': 'Calendar integrations (Google, Outlook, Apple) arrive in a later phase.',
  'comingSoon.projects': 'Projects, goals, and tags arrive in Phase 2.',
  'comingSoon.more': 'Settings, analytics, and focus mode arrive in later phases.',

  'task.priority.none': 'None',
  'task.priority.low': 'Low',
  'task.priority.medium': 'Medium',
  'task.priority.high': 'High',
  'task.priority.urgent': 'Urgent',

  'task.detail.description': 'Description',
  'task.detail.notes': 'Notes',
  'task.detail.dueDate': 'Due date',
  'task.detail.dueTime': 'Due time',
  'task.detail.deadline': 'Deadline',
  'task.detail.priority': 'Priority',
  'task.detail.close': 'Close',
  'task.detail.delete': 'Delete',
  'task.detail.save': 'Save',

  'action.undo': 'Undo',
  'toast.completed': 'Task completed',
  'toast.deleted': 'Task deleted',
} as const;

export type TranslationKey = keyof typeof en;

const he: Record<TranslationKey, string> = {
  'nav.today': 'היום',
  'nav.inbox': 'תיבה',
  'nav.calendar': 'יומן',
  'nav.projects': 'פרויקטים',
  'nav.more': 'עוד',

  'today.greeting.morning': 'בוקר טוב',
  'today.greeting.afternoon': 'צהריים טובים',
  'today.greeting.evening': 'ערב טוב',
  'today.progress': 'התקדמות היום',
  'today.overdue': 'פיגורים',
  'today.tasksToday': 'היום',
  'today.remaining': 'נותרו',
  'today.completedOf': '{completed} מתוך {total} הושלמו',
  'today.empty': 'אין משימות מתוזמנות להיום. הוסף משהו מהתיבה, או פשוט תיהנה מהשקט.',

  'inbox.title': 'תיבה',
  'inbox.quickAdd.placeholder': 'הוספת משימה…',
  'inbox.empty': 'התיבה ריקה. עבודה טובה — או שהגיע הזמן לתכנן קדימה.',

  'comingSoon.title': 'בקרוב',
  'comingSoon.calendar': 'אינטגרציית יומן (Google, Outlook, Apple) תגיע בשלב מאוחר יותר.',
  'comingSoon.projects': 'פרויקטים, יעדים ותגיות יגיעו בשלב 2.',
  'comingSoon.more': 'הגדרות, אנליטיקה ומצב פוקוס יגיעו בשלבים מאוחרים יותר.',

  'task.priority.none': 'ללא',
  'task.priority.low': 'נמוכה',
  'task.priority.medium': 'בינונית',
  'task.priority.high': 'גבוהה',
  'task.priority.urgent': 'דחופה',

  'task.detail.description': 'תיאור',
  'task.detail.notes': 'הערות',
  'task.detail.dueDate': 'תאריך יעד',
  'task.detail.dueTime': 'שעת יעד',
  'task.detail.deadline': 'דדליין',
  'task.detail.priority': 'עדיפות',
  'task.detail.close': 'סגור',
  'task.detail.delete': 'מחיקה',
  'task.detail.save': 'שמירה',

  'action.undo': 'ביטול',
  'toast.completed': 'המשימה הושלמה',
  'toast.deleted': 'המשימה נמחקה',
};

export const dictionaries: Record<Language, Record<TranslationKey, string>> = { en, he };
