// UI: render components, manage topbar, sidebar, modals
import { Auth } from './auth.js';
import { Storage } from './storage.js';
import { I18n } from './i18n.js';
import { Utils } from './utils.js';

export const UI = {
  root: null,

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

    // Topbar
    const topbar = this._renderTopbar();
    this.root.appendChild(topbar);

    // Main container (sidebar + content)
    const container = document.createElement('div');
    container.className = 'container';

    const sidebar = this._renderSidebar(path);
    sidebar.className = 'sidebar';
    container.appendChild(sidebar);

    const content = document.createElement('main');
    content.className = 'content';
    content.id = 'content-area';
    container.appendChild(content);

    this.root.appendChild(container);

    // Routing
    const me = Auth.currentUser();
    if(!me || path === '/login'){
      this._renderLogin(content);
      return;
    }

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
    const wrapper = document.createElement('header');
    wrapper.className = 'topbar flex items-center justify-between';

    const brand = document.createElement('div');
    brand.className = 'brand flex items-center gap-3';
    const img = document.createElement('img');
    img.src = 'assets/logo.svg';
    img.alt = 'logo';
    img.className = 'h-12 w-12';
    brand.appendChild(img);
    const title = document.createElement('h1');
    title.textContent = I18n.t('appName');
    title.className = 'text-lg font-semibold text-primary';
    brand.appendChild(title);

    wrapper.appendChild(brand);

    const controls = document.createElement('div');
    controls.className = 'controls flex items-center gap-3';

    // language
    const sel = document.createElement('select');
    sel.className = 'select-lang p-2 rounded';
    sel.innerHTML = `<option value="he">עברית</option><option value="en">English</option>`;
    sel.value = I18n.lang();
    sel.addEventListener('change', (e) => {
      I18n.set(e.target.value);
      // re-render current route to apply direction
      location.hash = location.hash;
    });
    controls.appendChild(sel);

    // show user info
    const user = Auth.currentUser();
    if(user){
      const name = document.createElement('div');
      name.className = 'user text-sm font-medium';
      name.textContent = \
`${user.displayName} • ${user.role}`;
      controls.appendChild(name);

      const logout = document.createElement('button');
      logout.className = 'btn ghost';
      logout.textContent = I18n.t('logout');
      logout.addEventListener('click', () => {
        Auth.logout();
        localStorage.removeItem('brimon.session');
        location.hash = '/login';
        location.reload();
      });
      controls.appendChild(logout);
    }

    wrapper.appendChild(controls);
    return wrapper;
  },

  _renderSidebar(activePath){
    const nav = document.createElement('nav');
    nav.className = 'nav flex flex-col gap-2';
    const items = [
      { path: '/dashboard', label: I18n.t('dashboard') },
      { path: '/tasks', label: I18n.t('tasks') },
      { path: '/projects', label: I18n.t('projects') },
      { path: '/orders', label: I18n.t('orders') },
    ];
    items.forEach(it => {
      const btn = document.createElement('button');
      btn.textContent = it.label;
      btn.className = 'text-left p-3 rounded-md hover:bg-slate-50';
      if(activePath.startsWith(it.path)) btn.classList.add('active');
      btn.addEventListener('click', () => { location.hash = it.path; });
      nav.appendChild(btn);
    });
    return nav;
  },

  _renderLogin(container){
    container.innerHTML = '';
    const c = document.createElement('div');
    c.className = 'card mx-auto';
    c.style.maxWidth = '520px';
    c.style.margin = '24px auto';
    c.innerHTML = `
      <div class="text-center mb-4">
        <img src="assets/logo.svg" alt="logo" class="mx-auto h-20 mb-2">
        <h2 class="text-xl font-semibold">${I18n.t('login')}</h2>
        <div class="small mt-1">B Rimon Management</div>
      </div>
      <div class="flex flex-col gap-3">
        <input class="input" id="login-username" placeholder="${I18n.t('username')}">
        <input class="input" id="login-password" type="password" placeholder="${I18n.t('password')}">
        <div class="flex justify-center mt-2">
          <button class="btn" id="btn-login">${I18n.t('login')}</button>
        </div>
        <div class="small text-center mt-2">Seed password par défaut: <strong class="accent">Password!2026</strong></div>
      </div>
    `;
    container.appendChild(c);

    const btn = c.querySelector('#btn-login');
    btn.addEventListener('click', async () => {
      const u = c.querySelector('#login-username').value.trim();
      const p = c.querySelector('#login-password').value;
      if(!u || !p) return alert('username + password required');
      try{
        await import('./auth.js').then(m => m.Auth.login(u, p));
        location.hash = '/dashboard';
        location.reload();
      }catch(err){
        alert('Login failed: ' + err.message);
      }
    });
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