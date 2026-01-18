// auth.js — authentication & password hashing (PBKDF2)
import { Storage } from './storage.js';
import { Utils } from './utils.js';

const AUTH_KEY = 'brimon.session';

export const Auth = {
  // PBKDF2 parameters
  hashAlgo: 'SHA-256',
  iterations: 10000,
  saltLen: 16,
  keyLen: 32,

  async seedDefaults(){
    // If any user lacks hash, set default password: Password!2026 and unique salt
    const users = Storage.users();
    for(const u of users){
      if(!u.hash || !u.salt){
        const pwd = 'Password!2026'; // default seed password (change in production)
        const {hash,salt} = await this.hashPassword(pwd);
        u.hash = hash; u.salt = salt;
      }
    }
    Storage.persist();
  },

  async hashPassword(password, saltHex=null){
    const enc = new TextEncoder();
    let salt;
    if(saltHex){
      salt = new Uint8Array(Utils.fromHex(saltHex));
    } else {
      salt = crypto.getRandomValues(new Uint8Array(this.saltLen));
    }
    // deriveKey via PBKDF2
    const baseKey = await crypto.subtle.importKey('raw', enc.encode(password), {name:'PBKDF2'}, false, ['deriveBits']);
    const derivedBits = await crypto.subtle.deriveBits(
      {name:'PBKDF2', salt, iterations: this.iterations, hash: this.hashAlgo},
      baseKey,
      this.keyLen * 8
    );
    const hashHex = Utils.toHex(derivedBits);
    const saltHexOut = Utils.toHex(salt.buffer);
    return {hash:hashHex, salt: saltHexOut};
  },

  async verify(password, user){
    if(!user || !user.salt || !user.hash) return false;
    const {hash} = await this.hashPassword(password, user.salt);
    return hash === user.hash;
  },

  login(userOrUsername, password){
    // synchronous wrapper (but verify is async). Return promise
    return new Promise(async (resolve,reject)=>{
      const user = typeof userOrUsername === 'string' ? Storage.findUserByUsername(userOrUsername) : userOrUsername;
      if(!user){ return reject(new Error('User not found')); }
      const ok = await this.verify(password, user);
      if(!ok) return reject(new Error('Invalid credentials'));
      // set session
      const session = {userId:user.id, at: Utils.nowIso()};
      localStorage.setItem(AUTH_KEY, JSON.stringify(session));
      resolve(user);
    });
  },

  logout(){
    localStorage.removeItem(AUTH_KEY);
  },

  currentUser(){
    const s = localStorage.getItem(AUTH_KEY);
    if(!s) return null;
    try{
      const session = JSON.parse(s);
      return Storage.findUserById(session.userId) || null;
    }catch(e){ return null; }
  },

  isRole(role){
    const u = this.currentUser();
    if(!u) return false;
    if(Array.isArray(role)) return role.includes(u.role);
    return u.role === role;
  },

  requireRole(roles){
    const u = this.currentUser();
    if(!u) return false;
    if(Array.isArray(roles)) return roles.includes(u.role);
    return u.role === roles;
  },

  createUser(username, displayName, role, password){
    return new Promise(async (resolve,reject)=>{
      if(Storage.findUserByUsername(username)) return reject(new Error('username_taken'));
      const {hash,salt} = await this.hashPassword(password);
      const user = {id:Utils.uuid(), username, displayName, role, hash, salt, lang:'he', createdAt:Utils.nowIso()};
      Storage.addUser(user);
      resolve(user);
    });
  }
};