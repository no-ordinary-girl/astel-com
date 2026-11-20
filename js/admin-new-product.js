/* New-product editor: photo previews, reusable specification names and PDF attachments.
   Browser-local prototype; the server must own uploaded files after backend integration. */
(function (root) {
  'use strict';
  const MAX_PDF_BYTES = 950000;
  const MAX_DOCS = 8;
  const MAX_SECTIONS = 8;
  const MAX_ROWS = 25;
  const MAX_PHOTOS = 12;
  const photoStates = new WeakMap();
  const typePrefix = 'custom:';
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  function readPdf(file) {
    if (!file || (file.type !== 'application/pdf' && !/\.pdf$/i.test(file.name)))
      return Promise.reject(new Error('Підтримуються тільки PDF-файли'));
    if (file.size > MAX_PDF_BYTES)
      return Promise.reject(new Error('PDF завеликий для localStorage (максимум 950 КБ)'));
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('Не вдалося прочитати PDF'));
      reader.onload = () => {
        const data = String(reader.result || '');
        const match = /^data:[^,]*;base64,([A-Za-z0-9+/]+={0,2})$/.exec(data);
        if (!match || !match[1].startsWith('JVBER'))
          reject(new Error('Некоректний PDF-файл'));
        else resolve('data:application/pdf;base64,' + match[1]);
      };
      reader.readAsDataURL(file);
    });
  }

  function customNames(form) {
    // Intentionally NOT a persistent list. Deleted last uses disappear on next render.
    const names = new Map();
    if (typeof PRODUCTS_DATA !== 'undefined') {
      Object.values(PRODUCTS_DATA).forEach(p => (p.specSections || []).forEach(section => {
        if (section.type === 'custom' && section.title) names.set(section.title.toLocaleLowerCase('uk'),
          {title: section.title, titleEn: section.titleEn || ''});
      }));
    }
    form.querySelectorAll('[data-spec-type]').forEach(select => {
      if (select.value.startsWith(typePrefix)) {
        const title = select.value.slice(typePrefix.length);
        if (title) {
          const key=title.toLocaleLowerCase('uk');
          names.set(key, {title, titleEn:select.closest('.admin-spec-section')?.dataset.customTitleEn || names.get(key)?.titleEn || ''});
        }
      }
    });
    return [...names.values()].sort((a,b) => a.title.localeCompare(b.title,'uk'));
  }
  function refreshTypeOptions(form) {
    const names = customNames(form);
    form.querySelectorAll('[data-spec-type]').forEach(select => {
      const selected = select.value;
      select.replaceChildren();
      const addOption = (value,label) => {
        const opt=document.createElement('option');opt.value=value;opt.textContent=label;select.append(opt);
      };
      addOption('tech','Технічні характеристики');
      addOption('general','Основні характеристики');
      for (const name of names) addOption(typePrefix + name.title,name.title);
      addOption('__new__','+ Створити нову назву…');
      select.value = [...select.options].some(o => o.value === selected) ? selected : 'tech';
    });
  }
  function extractSections(form) {
    return Array.from(form.querySelectorAll('.admin-spec-section')).map(section => {
      const selected = section.querySelector('[data-spec-type]').value;
      if (selected === '__new__') throw new Error('Збережіть нову назву таблиці');
      const custom = selected.startsWith(typePrefix);
      const title = custom ? selected.slice(typePrefix.length).trim() : '';
      if (custom && (title.length<2 || title.length>120)) throw new Error('Назва таблиці: від 2 до 120 символів');
      const rows = Array.from(section.querySelectorAll('.admin-spec-row')).map(row => ({
        label: row.querySelector('[data-spec-label]').value.trim(),
        value: row.querySelector('[data-spec-value]').value.trim(),
      })).filter(row => row.label || row.value);
      if (!rows.length || rows.some(row => !row.label || !row.value))
        throw new Error('Кожна таблиця повинна мати заповнені назву та значення хоча б одного рядка');
      return custom ? {type:'custom', title, titleEn:section.dataset.customTitleEn || '', rows} : {type:selected, rows};
    });
  }
  async function extractDocuments(form) {
    const rows = Array.from(form.querySelectorAll('.admin-document-row'));
    if (rows.length > MAX_DOCS) throw new Error('Максимум 8 PDF-файлів');
    const docs = [];
    for (const row of rows) {
      const file = row.querySelector('[data-doc-file]').files[0];
      if (!file) throw new Error('Оберіть PDF-файл або видаліть порожній рядок документа');
      const title = row.querySelector('[data-doc-title]').value.trim() || file.name;
      const titleEn = row.querySelector('[data-doc-title-en]').value.trim();
      const download = file.name.replace(/[\\/\x00-\x1f]/g, '_').slice(0,160);
      docs.push({ title, titleEn, url: await readPdf(file), download });
    }
    return docs;
  }
  function createSpecRow() {
    const row = document.createElement('div');
    row.className = 'admin-spec-row';
    row.innerHTML = `<input data-spec-label aria-label="Назва характеристики" placeholder="Назва характеристики" maxlength="160" />
      <input data-spec-value aria-label="Значення характеристики" placeholder="Значення" maxlength="2000" />
      <button type="button" class="admin-extra-remove" data-remove-spec-row aria-label="Видалити рядок" title="Видалити рядок">×</button>`;
    return row;
  }
  function createSpecSection() {
    const section = document.createElement('div');
    section.className = 'admin-spec-section';
    section.innerHTML = `<div class="admin-extra-section-top">
        <label>Тип таблиці <select data-spec-type></select></label>
        <button class="admin-extra-remove" type="button" data-remove-spec-section>Видалити таблицю</button>
      </div>
      <div class="admin-spec-name-editor" data-spec-name-editor hidden>
        <label>Нова назва таблиці <input data-spec-custom-name placeholder="Наприклад: Комплектація" maxlength="120" /></label>
        <label>English (необов'язково) <input data-spec-custom-name-en placeholder="e.g. Package Contents" maxlength="120" /></label>
        <button type="button" class="admin-btn admin-btn--outline" data-save-spec-name>Зберегти назву</button>
      </div>
      <div class="admin-spec-rows"></div>
      <button type="button" class="admin-extra-add" data-add-spec-row>+ Додати характеристику</button>`;
    section.querySelector('.admin-spec-rows').append(createSpecRow());
    return section;
  }
  function createDocRow() {
    const row = document.createElement('div');
    row.className = 'admin-document-row';
    row.innerHTML = `<label>Назва документа українською
        <input data-doc-title placeholder="Наприклад: Паспорт модему" maxlength="200" /></label>
      <label>Назва документа англійською (необов'язково)
        <input data-doc-title-en placeholder="e.g. Technical Datasheet" maxlength="200" /></label>
      <label>PDF-файл (до 950 КБ)
        <input data-doc-file type="file" accept=".pdf,application/pdf" required /></label>
      <button type="button" class="admin-extra-remove" data-remove-doc-row>Видалити PDF</button>`;
    return row;
  }

  function getState(form) {
    if (!photoStates.has(form)) photoStates.set(form,[]);
    return photoStates.get(form);
  }
  function getPhotos(form) { return getState(form).map(item => item.file); }
  function renderPhotos(form) {
    const list = form.querySelector('[data-new-photo-list]');
    if (!list) return;
    const photos = getState(form);
    list.innerHTML = photos.map((item,index) => `<div class="admin-photo-item ${index===0?'is-main':''}"
      draggable="true" tabindex="0" data-new-photo-index="${index}"
      aria-label="Фото ${index+1}${index===0?', головне':''}; перетягніть для зміни порядку">
      <div class="admin-photo-item__preview"><img src="${esc(item.url)}" alt="${esc(item.file.name)}" draggable="false" />
        <button type="button" class="admin-photo-item__remove" data-remove-new-photo="${index}" aria-label="Видалити фото ${index+1}">×</button></div>
      <div class="admin-photo-item__footer"><span class="admin-photo-item__number">${index===0?'Головне':`Фото ${index+1}`}</span>
        <span class="admin-photo-item__handle" aria-hidden="true">⠿</span></div></div>`).join('');
    const counter = form.querySelector('[data-new-photo-count]');
    if (counter) counter.textContent=`${photos.length} / ${MAX_PHOTOS}`;
    const add = form.querySelector('[data-new-photo-add]');
    if (add) add.hidden = photos.length >= MAX_PHOTOS;
  }
  function clearPhotos(form) {
    getState(form).forEach(photo => URL.revokeObjectURL(photo.url));
    photoStates.set(form, []);
    renderPhotos(form);
  }
  function movePhoto(form,from,to) {
    const photos=getState(form);
    if (!Number.isInteger(from) || !Number.isInteger(to) || from<0 || to<0 || from>=photos.length || to>=photos.length || from===to) return false;
    const [item]=photos.splice(from,1);photos.splice(to,0,item);renderPhotos(form);return true;
  }
  function bind(form) {
    getState(form);
    const warn = message => { if(typeof window!=='undefined') window.alert(message); };
    form.addEventListener('click',e => {
      const action=e.target.closest(
        '[data-add-spec-section], [data-remove-spec-section], [data-add-spec-row], ' +
        '[data-remove-spec-row], [data-add-doc-row], [data-remove-doc-row], ' +
        '[data-save-spec-name], [data-remove-new-photo]');
      if (!action) return;
      if (action.hasAttribute('data-add-spec-section')) {
        const list=form.querySelector('[data-spec-sections]');
        if (list.children.length>=MAX_SECTIONS) return warn('Максимум 8 таблиць');
        list.append(createSpecSection());refreshTypeOptions(form);
      } else if (action.hasAttribute('data-remove-spec-section')) {
        action.closest('.admin-spec-section').remove();refreshTypeOptions(form);
      } else if (action.hasAttribute('data-save-spec-name')) {
        const section=action.closest('.admin-spec-section');
        const title=section.querySelector('[data-spec-custom-name]').value.trim();
        const en=section.querySelector('[data-spec-custom-name-en]').value.trim();
        if (title.length<2 || title.length>120) return warn('Назва таблиці: від 2 до 120 символів');
        const matches=customNames(form).find(n=>n.title.toLocaleLowerCase('uk')===title.toLocaleLowerCase('uk'));
        if (matches && matches.title!==title) return warn('Така назва таблиці вже існує');
        section.dataset.customTitleEn=en;
        const select=section.querySelector('[data-spec-type]');
        const opt=document.createElement('option');opt.value=typePrefix+title;opt.textContent=title;
        select.add(opt);select.value=opt.value;
        section.querySelector('[data-spec-name-editor]').hidden=true;
        refreshTypeOptions(form);
      } else if (action.hasAttribute('data-add-spec-row')) {
        const list=action.closest('.admin-spec-section').querySelector('.admin-spec-rows');
        if (list.children.length>=MAX_ROWS) return warn('Максимум 25 характеристик у таблиці');
        list.append(createSpecRow());
      } else if (action.hasAttribute('data-remove-spec-row')) {
        action.closest('.admin-spec-row').remove();
      } else if (action.hasAttribute('data-add-doc-row')) {
        const list=form.querySelector('[data-doc-rows]');
        if (list.children.length>=MAX_DOCS) return warn('Максимум 8 PDF-файлів');
        list.append(createDocRow());
      } else if (action.hasAttribute('data-remove-doc-row')) {
        action.closest('.admin-document-row').remove();
      } else if (action.hasAttribute('data-remove-new-photo')) {
        const idx=Number(action.dataset.removeNewPhoto);
        const photos=getState(form);
        const [item]=photos.splice(idx,1);if(item) URL.revokeObjectURL(item.url);
        renderPhotos(form);
      }
    });
    form.addEventListener('change',e => {
      if (e.target.matches('[data-spec-type]')) {
        const section=e.target.closest('.admin-spec-section');
        const savedName = customNames(form).find(n=>e.target.value===typePrefix+n.title);
        section.dataset.customTitleEn=savedName?.titleEn || '';
        section.querySelector('[data-spec-name-editor]').hidden = e.target.value !== '__new__';
        if (e.target.value==='__new__') section.querySelector('[data-spec-custom-name]').focus();
        refreshTypeOptions(form);
      }
      if (e.target.matches('[name="photos"]')) {
        const files=Array.from(e.target.files||[]),photos=getState(form);
        if (photos.length+files.length>MAX_PHOTOS) { e.target.value='';return warn('Максимум 12 фотографій'); }
        if (files.some(file=>!['image/png','image/jpeg','image/webp'].includes(file.type) || file.size>6*1024*1024)) {
          e.target.value='';return warn('Підтримуються лише PNG, JPG, WebP розміром до 6 МБ');
        }
        for(const file of files)photos.push({file,url:URL.createObjectURL(file)});
        e.target.value=''; // Allows selecting the same file again; array owns the pending photos.
        renderPhotos(form);
      }
    });
    const list=form.querySelector('[data-new-photo-list]');
    if(list) {
      let dragIndex=null;
      list.addEventListener('dragstart',e=>{
        const item=e.target.closest('[data-new-photo-index]');if(!item)return;
        dragIndex=Number(item.dataset.newPhotoIndex);
        e.dataTransfer.effectAllowed='move';e.dataTransfer.setData('text/plain',String(dragIndex));
      });
      list.addEventListener('dragover',e=>{
        if(dragIndex===null || !e.target.closest('[data-new-photo-index]'))return;
        e.preventDefault();e.dataTransfer.dropEffect='move';
      });
      list.addEventListener('drop',e=>{
        const item=e.target.closest('[data-new-photo-index]');if(!item || dragIndex===null)return;
        e.preventDefault();movePhoto(form,dragIndex,Number(item.dataset.newPhotoIndex));dragIndex=null;
      });
      list.addEventListener('dragend',()=>{dragIndex=null;});
      list.addEventListener('keydown',e=>{
        if(!e.altKey || !['ArrowLeft','ArrowRight'].includes(e.key))return;
        const item=e.target.closest('[data-new-photo-index]');if(!item)return;
        const idx=Number(item.dataset.newPhotoIndex),next=idx+(e.key==='ArrowLeft'?-1:1);
        if(movePhoto(form,idx,next)){e.preventDefault();list.querySelector(`[data-new-photo-index="${next}"]`)?.focus();}
      });
    }
    renderPhotos(form);
    if(typeof root.addEventListener==='function') root.addEventListener('astel:catalog-updated',()=>refreshTypeOptions(form));
  }
  function reset(form) {
    form.querySelector('[data-spec-sections]')?.replaceChildren();
    form.querySelector('[data-doc-rows]')?.replaceChildren();
    clearPhotos(form);
  }
  const api={bind,reset,extractSections,extractDocuments,readPdf,getPhotos,customNames,movePhoto};
  root.AstelProductEditor=api;
  if(typeof module==='object' && module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
