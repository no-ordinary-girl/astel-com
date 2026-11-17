/* Admin delivery dropdown adapter. Do NOT generate fictional live branch availability. */
'use strict';
const AdminDelivery = Object.freeze({
  cityOptions() {
    const cities=typeof UKRAINE_ACTIVE_CITIES!=='undefined' ? UKRAINE_ACTIVE_CITIES : [];
    return [...new Set(cities.map(c=>c.name))].sort((a,b)=>a.localeCompare(b,'uk'));
  },
  uniqueBranches(values) {
    return [...new Set((values||[]).map(x=>String(x||'').trim()).filter(Boolean))];
  },
  orderBranches(orders,city,carrier,type) {
    const normalized=s=>String(s||'').trim().toLocaleLowerCase('uk');
    return this.uniqueBranches((orders||[])
      .filter(o=>normalized(o.delivery?.city)===normalized(city) && o.delivery?.carrierKey===carrier &&
        (o.delivery?.type||'Відділення')===type)
      .map(o=>o.delivery.branch));
  },
  async fetchVerifiedBranches(city,carrier,type) {
    // Configured only when a trusted backend is available; never expose carrier API keys in the frontend.
    const endpoint=typeof window!=='undefined' && window.ASTEL_DELIVERY_DIRECTORY_URL;
    if(!endpoint || !city || !['nova','ukr','meest'].includes(carrier))return null;
    const url=new URL(endpoint,window.location.origin);
    if(url.origin!==window.location.origin)throw new Error('Delivery directory must be same-origin');
    url.searchParams.set('city',city); url.searchParams.set('carrier',carrier); url.searchParams.set('type',type);
    const response=await fetch(url,{credentials:'same-origin'});
    if(!response.ok)throw new Error('Delivery directory temporarily unavailable');
    const payload=await response.json();
    if(!Array.isArray(payload.branches))throw new Error('Invalid delivery directory response');
    return this.uniqueBranches(payload.branches.filter(x=>typeof x==='string')).slice(0,300);
  },
});
if(typeof module!=='undefined'&&module.exports)module.exports=AdminDelivery;
