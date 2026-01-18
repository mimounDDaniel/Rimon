// UI: render components, manage topbar, modals
import { Auth } from './auth.js';
import { Storage } from './storage.js';
import { I18n } from './i18n.js';
import { Utils } from './utils.js';

export const UI = {
  root: null,
  currentModal: null,

  init(rootEl){
    this.root = rootEl;
  },

  async routeHandler(path){
    // Render topbar + content layout
    this.root.innerHTML = '';
    const topbar = this._renderTopbar();
    this.root.appendChild(topbar);

    const container = document.createElement('div');
    container.className = 'container';
    // sidebar
    const sidebar = this._renderSidebar(path);
    sidebar.className = 'sidebar card';
    container.appendChild(sidebar);
    // content
    const content = document.createElement('div');
    content.className = 'content';
    content.id = 'content-area';
    container.appendChild(content);
    this.root.appendChild(container);

    // route
    if(path === '/login' || !Auth.currentUser()){
      this._renderLogin(content);
      return;
    }

    // Protected routes
    if(path === '/dashboard' || path === '/'){\n   this._renderDashboard(content);
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
    const wrapper = document.createElement('div');
    wrapper.className = 'topbar';
    const brand = document.createElement('div');
    brand.className = 'brand';
    const img = document.createElement('img');
    img.src = 'assets/logo.svg';
    img.alt = 'logo';
    brand.appendChild(img);
    const title = document.createElement('h1');
    title.textContent = I18n.t('appName');
    brand.appendChild(title);
    wrapper.appendChild(brand);

    const controls = document.createElement('div');
    controls.className = 'controls';
    // language switch
    const sel = document.createElement('select');
    sel.innerHTML = `<option value="he">עברית</option><option value="en">English</option>`;
    sel.value = I18n.lang();
    sel.addEventListener('change', (e)=>{
      I18n.set(e.target.value);
      // rerender current route
      location.hash = location.hash; // trigger
    });
    controls.appendChild(sel);

    const user = Auth.currentUser();
    if(user){
      const name = document.createElement('div');
      name.className = 'kv small';
      name.textContent = user.displayName + ' • ' + user.role;
      controls.appendChild(name);

      const out = document.createElement('button');
      out.className = 'btn ghost';
      out.textContent = I18n.t('logout');
      out.addEventListener('click', ()=>{
        Auth.logout();
        location.hash = '/login';
        location.reload();
      });
      controls.appendChild(out);
    }

    wrapper.appendChild(controls);
    return wrapper;
  },

  _renderSidebar(activePath){
    const nav = document.createElement('div');
    nav.className = 'nav';
    const routes = [
      {path:'/dashboard', label:I18n.t('dashboard')},
      {path:'/tasks', label:I18n.t('tasks')},
      {path:'/projects', label:I18n.t('projects')},
      {path:'/orders', label:I18n.t('orders')},
    ];
    routes.forEach(r=>{
      const b = document.createElement('button');
      b.textContent = r.label;
      b.className = activePath.startsWith(r.path) ? 'active' : '';
      b.addEventListener('click', ()=> location.hash = r.path);
      nav.appendChild(b);
    });
    return nav;
  },

  _renderLogin(container){
    container.innerHTML = '';
    const c = document.createElement('div');
    c.className = 'card center';
    c.style.maxWidth = '420px';
    c.style.margin = '30px auto';
    c.innerHTML = `
      <div style="text-align:center;margin-bottom:12px">
        <img src="assets/logo.svg" alt="logo" style="height:72px">
        <h2>${I18n.t('login')}</h2>
      </div>
      <div class="form-row">
        <input class="input" id="login-username" placeholder="${I18n.t('username')}">
      </div>
      <div class="form-row" style="margin-top:8px">
        <input class="input" id="login-password" type="password" placeholder="${I18n.t('password')}">
      </div>
      <div style="margin-top:12px;display:flex;gap:8px;justify-content:center">
        <button class="btn" id="btn-login">${I18n.t('login')}</button>
      </div>
      <div style="margin-top:8px;text-align:center;color:var(--muted);font-size:13px">
        <div>Seed password par défaut: <strong>Password!2026</strong></div>
      </div>
    `;
    container.appendChild(c);

    container.querySelector('#btn-login').addEventListener('click', async ()=>{
      const u = container.querySelector('#login-username').value.trim();
      const p = container.querySelector('#login-password').value;
      try{
        await import('./auth.js').then(m=>m.Auth.login(u,p));
        location.hash = '/dashboard';
        location.reload();
      }catch(e){
        alert('Login failed: ' + e.message);
      }
    });
  },

  _renderDashboard(container){
    container.innerHTML = '';
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `<div class="header"><div class="h-title">${I18n.t('dashboard')}</div></div>`;
    // Today tasks & recent orders
    const tasks = Storage.tasks().filter(t=>{
      // tasks assigned to current user or in progress
      const me = Auth.currentUser();
      const today = new Date().toISOString().slice(0,10);
      return (t.assignees && t.assignees.includes(me.username)) || (t.status==='in progress' || t.status==='unassigned');
    }).slice(0,6);

    const orders = Storage.orders().slice(-6).reverse();

    const html = document.createElement('div');
    html.innerHTML = `
      <div class="grid">
        <div class="card">
          <div class="header"><div class="h-title">משימות היום</div></div>
          <div>${tasks.map(t=>`<div style="padding:8px;border-bottom:1px solid #f1f5f9"><strong>${t.title}</strong><div class="small">${t.description||''}</div></div>`).join('')}</div>
        </div>
        <div class="card">
          <div class="header"><div class="h-title">בקשות אחרונות</div></div>
          <div>${orders.map(o=>`<div style="padding:8px;border-bottom:1px solid #f1f5f9"><strong>${o.title}</strong><div class="small">${o.status} — ${o.date ? new Date(o.date).toLocaleDateString():''}</div></div>`).join('')}</div>
        </div>
      </div>
    `;
    card.appendChild(html);
    container.appendChild(card);
  },

  _renderTasks(container){
    container.innerHTML = '';
    const data = Storage.tasks();
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `<div class="header"><div class="h-title">${I18n.t('tasks')}</div><div><button class="btn" id="btn-new-task">+ New</button></div></div>`;
    const tableDiv = document.createElement('div');
    tableDiv.innerHTML = this._tasksTableHTML(data);
    card.appendChild(tableDiv);
    container.appendChild(card);

    // handlers
    card.querySelector('#btn-new-task').addEventListener('click', ()=>{
      this._openTaskModal();
    });

    // row actions
    tableDiv.querySelectorAll('[data-task-id]').forEach(el=>{
      el.querySelector('.btn').addEventListener('click',(e)=>{
        const id = el.getAttribute('data-task-id');
        this._openTaskModal(id);
      });
    });
  },

  _tasksTableHTML(tasks){
    const rows = tasks.map(t=>{
      const planned = t.plannedHours || 0;
      const logged = (t.timeLog || []).filter(l=>l.type!=='plan').reduce((s,l)=>s+(l.hours||0),0);
      const status = t.status || 'unassigned';
      const assignees = (t.assignees||[]).join(', ');
      return `<div class="card small" style="margin-bottom:8px;padding:12px" data-task-id="${t.id}">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <div><strong>${t.title}</strong><div class="small">${t.description||''}</div></div>
          <div style="text-align:right">
            <div class="small">${I18n.t('planned')}: ${planned}h • ${logged}h</div>
            <div class="small" style="margin-top:6px">${assignees}</div>
            <div style="margin-top:6px" class="row-actions">
              <button class="btn secondary">Ouvrir</button>
            </div>
          </div>
        </div>
      </div>`;
    }).join('');
    return rows || '<div class="small">Aucune tâche</div>';
  },

  async _openTaskModal(taskId=null){
    const task = taskId ? Storage.tasks().find(t=>t.id===taskId) : null;
    // build modal
    const modalBg = document.createElement('div');
    modalBg.className = 'modal-backdrop';
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
      <div class="header"><div class="h-title">${task?task.title:'Create task'}</div></div>
      <div class="form-row" style="margin-bottom:8px">
        <input class="input" id="t-title" placeholder="Title" value="${task?task.title:''}">
      </div>
      <div class="form-row" style="margin-bottom:8px">
        <textarea id="t-desc" placeholder="Description" class="input">${task?task.description:''}</textarea>
      </div>
      <div style="display:flex;gap:8px;align-items:center;margin-bottom:8px">
        <input class="input" id="t-planned" placeholder="Planned hours" value="${task?task.plannedHours||'' : ''}" style="width:120px">
        <select id="t-assignees" class="input" multiple style="flex:1;height:40px"></select>
      </div>
      <div style="display:flex;gap:8px;justify-content:flex-end">
        <button class="btn ghost" id="t-cancel">Cancel</button>
        <button class="btn" id="t-save">Save</button>
      </div>
    `;
    modalBg.appendChild(modal);
    document.body.appendChild(modalBg);
    // populate assignees
    const users = Storage.users();
    const sel = modal.querySelector('#t-assignees');
    users.forEach(u=>{
      const opt = document.createElement('option');
      opt.value = u.username; opt.textContent = u.displayName + ' • ' + u.role;
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
    list.className = 'small';
    const orders = Storage.orders().slice().reverse();
    list.innerHTML = orders.map(o=>`<div class="card" style="margin-bottom:8px;padding:10px">
      <div style="display:flex;justify-content:space-between"><div><strong>${o.title}</strong><div class="small">${o.description||''}</div></div><div>${o.status}</div></div>
      <div class="small" style="margin-top:6px">${o.requestedBy} • ${o.date?new Date(o.date).toLocaleString():''}</div>
      <div style="margin-top:6px" class="row-actions">
        ${this._orderActionButtons(o)}
      </div>
    </div>`).join('') || '<div>Aucune demande</div>';
    card.appendChild(list);
    container.appendChild(card);

    card.querySelector('#btn-new-order').addEventListener('click', ()=>{
      this._openOrderModal();
    });

    // button listeners (simple delegation)
    list.querySelectorAll('.btn').forEach(b=>{
      b.addEventListener('click', (e)=>{
        const id = b.getAttribute('data-id');
        const action = b.getAttribute('data-action');
        if(action==='accept' || action==='refuse'){
          Storage.updateOrder(id, {status: action==='accept' ? 'Accepted' : 'Refused'});
          location.reload();
        } else if(action==='advance'){
          // cycle statuses
          const o = Storage.orders().find(x=>x.id===id);
          const orderFlow = ['Requested','Accepted','Ordered','In delivery','Delivered'];
          let idx = orderFlow.indexOf(o.status);
          idx = Math.min(orderFlow.length-1, idx+1);
          Storage.updateOrder(id, {status: orderFlow[idx]});
          location.reload();
        }
      });
    });
  },

  _orderActionButtons(o){
    const me = Auth.currentUser();
    if(!me) return '';
    if(me.role === 'orders_manager' || me.role === 'super_admin'){
      return `<button class="btn" data-id="${o.id}" data-action="accept">${I18n.t('accept')}</button>
              <button class="btn ghost" data-id="${o.id}" data-action="refuse">${I18n.t('refuse')}</button>
              <button class="btn secondary" data-id="${o.id}" data-action="advance">Advance</button>`;
    } else {
      return `<button class="btn ghost" data-id="${o.id}" data-action="view">View</button>`;
    }
  },

  _openOrderModal(){
    const modalBg = document.createElement('div');
    modalBg.className = 'modal-backdrop';
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
      <div class="header"><div class="h-title">Create Order Request</div></div>
      <div class="form-row"><input class="input" id="o-title" placeholder="Title"></div>
      <div class="form-row" style="margin-top:8px"><textarea id="o-desc" class="input" placeholder="Description"></textarea></div>
      <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:10px">
        <button class="btn ghost" id="o-cancel">Cancel</button>
        <button class="btn" id="o-create">Create</button>
      </div>
    `;
    modalBg.appendChild(modal);
    document.body.appendChild(modalBg);
    modal.querySelector('#o-cancel').addEventListener('click', ()=>modalBg.remove());
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
  }
};