// i18n: Hebrew & English strings minimal set
export const I18n = {
  _lang: 'he',
  _catalog: {
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
    },
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
      addHours: 'Add hours',
      planned: 'Planned',
      status: 'Status',
      filters: 'Filters',
      exportCSV: 'Export CSV',
      exportPDF: 'Export PDF',
      createOrder: 'Create Order Request',
      accept: 'Accept',
      refuse: 'Refuse',
    }
  },

  init({defaultLang='he'}){
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