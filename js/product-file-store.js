/* Browser-local PDF attachments. IndexedDB stores binary data outside localStorage.
   A production backend must replace this and authorize downloads. */
(function(root){
  'use strict';
  const PREFIX='idb-pdf:';
  const DATABASE='astelkom-product-files';
  const STORE='pdfs';
  let connection;
  function open(){
    if(!root.indexedDB) return Promise.reject(new Error('Браузер не підтримує IndexedDB для PDF-файлів'));
    if(!connection) connection=new Promise((resolve,reject)=>{
      const req=root.indexedDB.open(DATABASE,1);
      req.onupgradeneeded=()=>{if(!req.result.objectStoreNames.contains(STORE)) req.result.createObjectStore(STORE);};
      req.onsuccess=()=>resolve(req.result);
      req.onerror=()=>reject(req.error||new Error('Не вдалося відкрити сховище PDF'));
    });
    return connection;
  }
  async function save(file){
    if(!file || !(file.type==='application/pdf'||/\.pdf$/i.test(file.name))) throw new Error('Підтримуються лише PDF-файли');
    const bytes=new Uint8Array(await file.slice(0,5).arrayBuffer());
    if(String.fromCharCode(...bytes)!=='%PDF-') throw new Error('Некоректний PDF-файл');
    const db=await open();
    const id=(root.crypto && typeof root.crypto.randomUUID==='function') ? root.crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    await new Promise((resolve,reject)=>{
      const tx=db.transaction(STORE,'readwrite');
      tx.objectStore(STORE).put(file,id);
      tx.oncomplete=resolve;
      tx.onerror=()=>reject(tx.error||new Error('PDF не збережено. Перевірте вільне місце.'));
      tx.onabort=()=>reject(tx.error||new Error('Недостатньо місця для PDF-файлу'));
    });
    return PREFIX+id;
  }
  async function get(ref){
    if(!isRef(ref)) return null;
    const db=await open();
    return new Promise((resolve,reject)=>{
      const req=db.transaction(STORE,'readonly').objectStore(STORE).get(ref.slice(PREFIX.length));
      req.onsuccess=()=>resolve(req.result||null);
      req.onerror=()=>reject(req.error);
    });
  }
  async function remove(ref){
    if(!isRef(ref)) return;
    const db=await open();
    await new Promise((resolve,reject)=>{
      const tx=db.transaction(STORE,'readwrite');
      tx.objectStore(STORE).delete(ref.slice(PREFIX.length));
      tx.oncomplete=resolve; tx.onerror=()=>reject(tx.error);
    });
  }
  function isRef(value){return typeof value==='string'&&/^idb-pdf:[a-zA-Z0-9-]{8,100}$/.test(value);}
  async function hydrate(container){
    if(!container) return;
    const nodes=Array.from(container.querySelectorAll('a[data-local-pdf]'));
    await Promise.all(nodes.map(async node=>{
      const ref=node.getAttribute('data-local-pdf');
      try{
        const file=await get(ref);
        if(!file){node.removeAttribute('href');node.setAttribute('aria-disabled','true');node.title='Файл доступний лише у браузері, де його завантажили';return;}
        if(node.dataset.objectUrl) URL.revokeObjectURL(node.dataset.objectUrl);
        const objectUrl=URL.createObjectURL(file);
        node.dataset.objectUrl=objectUrl;
        node.href=objectUrl;
        node.removeAttribute('aria-disabled');
      }catch(e){node.removeAttribute('href');node.title='Не вдалося завантажити PDF з локального сховища';}
    }));
  }
  root.AstelProductFiles={save,get,remove,isRef,hydrate};
  if(typeof module==='object'&&module.exports)module.exports=root.AstelProductFiles;
})(typeof window!=='undefined'?window:globalThis);
