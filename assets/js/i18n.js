// i18n: Hebrew & English translations - EN base with HE translations
export const I18n = {
  _lang: 'en', // Default to English base
  _catalog: {
    // English - Base language
    en: {
      appName: 'B Rimon Management',
      login: 'Login',
      username: 'Username',
      password: 'Password',
      logout: 'Logout',
      dashboard: 'Dashboard',
      tasks: 'Tasks',
      projects: 'Projects',
      orders: 'Orders',
      users: 'Users',
      addHours: 'Add Hours',
      planned: 'Planned',
      status: 'Status',
      filters: 'Filters',
      exportCSV: 'Export CSV',
      exportPDF: 'Export PDF',
      createOrder: 'Create Order Request',
      accept: 'Accept',
      refuse: 'Refuse',
      // Additional translations
      welcome: 'Welcome',
      welcomeBack: 'Welcome back',
      signIn: 'Sign In',
      signInToContinue: 'Sign in to continue to your account',
      enterUsername: 'Enter your username',
      enterPassword: 'Enter your password',
      rememberMe: 'Remember me',
      forgotPassword: 'Forgot password?',
      loading: 'Loading...',
      menu: 'Menu',
      close: 'Close',
      open: 'Open',
      save: 'Save',
      cancel: 'Cancel',
      delete: 'Delete',
      edit: 'Edit',
      add: 'Add',
      search: 'Search',
      settings: 'Settings',
      profile: 'Profile',
      notifications: 'Notifications',
      language: 'Language',
      theme: 'Theme',
      darkMode: 'Dark Mode',
      lightMode: 'Light Mode',
      home: 'Home',
      back: 'Back',
      next: 'Next',
      previous: 'Previous',
      submit: 'Submit',
      confirm: 'Confirm',
      success: 'Success',
      error: 'Error',
      warning: 'Warning',
      info: 'Info',
    },
    // Hebrew - Full translations
    he: {
      appName: 'B Rimon Management',
      login: 'התחברות',
      username: 'שם משתמש',
      password: 'סיסמה',
      logout: 'התנתק',
      dashboard: 'לוח בקרה',
      tasks: 'משימות',
      projects: 'פרויקטים',
      orders: 'הזמנות',
      users: 'משתמשים',
      addHours: 'הוספת שעות',
      planned: 'משוערת',
      status: 'מצב',
      filters: 'מסננים',
      exportCSV: 'ייצא CSV',
      exportPDF: 'ייצא PDF',
      createOrder: 'בקשת חומר',
      accept: 'אשר',
      refuse: 'דחה',
      // Additional Hebrew translations
      welcome: 'ברוכים הבאים',
      welcomeBack: 'ברוך שובך',
      signIn: 'כניסה',
      signInToContinue: 'היכנס כדי להמשיך לחשבון שלך',
      enterUsername: 'הזן שם משתמש',
      enterPassword: 'הזן סיסמה',
      rememberMe: 'זכור אותי',
      forgotPassword: 'שכחת סיסמה?',
      loading: 'טוען...',
      menu: 'תפריט',
      close: 'סגור',
      open: 'פתח',
      save: 'שמור',
      cancel: 'ביטול',
      delete: 'מחק',
      edit: 'ערוך',
      add: 'הוסף',
      search: 'חיפוש',
      settings: 'הגדרות',
      profile: 'פרופיל',
      notifications: 'התראות',
      language: 'שפה',
      theme: 'ערכת נושא',
      darkMode: 'מצב כהה',
      lightMode: 'מצב בהיר',
      home: 'דף הבית',
      back: 'חזור',
      next: 'הבא',
      previous: 'קודם',
      submit: 'שלח',
      confirm: 'אשר',
      success: 'הצלחה',
      error: 'שגיאה',
      warning: 'אזהרה',
      info: 'מידע',
    }
  },

  init({defaultLang='en'}){  // Changed default to English
    this._lang = defaultLang;
    this.applyDir();
  },

  t(key){
    return (this._catalog[this._lang] && this._catalog[this._lang][key]) || key;
  },

  set(lang){
    this._lang = lang;
    this.applyDir();
  },

  lang(){ return this._lang; },

  applyDir(){
    const dir = this._lang === 'he' ? 'rtl' : 'ltr';
    document.documentElement.lang = this._lang;
    document.documentElement.dir = dir;
    // Add classes to root
    const root = document.querySelector('#app');
    if(root){
      root.classList.toggle('rtl', dir==='rtl');
      root.classList.toggle('ltr', dir==='ltr');
    }
  }
};