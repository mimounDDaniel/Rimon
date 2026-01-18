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
      // Example project + task seeds (minimal)
      const p1 = {id: Utils.uuid(), name: 'פרויקט הדגמה', start: now, end:null, createdAt:now};
      this._db.projects.push(p1);
      const t1 = {
        id: Utils.uuid(), projectId: p1.id, title: 'משימה ראשונית', description:'תיאור משימה', images:[], plannedHours:2,
        assignees:['daniel'], status:'unassigned', timeLog: [{type:'plan', by:'system', hours:2, at:now}], createdAt:now
      };
      this._db.tasks.push(t1);

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