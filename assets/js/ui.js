// UI: render components, manage topbar, sidebar, modals with animations
import { Auth } from './auth.js';
import { Storage } from './storage.js';
import { I18n } from './i18n.js';
import { Utils } from './utils.js';

export const UI = {
  root: null,
  sidebarOpen: false,

  init(rootEl){
    this.root = rootEl;
  },

  // route handler bound from main.js
  async routeHandler(path){
    try{
      this.root.innerHTML = '';
    }catch(e){
      console.error('UI root missing', e);
      return;
    }

    // Check if user is authenticated
    const me = Auth.currentUser();
    
    // If not authenticated or on login page, show login-only view
    if(!me || path === '/login'){
      this._renderLoginOnly();
      return;
    }

    // Authenticated users get full layout with topbar and sidebar
    this._renderAuthenticatedLayout(path);
  },

  _renderLoginOnly(){
    // Clear root and show only login form (no topbar/sidebar)
    this.root.innerHTML = '';
    this.root.className = 'app-root min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100';
    
    const loginContainer = document.createElement('div');
    loginContainer.className = 'w-full max-w-md px-4 animate-fade-in';
    loginContainer.innerHTML = `
      <div class="bg-white rounded-2xl shadow-xl p-8 space-y-6">
        <div class="text-center space-y-4">
          <div class="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl shadow-lg">
            <img src="assets/logo.svg" alt="logo" class="w-16 h-16 object-contain" />
          </div>
          <div>
            <h1 class="text-3xl font-bold text-gray-900">${I18n.t('appName')}</h1>
            <p class="text-sm text-gray-500 mt-2">${I18n.t('signInToContinue')}</p>
          </div>
        </div>
        
        <div class="space-y-4">
          <div class="space-y-2">
            <label class="text-sm font-medium text-gray-700">${I18n.t('username')}</label>
            <input 
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" 
              id="login-username" 
              placeholder="${I18n.t('enterUsername')}"
              autocomplete="username"
            />
          </div>
          
          <div class="space-y-2">
            <label class="text-sm font-medium text-gray-700">${I18n.t('password')}</label>
            <input 
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" 
              id="login-password" 
              type="password" 
              placeholder="${I18n.t('enterPassword')}"
              autocomplete="current-password"
            />
          </div>
          
          <div class="flex items-center justify-between">
            <label class="flex items-center space-x-2 cursor-pointer">
              <input type="checkbox" class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
              <span class="text-sm text-gray-600">${I18n.t('rememberMe')}</span>
            </label>
            <div class="flex items-center gap-2">
              <select id="login-lang" class="text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500">
                <option value="en">English</option>
                <option value="he">עברית</option>
              </select>
            </div>
          </div>
          
          <button 
            class="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold py-3 px-4 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:shadow-lg transform hover:scale-[1.02] active:scale-[0.98]" 
            id="btn-login"
          >
            ${I18n.t('signIn')}
          </button>
          
          <div class="text-center">
            <p class="text-xs text-gray-500">Default password: <strong class="text-red-600">Password!2026</strong></p>
          </div>
        </div>
      </div>
    `;
    
    this.root.appendChild(loginContainer);

    // Setup language selector
    const langSel = loginContainer.querySelector('#login-lang');
    langSel.value = I18n.lang();
    langSel.addEventListener('change', (e) => {
      I18n.set(e.target.value);
      location.hash = location.hash || '/login';
    });

    // Setup login button
    const btn = loginContainer.querySelector('#btn-login');
    const usernameInput = loginContainer.querySelector('#login-username');
    const passwordInput = loginContainer.querySelector('#login-password');
    
    // Allow Enter key to login
    [usernameInput, passwordInput].forEach(input => {
      input.addEventListener('keypress', (e) => {
        if(e.key === 'Enter') btn.click();
      });
    });
    
    btn.addEventListener('click', async () => {
      const u = usernameInput.value.trim();
      const p = passwordInput.value;
      if(!u || !p) return alert('Username and password required');
      
      btn.disabled = true;
      btn.textContent = I18n.t('loading');
      
      try{
        await import('./auth.js').then(m => m.Auth.login(u, p));
        location.hash = '/dashboard';
        location.reload();
      }catch(err){
        alert('Login failed: ' + err.message);
        btn.disabled = false;
        btn.textContent = I18n.t('signIn');
      }
    });
  },

  _renderAuthenticatedLayout(path){
    // Reset root classes for authenticated layout
    this.root.className = 'app-root min-h-screen bg-gray-50';
    
    // Topbar
    const topbar = this._renderTopbar();
    this.root.appendChild(topbar);

    // Main container with sidebar and content
    const container = document.createElement('div');
    container.className = 'flex min-h-[calc(100vh-80px)]';
    
    // Sidebar (desktop + mobile slide-out)
    const sidebar = this._renderSidebar(path);
    container.appendChild(sidebar);

    // Main content area
    const content = document.createElement('main');
    content.className = 'flex-1 p-6 transition-all duration-300';
    content.id = 'content-area';
    container.appendChild(content);

    this.root.appendChild(container);

    // Route content
    if(path === '/dashboard' || path === '/'){ 
      this._renderDashboard(content);
    } else if(path.startsWith('/tasks')){
      this._renderTasks(content);
    } else if(path.startsWith('/orders')){
      this._renderOrders(content);
    } else if(path.startsWith('/projects')){
      this._renderProjects(content);
    } else {
      content.innerHTML = '<div class="card">Not found</div>';
    }
  },

  _renderTopbar(){
    const currentUser = Auth.currentUser();
    if(!currentUser) return document.createElement('header'); // Safety check
    
    const wrapper = document.createElement('header');
    wrapper.className = 'sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm';
    wrapper.innerHTML = `
      <div class="flex items-center justify-between h-16 px-4 lg:px-6">
        <div class="flex items-center gap-4">
          <!-- Mobile menu button -->
          <button 
            id="mobile-menu-btn" 
            class="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Toggle menu"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
            </svg>
          </button>
          
          <!-- Brand -->
          <div class="flex items-center gap-3">
            <img src="assets/logo.svg" alt="logo" class="h-10 w-10 rounded-lg" />
            <h1 class="text-lg font-bold text-gray-900 hidden sm:block">${I18n.t('appName')}</h1>
          </div>
        </div>
        
        <!-- Right controls -->
        <div class="flex items-center gap-3">
          <!-- Language selector -->
          <select 
            id="lang-selector" 
            class="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="en">EN</option>
            <option value="he">HE</option>
          </select>
          
          <!-- User info -->
          <div class="hidden md:flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg">
            <div class="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-semibold">
              ${currentUser.displayName.charAt(0).toUpperCase()}
            </div>
            <div class="text-sm">
              <div class="font-medium text-gray-900">${currentUser.displayName}</div>
              <div class="text-xs text-gray-500">${currentUser.role}</div>
            </div>
          </div>
          
          <!-- Logout button -->
          <button 
            id="logout-btn" 
            class="px-4 py-2 text-sm font-medium text-gray-700 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            ${I18n.t('logout')}
          </button>
        </div>
      </div>
    `;

    // Setup language selector
    const langSel = wrapper.querySelector('#lang-selector');
    langSel.value = I18n.lang();
    langSel.addEventListener('change', (e) => {
      I18n.set(e.target.value);
      location.hash = location.hash;
    });

    // Setup logout button
    wrapper.querySelector('#logout-btn').addEventListener('click', () => {
      Auth.logout();
      localStorage.removeItem('brimon.session');
      location.hash = '/login';
      location.reload();
    });

    // Setup mobile menu toggle
    wrapper.querySelector('#mobile-menu-btn').addEventListener('click', () => {
      this.toggleSidebar();
    });

    return wrapper;
  },

  toggleSidebar(){
    this.sidebarOpen = !this.sidebarOpen;
    const sidebar = document.getElementById('app-sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    
    if(this.sidebarOpen){
      sidebar.classList.remove('-translate-x-full');
      overlay.classList.remove('hidden');
      document.body.style.overflow = 'hidden';
    } else {
      sidebar.classList.add('-translate-x-full');
      overlay.classList.add('hidden');
      document.body.style.overflow = '';
    }
  },

  _renderSidebar(activePath){
    const wrapper = document.createElement('div');
    
    // Overlay for mobile (clicks to close)
    const overlay = document.createElement('div');
    overlay.id = 'sidebar-overlay';
    overlay.className = 'fixed inset-0 bg-black/50 z-40 lg:hidden hidden transition-opacity';
    overlay.addEventListener('click', () => this.toggleSidebar());
    wrapper.appendChild(overlay);
    
    // Sidebar
    const sidebar = document.createElement('aside');
    sidebar.id = 'app-sidebar';
    sidebar.className = 'fixed lg:static inset-y-0 left-0 w-64 bg-white border-r border-gray-200 transform -translate-x-full lg:translate-x-0 transition-transform duration-300 ease-in-out z-50 flex flex-col';
    
    // Sidebar content
    const nav = document.createElement('nav');
    nav.className = 'flex-1 p-4 space-y-1 overflow-y-auto';
    
    const items = [
      { path: '/dashboard', label: I18n.t('dashboard'), icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
      { path: '/tasks', label: I18n.t('tasks'), icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' },
      { path: '/projects', label: I18n.t('projects'), icon: 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z' },
      { path: '/orders', label: I18n.t('orders'), icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
    ];
    
    items.forEach(item => {
      const isActive = activePath.startsWith(item.path);
      const btn = document.createElement('button');
      btn.className = `w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all ${
        isActive 
          ? 'bg-blue-50 text-blue-700 font-semibold shadow-sm' 
          : 'text-gray-700 hover:bg-gray-100'
      }`;
      btn.innerHTML = `
        <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${item.icon}"/>
        </svg>
        <span>${item.label}</span>
      `;
      btn.addEventListener('click', () => { 
        location.hash = item.path;
        if(window.innerWidth < 1024) this.toggleSidebar();
      });
      nav.appendChild(btn);
    });
    
    sidebar.appendChild(nav);
    wrapper.appendChild(sidebar);
    
    return wrapper;
  },

  _renderDashboard(container){
    container.innerHTML = '';
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `<div class="header"><div class="h-title">${I18n.t('dashboard')}</div><div></div></div>`;

    // Small summary row
    const summary = document.createElement('div');
    summary.className = 'grid grid-cols-1 md:grid-cols-2 gap-4 mb-4';
    summary.innerHTML = `
      <div class="accent-bg card small"><strong>משימות פתוחות</strong><div class="small">${Storage.tasks().filter(t=>t.status !== 'done').length}</div></div>
      <div class="accent-bg card small"><strong>בקשות הזמנה</strong><div class="small">${Storage.orders().length}</div></div>
    `;
    card.appendChild(summary);

    // Tasks today + recent orders
    const grid = document.createElement('div');
    grid.className = 'grid grid-cols-1 md:grid-cols-2 gap-4';

    const tasksCol = document.createElement('div');
    const ordersCol = document.createElement('div');

    // tasks list
    const tasks = Storage.tasks().slice().reverse().slice(0,6);
    const tasksHeader = document.createElement('div');
    tasksHeader.className = 'header';
    tasksHeader.innerHTML = `<div class="h-title">משימות אחרונות</div>`;
    tasksCol.appendChild(tasksHeader);

    tasks.forEach(t => {
      const el = document.createElement('div');
      el.className = 'task-card flex items-center justify-between';
      el.innerHTML = `<div class="flex-1"><strong>${t.title}</strong><div class="small">${t.description || ''}</div></div>
                      <div class="text-right">
                        <div class="small">${I18n.t('planned')}: ${t.plannedHours || 0}h</div>
                        <div class="mt-2"><button class="btn secondary" data-id="${t.id}">Open</button></div>
                      </div>`;
      tasksCol.appendChild(el);
    });

    // orders list
    const orders = Storage.orders().slice().reverse().slice(0,6);
    const ordersHeader = document.createElement('div');
    ordersHeader.className = 'header';
    ordersHeader.innerHTML = `<div class="h-title">בקשות אחרונות</div>`;
    ordersCol.appendChild(ordersHeader);

    if(orders.length === 0) ordersCol.innerHTML += '<div class="small">אין בקשות</div>';
    orders.forEach(o => {
      const el = document.createElement('div');
      el.className = 'task-card flex items-center justify-between';
      el.innerHTML = `<div class="flex-1"><strong>${o.title}</strong><div class="small">${o.description || ''}</div></div>
                      <div class="text-right">
                        <div class="small">${o.status}</div>
                        <div class="mt-2"><button class="btn ghost" data-id="${o.id}">View</button></div>
                      </div>`;
      ordersCol.appendChild(el);
    });

    grid.appendChild(tasksCol);
    grid.appendChild(ordersCol);
    card.appendChild(grid);
    container.appendChild(card);
  },

  _renderTasks(container){
    container.innerHTML = '';
    const data = Storage.tasks();
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `<div class="header"><div class="h-title">${I18n.t('tasks')}</div><div><button class="btn" id="btn-new-task">+ New</button></div></div>`;
    const list = document.createElement('div');
    list.className = 'grid gap-3';
    data.forEach(t=>{
      const el = document.createElement('div');
      el.className = 'task-card flex items-center justify-between';
      el.innerHTML = `<div class="flex-1"><strong>${t.title}</strong><div class="small">${t.description||''}</div></div>
                      <div class="text-right">
                        <div class="small">${I18n.t('planned')}: ${t.plannedHours||0}h</div>
                        <div class="mt-2"><button class="btn secondary" data-id="${t.id}">Open</button></div>
                      </div>`;
      list.appendChild(el);
    });
    card.appendChild(list);
    container.appendChild(card);

    const newBtn = card.querySelector('#btn-new-task');
    if(newBtn) newBtn.addEventListener('click', ()=> this._openTaskModal());
    list.querySelectorAll('button[data-id]').forEach(b=>{
      b.addEventListener('click', ()=>{
        const id = b.getAttribute('data-id');
        this._openTaskModal(id);
      });
    });
  },

  _openTaskModal(taskId=null){
    const task = taskId ? Storage.tasks().find(t=>t.id===taskId) : null;
    const modalBg = document.createElement('div');
    modalBg.className = 'modal-backdrop';
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
      <div class="header"><div class="h-title">${task?task.title:'Create task'}</div></div>
      <div class="flex flex-col gap-3">
        <input class="input" id="t-title" placeholder="Title" value="${task?task.title:''}">
        <textarea id="t-desc" class="input" placeholder="Description">${task?task.description:''}</textarea>
        <div class="flex gap-2 items-center">
          <input class="input" id="t-planned" placeholder="Planned hours" value="${task?task.plannedHours||'' : ''}" style="width:140px">
          <select id="t-assignees" class="input" multiple style="flex:1;height:44px"></select>
        </div>
        <div class="flex justify-end gap-2">
          <button class="btn ghost" id="t-cancel">Cancel</button>
          <button class="btn" id="t-save">Save</button>
        </div>
      </div>
    `;
    modalBg.appendChild(modal);
    document.body.appendChild(modalBg);

    const sel = modal.querySelector('#t-assignees');
    Storage.users().forEach(u=>{
      const opt = document.createElement('option');
      opt.value = u.username;
      opt.textContent = `${u.displayName} • ${u.role}`;
      if(task && task.assignees && task.assignees.includes(u.username)) opt.selected = true;
      sel.appendChild(opt);
    });

    modal.querySelector('#t-cancel').addEventListener('click', ()=> modalBg.remove());
    modal.querySelector('#t-save').addEventListener('click', ()=>{
      const title = modal.querySelector('#t-title').value.trim();
      const desc = modal.querySelector('#t-desc').value.trim();
      const planned = Number(modal.querySelector('#t-planned').value) || 0;
      const assignees = Array.from(sel.selectedOptions).map(o=>o.value);
      if(!title) return alert('title required');
      if(task){
        Storage.updateTask(task.id, {title, description:desc, plannedHours:planned, assignees});
      } else {
        const t = {
          id: Utils.uuid(),
          projectId: null,
          title, description: desc, images:[], plannedHours: planned,
          assignees, status: assignees.length? 'in progress':'unassigned',
          timeLog: [{type:'plan', by:'system', hours:planned, at:Utils.nowIso()}],
          createdAt: Utils.nowIso()
        };
        Storage.addTask(t);
      }
      modalBg.remove();
      location.hash = '/tasks';
      location.reload();
    });
  },

  _renderOrders(container){
    container.innerHTML = '';
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `<div class="header"><div class="h-title">${I18n.t('orders')}</div><div><button class="btn" id="btn-new-order">${I18n.t('createOrder')}</button></div></div>`;
    const list = document.createElement('div');
    list.className = 'grid gap-3';

    const orders = Storage.orders().slice().reverse();
    orders.forEach(o=>{
      const el = document.createElement('div');
      el.className = 'task-card flex items-center justify-between';
      el.innerHTML = `<div class="flex-1"><strong>${o.title}</strong><div class="small">${o.description||''}</div></div>
                      <div class="text-right">
                        <div class="small">${o.status}</div>
                        <div class="mt-2"><button class="btn ghost" data-id="${o.id}">View</button></div>
                      </div>`;
      list.appendChild(el);
    });
    card.appendChild(list);
    container.appendChild(card);

    const newBtn = card.querySelector('#btn-new-order');
    if(newBtn) newBtn.addEventListener('click', ()=> this._openOrderModal());
  },

  _openOrderModal(){
    const modalBg = document.createElement('div');
    modalBg.className = 'modal-backdrop';
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
      <div class="header"><div class="h-title">Create Order Request</div></div>
      <div class="flex flex-col gap-3">
        <input class="input" id="o-title" placeholder="Title">
        <textarea class="input" id="o-desc" placeholder="Description"></textarea>
        <div class="flex justify-end gap-2">
          <button class="btn ghost" id="o-cancel">Cancel</button>
          <button class="btn" id="o-create">Create</button>
        </div>
      </div>
    `;
    modalBg.appendChild(modal);
    document.body.appendChild(modalBg);
    modal.querySelector('#o-cancel').addEventListener('click', ()=> modalBg.remove());
    modal.querySelector('#o-create').addEventListener('click', ()=>{
      const title = modal.querySelector('#o-title').value.trim();
      const desc = modal.querySelector('#o-desc').value.trim();
      if(!title) return alert('title required');
      const me = Auth.currentUser();
      const o = {id: Utils.uuid(), title, description:desc, date: Utils.nowIso(), status: 'Requested', requestedBy: me.username};
      Storage.addOrder(o);
      modalBg.remove();
      location.reload();
    });
  },

  _renderProjects(container){
    container.innerHTML = '<div class="card"><div class="h-title">Projects</div><div class="small">Gestion des projets (à compléter)</div></div>';
  }
};