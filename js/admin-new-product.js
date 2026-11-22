/* Shared specification/document editor for new and existing products.
   Files are saved in IndexedDB; catalog metadata stays in localStorage until a backend exists. */
(function(root){
'use strict';
const MAX_DOCS=8, MAX_SECTIONS=8, MAX_ROWS=25, MAX_PHOTOS=12;
const photoStates=new WeakMap();
let nextFormId=0;
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
// i18n.js exposes a route-aware translate() and a language-independent lookup.
// The admin screen stays Ukrainian, so translate() would otherwise return Ukrainian.
function englishFromDictionary(value) {
  const source=String(value??'');
  if(!source.trim())return '';
  const manager=(typeof I18nManager!=='undefined')?I18nManager:root.I18nManager;
  const translate=manager?.translateForBuild;
  if(typeof translate!=='function')return /[А-Яа-яІіЇїЄєҐґ]/.test(source)?'':source;
  const result=source.split('\n').map(line=>translate(line)).join('\n');
  // Never copy Ukrainian into an English field if the dictionary lacks a translation.
  return /[А-Яа-яІіЇїЄєҐґ]/.test(result)?'':result;
}
function englishInitial(value, existing) {
  const candidate=String(existing??'').trim();
  // Preserve a real manually-entered translation, but replace duplicated Ukrainian.
  return candidate&&!/[А-Яа-яІіЇїЄєҐґ]/.test(candidate)?candidate:englishFromDictionary(value);
}
function selectLanguage(form, language){
  if(language!=='uk'&&language!=='en')return;
  form.dataset.editorLanguage=language;
  form.querySelectorAll('[data-editor-lang]').forEach(button=>{
    const selected=button.dataset.editorLang===language;
    button.setAttribute('aria-selected',String(selected));
    button.tabIndex=selected?0:-1;
  });
  const context=form.querySelector('[data-editor-language-context]');
  if(context){
    const code=context.querySelector('[data-editor-language-code]');
    const heading=context.querySelector('[data-editor-language-heading]');
    const help=context.querySelector('[data-editor-language-help]');
    if(code)code.textContent=language==='uk'?'UA':'EN';
    if(heading)heading.textContent=language==='uk'?'Ви редагуєте українську версію':'Ви редагуєте англійську версію';
    if(help)help.textContent=language==='uk'
      ?'Заповнюйте назву, опис і характеристики українською. Для англійської версії перейдіть на вкладку English.'
      :'Заповнюйте англійські переклади назви, опису та характеристик. Підписи полів залишаються українською.';
  }
}

function err(msg){throw new Error(msg);}
const DEFAULT_TITLES={
  tech:{uk:'Технічні характеристики',en:'Technical Specifications'},
  general:{uk:'Основні характеристики',en:'General Specifications'},
};
function tableType(title,titleEn){
  const uk=String(title||'').trim(),en=String(titleEn||'').trim();
  if(uk===DEFAULT_TITLES.tech.uk && en===DEFAULT_TITLES.tech.en)return 'tech';
  if(uk===DEFAULT_TITLES.general.uk && en===DEFAULT_TITLES.general.en)return 'general';
  return 'custom';
}
function customNames(form){
  const names=new Map();
  if(typeof PRODUCTS_DATA!=='undefined')Object.values(PRODUCTS_DATA).forEach(p=>(p.specSections||[]).forEach(section=>{
    if(section.type==='custom' && section.title)
      names.set(section.title.toLocaleLowerCase('uk'),{title:section.title,titleEn:section.titleEn||''});
  }));
  form.querySelectorAll('.admin-spec-section').forEach(section=>{
    const title=section.querySelector('[data-spec-title]')?.value.trim();
    const titleEn=section.querySelector('[data-spec-title-en]')?.value.trim()||'';
    if(title && tableType(title,titleEn)==='custom')
      names.set(title.toLocaleLowerCase('uk'),{title,titleEn});
  });
  return [...names.values()].sort((a,b)=>a.title.localeCompare(b.title,'uk'));
}
function refreshSuggestions(form){
  const list=form.querySelector('[data-custom-spec-names]');if(!list)return;
  if(!list.id)list.id='astel-spec-names-'+(++nextFormId);
  // Table names are free-text fields. A datalist creates an unwanted native
  // dropdown arrow on Chromium and suggests the heading is a fixed choice.
  form.querySelectorAll('[data-spec-title]').forEach(input=>input.removeAttribute('list'));
  list.replaceChildren(...customNames(form).map(item=>{
    const opt=document.createElement('option');opt.value=item.title;return opt;
  }));
}
function createSpecRow(data={}){
  const row=document.createElement('div');row.className='admin-spec-row';
  row.innerHTML=`<div class="admin-spec-row__translations">
    <label data-editor-field-lang="uk">Назва характеристики <input data-spec-label placeholder="Назва характеристики" maxlength="160" value="${esc(data.label||'')}" aria-label="Характеристика українською" /></label>
    <label data-editor-field-lang="en">Назва характеристики <input data-spec-label-en placeholder="Переклад назви англійською" maxlength="160" value="${esc(englishInitial(data.label||'',data.labelEn))}" aria-label="Характеристика англійською" /></label>
  </div><div class="admin-spec-row__translations">
    <label data-editor-field-lang="uk">Значення <input data-spec-value placeholder="Значення" maxlength="2000" value="${esc(data.value||'')}" /></label>
    <label data-editor-field-lang="en">Значення <input data-spec-value-en placeholder="Переклад значення англійською" maxlength="2000" value="${esc(englishInitial(data.value||'',data.valueEn))}" /></label>
  </div><button type="button" class="admin-extra-remove admin-extra-remove--small" data-remove-spec-row title="Видалити характеристику" aria-label="Видалити характеристику">×</button>`;
  return row;
}
function createSpecSection(data={}){
  const section=document.createElement('div');section.className='admin-spec-section';
  const type=['tech','general','custom'].includes(data.type)?data.type:'tech';
  const title=type==='custom'?(data.title||''):(data.title||DEFAULT_TITLES[type].uk);
  const english=type==='custom'?englishInitial(title,data.titleEn):(data.titleEn||DEFAULT_TITLES[type].en);
  section.innerHTML=`<div class="admin-extra-section-top admin-spec-table-header">
    <div class="admin-spec-table-name">
      <label data-editor-field-lang="uk">Назва таблиці
        <input data-spec-title placeholder="Назва таблиці українською" maxlength="120" value="${esc(title)}" /></label>
      <label data-editor-field-lang="en">Назва таблиці
        <input data-spec-title-en placeholder="Перекладіть назву таблиці англійською" maxlength="120" value="${esc(english)}" /></label>
    </div>
    <button type="button" class="admin-extra-remove admin-extra-remove--section" data-remove-spec-section><img src="assets/images/delete.svg" alt="" /> Видалити</button>
  </div><div class="admin-spec-rows"></div><button type="button" class="admin-extra-add" data-add-spec-row>+ Додати характеристику</button>`;
  const rows=Array.isArray(data.rows)&&data.rows.length?data.rows:[{}];
  rows.forEach(row=>section.querySelector('.admin-spec-rows').append(createSpecRow(row)));
  return section;
}
function safePdfHref(url){
  const value=String(url||'').trim();
  return /^(https?:\/\/|(?:\.\.?\/)?(?:assets|downloads|docs)\/)/i.test(value) ? value : '';
}
function createDocRow(data={}){
  const row=document.createElement('div');row.className='admin-document-row';
  const original=data.url?data:null;
  if(original)row.dataset.originalDoc=JSON.stringify(original);
  const isLocal=Boolean(original&&root.AstelProductFiles?.isRef(original.url));
  const href=isLocal?'#':safePdfHref(original?.url);
  const filename=String(original?.download||original?.url?.split('/').pop()||'PDF-документ');
  const currentFile=original?`<div class="admin-document-current" aria-label="Поточний прикріплений PDF">
    <span class="admin-document-current__badge" aria-hidden="true">PDF</span>
    <div class="admin-document-current__details"><strong>Прикріплений зараз</strong>
      <span class="admin-document-current__filename" title="${esc(filename)}">${esc(filename)}</span></div>
    ${href?`<a class="admin-document-current__open" href="${esc(href)}" ${isLocal?`data-local-pdf="${esc(original.url)}"`:''}
      target="_blank" rel="noopener noreferrer">Відкрити PDF ↗</a>`:''}
  </div>`:'';
  row.innerHTML=`<div class="admin-extra-section-top admin-document-row__header">
      <strong>PDF-документ</strong>
      <button type="button" class="admin-extra-remove admin-extra-remove--section" data-remove-doc-row><img src="assets/images/delete.svg" alt="" /> Видалити</button>
    </div>
    <label data-editor-field-lang="uk">Назва документа українською
    <input data-doc-title placeholder="Наприклад: Паспорт модему" maxlength="200" value="${esc(data.title||'')}" /></label>
    <label data-editor-field-lang="en">Назва документа англійською
    <input data-doc-title-en placeholder="Переклад назви документа англійською" maxlength="200" value="${esc(englishInitial(data.title||'',data.titleEn))}" /></label>
    ${currentFile}
    <label>${original?'Замінити прикріплений PDF (необов’язково)':'Додати PDF-файл'}
    <input data-doc-file type="file" accept=".pdf,application/pdf" ${original?'':'required'}/></label>`;
  if(isLocal)root.AstelProductFiles?.hydrate(row).catch(()=>{});
  return row;
}
function populate(form,product){
  const titleUk=form.querySelector('[name="title"]');
  const titleEn=form.querySelector('[name="titleEn"]');
  if(titleUk)titleUk.value=product?.title||'';
  if(titleEn)titleEn.value=product?englishInitial(product.title||'',product.titleEn):'';
  const sections=form.querySelector('[data-spec-sections]');const docs=form.querySelector('[data-doc-rows]');
  if(sections){sections.replaceChildren();
    if(product){
      if(product.techSpecs?.length)sections.append(createSpecSection({type:'tech',rows:product.techSpecs}));
      if(product.generalSpecs?.length)sections.append(createSpecSection({type:'general',rows:product.generalSpecs}));
      (product.specSections||[]).forEach(s=>sections.append(createSpecSection(s)));
    }
  }
  if(docs){docs.replaceChildren();(product?.docs||[]).forEach(d=>docs.append(createDocRow(d)));}
  const uk=form.querySelector('[name="description"]');if(uk)uk.value=(product?.description||[]).join('\n\n');
  const en=form.querySelector('[name="descriptionEn"]');if(en)en.value=(product?.description?.length?product.description.map((value,i)=>englishInitial(value,product?.descriptionEn?.[i])):(product?.descriptionEn||[])).join('\n\n');
  refreshSuggestions(form);
}
function extractProductNames(form){
  const title=form.querySelector('[name="title"]')?.value.trim()||'';
  const titleEn=form.querySelector('[name="titleEn"]')?.value.trim()||'';
  if(title.length<3 || title.length>200)err('Назва товару українською: від 3 до 200 символів');
  if(titleEn.length<3 || titleEn.length>200 || /[А-Яа-яІіЇїЄєҐґ]/.test(titleEn))
    err('Назва товару англійською: від 3 до 200 символів');
  return {title,titleEn};
}
function extractDescriptions(form){
  const uk=String(form.querySelector('[name="description"]')?.value||'').trim();
  const en=String(form.querySelector('[name="descriptionEn"]')?.value||'').trim();
  if((uk&&!en)||(!uk&&en))err('Заповніть опис українською та англійською');
  return {description:uk.split(/\n\s*\n/).map(s=>s.trim()).filter(Boolean),
    descriptionEn:en.split(/\n\s*\n/).map(s=>s.trim()).filter(Boolean)};
}
function extractSections(form){
  return Array.from(form.querySelectorAll('.admin-spec-section')).map(section=>{
    const title=section.querySelector('[data-spec-title]')?.value.trim()||'';
    const titleEn=section.querySelector('[data-spec-title-en]')?.value.trim()||'';
    if(!title||!titleEn)err('Заповніть назву таблиці українською та англійською');
    const type=tableType(title,titleEn);
    const rows=Array.from(section.querySelectorAll('.admin-spec-row')).map(row=>({
      label:row.querySelector('[data-spec-label]').value.trim(),
      labelEn:row.querySelector('[data-spec-label-en]').value.trim(),
      value:row.querySelector('[data-spec-value]').value.trim(),
      valueEn:row.querySelector('[data-spec-value-en]').value.trim(),
    })).filter(row=>Object.values(row).some(Boolean));
    if(!rows.length || rows.some(r=>!r.label||!r.labelEn||!r.value||!r.valueEn))err('Заповніть усі поля характеристик українською та англійською');
    return type==='custom'?{type,title,titleEn,rows}:{type,rows};
  });
}
function translationHint(value){
  const text=String(value||'').replace(/\s+/g,' ').trim();
  const sample=text.length>52?text.slice(0,52)+'…':text;
  return sample?`Перекладіть «${sample}» англійською`:'Введіть англійський переклад';
}
function validateTranslations(form){
  form.querySelectorAll('.admin-translation-missing').forEach(input=>{
    input.classList.remove('admin-translation-missing');input.removeAttribute('aria-invalid');
  });
  const missing=[];
  const check=(uk,en)=>{
    if(!uk||!en)return;
    const source=uk.value.trim(), translated=en.value.trim();
    if(source && (!translated || /[А-Яа-яІіЇїЄєҐґ]/.test(translated))){
      en.placeholder=translationHint(source);
      en.classList.add('admin-translation-missing');
      en.setAttribute('aria-invalid','true');
      missing.push(en);
    }
  };
  const nameUk=form.querySelector('[name="title"]'),nameEn=form.querySelector('[name="titleEn"]');
  check(nameUk,nameEn);
  // Missing required product names should be highlighted, including a missing UK name.
  if(nameUk&&!nameUk.value.trim()){
    nameUk.classList.add('admin-translation-missing');nameUk.setAttribute('aria-invalid','true');
    missing.unshift(nameUk);
  } else if(nameEn&&!nameEn.value.trim()&&!missing.includes(nameEn)){
    nameEn.placeholder=translationHint(nameUk?.value||'');
    nameEn.classList.add('admin-translation-missing');nameEn.setAttribute('aria-invalid','true');missing.push(nameEn);
  }
  check(form.querySelector('[name="description"]'),form.querySelector('[name="descriptionEn"]'));
  form.querySelectorAll('.admin-spec-section').forEach(section=>{
    check(section.querySelector('[data-spec-title]'),section.querySelector('[data-spec-title-en]'));
    section.querySelectorAll('.admin-spec-row').forEach(row=>{
      check(row.querySelector('[data-spec-label]'),row.querySelector('[data-spec-label-en]'));
      check(row.querySelector('[data-spec-value]'),row.querySelector('[data-spec-value-en]'));
    });
  });
  form.querySelectorAll('.admin-document-row').forEach(row=>check(row.querySelector('[data-doc-title]'),row.querySelector('[data-doc-title-en]')));
  if(missing.length){
    const first=missing[0];
    selectLanguage(form,first.closest?.('[data-editor-field-lang]')?.dataset.editorFieldLang||'en');
    first.focus({preventScroll:true});
    first.scrollIntoView?.({behavior:'smooth',block:'center'});
    return false;
  }
  return true;
}
async function readPdf(file){
  if(!root.AstelProductFiles)throw new Error('Не підключено сховище PDF');
  return root.AstelProductFiles.save(file);
}
async function extractDocuments(form){
  const rows=Array.from(form.querySelectorAll('.admin-document-row'));
  if(rows.length>MAX_DOCS)err('Максимум 8 PDF-файлів');
  const result=[];
  for(const row of rows){
    const file=row.querySelector('[data-doc-file]').files[0];
    const previous=row.dataset.originalDoc?JSON.parse(row.dataset.originalDoc):null;
    if(!file&&!previous)err('Оберіть PDF для нового документа');
    const title=row.querySelector('[data-doc-title]').value.trim(),titleEn=row.querySelector('[data-doc-title-en]').value.trim();
    if(!title||!titleEn)err('Назва PDF українською та англійською обов’язкова');
    const url=file?await readPdf(file):previous.url;
    const download=file?file.name.replace(/[\\/\x00-\x1f]/g,'_').slice(0,160):previous.download;
    result.push({title,titleEn,url,download});
  }
  return result;
}
function getState(form){if(!photoStates.has(form))photoStates.set(form,[]);return photoStates.get(form);}
function getPhotos(form){return getState(form).map(p=>p.file);}
function renderPhotos(form){
  const list=form.querySelector('[data-new-photo-list]');if(!list)return;
  const state=getState(form);
  list.innerHTML=state.map((item,i)=>`<div class="admin-photo-item ${i===0?'is-main':''}" draggable="true" tabindex="0" data-new-photo-index="${i}">
    <div class="admin-photo-item__preview"><img src="${esc(item.url)}" alt="${esc(item.file.name)}" draggable="false" />
    <button type="button" class="admin-photo-item__remove" data-remove-new-photo="${i}" aria-label="Видалити фото ${i+1}">×</button></div>
    <div class="admin-photo-item__footer"><span class="admin-photo-item__number">${i===0?'Головне':`Фото ${i+1}`}</span><span class="admin-photo-item__handle" aria-hidden="true">⠿</span></div>
  </div>`).join('');
  const count=form.querySelector('[data-new-photo-count]');if(count)count.textContent=`${state.length} / ${MAX_PHOTOS}`;
  const add=form.querySelector('[data-new-photo-add]');if(add)add.hidden=state.length>=MAX_PHOTOS;
}
function clearPhotos(form){getState(form).forEach(p=>URL.revokeObjectURL(p.url));photoStates.set(form,[]);renderPhotos(form);}
function movePhoto(form,from,to){const s=getState(form);if(from<0||to<0||from>=s.length||to>=s.length||from===to)return false;const [entry]=s.splice(from,1);s.splice(to,0,entry);renderPhotos(form);return true;}
function bind(form){
  getState(form);
  const warn=message=>root.alert?.(message);
  form.addEventListener('click',e=>{
    const btn=e.target.closest('button');if(!btn)return;
    const section=btn.closest('.admin-spec-section');
    if(btn.hasAttribute('data-editor-lang')){selectLanguage(form,btn.dataset.editorLang);return;}
    if(btn.hasAttribute('data-add-spec-section')){
      const container=form.querySelector('[data-spec-sections]');if(container.children.length>=MAX_SECTIONS)return warn('Максимум 8 таблиць');
      container.append(createSpecSection());refreshSuggestions(form);
    }else if(btn.hasAttribute('data-remove-spec-section')){section.remove();refreshSuggestions(form);
    }else if(btn.hasAttribute('data-add-spec-row')){
      const list=section.querySelector('.admin-spec-rows');if(list.children.length>=MAX_ROWS)return warn('Максимум 25 характеристик');list.append(createSpecRow());
    }else if(btn.hasAttribute('data-remove-spec-row')){btn.closest('.admin-spec-row').remove();
    }else if(btn.hasAttribute('data-add-doc-row')){
      const list=form.querySelector('[data-doc-rows]');if(list.children.length>=MAX_DOCS)return warn('Максимум 8 PDF');list.append(createDocRow());
    }else if(btn.hasAttribute('data-remove-doc-row')){btn.closest('.admin-document-row').remove();
    }else if(btn.hasAttribute('data-remove-new-photo')){const state=getState(form),item=state.splice(Number(btn.dataset.removeNewPhoto),1)[0];if(item)URL.revokeObjectURL(item.url);renderPhotos(form);}
  });
  form.querySelector('[data-editor-language-tabs]')?.addEventListener('keydown',e=>{
    if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;
    e.preventDefault();
    const lang=e.key==='Home'?'uk':e.key==='End'?'en':e.key==='ArrowLeft'?'uk':'en';
    selectLanguage(form,lang);
    form.querySelector(`[data-editor-lang="${lang}"]`)?.focus();
  });
  form.addEventListener('input',e=>{
    if(e.target.classList?.contains('admin-translation-missing') && e.target.value.trim() && !/[А-Яа-яІіЇїЄєҐґ]/.test(e.target.value)){
      e.target.classList.remove('admin-translation-missing');e.target.removeAttribute('aria-invalid');
    }
  });
  form.addEventListener('change',e=>{
    if(e.target.matches('[data-spec-title]')){
      const selected=customNames(form).find(x=>x.title.toLocaleLowerCase('uk')===e.target.value.trim().toLocaleLowerCase('uk'));
      if(selected){const en=e.target.closest('.admin-spec-section').querySelector('[data-spec-title-en]');if(!en.value)en.value=selected.titleEn;}
      refreshSuggestions(form);
    }
    if(e.target.matches('[name="photos"]')){
      const photos=getState(form),files=Array.from(e.target.files||[]);
      if(photos.length+files.length>MAX_PHOTOS){e.target.value='';return warn('Максимум 12 фотографій');}
      if(files.some(f=>!['image/png','image/jpeg','image/webp'].includes(f.type)||f.size>6*1024*1024)){e.target.value='';return warn('PNG, JPG, WebP до 6 МБ');}
      files.forEach(file=>photos.push({file,url:URL.createObjectURL(file)}));e.target.value='';renderPhotos(form);
    }
  });
  const list=form.querySelector('[data-new-photo-list]');
  if(list){let dragging=null;
    list.addEventListener('dragstart',e=>{const item=e.target.closest('[data-new-photo-index]');if(!item)return;dragging=Number(item.dataset.newPhotoIndex);e.dataTransfer.effectAllowed='move';e.dataTransfer.setData('text/plain',String(dragging));});
    list.addEventListener('dragover',e=>{if(dragging===null||!e.target.closest('[data-new-photo-index]'))return;e.preventDefault();e.dataTransfer.dropEffect='move';});
    list.addEventListener('drop',e=>{const target=e.target.closest('[data-new-photo-index]');if(!target||dragging===null)return;e.preventDefault();movePhoto(form,dragging,Number(target.dataset.newPhotoIndex));dragging=null;});
    list.addEventListener('dragend',()=>dragging=null);
    list.addEventListener('keydown',e=>{const node=e.target.closest('[data-new-photo-index]');if(!node||!e.altKey||!['ArrowLeft','ArrowRight'].includes(e.key))return;const idx=Number(node.dataset.newPhotoIndex),next=idx+(e.key==='ArrowLeft'?-1:1);if(movePhoto(form,idx,next)){e.preventDefault();list.querySelector(`[data-new-photo-index="${next}"]`)?.focus();}});
  }
  renderPhotos(form);refreshSuggestions(form);selectLanguage(form,form.dataset.editorLanguage||'uk');
  if(root.addEventListener)root.addEventListener('astel:catalog-updated',()=>refreshSuggestions(form));
}
function reset(form){populate(form,null);clearPhotos(form);}
const api={bind,reset,populate,extractProductNames,extractDescriptions,extractSections,extractDocuments,readPdf,getPhotos,customNames,movePhoto,createSpecSection,createDocRow,englishFromDictionary,englishInitial,selectLanguage,validateTranslations,tableType};
root.AstelProductEditor=api;
if(typeof module==='object'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
