/* New-product editor: repeatable specification tables and browser-local PDF uploads. */
(function (root) {
  'use strict';
  const MAX_PDF_BYTES = 950000;
  const MAX_DOCS = 8;
  const MAX_SECTIONS = 8;
  const MAX_ROWS = 25;

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
        // Some Android browsers return an empty/octet-stream MIME for .pdf files.
        const match = /^data:[^,]*;base64,([A-Za-z0-9+/]+={0,2})$/.exec(data);
        if (!match || !match[1].startsWith('JVBER'))
          reject(new Error('Некоректний PDF-файл'));
        else resolve('data:application/pdf;base64,' + match[1]);
      };
      reader.readAsDataURL(file);
    });
  }

  function extractSections(form) {
    return Array.from(form.querySelectorAll('.admin-spec-section')).map(section => {
      const type = section.querySelector('[data-spec-type]').value;
      const rows = Array.from(section.querySelectorAll('.admin-spec-row')).map(row => ({
        label: row.querySelector('[data-spec-label]').value.trim(),
        value: row.querySelector('[data-spec-value]').value.trim(),
      })).filter(row => row.label || row.value);
      if (!rows.length || rows.some(row => !row.label || !row.value))
        throw new Error('Кожна таблиця повинна мати заповнені назву та значення хоча б одного рядка');
      return { type, rows };
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
      // The download filename is safe to use in a download attribute.
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
        <label>Тип таблиці
          <select data-spec-type><option value="tech">Технічні характеристики</option><option value="general">Основні характеристики</option></select>
        </label>
        <button class="admin-extra-remove" type="button" data-remove-spec-section>Видалити таблицю</button>
      </div><div class="admin-spec-rows"></div>
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
  function bind(form) {
    form.addEventListener('click', e => {
      const action = e.target.closest('[data-add-spec-section],[data-remove-spec-section],\
        [data-add-spec-row],[data-remove-spec-row],[data-add-doc-row],[data-remove-doc-row]');
      if (!action) return;
      if (action.hasAttribute('data-add-spec-section')) {
        const list = form.querySelector('[data-spec-sections]');
        if (list.children.length >= MAX_SECTIONS) return window.alert('Максимум 8 таблиць');
        list.append(createSpecSection());
      } else if (action.hasAttribute('data-remove-spec-section')) {
        action.closest('.admin-spec-section').remove();
      } else if (action.hasAttribute('data-add-spec-row')) {
        const list = action.closest('.admin-spec-section').querySelector('.admin-spec-rows');
        if (list.children.length >= MAX_ROWS) return window.alert('Максимум 25 характеристик у таблиці');
        list.append(createSpecRow());
      } else if (action.hasAttribute('data-remove-spec-row')) {
        action.closest('.admin-spec-row').remove();
      } else if (action.hasAttribute('data-add-doc-row')) {
        const list = form.querySelector('[data-doc-rows]');
        if (list.children.length >= MAX_DOCS) return window.alert('Максимум 8 PDF-файлів');
        list.append(createDocRow());
      } else if (action.hasAttribute('data-remove-doc-row')) {
        action.closest('.admin-document-row').remove();
      }
    });
  }
  function reset(form) {
    form.querySelector('[data-spec-sections]')?.replaceChildren();
    form.querySelector('[data-doc-rows]')?.replaceChildren();
  }
  const api = { bind, reset, extractSections, extractDocuments, readPdf };
  root.AstelProductEditor = api;
  if (typeof module === 'object' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
