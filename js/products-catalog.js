/* Product listing: generated exclusively from products-data.js (no duplicate HTML cards). */
(() => {
  'use strict';
  document.addEventListener('DOMContentLoaded', () => {
    const grid=document.getElementById('product-grid');
    if(!grid || typeof PRODUCTS_DATA==='undefined') return;
    const $=id=>document.getElementById(id);
    const minInput=$('filter-min'), maxInput=$('filter-max'),rMin=$('range-min'),rMax=$('range-max');
    const progress=$('range-progress'),stockOnly=$('filter-instock'),counter=$('product-counter');
    const sidebar=$('sidebar');
    const categoriesList=sidebar.querySelector('.sidebar__list');
    let links=[];
    const en=document.documentElement.lang==='en'||/\/en\//.test(location.pathname);
    const loc=(uk,english)=>en?english:uk;
    let category=new URLSearchParams(location.search).get('category')||'all';
    let low=0,high=1,step=1;
    const esc=s=>String(s??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
    const translate=text=>en && typeof I18nManager!=='undefined' ? I18nManager.translate(text) : text;
    const image=p=>CatalogManager.validImageSource(p.images?.[0]) ? p.images[0] : p.image;
    function makeCard(p) {
      const title=en && p.titleEn ? p.titleEn : translate(p.title);
      const href=`${en?'en/':''}product.html?id=${encodeURIComponent(p.id)}`;
      const min=CartManager.getMinQty(p);
      const qty=p.inStock ? `<div class="product-card__qty-control">
          <button type="button" class="product-card__qty-btn" data-action="dec" disabled aria-label="${loc('Зменшити','Decrease')}">−</button>
          <input type="number" class="product-card__qty-input" min="${min}" max="1000000" value="${min}" aria-label="${loc('Кількість','Quantity')}" />
          <button type="button" class="product-card__qty-btn" data-action="inc" aria-label="${loc('Збільшити','Increase')}">+</button>
        </div>` : '';
      const sale=en?(p.saleTermsCode==='retail'?'Wholesale & Retail':'Wholesale Only'):p.saleTerms;
      const stock=en?(p.inStock?'Available to order':'Out of Stock'):p.stockText;
      const from=p.id==='com-900-psg-4g'?loc('від ','from '):'';
      return `<article class="product-card" data-product-id="${esc(p.id)}" data-category="${esc(p.category)}" data-price="${p.numericPrice}" data-instock="${p.inStock}">
        <button class="product-card__cart" type="button" aria-label="${loc('Додати в кошик','Add to cart')}" title="${p.inStock?loc('Додати в кошик','Add to cart'):loc('Немає в наявності','Out of stock')}" ${p.inStock?'':'disabled'}>
          <img src="assets/images/shopping_cart.svg" class="cart-icon-black" alt="" />
        </button>
        <a href="${href}" class="product-card__image-wrap"><img src="${esc(image(p))}" alt="${esc(title)}" class="product-card__img" loading="lazy" /></a>
        <a href="${href}" class="product-card__title">${esc(title)}</a>
        <div class="product-card__bottom">
          <div class="product-card__price">${from}${esc(p.price)}<span class="product-card__item"> / ${loc('шт','pc')}</span></div>
          <div class="product-card__status ${p.inStock?'product-card__status--instock':'product-card__status--outstock'}">${stock} | ${sale}</div>
        </div>
        <div class="product-card__footer"><span>${loc('Ціна без ПДВ','Price excluding VAT')}</span>${qty}</div>
      </article>`;
    }
    function renderSidebar(items) {
      const entries=[['all',loc('УСІ ТОВАРИ','ALL PRODUCTS')],
        ...Object.keys(CatalogManager.CATEGORIES).map(code=>[code,CatalogManager.getCategoryName(code,en)])];
      categoriesList.innerHTML=entries.map(([code,name])=>{
        const count=code==='all'?items.length:items.filter(p=>p.category===code).length;
        return `<li class="sidebar__item"><a href="#" class="sidebar__link ${code===category?'sidebar__link--active':''}" data-target="${esc(code)}">
          <span>${esc(name)}</span><span class="sidebar__count">${count}</span></a></li>`;
      }).join('');
      links=[...categoriesList.querySelectorAll('.sidebar__link[data-target]')];
      if(category!=='all' && !CatalogManager.CATEGORIES[category]) category='all';
    }
    function renderCatalog(){
      const items=Object.values(PRODUCTS_DATA).filter(p => p.isVisible !== false);
      renderSidebar(items);
      grid.innerHTML=items.map(makeCard).join('');
      for(const link of links){
        const cat=link.dataset.target;
        const count=cat==='all'?items.length:items.filter(p=>p.category===cat).length;
        const node=link.querySelector('.sidebar__count');if(node)node.textContent=count;
        link.classList.toggle('sidebar__link--active',cat===category);
      }
      const prices=items.map(p=>Number(p.numericPrice));
      low=Math.min(...prices,0);high=Math.max(...prices,1);
      if(items.length){low=Math.min(...prices);high=Math.max(...prices);}
      if(low===high)high=low+1;
      step=Math.min(100,Math.max(1,high-low));
      for(const input of [minInput,maxInput,rMin,rMax]){input.min=low;input.max=high;}
      minInput.value=rMin.value=low;maxInput.value=rMax.value=high;
      const count=document.querySelector('.filter-checkbox .count');
      if(count)count.textContent=`(${items.filter(p=>p.inStock).length})`;
      updateProgress();applyFilters();
    }
    function applyFilters(){
      const min=Number(minInput.value);const max=Number(maxInput.value);
      const instock=stockOnly.checked;
      let count=0;
      for(const card of grid.querySelectorAll('.product-card')) {
        const visible=(category==='all'||card.dataset.category===category) && Number(card.dataset.price)>=min && Number(card.dataset.price)<=max && (!instock||card.dataset.instock==='true');
        card.style.display=visible?'flex':'none';if(visible)count++;
      }
      counter.textContent=en?`${count} ${count===1?'product':'products'}` : count===0?'Товарів не знайдено': count===1?'1 товар':count<=4?`${count} товари`:`${count} товарів`;
    }
    function updateProgress(){
      const span=high-low||1;
      progress.style.left=`${Math.max(0,100*(Number(rMin.value)-low)/span)}%`;
      progress.style.right=`${Math.max(0,100*(high-Number(rMax.value))/span)}%`;
    }
    function rangeChanged(e){
      let min=Number(rMin.value),max=Number(rMax.value);
      if(max-min<step){
        if(e.target===rMin) min=Math.max(low,max-step);
        else max=Math.min(high,min+step);
      }
      rMin.value=min;rMax.value=max;
      minInput.value=min;maxInput.value=max;
      updateProgress();applyFilters();
    }
    function fieldsChanged(){
      let min=Math.max(low,Math.min(high,Number(minInput.value)));
      let max=Math.max(low,Math.min(high,Number(maxInput.value)));
      if(max-min<step){if(min+step<=high)max=min+step;else min=max-step;}
      minInput.value=rMin.value=min;maxInput.value=rMax.value=max;
      updateProgress();applyFilters();
    }
    for(const el of [rMin,rMax]) el.addEventListener('input',rangeChanged);
    for(const el of [minInput,maxInput])el.addEventListener('change',fieldsChanged);
    stockOnly.addEventListener('change',applyFilters);
    categoriesList.addEventListener('click',e=>{
      const link=e.target.closest('.sidebar__link[data-target]');if(!link)return;
      e.preventDefault();category=link.dataset.target;
      links.forEach(l=>l.classList.toggle('sidebar__link--active',l===link));
      const url=new URL(location.href);
      if(category==='all') url.searchParams.delete('category');
      else url.searchParams.set('category',category);
      history.replaceState({},'',url);
      applyFilters();if(innerWidth<960)sidebar.classList.remove('sidebar--open');
    });
    $('filter-toggle')?.addEventListener('click',()=>sidebar.classList.toggle('sidebar--open'));
    grid.addEventListener('click',e=>{
      const card=e.target.closest('.product-card');if(!card)return;
      const p=PRODUCTS_DATA[card.dataset.productId];if(!p)return;
      const input=card.querySelector('.product-card__qty-input');
      const min=CartManager.getMinQty(p);
      if(e.target.closest('.product-card__qty-btn')) {
        const delta=e.target.closest('[data-action="inc"]')?1:-1;
        const qty=Math.max(min,Math.min(1000000,(Number(input.value)||min)+delta));
        input.value=qty;card.querySelector('[data-action="dec"]').disabled=qty<=min;return;
      }
      if(e.target.closest('.product-card__cart') && p.inStock)
        CartManager.addItem(p,Math.max(min,Math.min(1000000,Number(input?.value)||min)));
    });
    grid.addEventListener('change',e=>{
      if(e.target.matches('.product-card__qty-input')) {
        const card=e.target.closest('.product-card');const p=PRODUCTS_DATA[card.dataset.productId];
        const min=CartManager.getMinQty(p);e.target.value=Math.max(min,Math.min(1000000,Number(e.target.value)||min));
        card.querySelector('[data-action="dec"]').disabled=Number(e.target.value)<=min;
      }
    });
    const top=$('back-to-top'),footer=$('footer');
    if(top){
      window.addEventListener('scroll',()=>{
        top.classList.toggle('show',window.scrollY>300);
        if(footer)top.classList.toggle('back-to-top--inverted',footer.getBoundingClientRect().top<=innerHeight-24);
      });
      top.addEventListener('click',()=>scrollTo({top:0,behavior:'smooth'}));
    }
    window.addEventListener('astel:catalog-updated',renderCatalog);
    renderCatalog();
  });
})();
