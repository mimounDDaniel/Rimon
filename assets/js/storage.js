// storage.js — LocalStorage pseudo-DB
import { Utils } from './utils.js';

const KEY = 'brimon.db.v1';

export const Storage = {
  _db: null,

  async init(){
    const raw = localStorage.getItem(KEY);
    if(raw){
      try{
        this._db = JSON.parse(raw);
      }catch(e){
        console.error('Corrupt DB — reinitializing', e);
        this._db = null;
      }
    }
    if(!this._db){
      // Seed initial structure
      const now = new Date().toISOString();
      this._db = {
        meta:{createdAt:now, version:1},
        users: [], // {id, username, displayName, role, hash, salt, lang, avatar}
        projects: [],
        tasks: [], // task entries
        orders: [],
      };
      // Add seeded users (password defaults will be set by Auth helper)
      const seedUsers = [
        {username:'avri', displayName:'Avri', role:'admin'},
        {username:'daniel', displayName:'Daniel', role:'employee'},
        {username:'sasha', displayName:'Sasha', role:'employee'},
        {username:'mathy', displayName:'Mathy', role:'employee'},
        {username:'morine', displayName:'Morine', role:'orders_manager'},
        {username:'noumi', displayName:'Noumi', role:'orders_manager'},
        {username:'yair', displayName:'Yair', role:'mini_admin'},
        {username:'itamar', displayName:'Itamar', role:'mini_admin'},
      ];
      // Create user records with placeholder hashes; Auth will finalize if needed
      for(const u of seedUsers){
        this._db.users.push({
          id: Utils.uuid(),
          username: u.username,
          displayName: u.displayName,
          role: u.role,
          hash: '', salt:'', // will be set by Auth.seedDefaults()
          lang: 'he',
          createdAt: now,
        });
      }
      // Example projects with tasks
      const herzliya = {id: Utils.uuid(), name: 'Herzliya', start: now, end:null, createdAt:now};
      this._db.projects.push(herzliya);
      
      const rtg = {id: Utils.uuid(), name: 'RTG', start: now, end:null, createdAt:now};
      this._db.projects.push(rtg);
      
      // Herzliya project tasks
      const h1 = {
        id: Utils.uuid(), projectId: herzliya.id, title: 'Modify the LEDs', description:'Modify lighting system', images:[], plannedHours:4,
        assignees:['daniel'], status:'in progress', timeLog: [{type:'plan', by:'system', hours:4, at:now}], createdAt:now
      };
      this._db.tasks.push(h1);
      
      const h2 = {
        id: Utils.uuid(), projectId: herzliya.id, title: 'Reorganize materials in shelves', description:'Organize storage', images:[], plannedHours:3,
        assignees:['daniel'], status:'unassigned', timeLog: [{type:'plan', by:'system', hours:3, at:now}], createdAt:now
      };
      this._db.tasks.push(h2);
      
      // RTG project tasks
      const r1 = {
        id: Utils.uuid(), projectId: rtg.id, title: 'Make a hole for ventilation', description:'Drilling work', images:[], plannedHours:2,
        assignees:['sasha'], status:'in progress', timeLog: [{type:'plan', by:'system', hours:2, at:now}], createdAt:now
      };
      this._db.tasks.push(r1);
      
      const r2 = {
        id: Utils.uuid(), projectId: rtg.id, title: 'Install communication boxes', description:'Install network equipment', images:[], plannedHours:5,
        assignees:['daniel', 'sasha'], status:'unassigned', timeLog: [{type:'plan', by:'system', hours:5, at:now}], createdAt:now
      };
      this._db.tasks.push(r2);
      
      const r3 = {
        id: Utils.uuid(), projectId: rtg.id, title: 'Connect communication boxes to electrical panels', description:'Electrical wiring', images:[], plannedHours:4,
        assignees:['mathy'], status:'unassigned', timeLog: [{type:'plan', by:'system', hours:4, at:now}], createdAt:now
      };
      this._db.tasks.push(r3);
      
      const r4 = {
        id: Utils.uuid(), projectId: rtg.id, title: 'Install the LEDs', description:'LED installation', images:[], plannedHours:3,
        assignees:['mathy'], status:'unassigned', timeLog: [{type:'plan', by:'system', hours:3, at:now}], createdAt:now
      };
      this._db.tasks.push(r4);
      
      const r5 = {
        id: Utils.uuid(), projectId: rtg.id, title: 'Install the generator', description:'Generator installation', images:[], plannedHours:6,
        assignees:['avri'], status:'unassigned', timeLog: [{type:'plan', by:'system', hours:6, at:now}], createdAt:now
      };
      this._db.tasks.push(r5);
      
      // Sample orders
      const o1 = {id: Utils.uuid(), title: 'M5X15 screws', description:'Order screws for project', date: now, status: 'Requested', requestedBy: 'daniel'};
      this._db.orders.push(o1);
      
      const o2 = {id: Utils.uuid(), title: 'Doors for RTG', description:'Custom doors needed', date: now, status: 'Requested', requestedBy: 'sasha'};
      this._db.orders.push(o2);
      
      const o3 = {id: Utils.uuid(), title: 'Chevrolet Savana for vacation', description:'Vehicle rental', date: now, status: 'Requested', requestedBy: 'avri'};
      this._db.orders.push(o3);

      this.persist();
    }
    // Ensure seeded users have passwords set (if not)
    await import('./auth.js').then(m=>m.Auth.seedDefaults());
    return this._db;
  },

  persist(){
    localStorage.setItem(KEY, JSON.stringify(this._db));
  },

  // Generic getters/setters:
  users(){ return this._db.users.slice(); },
  projects(){ return this._db.projects.slice(); },
  tasks(){ return this._db.tasks.slice(); },
  orders(){ return this._db.orders.slice(); },

  findUserByUsername(username){ return this._db.users.find(u=>u.username.toLowerCase()===username.toLowerCase()) },
  findUserById(id){ return this._db.users.find(u=>u.id===id) },

  addUser(user){ this._db.users.push(user); this.persist(); return user; },
  updateUser(id,attrs){ const u = this._db.users.find(x=>x.id===id); if(u) Object.assign(u,attrs); this.persist(); return u; },
  deleteUser(id){ this._db.users = this._db.users.filter(x=>x.id!==id); this.persist(); },

  addProject(p){ this._db.projects.push(p); this.persist(); return p; },
  updateProject(id,attrs){ const p = this._db.projects.find(x=>x.id===id); Object.assign(p,attrs); this.persist(); return p; },

  addTask(t){ this._db.tasks.push(t); this.persist(); return t; },
  updateTask(id,attrs){ const t = this._db.tasks.find(x=>x.id===id); Object.assign(t,attrs); this.persist(); return t; },
  deleteTask(id){ this._db.tasks = this._db.tasks.filter(x=>x.id!==id); this.persist(); },

  addOrder(o){ this._db.orders.push(o); this.persist(); return o; },
  updateOrder(id,attrs){ const o = this._db.orders.find(x=>x.id===id); Object.assign(o,attrs); this.persist(); return o; },

  // helper to write entire DB (for admin)
  setDB(newDb){ this._db = newDb; this.persist(); }
};