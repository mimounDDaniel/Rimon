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
    } else if (path.startsWith('/my-tasks')) {
      this._renderTasks(content, 'my');
    } else if (path.startsWith('/all-tasks')) {
      this._renderTasks(content, 'all');
    } else if (path.startsWith('/my-orders')) {
      this._renderOrders(content, 'my');
    } else if (path.startsWith('/all-orders')) {
      this._renderOrders(content, 'all');
    } else if (path.startsWith('/projects')) {
      this._renderProjects(content);
    } else if (path.startsWith('/users')) {
      this._renderUsers(content);
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
      <option value="en">🇺🇸 English</option>
      <option value="he">🇮🇱 עברית</option>
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

    // Brand (logo only, no title)
    const brand = document.createElement('div');
    brand.className = 'brand';
    const img = document.createElement('img');
    img.src = 'assets/logo.png';
    img.alt = I18n.t('appName');
    brand.appendChild(img);
    leftSide.appendChild(brand);

    wrapper.appendChild(leftSide);

    // Right side: language selector + user info + logout
    const controls = document.createElement('div');
    controls.className = 'controls';

    // Language selector (with flag emojis)
    const langSelect = document.createElement('select');
    langSelect.className = 'lang-selector';
    langSelect.setAttribute('aria-label', I18n.t('selectLanguage'));
    langSelect.innerHTML = `
      <option value="en">🇺🇸 EN</option>
      <option value="he">🇮🇱 HE</option>
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

    const me = Auth.currentUser();
    const items = [
      { path: '/dashboard', label: I18n.t('dashboard'), roles: ['admin', 'mini_admin', 'employee', 'orders_manager'] },
      // Tasks menu items
      { path: '/my-tasks', label: I18n.t('myTasks'), roles: ['admin', 'mini_admin', 'employee'] },
      { path: '/all-tasks', label: I18n.t('allTasks'), roles: ['admin', 'mini_admin'] },
      { path: '/projects', label: I18n.t('projects'), roles: ['admin', 'mini_admin', 'employee'] },
      // Orders menu items
      { path: '/my-orders', label: I18n.t('myOrders'), roles: ['admin', 'mini_admin', 'employee', 'orders_manager'] },
      { path: '/all-orders', label: I18n.t('allOrders'), roles: ['admin', 'mini_admin', 'orders_manager'] },
      { path: '/users', label: I18n.t('users'), roles: ['admin', 'mini_admin'] }
    ];

    items.forEach(it => {
      if (!it.roles.includes(me.role)) return;
      
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

    const me = Auth.currentUser();
    const items = [
      { path: '/dashboard', label: I18n.t('dashboard'), roles: ['admin', 'mini_admin', 'employee', 'orders_manager'] },
      // Tasks menu items
      { path: '/my-tasks', label: I18n.t('myTasks'), roles: ['admin', 'mini_admin', 'employee'] },
      { path: '/all-tasks', label: I18n.t('allTasks'), roles: ['admin', 'mini_admin'] },
      { path: '/projects', label: I18n.t('projects'), roles: ['admin', 'mini_admin', 'employee'] },
      // Orders menu items
      { path: '/my-orders', label: I18n.t('myOrders'), roles: ['admin', 'mini_admin', 'employee', 'orders_manager'] },
      { path: '/all-orders', label: I18n.t('allOrders'), roles: ['admin', 'mini_admin', 'orders_manager'] },
      { path: '/users', label: I18n.t('users'), roles: ['admin', 'mini_admin'] }
    ];

    items.forEach(it => {
      if (!it.roles.includes(me.role)) return;
      
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
      <option value="en">🇺🇸</option>
      <option value="he">🇮🇱</option>
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

    // Tasks (filtered by role)
    const tasksCol = document.createElement('div');
    const tasksHeader = document.createElement('h3');
    tasksHeader.className = 'font-semibold mb-3';
    tasksHeader.textContent = I18n.t('recentTasks');
    tasksCol.appendChild(tasksHeader);

    const me = Auth.currentUser();
    let allTasks = Storage.tasks();
    
    // Filter tasks based on role
    if (me.role === 'employee') {
      // Employees only see tasks assigned to them
      allTasks = allTasks.filter(t => t.assignees && t.assignees.includes(me.username));
    } else if (me.role === 'orders_manager') {
      // Orders managers don't see tasks
      allTasks = [];
    }
    // admin and mini_admin see all tasks
    
    const tasks = allTasks.slice().reverse().slice(0, 5);
    
    if (tasks.length === 0) {
      const noTasks = document.createElement('div');
      noTasks.className = 'small';
      noTasks.textContent = 'No tasks';
      tasksCol.appendChild(noTasks);
    } else {
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
    }

    // Orders
    const ordersCol = document.createElement('div');
    const ordersHeader = document.createElement('h3');
    ordersHeader.className = 'font-semibold mb-3';
    ordersHeader.textContent = I18n.t('recentOrders');
    ordersCol.appendChild(ordersHeader);

    let allOrders = Storage.orders();
    
    // Filter orders based on role
    if (me.role === 'employee') {
      // Employees only see their own orders
      allOrders = allOrders.filter(o => o.requestedBy === me.username);
    }
    // admin, mini_admin, and orders_manager see all orders
    
    const orders = allOrders.slice().reverse().slice(0, 5);
    if (orders.length === 0) {
      const noOrders = document.createElement('div');
      noOrders.className = 'small';
      noOrders.textContent = I18n.t('noOrders');
      ordersCol.appendChild(noOrders);
    } else {
      orders.forEach(o => {
        const el = document.createElement('div');
        el.className = 'task-card';
        const urgentBadge = o.isUrgent ? `<span class="badge badge-urgent">🔥 ${I18n.t('urgent')}</span>` : '';
        el.innerHTML = `
          <div class="flex-1">
            <strong>${o.title}</strong> ${urgentBadge}
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

  _renderTasks(container, view = 'my') {
    container.innerHTML = '';
    const me = Auth.currentUser();
    
    // Don't show tasks page for orders_manager
    if (me.role === 'orders_manager') {
      container.innerHTML = '<div class="card"><div class="h-title">Access Denied</div><div class="small">Your role does not have access to tasks.</div></div>';
      return;
    }
    
    const card = document.createElement('div');
    card.className = 'card';

    const header = document.createElement('div');
    header.className = 'header';
    const headerTitle = document.createElement('div');
    headerTitle.className = 'h-title';
    headerTitle.textContent = view === 'all' ? I18n.t('allTasks') : I18n.t('myTasks');
    header.appendChild(headerTitle);

    const newBtn = document.createElement('button');
    newBtn.className = 'btn';
    newBtn.id = 'btn-new-task';
    newBtn.textContent = I18n.t('newTask');
    // Only admins and mini_admins can create new tasks
    if (me.role === 'admin' || me.role === 'mini_admin') {
      header.appendChild(newBtn);
    }
    card.appendChild(header);

    // Add filters section for admins in 'all' view
    if (view === 'all' && (me.role === 'admin' || me.role === 'mini_admin')) {
      const filtersDiv = document.createElement('div');
      filtersDiv.className = 'filters-section';
      filtersDiv.style.cssText = 'display: flex; gap: 1rem; padding: 1rem; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px; margin-bottom: 1rem; flex-wrap: wrap;';
      
      // Status filter
      const statusFilter = document.createElement('select');
      statusFilter.className = 'input';
      statusFilter.id = 'status-filter';
      statusFilter.style.cssText = 'flex: 1; min-width: 200px; background: white;';
      statusFilter.innerHTML = `
        <option value="">${I18n.t('allStatuses')}</option>
        <option value="undefined">${I18n.t('undefined')}</option>
        <option value="unassigned">${I18n.t('unassigned')}</option>
        <option value="assigned">${I18n.t('assigned')}</option>
        <option value="in progress">${I18n.t('inProgress')}</option>
        <option value="completed">${I18n.t('completed')}</option>
        <option value="refused">${I18n.t('refused')}</option>
        <option value="cancelled">${I18n.t('cancelled')}</option>
      `;
      filtersDiv.appendChild(statusFilter);
      
      // Project filter
      const projectFilter = document.createElement('select');
      projectFilter.className = 'input';
      projectFilter.id = 'project-filter';
      projectFilter.style.cssText = 'flex: 1; min-width: 200px; background: white;';
      const projects = Storage.projects();
      projectFilter.innerHTML = `<option value="">${I18n.t('allProjects')}</option>` +
        projects.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
      filtersDiv.appendChild(projectFilter);
      
      card.appendChild(filtersDiv);
    }

    const list = document.createElement('div');
    list.className = 'grid gap-3';
    list.id = 'tasks-list';
    
    const renderTaskList = () => {
      list.innerHTML = '';
      let allTasks = Storage.tasks();
      
      // Filter tasks based on view and role
      if (view === 'my') {
        // Show only tasks assigned to current user
        allTasks = allTasks.filter(t => t.assignees && t.assignees.includes(me.username));
      } else if (view === 'all') {
        // Only admins and mini_admins can see all tasks
        if (me.role !== 'admin' && me.role !== 'mini_admin') {
          container.innerHTML = `<div class="card"><div class="h-title">${I18n.t('accessDenied')}</div><div class="small">${I18n.t('noAccessToAllTasks')}</div></div>`;
          return;
        }
        // Apply filters
        const statusFilter = document.getElementById('status-filter');
        const projectFilter = document.getElementById('project-filter');
        if (statusFilter && statusFilter.value) {
          allTasks = allTasks.filter(t => t.status === statusFilter.value);
        }
        if (projectFilter && projectFilter.value) {
          allTasks = allTasks.filter(t => t.projectId === projectFilter.value);
        }
      }
      
      allTasks.forEach(t => {
        const project = Storage.projects().find(p => p.id === t.projectId);
        const statusBadge = this._getStatusBadge(t.status);
        const el = document.createElement('div');
        el.className = 'task-card';
        el.style.cssText = 'transition: transform 0.2s, box-shadow 0.2s;';
        el.innerHTML = `
          <div class="flex-1">
            <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
              <strong style="font-size: 1.1rem;">${t.title}</strong>
              ${statusBadge}
            </div>
            <div class="small" style="color: #666; margin-bottom: 0.25rem;">${t.description || ''}</div>
            ${project ? `<div class="small" style="color: #764ba2; font-weight: 600;">📁 ${project.name}</div>` : ''}
          </div>
          <div class="text-right">
            <div class="small">${I18n.t('planned')}: ${t.plannedHours || 0}h</div>
            <div class="mt-2"><button class="btn secondary" data-id="${t.id}">${I18n.t('open')}</button></div>
          </div>
        `;
        el.addEventListener('mouseenter', () => {
          el.style.transform = 'translateY(-2px)';
          el.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
        });
        el.addEventListener('mouseleave', () => {
          el.style.transform = 'translateY(0)';
          el.style.boxShadow = '';
        });
        list.appendChild(el);
      });
      
      // Re-attach event handlers
      list.querySelectorAll('button[data-id]').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-id');
          this._openTaskModal(id);
        });
      });
    };
    
    renderTaskList();
    card.appendChild(list);
    container.appendChild(card);

    // Event handlers
    if (me.role === 'admin' || me.role === 'mini_admin') {
      newBtn.addEventListener('click', () => this._openTaskModal());
    }
    
    // Filter change handlers
    const statusFilter = document.getElementById('status-filter');
    const projectFilter = document.getElementById('project-filter');
    if (statusFilter) {
      statusFilter.addEventListener('change', renderTaskList);
    }
    if (projectFilter) {
      projectFilter.addEventListener('change', renderTaskList);
    }
  },
  
  _getStatusBadge(status) {
    const statusColors = {
      'undefined': 'background: #94a3b8; color: white;',
      'unassigned': 'background: #e2e8f0; color: #475569;',
      'assigned': 'background: #3b82f6; color: white;',
      'in progress': 'background: #f59e0b; color: white;',
      'completed': 'background: #10b981; color: white;',
      'refused': 'background: #ef4444; color: white;',
      'cancelled': 'background: #6b7280; color: white;'
    };
    // Default to unassigned if status is null/undefined
    const style = statusColors[status] || statusColors['unassigned'];
    // Handle status translation - replace all spaces with empty string for translation key
    const translationKey = (status || 'unassigned').replace(/\s+/g, '');
    const label = I18n.t(translationKey) || status;
    return `<span style="padding: 0.25rem 0.75rem; border-radius: 12px; font-size: 0.75rem; font-weight: 600; ${style}">${label}</span>`;
  },

  _openTaskModal(taskId = null) {
    const me = Auth.currentUser();
    const task = taskId ? Storage.tasks().find(t => t.id === taskId) : null;
    const isEmployee = me.role === 'employee';
    const canEdit = !isEmployee || !task; // Employees can't edit existing tasks
    
    const modalBg = document.createElement('div');
    modalBg.className = 'modal-backdrop';
    modalBg.setAttribute('role', 'dialog');
    modalBg.setAttribute('aria-modal', 'true');

    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.maxWidth = '700px';
    modal.style.maxHeight = '90vh';
    modal.style.overflowY = 'auto';

    const header = document.createElement('div');
    header.className = 'header';
    const headerTitle = document.createElement('div');
    headerTitle.className = 'h-title';
    headerTitle.textContent = task ? task.title : I18n.t('createTask');
    header.appendChild(headerTitle);
    modal.appendChild(header);

    const form = document.createElement('div');
    form.className = 'flex flex-col gap-3';
    
    // Show read-only notice for employees
    if (task && isEmployee) {
      const notice = document.createElement('div');
      notice.style.cssText = 'padding: 0.75rem; background: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 4px; margin-bottom: 1rem;';
      notice.innerHTML = `<small style="color: #92400e;">ℹ️ ${I18n.t('taskReadOnly')}</small>`;
      form.appendChild(notice);
    }

    // Project selector (admins only, or when creating)
    if (!isEmployee || !task) {
      const projectSelect = document.createElement('select');
      projectSelect.className = 'input';
      projectSelect.id = 't-project';
      projectSelect.disabled = task && isEmployee;
      const projects = Storage.projects();
      projectSelect.innerHTML = `<option value="">${I18n.t('selectProject')}</option>` +
        projects.map(p => `<option value="${p.id}" ${task && task.projectId === p.id ? 'selected' : ''}>${p.name}</option>`).join('');
      form.appendChild(projectSelect);
    } else if (task && task.projectId) {
      const project = Storage.projects().find(p => p.id === task.projectId);
      if (project) {
        const projectInfo = document.createElement('div');
        projectInfo.style.cssText = 'padding: 0.5rem; background: #f3f4f6; border-radius: 4px; color: #764ba2; font-weight: 600;';
        projectInfo.innerHTML = `📁 ${I18n.t('projectName')}: ${project.name}`;
        form.appendChild(projectInfo);
      }
    }

    const titleInput = document.createElement('input');
    titleInput.className = 'input';
    titleInput.id = 't-title';
    titleInput.placeholder = I18n.t('title');
    titleInput.value = task ? task.title : '';
    titleInput.disabled = task && isEmployee;
    form.appendChild(titleInput);

    const descTextarea = document.createElement('textarea');
    descTextarea.className = 'input';
    descTextarea.id = 't-desc';
    descTextarea.placeholder = I18n.t('description');
    descTextarea.rows = 3;
    descTextarea.textContent = task ? task.description : '';
    descTextarea.disabled = task && isEmployee;
    form.appendChild(descTextarea);

    const hoursInput = document.createElement('input');
    hoursInput.className = 'input';
    hoursInput.id = 't-planned';
    hoursInput.type = 'number';
    hoursInput.placeholder = I18n.t('plannedHours');
    hoursInput.value = task ? task.plannedHours || '' : '';
    hoursInput.disabled = task && isEmployee;
    form.appendChild(hoursInput);

    const assigneeSelect = document.createElement('select');
    assigneeSelect.className = 'input';
    assigneeSelect.id = 't-assignees';
    assigneeSelect.multiple = true;
    assigneeSelect.style.height = '80px';
    assigneeSelect.disabled = task && isEmployee;
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
    
    // Status selector (employees can change status)
    if (task) {
      const statusSelect = document.createElement('select');
      statusSelect.className = 'input';
      statusSelect.id = 't-status';
      statusSelect.innerHTML = `
        <option value="undefined" ${task.status === 'undefined' ? 'selected' : ''}>${I18n.t('undefined')}</option>
        <option value="unassigned" ${task.status === 'unassigned' ? 'selected' : ''}>${I18n.t('unassigned')}</option>
        <option value="assigned" ${task.status === 'assigned' ? 'selected' : ''}>${I18n.t('assigned')}</option>
        <option value="in progress" ${task.status === 'in progress' ? 'selected' : ''}>${I18n.t('inProgress')}</option>
        <option value="completed" ${task.status === 'completed' ? 'selected' : ''}>${I18n.t('completed')}</option>
        <option value="refused" ${task.status === 'refused' ? 'selected' : ''}>${I18n.t('refused')}</option>
        <option value="cancelled" ${task.status === 'cancelled' ? 'selected' : ''}>${I18n.t('cancelled')}</option>
      `;
      const statusLabel = document.createElement('label');
      statusLabel.textContent = I18n.t('status') + ':';
      statusLabel.style.fontWeight = '600';
      form.appendChild(statusLabel);
      form.appendChild(statusSelect);
    }
    
    // Comments section for existing tasks
    if (task) {
      const commentsSection = document.createElement('div');
      commentsSection.style.cssText = 'border-top: 2px solid #e5e7eb; padding-top: 1rem; margin-top: 1rem;';
      
      const commentsTitle = document.createElement('h3');
      commentsTitle.textContent = I18n.t('taskComments');
      commentsTitle.style.cssText = 'font-size: 1.1rem; font-weight: 700; margin-bottom: 0.75rem;';
      commentsSection.appendChild(commentsTitle);
      
      // Display existing comments
      if (task.comments && task.comments.length > 0) {
        const commentsList = document.createElement('div');
        commentsList.style.cssText = 'max-height: 200px; overflow-y: auto; margin-bottom: 1rem; background: #f9fafb; padding: 0.75rem; border-radius: 8px;';
        task.comments.forEach(c => {
          const commentDiv = document.createElement('div');
          commentDiv.style.cssText = 'margin-bottom: 0.75rem; padding: 0.5rem; background: white; border-radius: 6px; border-left: 3px solid #667eea;';
          commentDiv.innerHTML = `
            <div style="font-weight: 600; color: #4f46e5; margin-bottom: 0.25rem;">${c.by}</div>
            <div style="font-size: 0.875rem; color: #374151;">${c.text}</div>
            <div style="font-size: 0.75rem; color: #9ca3af; margin-top: 0.25rem;">${new Date(c.at).toLocaleString()}</div>
          `;
          commentsList.appendChild(commentDiv);
        });
        commentsSection.appendChild(commentsList);
      }
      
      // Add comment input
      const commentInput = document.createElement('textarea');
      commentInput.className = 'input';
      commentInput.id = 't-comment';
      commentInput.placeholder = I18n.t('addComment');
      commentInput.rows = 2;
      commentsSection.appendChild(commentInput);
      
      form.appendChild(commentsSection);
    }

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
    saveBtn.style.cssText = 'background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); transition: transform 0.2s;';
    saveBtn.addEventListener('mouseenter', () => saveBtn.style.transform = 'scale(1.05)');
    saveBtn.addEventListener('mouseleave', () => saveBtn.style.transform = 'scale(1)');
    saveBtn.addEventListener('click', () => {
      const title = titleInput.value.trim();
      const desc = descTextarea.value.trim();
      const planned = Number(hoursInput.value) || 0;
      const assignees = Array.from(assigneeSelect.selectedOptions).map(o => o.value);
      const projectId = document.getElementById('t-project')?.value || (task ? task.projectId : null);
      const status = document.getElementById('t-status')?.value || 'unassigned';
      const commentText = document.getElementById('t-comment')?.value.trim();

      if (!task && !title) {
        alert(I18n.t('titleRequired'));
        return;
      }

      if (task) {
        const updates = {};
        
        // Admins can update everything
        if (!isEmployee) {
          updates.title = title;
          updates.description = desc;
          updates.plannedHours = planned;
          updates.assignees = assignees;
          updates.projectId = projectId;
        }
        
        // Everyone can update status
        if (status !== task.status) {
          updates.status = status;
          // Add status change to comments
          if (!task.comments) task.comments = [];
          updates.comments = [...task.comments, {
            by: me.username,
            text: `${I18n.t('statusChange')}: ${I18n.t(task.status.replace(' ', ''))} → ${I18n.t(status.replace(' ', ''))}`,
            at: Utils.nowIso()
          }];
        }
        
        // Add new comment if provided
        if (commentText) {
          if (!updates.comments) {
            updates.comments = task.comments ? [...task.comments] : [];
          }
          updates.comments.push({
            by: me.username,
            text: commentText,
            at: Utils.nowIso()
          });
        }
        
        Storage.updateTask(task.id, updates);
      } else {
        const newTask = {
          id: Utils.uuid(),
          projectId: projectId || null,
          title,
          description: desc,
          images: [],
          plannedHours: planned,
          assignees,
          status: assignees.length ? 'assigned' : 'undefined',
          timeLog: [{ type: 'plan', by: me.username, hours: planned, at: Utils.nowIso() }],
          comments: [],
          createdAt: Utils.nowIso()
        };
        Storage.addTask(newTask);
      }
      modalBg.remove();
      // Refresh current view by re-navigating to current route
      const currentPath = window.location.hash.substring(1);
      Router.navigate(currentPath || '/dashboard');
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

  _renderOrders(container, view = 'my') {
    container.innerHTML = '';
    const me = Auth.currentUser();
    
    const card = document.createElement('div');
    card.className = 'card';

    const header = document.createElement('div');
    header.className = 'header';
    const headerTitle = document.createElement('div');
    headerTitle.className = 'h-title';
    headerTitle.textContent = view === 'all' ? I18n.t('allOrders') : I18n.t('myOrders');
    header.appendChild(headerTitle);

    const newBtn = document.createElement('button');
    newBtn.className = 'btn';
    newBtn.id = 'btn-new-order';
    newBtn.textContent = I18n.t('createOrder');
    header.appendChild(newBtn);
    card.appendChild(header);

    const list = document.createElement('div');
    list.className = 'grid gap-3';

    let allOrders = Storage.orders();
    
    // Filter orders based on view and role
    if (view === 'my') {
      // Show only orders created by current user
      allOrders = allOrders.filter(o => o.requestedBy === me.username);
    } else if (view === 'all') {
      // Only admins, mini_admins, and orders_manager can see all orders
      if (me.role !== 'admin' && me.role !== 'mini_admin' && me.role !== 'orders_manager') {
        container.innerHTML = `<div class="card"><div class="h-title">${I18n.t('accessDenied')}</div><div class="small">${I18n.t('noAccessToAllOrders')}</div></div>`;
        return;
      }
      // Show all orders (no filtering)
    }
    
    const orders = allOrders.slice().reverse();
    orders.forEach(o => {
      const el = document.createElement('div');
      el.className = 'task-card';
      const urgentBadge = o.isUrgent ? `<span class="badge badge-urgent">🔥 ${I18n.t('urgent')}</span>` : '';
      const arrivalInfo = o.arrivalDate ? `<div class="text-xs text-gray-600">${I18n.t('arrivalDate')}: ${new Date(o.arrivalDate).toLocaleDateString()}</div>` : '';
      el.innerHTML = `
        <div class="flex-1">
          <strong>${o.title}</strong> ${urgentBadge}
          <div class="small">${o.description || ''}</div>
          ${arrivalInfo}
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
    list.querySelectorAll('button[data-id]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        this._openOrderModal(id);
      });
    });
  },

  _openOrderModal(orderId = null) {
    const order = orderId ? Storage.orders().find(o => o.id === orderId) : null;
    const me = Auth.currentUser();
    const isOrderManager = me.role === 'orders_manager' || me.role === 'admin' || me.role === 'mini_admin';
    
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
    headerTitle.textContent = order ? order.title : I18n.t('createOrder');
    header.appendChild(headerTitle);
    modal.appendChild(header);

    const form = document.createElement('div');
    form.className = 'flex flex-col gap-3';

    if (!order) {
      // Creating new order
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

      // Add urgent checkbox
      const urgentDiv = document.createElement('div');
      urgentDiv.className = 'flex items-center gap-2';
      const urgentCheckbox = document.createElement('input');
      urgentCheckbox.type = 'checkbox';
      urgentCheckbox.id = 'o-urgent';
      urgentCheckbox.className = 'checkbox';
      const urgentLabel = document.createElement('label');
      urgentLabel.htmlFor = 'o-urgent';
      urgentLabel.textContent = '🔥 ' + I18n.t('markAsUrgent');
      urgentDiv.appendChild(urgentCheckbox);
      urgentDiv.appendChild(urgentLabel);
      form.appendChild(urgentDiv);

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
        const isUrgent = urgentCheckbox.checked;

        if (!title) {
          alert(I18n.t('titleRequired'));
          return;
        }

        const order = {
          id: Utils.uuid(),
          title,
          description: desc,
          date: Utils.nowIso(),
          status: 'pending',
          requestedBy: me.username,
          isUrgent: isUrgent,
          arrivalDate: null,
          notes: ''
        };
        Storage.addOrder(order);
        modalBg.remove();
        // Refresh current page
        const currentPath = location.hash.replace('#', '') || '/';
        Router.navigate(currentPath);
      });
      btnRow.appendChild(createBtn);
      form.appendChild(btnRow);

      setTimeout(() => titleInput.focus(), 100);
    } else {
      // Viewing/Editing existing order
      const detailsDiv = document.createElement('div');
      detailsDiv.className = 'flex flex-col gap-2';
      
      detailsDiv.innerHTML = `
        <div><strong>${I18n.t('title')}:</strong> ${order.title}</div>
        <div><strong>${I18n.t('description')}:</strong> ${order.description || I18n.t('none')}</div>
        <div><strong>${I18n.t('requestedBy')}:</strong> ${order.requestedBy}</div>
        <div><strong>${I18n.t('date')}:</strong> ${new Date(order.date).toLocaleDateString()}</div>
        <div><strong>${I18n.t('urgent')}:</strong> ${order.isUrgent ? `🔥 ${I18n.t('yes')}` : I18n.t('no')}</div>
      `;
      form.appendChild(detailsDiv);

      if (isOrderManager) {
        // Order managers can edit status and arrival date
        const statusDiv = document.createElement('div');
        statusDiv.className = 'flex flex-col gap-1';
        const statusLabel = document.createElement('label');
        statusLabel.textContent = I18n.t('status');
        statusDiv.appendChild(statusLabel);
        
        const statusSelect = document.createElement('select');
        statusSelect.id = 'o-status';
        statusSelect.className = 'input';
        statusSelect.innerHTML = `
          <option value="pending">${I18n.t('pending')}</option>
          <option value="in_search">${I18n.t('inSearch')}</option>
          <option value="ordered">${I18n.t('ordered')}</option>
          <option value="in_progress">${I18n.t('inProgress')}</option>
          <option value="completed">${I18n.t('completed')}</option>
          <option value="refused">${I18n.t('refused')}</option>
          <option value="cancelled">${I18n.t('cancelled')}</option>
        `;
        statusSelect.value = order.status || 'pending';
        statusDiv.appendChild(statusSelect);
        form.appendChild(statusDiv);

        const arrivalDiv = document.createElement('div');
        arrivalDiv.className = 'flex flex-col gap-1';
        const arrivalLabel = document.createElement('label');
        arrivalLabel.textContent = I18n.t('arrivalDate');
        arrivalDiv.appendChild(arrivalLabel);
        
        const arrivalInput = document.createElement('input');
        arrivalInput.type = 'date';
        arrivalInput.id = 'o-arrival';
        arrivalInput.className = 'input';
        if (order.arrivalDate) {
          arrivalInput.value = order.arrivalDate.split('T')[0];
        }
        arrivalDiv.appendChild(arrivalInput);
        form.appendChild(arrivalDiv);

        const notesDiv = document.createElement('div');
        notesDiv.className = 'flex flex-col gap-1';
        const notesLabel = document.createElement('label');
        notesLabel.textContent = I18n.t('notes');
        notesDiv.appendChild(notesLabel);
        
        const notesTextarea = document.createElement('textarea');
        notesTextarea.id = 'o-notes';
        notesTextarea.className = 'input';
        notesTextarea.rows = 3;
        notesTextarea.value = order.notes || '';
        notesDiv.appendChild(notesTextarea);
        form.appendChild(notesDiv);

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
          const newStatus = statusSelect.value;
          const newArrival = arrivalInput.value ? new Date(arrivalInput.value).toISOString() : null;
          const newNotes = notesTextarea.value.trim();

          Storage.updateOrder(order.id, {
            status: newStatus,
            arrivalDate: newArrival,
            notes: newNotes
          });
          modalBg.remove();
          // Refresh current page
          const currentPath = location.hash.replace('#', '') || '/';
          Router.navigate(currentPath);
        });
        btnRow.appendChild(saveBtn);
        form.appendChild(btnRow);
      } else {
        // Regular users can only view
        const statusDiv = document.createElement('div');
        statusDiv.innerHTML = `<div><strong>${I18n.t('status')}:</strong> ${order.status}</div>`;
        if (order.arrivalDate) {
          statusDiv.innerHTML += `<div class="mt-2"><strong>${I18n.t('arrivalDate')}:</strong> ${new Date(order.arrivalDate).toLocaleDateString()}</div>`;
        }
        if (order.notes) {
          statusDiv.innerHTML += `<div class="mt-2"><strong>${I18n.t('notes')}:</strong> ${order.notes}</div>`;
        }
        form.appendChild(statusDiv);

        const btnRow = document.createElement('div');
        btnRow.className = 'flex justify-end gap-2 mt-2';

        const closeBtn = document.createElement('button');
        closeBtn.className = 'btn';
        closeBtn.textContent = I18n.t('close');
        closeBtn.addEventListener('click', () => modalBg.remove());
        btnRow.appendChild(closeBtn);
        form.appendChild(btnRow);
      }
    }

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
  },

  _renderUsers(container) {
    container.innerHTML = '';
    const me = Auth.currentUser();
    
    // Only admin and mini_admin can access
    if (!['admin', 'mini_admin'].includes(me.role)) {
      container.innerHTML = '<div class="card"><div class="h-title">Access Denied</div></div>';
      return;
    }
    
    const card = document.createElement('div');
    card.className = 'card';

    const header = document.createElement('div');
    header.className = 'header';
    const headerTitle = document.createElement('div');
    headerTitle.className = 'h-title';
    headerTitle.textContent = I18n.t('users');
    header.appendChild(headerTitle);

    const newBtn = document.createElement('button');
    newBtn.className = 'btn';
    newBtn.textContent = '+ New User';
    header.appendChild(newBtn);
    card.appendChild(header);

    const list = document.createElement('div');
    list.className = 'grid gap-3';
    
    const users = Storage.users();
    users.forEach(u => {
      const el = document.createElement('div');
      el.className = 'task-card';
      el.innerHTML = `
        <div class="flex-1">
          <strong>${u.displayName}</strong>
          <div class="small">@${u.username} • ${u.role}</div>
        </div>
        <div class="text-right">
          <button class="btn secondary" data-id="${u.id}">Edit</button>
        </div>
      `;
      list.appendChild(el);
    });
    
    card.appendChild(list);
    container.appendChild(card);

    // Event handlers
    newBtn.addEventListener('click', () => this._openUserModal());
    list.querySelectorAll('button[data-id]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        this._openUserModal(id);
      });
    });
  },

  _openUserModal(userId = null) {
    const user = userId ? Storage.users().find(u => u.id === userId) : null;
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
    headerTitle.textContent = user ? `Edit User: ${user.displayName}` : 'Create User';
    header.appendChild(headerTitle);
    modal.appendChild(header);

    const form = document.createElement('div');
    form.className = 'flex flex-col gap-3';

    const usernameInput = document.createElement('input');
    usernameInput.className = 'input';
    usernameInput.placeholder = 'Username';
    usernameInput.value = user ? user.username : '';
    usernameInput.disabled = !!user; // Can't change username
    form.appendChild(usernameInput);

    const displayNameInput = document.createElement('input');
    displayNameInput.className = 'input';
    displayNameInput.placeholder = 'Display Name';
    displayNameInput.value = user ? user.displayName : '';
    form.appendChild(displayNameInput);

    const roleSelect = document.createElement('select');
    roleSelect.className = 'input';
    roleSelect.innerHTML = `
      <option value="admin">Admin</option>
      <option value="mini_admin">Mini Admin</option>
      <option value="employee">Employee</option>
      <option value="orders_manager">Orders Manager</option>
    `;
    roleSelect.value = user ? user.role : 'employee';
    form.appendChild(roleSelect);

    if (!user) {
      const passwordInput = document.createElement('input');
      passwordInput.className = 'input';
      passwordInput.type = 'password';
      passwordInput.placeholder = 'Password';
      form.appendChild(passwordInput);
    }

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
    saveBtn.addEventListener('click', async () => {
      const displayName = displayNameInput.value.trim();
      const role = roleSelect.value;

      if (!displayName) {
        alert('Display name required');
        return;
      }

      if (user) {
        // Update existing user
        Storage.updateUser(user.id, { displayName, role });
        modalBg.remove();
        Router.navigate('/users');
      } else {
        // Create new user
        const username = usernameInput.value.trim();
        const password = form.querySelector('input[type="password"]').value;
        
        if (!username || !password) {
          alert('Username and password required');
          return;
        }

        try {
          await Auth.createUser(username, displayName, role, password);
          modalBg.remove();
          Router.navigate('/users');
        } catch (err) {
          alert('Error creating user: ' + err.message);
        }
      }
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
    setTimeout(() => {
      if (user) {
        displayNameInput.focus();
      } else {
        usernameInput.focus();
      }
    }, 100);
  }
};
