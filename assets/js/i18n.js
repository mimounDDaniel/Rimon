// i18n: Internationalization module with English as source language
export const I18n = {
  _lang: 'en',
  _listeners: [],
  _catalog: {
    en: {
      // Core app
      appName: 'B Rimon Management',
      appTagline: 'Power in Motion',
      
      // Authentication
      login: 'Login',
      username: 'Username',
      password: 'Password',
      logout: 'Logout',
      seedPasswordNote: 'Seed password by default',
      
      // Navigation
      dashboard: 'Dashboard',
      tasks: 'Tasks',
      myTasks: 'My Tasks',
      allTasks: 'All Tasks',
      projects: 'Projects',
      orders: 'Orders',
      myOrders: 'My Orders',
      allOrders: 'All Orders',
      users: 'Users',
      settings: 'Settings',
      profile: 'Profile',
      
      // Actions
      addHours: 'Add hours',
      create: 'Create',
      save: 'Save',
      cancel: 'Cancel',
      edit: 'Edit',
      delete: 'Delete',
      accept: 'Accept',
      refuse: 'Refuse',
      close: 'Close',
      open: 'Open',
      view: 'View',
      yes: 'Yes',
      no: 'No',
      
      // Common labels
      title: 'Title',
      description: 'Description',
      planned: 'Planned',
      status: 'Status',
      filters: 'Filters',
      date: 'Date',
      assignees: 'Assignees',
      
      // Export
      exportCSV: 'Export CSV',
      exportPDF: 'Export PDF',
      
      // Orders
      createOrder: 'Create Order Request',
      orderRequest: 'Order Request',
      requested: 'Requested',
      requestedBy: 'Requested by',
      pending: 'Pending',
      inSearch: 'In Search',
      ordered: 'Ordered',
      inProgress: 'In Progress',
      completed: 'Completed',
      refused: 'Refused',
      cancelled: 'Cancelled',
      arrivalDate: 'Arrival Date',
      notes: 'Notes',
      urgent: 'Urgent',
      markAsUrgent: 'Mark as urgent',
      none: 'None',
      
      // Tasks
      createTask: 'Create Task',
      newTask: '+ New',
      taskTitle: 'Task Title',
      taskDescription: 'Task Description',
      plannedHours: 'Planned hours',
      openTasks: 'Open tasks',
      recentTasks: 'Recent tasks',
      taskComments: 'Comments & History',
      addComment: 'Add Comment',
      statusChange: 'Status Change',
      unassigned: 'Unassigned',
      assigned: 'Assigned',
      undefined: 'Undefined',
      allStatuses: 'All Statuses',
      filterByStatus: 'Filter by status',
      filterByProject: 'Filter by project',
      allProjects: 'All Projects',
      projectName: 'Project',
      selectProject: 'Select Project',
      viewProject: 'View Project',
      taskHistory: 'Task History',
      addPhoto: 'Add Photo',
      taskReadOnly: 'Task details are read-only for employees',
      createUnassignedTask: 'Just create the task for now',
      allFieldsRequired: 'All fields must be filled',
      
      // Dashboard
      goodMorning: 'Good morning',
      goodAfternoon: 'Good afternoon',
      goodEvening: 'Good evening',
      todaysTasks: 'Here are today\'s tasks',
      recentOrders: 'Recent orders',
      noOrders: 'No orders',
      calendar: 'Calendar',
      
      // Messages
      notFound: 'Not found',
      required: 'Required',
      titleRequired: 'Title required',
      usernamePasswordRequired: 'Username and password required',
      loginFailed: 'Login failed',
      initError: 'Initialization error',
      accessDenied: 'Access Denied',
      noAccessToAllTasks: 'Your role does not have access to all tasks.',
      noAccessToAllOrders: 'Your role does not have access to all orders.',
      
      // Mobile menu
      menu: 'Menu',
      closeMenu: 'Close menu',
      
      // Language
      language: 'Language',
      selectLanguage: 'Select language',
      english: 'English',
      hebrew: 'עברית'
    },
    he: {
      // Core app
      appName: 'B Rimon Management',
      appTagline: 'כוח בתנועה',
      
      // Authentication
      login: 'התחברות',
      username: 'שם משתמש',
      password: 'סיסמה',
      logout: 'התנתק',
      seedPasswordNote: 'סיסמת זרע כברירת מחדל',
      
      // Navigation
      dashboard: 'לוח בקרה',
      tasks: 'משימות',
      myTasks: 'המשימות שלי',
      allTasks: 'כל המשימות',
      projects: 'פרויקטים',
      orders: 'הזמנות',
      myOrders: 'ההזמנות שלי',
      allOrders: 'כל ההזמנות',
      users: 'משתמשים',
      settings: 'הגדרות',
      profile: 'פרופיל',
      
      // Actions
      addHours: 'הוספת שעות',
      create: 'צור',
      save: 'שמור',
      cancel: 'ביטול',
      edit: 'ערוך',
      delete: 'מחק',
      accept: 'אשר',
      refuse: 'דחה',
      close: 'סגור',
      open: 'פתח',
      view: 'צפה',
      yes: 'כן',
      no: 'לא',
      
      // Common labels
      title: 'כותרת',
      description: 'תיאור',
      planned: 'משוערת',
      status: 'מצב',
      filters: 'מסננים',
      date: 'תאריך',
      assignees: 'משוייכים',
      
      // Export
      exportCSV: 'ייצא CSV',
      exportPDF: 'ייצא PDF',
      
      // Orders
      createOrder: 'בקשת חומר',
      orderRequest: 'בקשת הזמנה',
      requested: 'נתבקש',
      requestedBy: 'התבקש על ידי',
      pending: 'ממתין',
      inSearch: 'בחיפוש',
      ordered: 'הוזמן',
      inProgress: 'בתהליך',
      completed: 'הושלם',
      refused: 'נדחה',
      cancelled: 'בוטל',
      arrivalDate: 'תאריך הגעה',
      notes: 'הערות',
      urgent: 'דחוף',
      markAsUrgent: 'סמן כדחוף',
      none: 'אין',
      
      // Tasks
      createTask: 'צור משימה',
      newTask: '+ חדש',
      taskTitle: 'כותרת המשימה',
      taskDescription: 'תיאור המשימה',
      plannedHours: 'שעות משוערות',
      openTasks: 'משימות פתוחות',
      recentTasks: 'משימות אחרונות',
      taskComments: 'הערות והיסטוריה',
      addComment: 'הוסף הערה',
      statusChange: 'שינוי סטטוס',
      unassigned: 'לא משוייך',
      assigned: 'משוייך',
      undefined: 'לא מוגדר',
      allStatuses: 'כל הסטטוסים',
      filterByStatus: 'סנן לפי סטטוס',
      filterByProject: 'סנן לפי פרויקט',
      allProjects: 'כל הפרויקטים',
      projectName: 'פרויקט',
      selectProject: 'בחר פרויקט',
      viewProject: 'צפה בפרויקט',
      taskHistory: 'היסטוריית משימה',
      addPhoto: 'הוסף תמונה',
      taskReadOnly: 'פרטי המשימה הם לקריאה בלבד עבור עובדים',
      createUnassignedTask: 'רק צור את המשימה לעכשיו',
      allFieldsRequired: 'כל השדות חייבים להיות מלאים',
      
      // Dashboard
      goodMorning: 'בוקר טוב',
      goodAfternoon: 'צהריים טובים',
      goodEvening: 'ערב טוב',
      todaysTasks: 'הנה המשימות של היום',
      recentOrders: 'בקשות אחרונות',
      noOrders: 'אין בקשות',
      calendar: 'לוח שנה',
      
      // Messages
      notFound: 'לא נמצא',
      required: 'נדרש',
      titleRequired: 'כותרת נדרשת',
      usernamePasswordRequired: 'שם משתמש וסיסמה נדרשים',
      loginFailed: 'התחברות נכשלה',
      initError: 'שגיאת אתחול',
      accessDenied: 'גישה נדחתה',
      noAccessToAllTasks: 'לתפקיד שלך אין גישה לכל המשימות.',
      noAccessToAllOrders: 'לתפקיד שלך אין גישה לכל ההזמנות.',
      
      // Mobile menu
      menu: 'תפריט',
      closeMenu: 'סגור תפריט',
      
      // Language
      language: 'שפה',
      selectLanguage: 'בחר שפה',
      english: 'English',
      hebrew: 'עברית'
    }
  },

  init({defaultLang = 'en'} = {}) {
    this._lang = defaultLang;
    this.applyDir();
    return Promise.resolve();
  },

  t(key) {
    return (this._catalog[this._lang] && this._catalog[this._lang][key]) || key;
  },

  set(lang) {
    if (this._lang === lang) return;
    this._lang = lang;
    this.applyDir();
    this._emit('i18n:change', lang);
  },

  lang() {
    return this._lang;
  },

  applyDir() {
    const dir = this._lang === 'he' ? 'rtl' : 'ltr';
    document.documentElement.lang = this._lang;
    document.documentElement.dir = dir;
    
    // Add/remove body classes for RTL support
    if (dir === 'rtl') {
      document.body.classList.add('is-rtl');
      document.body.classList.remove('is-ltr');
    } else {
      document.body.classList.add('is-ltr');
      document.body.classList.remove('is-rtl');
    }
    
    // Also toggle on app root if it exists
    const root = document.querySelector('#app');
    if (root) {
      root.classList.toggle('rtl', dir === 'rtl');
      root.classList.toggle('ltr', dir === 'ltr');
    }
  },

  on(event, callback) {
    this._listeners.push({ event, callback });
  },

  off(event, callback) {
    this._listeners = this._listeners.filter(
      l => !(l.event === event && l.callback === callback)
    );
  },

  _emit(event, data) {
    this._listeners
      .filter(l => l.event === event)
      .forEach(l => l.callback(data));
  }
};