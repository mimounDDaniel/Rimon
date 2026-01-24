// UI: Modern responsive UI with authentication-aware rendering
import { Auth } from './auth.js';
import { Storage } from './storage.js';
import { I18n } from './i18n.js';
import { Utils } from './utils.js';
import { Router } from './router.js';

export const UI = {
  root: null,
  mobileMenuOpen: false,

  init(rootEl) {
    this.root = rootEl;
    // Listen for i18n changes to re-render
    I18n.on('i18n:change', () => {
      const currentPath = location.hash.replace('#', '') || '/';
      this.routeHandler(currentPath);
    });
  },

  // Route handler bound from main.js
  async routeHandler(path) {
    try {
      this.root.innerHTML = '';
    } catch (e) {
      console.error('UI root missing', e);
      return;
    }

    const me = Auth.currentUser();

    // Pre-login: show only login screen (centered)
    if (!me || path === '/login') {
      this._renderLoginScreen();
      return;
    }

    // Post-login: show topbar + sidebar/mobile menu + content
    const topbar = this._renderTopbar();
    this.root.appendChild(topbar);

    const mainContainer = document.createElement('div');
    mainContainer.className = 'main-container';

    const sidebar = this._renderSidebar(path);
    mainContainer.appendChild(sidebar);

    const content = document.createElement('main');
    content.className = 'content';
    content.id = 'content-area';
    mainContainer.appendChild(content);

    this.root.appendChild(mainContainer);

    // Render mobile menu overlay
    this._renderMobileMenu(path);

    // Route to appropriate content
    if (path === '/dashboard' || path === '/') {
      this._renderDashboard(content);
    } else if (path.startsWith('/tasks')) {
      this._renderTasks(content);
    } else if (path.startsWith('/orders')) {
      this._renderOrders(content);
    } else if (path.startsWith('/projects')) {
      this._renderProjects(content);
    } else {
      content.innerHTML = `<div class="card"><div class="h-title">${I18n.t('notFound')}</div></div>`;
    }
  },

  // ==================== PRE-LOGIN ====================
  _renderLoginScreen() {
    const screen = document.createElement('div');
    screen.className = 'login-screen';

    const card = document.createElement('div');
    card.className = 'login-card';

    // Logo
    const logo = document.createElement('div');
    logo.className = 'login-logo';
    const img = document.createElement('img');
    img.src = 'assets/logo.png';
    img.alt = I18n.t('appName');
    logo.appendChild(img);
    card.appendChild(logo);

    // Title
    const title = document.createElement('h2');
    title.className = 'text-center text-xl font-bold mb-1';
    title.textContent = I18n.t('login');
    card.appendChild(title);

    const subtitle = document.createElement('div');
    subtitle.className = 'text-center text-sm text-gray-600 mb-6';
    subtitle.textContent = I18n.t('appName');
    card.appendChild(subtitle);

    // Form
    const form = document.createElement('div');
    form.className = 'flex flex-col gap-3';

    const userInput = document.createElement('input');
    userInput.className = 'input';
    userInput.id = 'login-username';
    userInput.type = 'text';
    userInput.placeholder = I18n.t('username');
    userInput.setAttribute('aria-label', I18n.t('username'));
    form.appendChild(userInput);

    const passInput = document.createElement('input');
    passInput.className = 'input';
    passInput.id = 'login-password';
    passInput.type = 'password';
    passInput.placeholder = I18n.t('password');
    passInput.setAttribute('aria-label', I18n.t('password'));
    form.appendChild(passInput);

    const btnContainer = document.createElement('div');
    btnContainer.className = 'flex justify-center mt-2';
    const loginBtn = document.createElement('button');
    loginBtn.className = 'btn';
    loginBtn.id = 'btn-login';
    loginBtn.textContent = I18n.t('login');
    btnContainer.appendChild(loginBtn);
    form.appendChild(btnContainer);

    const note = document.createElement('div');
    note.className = 'text-center text-sm text-gray-600 mt-3';
    note.innerHTML = `${I18n.t('seedPasswordNote')}: <strong class="accent">Password!2026</strong>`;
    form.appendChild(note);

    card.appendChild(form);

    // Language selector at bottom
    const langSection = document.createElement('div');
    langSection.className = 'flex items-center justify-center gap-2 mt-6 pt-4 border-t border-gray-200';
    const langLabel = document.createElement('span');
    langLabel.className = 'text-sm text-gray-600';
    langLabel.textContent = I18n.t('language') + ':';
    langSection.appendChild(langLabel);

    const langSelect = document.createElement('select');
    langSelect.className = 'lang-selector';
    langSelect.setAttribute('aria-label', I18n.t('selectLanguage'));
    langSelect.innerHTML = `
      <option value="en">English</option>
      <option value="he">עברית</option>
    `;
    langSelect.value = I18n.lang();
    langSelect.addEventListener('change', (e) => {
      I18n.set(e.target.value);
    });
    langSection.appendChild(langSelect);
    card.appendChild(langSection);

    screen.appendChild(card);
    this.root.appendChild(screen);

    // Login handler
    loginBtn.addEventListener('click', async () => {
      const u = userInput.value.trim();
      const p = passInput.value;
      if (!u || !p) {
        alert(I18n.t('usernamePasswordRequired'));
        return;
      }
      try {
        await Auth.login(u, p);
        Router.navigate('/dashboard');
      } catch (err) {
        alert(I18n.t('loginFailed') + ': ' + err.message);
      }
    });

    // Enter key support
    passInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') loginBtn.click();
    });
    userInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') passInput.focus();
    });
  },

  // ==================== POST-LOGIN ====================
  _renderTopbar() {
    const wrapper = document.createElement('header');
    wrapper.className = 'topbar';
    wrapper.setAttribute('role', 'banner');

    // Left side: hamburger (mobile) + brand
    const leftSide = document.createElement('div');
    leftSide.className = 'flex items-center gap-3';

    // Hamburger button (mobile only)
    const hamburger = document.createElement('button');
    hamburger.className = 'hamburger-btn';
    hamburger.setAttribute('aria-label', I18n.t('menu'));
    hamburger.innerHTML = `
      <svg fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
      </svg>
    `;
    hamburger.addEventListener('click', () => this._toggleMobileMenu());
    leftSide.appendChild(hamburger);

    // Brand
    const brand = document.createElement('div');
    brand.className = 'brand';
    const img = document.createElement('img');
    img.src = 'assets/logo.png';
    img.alt = I18n.t('appName');
    brand.appendChild(img);
    const title = document.createElement('h1');
    title.textContent = I18n.t('appName');
    brand.appendChild(title);
    leftSide.appendChild(brand);

    wrapper.appendChild(leftSide);

    // Right side: language selector + user info + logout
    const controls = document.createElement('div');
    controls.className = 'controls';

    // Language selector
    const langSelect = document.createElement('select');
    langSelect.className = 'lang-selector';
    langSelect.setAttribute('aria-label', I18n.t('selectLanguage'));
    langSelect.innerHTML = `
      <option value="en">English</option>
      <option value="he">עברית</option>
    `;
    langSelect.value = I18n.lang();
    langSelect.addEventListener('change', (e) => {
      I18n.set(e.target.value);
    });
    controls.appendChild(langSelect);

    // User info
    const user = Auth.currentUser();
    if (user) {
      const userInfo = document.createElement('div');
      userInfo.className = 'user-info';

      // Avatar with initials
      const avatar = document.createElement('div');
      avatar.className = 'user-avatar';
      avatar.textContent = user.displayName
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .substring(0, 2);
      userInfo.appendChild(avatar);

      const userDetails = document.createElement('div');
      userDetails.className = 'hidden md:block';
      userDetails.innerHTML = `<div class="text-sm font-medium">${user.displayName}</div><div class="text-xs text-gray-600">${user.role}</div>`;
      userInfo.appendChild(userDetails);

      controls.appendChild(userInfo);

      // Logout button
      const logoutBtn = document.createElement('button');
      logoutBtn.className = 'btn ghost';
      logoutBtn.textContent = I18n.t('logout');
      logoutBtn.setAttribute('aria-label', I18n.t('logout'));
      logoutBtn.addEventListener('click', () => {
        Auth.logout();
        Router.navigate('/login');
      });
      controls.appendChild(logoutBtn);
    }

    wrapper.appendChild(controls);
    return wrapper;
  },

  _renderSidebar(activePath) {
    const sidebar = document.createElement('aside');
    sidebar.className = 'sidebar';
    sidebar.setAttribute('role', 'navigation');
    sidebar.setAttribute('aria-label', 'Main navigation');

    const nav = document.createElement('nav');
    nav.className = 'nav';

    const items = [
      { path: '/dashboard', label: I18n.t('dashboard') },
      { path: '/tasks', label: I18n.t('tasks') },
      { path: '/projects', label: I18n.t('projects') },
      { path: '/orders', label: I18n.t('orders') }
    ];

    items.forEach(it => {
      const btn = document.createElement('button');
      btn.textContent = it.label;
      btn.setAttribute('aria-label', it.label);
      if (activePath.startsWith(it.path)) {
        btn.classList.add('active');
        btn.setAttribute('aria-current', 'page');
      }
      btn.addEventListener('click', () => Router.navigate(it.path));
      nav.appendChild(btn);
    });

    sidebar.appendChild(nav);
    return sidebar;
  },

  _renderMobileMenu(activePath) {
    // Remove existing mobile menu if any
    const existing = document.querySelector('.mobile-menu-overlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.className = 'mobile-menu-overlay';
    overlay.setAttribute('aria-hidden', 'true');
    overlay.addEventListener('click', () => this._toggleMobileMenu());

    const menu = document.createElement('div');
    menu.className = 'mobile-menu';
    menu.setAttribute('role', 'dialog');
    menu.setAttribute('aria-label', I18n.t('menu'));

    const user = Auth.currentUser();
    if (user) {
      // User section
      const userSection = document.createElement('div');
      userSection.className = 'mobile-menu-user';
      const avatar = document.createElement('div');
      avatar.className = 'user-avatar mx-auto mb-2';
      avatar.style.width = '48px';
      avatar.style.height = '48px';
      avatar.style.fontSize = '1rem';
      avatar.textContent = user.displayName
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .substring(0, 2);
      userSection.appendChild(avatar);

      const userName = document.createElement('div');
      userName.className = 'text-center font-semibold';
      userName.textContent = user.displayName;
      userSection.appendChild(userName);

      const userRole = document.createElement('div');
      userRole.className = 'text-center text-sm opacity-90 mt-1';
      userRole.textContent = user.role;
      userSection.appendChild(userRole);

      menu.appendChild(userSection);
    }

    // Navigation
    const navSection = document.createElement('div');
    navSection.className = 'mobile-menu-nav';

    const items = [
      { path: '/dashboard', label: I18n.t('dashboard') },
      { path: '/tasks', label: I18n.t('tasks') },
      { path: '/projects', label: I18n.t('projects') },
      { path: '/orders', label: I18n.t('orders') }
    ];

    items.forEach(it => {
      const btn = document.createElement('button');
      btn.textContent = it.label;
      btn.className = 'nav button';
      if (activePath.startsWith(it.path)) {
        btn.classList.add('active');
      }
      btn.addEventListener('click', () => {
        Router.navigate(it.path);
        this._toggleMobileMenu();
      });
      const btnWrapper = document.createElement('div');
      btnWrapper.appendChild(btn);
      navSection.appendChild(btnWrapper);
    });

    menu.appendChild(navSection);

    // Footer with language selector and logout
    const footer = document.createElement('div');
    footer.className = 'mobile-menu-footer';

    const langSection = document.createElement('div');
    langSection.className = 'flex items-center justify-between mb-3';
    const langLabel = document.createElement('span');
    langLabel.className = 'text-sm text-gray-600';
    langLabel.textContent = I18n.t('language');
    langSection.appendChild(langLabel);

    const langSelect = document.createElement('select');
    langSelect.className = 'lang-selector';
    langSelect.innerHTML = `
      <option value="en">English</option>
      <option value="he">עברית</option>
    `;
    langSelect.value = I18n.lang();
    langSelect.addEventListener('change', (e) => {
      I18n.set(e.target.value);
    });
    langSection.appendChild(langSelect);
    footer.appendChild(langSection);

    const logoutBtn = document.createElement('button');
    logoutBtn.className = 'btn danger w-full';
    logoutBtn.textContent = I18n.t('logout');
    logoutBtn.addEventListener('click', () => {
      Auth.logout();
      Router.navigate('/login');
    });
    footer.appendChild(logoutBtn);

    menu.appendChild(footer);
    overlay.appendChild(menu);
    document.body.appendChild(overlay);

    // Keyboard handler
    document.addEventListener('keydown', this._handleMenuEscape);
  },

  _toggleMobileMenu() {
    const overlay = document.querySelector('.mobile-menu-overlay');
    const menu = document.querySelector('.mobile-menu');
    if (!overlay || !menu) return;

    this.mobileMenuOpen = !this.mobileMenuOpen;
    overlay.classList.toggle('open', this.mobileMenuOpen);
    menu.classList.toggle('open', this.mobileMenuOpen);
    overlay.setAttribute('aria-hidden', !this.mobileMenuOpen);

    if (!this.mobileMenuOpen) {
      document.removeEventListener('keydown', this._handleMenuEscape);
    }
  },

  _handleMenuEscape(e) {
    if (e.key === 'Escape') {
      const overlay = document.querySelector('.mobile-menu-overlay');
      if (overlay && overlay.classList.contains('open')) {
        UI._toggleMobileMenu();
      }
    }
  },

  // ==================== CONTENT RENDERERS ====================
  _renderDashboard(container) {
    container.innerHTML = '';
    const card = document.createElement('div');
    card.className = 'card';

    const header = document.createElement('div');
    header.className = 'header';
    const headerTitle = document.createElement('div');
    headerTitle.className = 'h-title';
    headerTitle.textContent = I18n.t('dashboard');
    header.appendChild(headerTitle);
    card.appendChild(header);

    // Summary
    const summary = document.createElement('div');
    summary.className = 'grid grid-cols-1 md:grid-cols-2 gap-4 mb-6';
    const openTasksCount = Storage.tasks().filter(t => t.status !== 'done').length;
    const ordersCount = Storage.orders().length;

    summary.innerHTML = `
      <div class="accent-bg">
        <strong>${I18n.t('openTasks')}</strong>
        <div class="text-2xl font-bold mt-1">${openTasksCount}</div>
      </div>
      <div class="accent-bg">
        <strong>${I18n.t('orders')}</strong>
        <div class="text-2xl font-bold mt-1">${ordersCount}</div>
      </div>
    `;
    card.appendChild(summary);

    // Recent tasks and orders
    const grid = document.createElement('div');
    grid.className = 'grid grid-cols-1 md:grid-cols-2 gap-6';

    // Tasks
    const tasksCol = document.createElement('div');
    const tasksHeader = document.createElement('h3');
    tasksHeader.className = 'font-semibold mb-3';
    tasksHeader.textContent = I18n.t('recentTasks');
    tasksCol.appendChild(tasksHeader);

    const tasks = Storage.tasks().slice().reverse().slice(0, 5);
    tasks.forEach(t => {
      const el = document.createElement('div');
      el.className = 'task-card';
      el.innerHTML = `
        <div class="flex-1">
          <strong>${t.title}</strong>
          <div class="small">${t.description || ''}</div>
        </div>
        <div class="text-right">
          <div class="small">${I18n.t('planned')}: ${t.plannedHours || 0}h</div>
          <div class="mt-2"><button class="btn secondary" data-id="${t.id}">${I18n.t('open')}</button></div>
        </div>
      `;
      tasksCol.appendChild(el);
    });

    // Orders
    const ordersCol = document.createElement('div');
    const ordersHeader = document.createElement('h3');
    ordersHeader.className = 'font-semibold mb-3';
    ordersHeader.textContent = I18n.t('recentOrders');
    ordersCol.appendChild(ordersHeader);

    const orders = Storage.orders().slice().reverse().slice(0, 5);
    if (orders.length === 0) {
      const noOrders = document.createElement('div');
      noOrders.className = 'small';
      noOrders.textContent = I18n.t('noOrders');
      ordersCol.appendChild(noOrders);
    } else {
      orders.forEach(o => {
        const el = document.createElement('div');
        el.className = 'task-card';
        el.innerHTML = `
          <div class="flex-1">
            <strong>${o.title}</strong>
            <div class="small">${o.description || ''}</div>
          </div>
          <div class="text-right">
            <div class="small">${o.status}</div>
            <div class="mt-2"><button class="btn ghost" data-id="${o.id}">${I18n.t('view')}</button></div>
          </div>
        `;
        ordersCol.appendChild(el);
      });
    }

    grid.appendChild(tasksCol);
    grid.appendChild(ordersCol);
    card.appendChild(grid);
    container.appendChild(card);

    // Event handlers
    card.querySelectorAll('.task-card button[data-id]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const task = Storage.tasks().find(t => t.id === id);
        if (task) this._openTaskModal(task.id);
      });
    });
  },

  _renderTasks(container) {
    container.innerHTML = '';
    const card = document.createElement('div');
    card.className = 'card';

    const header = document.createElement('div');
    header.className = 'header';
    const headerTitle = document.createElement('div');
    headerTitle.className = 'h-title';
    headerTitle.textContent = I18n.t('tasks');
    header.appendChild(headerTitle);

    const newBtn = document.createElement('button');
    newBtn.className = 'btn';
    newBtn.id = 'btn-new-task';
    newBtn.textContent = I18n.t('newTask');
    header.appendChild(newBtn);
    card.appendChild(header);

    const list = document.createElement('div');
    list.className = 'grid gap-3';
    const tasks = Storage.tasks();
    tasks.forEach(t => {
      const el = document.createElement('div');
      el.className = 'task-card';
      el.innerHTML = `
        <div class="flex-1">
          <strong>${t.title}</strong>
          <div class="small">${t.description || ''}</div>
        </div>
        <div class="text-right">
          <div class="small">${I18n.t('planned')}: ${t.plannedHours || 0}h</div>
          <div class="mt-2"><button class="btn secondary" data-id="${t.id}">${I18n.t('open')}</button></div>
        </div>
      `;
      list.appendChild(el);
    });
    card.appendChild(list);
    container.appendChild(card);

    // Event handlers
    newBtn.addEventListener('click', () => this._openTaskModal());
    list.querySelectorAll('button[data-id]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        this._openTaskModal(id);
      });
    });
  },

  _openTaskModal(taskId = null) {
    const task = taskId ? Storage.tasks().find(t => t.id === taskId) : null;
    const modalBg = document.createElement('div');
    modalBg.className = 'modal-backdrop';
    modalBg.setAttribute('role', 'dialog');
    modalBg.setAttribute('aria-modal', 'true');

    const modal = document.createElement('div');
    modal.className = 'modal';

    const header = document.createElement('div');
    header.className = 'header';
    const headerTitle = document.createElement('div');
    headerTitle.className = 'h-title';
    headerTitle.textContent = task ? task.title : I18n.t('createTask');
    header.appendChild(headerTitle);
    modal.appendChild(header);

    const form = document.createElement('div');
    form.className = 'flex flex-col gap-3';

    const titleInput = document.createElement('input');
    titleInput.className = 'input';
    titleInput.id = 't-title';
    titleInput.placeholder = I18n.t('title');
    titleInput.value = task ? task.title : '';
    form.appendChild(titleInput);

    const descTextarea = document.createElement('textarea');
    descTextarea.className = 'input';
    descTextarea.id = 't-desc';
    descTextarea.placeholder = I18n.t('description');
    descTextarea.rows = 3;
    descTextarea.textContent = task ? task.description : '';
    form.appendChild(descTextarea);

    const hoursInput = document.createElement('input');
    hoursInput.className = 'input';
    hoursInput.id = 't-planned';
    hoursInput.type = 'number';
    hoursInput.placeholder = I18n.t('plannedHours');
    hoursInput.value = task ? task.plannedHours || '' : '';
    form.appendChild(hoursInput);

    const assigneeSelect = document.createElement('select');
    assigneeSelect.className = 'input';
    assigneeSelect.id = 't-assignees';
    assigneeSelect.multiple = true;
    assigneeSelect.style.height = '80px';
    Storage.users().forEach(u => {
      const opt = document.createElement('option');
      opt.value = u.username;
      opt.textContent = `${u.displayName} • ${u.role}`;
      if (task && task.assignees && task.assignees.includes(u.username)) {
        opt.selected = true;
      }
      assigneeSelect.appendChild(opt);
    });
    form.appendChild(assigneeSelect);

    const btnRow = document.createElement('div');
    btnRow.className = 'flex justify-end gap-2 mt-2';

    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'btn ghost';
    cancelBtn.textContent = I18n.t('cancel');
    cancelBtn.addEventListener('click', () => modalBg.remove());
    btnRow.appendChild(cancelBtn);

    const saveBtn = document.createElement('button');
    saveBtn.className = 'btn';
    saveBtn.textContent = I18n.t('save');
    saveBtn.addEventListener('click', () => {
      const title = titleInput.value.trim();
      const desc = descTextarea.value.trim();
      const planned = Number(hoursInput.value) || 0;
      const assignees = Array.from(assigneeSelect.selectedOptions).map(o => o.value);

      if (!title) {
        alert(I18n.t('titleRequired'));
        return;
      }

      if (task) {
        Storage.updateTask(task.id, { title, description: desc, plannedHours: planned, assignees });
      } else {
        const newTask = {
          id: Utils.uuid(),
          projectId: null,
          title,
          description: desc,
          images: [],
          plannedHours: planned,
          assignees,
          status: assignees.length ? 'in progress' : 'unassigned',
          timeLog: [{ type: 'plan', by: 'system', hours: planned, at: Utils.nowIso() }],
          createdAt: Utils.nowIso()
        };
        Storage.addTask(newTask);
      }
      modalBg.remove();
      Router.navigate('/tasks');
    });
    btnRow.appendChild(saveBtn);
    form.appendChild(btnRow);

    modal.appendChild(form);
    modalBg.appendChild(modal);
    document.body.appendChild(modalBg);

    // Keyboard handlers
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        modalBg.remove();
        document.removeEventListener('keydown', handleEscape);
      }
    };
    document.addEventListener('keydown', handleEscape);

    // Close on backdrop click
    modalBg.addEventListener('click', (e) => {
      if (e.target === modalBg) {
        modalBg.remove();
        document.removeEventListener('keydown', handleEscape);
      }
    });

    // Focus first input
    setTimeout(() => titleInput.focus(), 100);
  },

  _renderOrders(container) {
    container.innerHTML = '';
    const card = document.createElement('div');
    card.className = 'card';

    const header = document.createElement('div');
    header.className = 'header';
    const headerTitle = document.createElement('div');
    headerTitle.className = 'h-title';
    headerTitle.textContent = I18n.t('orders');
    header.appendChild(headerTitle);

    const newBtn = document.createElement('button');
    newBtn.className = 'btn';
    newBtn.id = 'btn-new-order';
    newBtn.textContent = I18n.t('createOrder');
    header.appendChild(newBtn);
    card.appendChild(header);

    const list = document.createElement('div');
    list.className = 'grid gap-3';

    const orders = Storage.orders().slice().reverse();
    orders.forEach(o => {
      const el = document.createElement('div');
      el.className = 'task-card';
      el.innerHTML = `
        <div class="flex-1">
          <strong>${o.title}</strong>
          <div class="small">${o.description || ''}</div>
        </div>
        <div class="text-right">
          <div class="small">${o.status}</div>
          <div class="mt-2"><button class="btn ghost" data-id="${o.id}">${I18n.t('view')}</button></div>
        </div>
      `;
      list.appendChild(el);
    });
    card.appendChild(list);
    container.appendChild(card);

    // Event handlers
    newBtn.addEventListener('click', () => this._openOrderModal());
  },

  _openOrderModal() {
    const modalBg = document.createElement('div');
    modalBg.className = 'modal-backdrop';
    modalBg.setAttribute('role', 'dialog');
    modalBg.setAttribute('aria-modal', 'true');

    const modal = document.createElement('div');
    modal.className = 'modal';

    const header = document.createElement('div');
    header.className = 'header';
    const headerTitle = document.createElement('div');
    headerTitle.className = 'h-title';
    headerTitle.textContent = I18n.t('createOrder');
    header.appendChild(headerTitle);
    modal.appendChild(header);

    const form = document.createElement('div');
    form.className = 'flex flex-col gap-3';

    const titleInput = document.createElement('input');
    titleInput.className = 'input';
    titleInput.id = 'o-title';
    titleInput.placeholder = I18n.t('title');
    form.appendChild(titleInput);

    const descTextarea = document.createElement('textarea');
    descTextarea.className = 'input';
    descTextarea.id = 'o-desc';
    descTextarea.placeholder = I18n.t('description');
    descTextarea.rows = 3;
    form.appendChild(descTextarea);

    const btnRow = document.createElement('div');
    btnRow.className = 'flex justify-end gap-2 mt-2';

    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'btn ghost';
    cancelBtn.textContent = I18n.t('cancel');
    cancelBtn.addEventListener('click', () => modalBg.remove());
    btnRow.appendChild(cancelBtn);

    const createBtn = document.createElement('button');
    createBtn.className = 'btn';
    createBtn.textContent = I18n.t('create');
    createBtn.addEventListener('click', () => {
      const title = titleInput.value.trim();
      const desc = descTextarea.value.trim();

      if (!title) {
        alert(I18n.t('titleRequired'));
        return;
      }

      const me = Auth.currentUser();
      const order = {
        id: Utils.uuid(),
        title,
        description: desc,
        date: Utils.nowIso(),
        status: I18n.t('requested'),
        requestedBy: me.username
      };
      Storage.addOrder(order);
      modalBg.remove();
      Router.navigate('/orders');
    });
    btnRow.appendChild(createBtn);
    form.appendChild(btnRow);

    modal.appendChild(form);
    modalBg.appendChild(modal);
    document.body.appendChild(modalBg);

    // Keyboard handlers
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        modalBg.remove();
        document.removeEventListener('keydown', handleEscape);
      }
    };
    document.addEventListener('keydown', handleEscape);

    // Close on backdrop click
    modalBg.addEventListener('click', (e) => {
      if (e.target === modalBg) {
        modalBg.remove();
        document.removeEventListener('keydown', handleEscape);
      }
    });

    // Focus first input
    setTimeout(() => titleInput.focus(), 100);
  },

  _renderProjects(container) {
    container.innerHTML = '';
    const card = document.createElement('div');
    card.className = 'card';
    const header = document.createElement('div');
    header.className = 'header';
    const headerTitle = document.createElement('div');
    headerTitle.className = 'h-title';
    headerTitle.textContent = I18n.t('projects');
    header.appendChild(headerTitle);
    card.appendChild(header);

    const content = document.createElement('div');
    content.className = 'small';
    content.textContent = 'Project management (to be completed)';
    card.appendChild(content);
    container.appendChild(card);
  }
};
