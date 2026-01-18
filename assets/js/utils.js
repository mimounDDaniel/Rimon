// Utilities
export const Utils = {
  uuid(){
    // simple uuid
    return 'id-' + ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g,c=>
      (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    );
  },

  nowIso(){ return new Date().toISOString(); },

  toHex(buffer){
    const b = new Uint8Array(buffer);
    return Array.from(b).map(x=>x.toString(16).padStart(2,'0')).join('');
  },

  fromHex(hex){
    const bytes = new Uint8Array(hex.length/2);
    for(let i=0;i<bytes.length;i++) bytes[i]=parseInt(hex.substr(i*2,2),16);
    return bytes.buffer;
  },

  formatDate(iso){
    if(!iso) return '';
    const d = new Date(iso);
    return d.toLocaleString();
  },

  // CSV helper
  toCSV(rows, columns){
    const esc = v => {
      if(v===null||v===undefined) return '';
      const s = String(v).replace(/"/g,'""');
      return `"${s}"`;
    };
    const header = columns.map(c=>esc(c)).join(',');
    const body = rows.map(r=>columns.map(col=>esc(r[col]||'')).join(',')).join('\n');
    return header + '\n' + body;
  }
};