// Order payment/revenue rules for the localStorage demo.
// Revenue is a per-order amount, not an additive status-transition counter.
const OrderFinance = Object.freeze({
  isCash(payment) { return /готівк|cash/i.test(String(payment||'')); },
  paymentStatus(order) {
    if(typeof AstelAdminPayments !== 'undefined') return AstelAdminPayments.status(order);
    if(order?.paymentVerification?.verified===true && order?.paymentVerification?.provider && order?.paymentVerification?.orderId===String(order.orderId||order.id) &&
      Number(order.paymentVerification.amount)===Number(order.subtotal) && order.paymentVerification.currency==='UAH') {
      return order?.paymentStatus==='paid' ? 'paid' : 'unpaid';
    }
    return this.isCash(order?.payment) ? 'cash-on-delivery' : 'unpaid';
  },
  paymentLabel(order,language='uk') {
    const state=this.paymentStatus(order);
    if (state==='partial') return language==='en' ? 'Partially paid' : 'Частково сплачено';
    if (state==='overpaid') return language==='en' ? 'Overpaid' : 'Переплата';
    if (state==='pending') return language==='en' ? 'Payment awaiting confirmation' : 'Очікує підтвердження платежу';
    if(language==='en')return state==='paid'?(typeof AstelAdminPayments !== 'undefined' && AstelAdminPayments.entriesFor(order.orderId||order.id).length ? 'Payment confirmed by manager' : 'Paid (verified)'):state==='cash-on-delivery'?'Pay on delivery':'Awaiting payment confirmation';
    return state==='paid' ? (typeof AstelAdminPayments !== 'undefined' && AstelAdminPayments.entriesFor(order.orderId||order.id).length ? 'Оплату підтверджено менеджером' : 'Сплачено (підтверджено)') : state==='cash-on-delivery' ? 'Оплата при отриманні' : 'Очікує підтвердження оплати';
  },
  acceptedGreen(order) { return this.isCash(order?.payment) || this.paymentStatus(order)==='paid'; },
  contribution(order) {
    if(order?.statusCode==='canceled') return 0;
    if(Number.isFinite(Number(order?.recognizedRevenue)) && order?.recognizedRevenue !== undefined && order?.recognizedRevenue !== null)
      return Math.max(0,Number(order.recognizedRevenue));
    return order?.statusCode==='completed' ? Math.max(0,Number(order.subtotal)||0) : 0;
  },
  transition(order,nextCode) {
    if(!['active','processing','shipped','completed','canceled'].includes(nextCode))
      throw new Error('Невірний статус замовлення');
    let recognizedRevenue=this.contribution(order);
    if(nextCode==='canceled') recognizedRevenue=0;
    if(nextCode==='completed') recognizedRevenue=Math.max(0,Number(order.subtotal)||0);
    return {...order,statusCode:nextCode,recognizedRevenue,locked:nextCode!=='active'};
  },
  total(orders) {
    const map=new Map();
    for(const ord of orders) map.set(String(ord.orderId||ord.id),ord);
    return [...map.values()].reduce((sum,o)=>sum+this.contribution(o),0);
  },
  validateEdits(customer,delivery,items) {
    const c=customer||{},d=delivery||{};
    if(!String(c.firstName||'').trim() || !String(c.lastName||'').trim()) throw new Error('Вкажіть ім’я та прізвище клієнта');
    if(!/^\+?[\d()\s-]{9,22}$/.test(String(c.phone||''))) throw new Error('Некоректний номер телефону');
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(c.email||''))) throw new Error('Некоректна електронна адреса');
    if(!String(d.city||'').trim() || !String(d.branch||'').trim()) throw new Error('Вкажіть місто та адресу доставки');
    if(!['nova','ukr','meest'].includes(d.carrierKey)) throw new Error('Невідома служба доставки');
    if(!Array.isArray(items) || !items.length || items.length>50) throw new Error('Замовлення повинно містити 1–50 товарів');
    for(const item of items) {
      if(!Number.isSafeInteger(item.qty)||item.qty<1||item.qty>1000000 ||
        !Number.isSafeInteger(item.price)||item.price<1||item.price>99999999)
        throw new Error('Некоректна кількість або ціна товару');
    }
    const total=items.reduce((sum,i)=>sum+i.qty*i.price,0);
    if(!Number.isSafeInteger(total) || total>Number.MAX_SAFE_INTEGER) throw new Error('Сума замовлення занадто велика');
    return total;
  },
});
if(typeof module!=='undefined' && module.exports) module.exports=OrderFinance;
