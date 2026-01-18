// very small hash router
export const Router = {
  _routes: {},
  _onRoute: null,

  init(onRoute){
    this._onRoute = onRoute;
    window.addEventListener('hashchange', ()=>this._dispatch());
    this._dispatch();
  },

  register(path, handler){
    this._routes[path] = handler;
  },

  navigate(path){
    location.hash = '#'+path;
    this._dispatch();
  },

  _dispatch(){
    const path = location.hash.replace('#','') || '/';
    if(this._onRoute) this._onRoute(path);
  }
};