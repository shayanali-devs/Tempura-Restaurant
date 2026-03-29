// ============================================================
//  TEMPURA POTATO — app.js v3.0
//  CRITICAL FIX: Cart reads localStorage only, NEVER overwrites on load
// ============================================================

const firebaseConfig = {
  apiKey: "AIzaSyCD9Xm9Etzxg5Avy9n4sHP-SW0Ei-ZTcHA",
  authDomain: "tempura-potato-deep.firebaseapp.com",
  databaseURL: "https://tempura-potato-deep-default-rtdb.firebaseio.com",
  projectId: "tempura-potato-deep",
  storageBucket: "tempura-potato-deep.firebasestorage.app",
  messagingSenderId: "516857155009",
  appId: "1:516857155009:web:c5ed7f3bac91d2fc127340",
  measurementId: "G-9FW6P8L7VP"
};

let db = null, auth = null;
try {
  if (!firebase.apps || !firebase.apps.length) firebase.initializeApp(firebaseConfig);
  db = firebase.database();
  auth = firebase.auth ? firebase.auth() : null;
} catch(e) { console.warn('Firebase:', e.message); }

const IMGBB_KEY = 'ab7a51eaed988c67582fc8bcc877df5a';

async function uploadToImgBB(file) {
  const fd = new FormData(); fd.append('image', file);
  const res = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_KEY}`, { method:'POST', body:fd });
  const data = await res.json();
  if (data.success) return data.data.url;
  throw new Error('ImgBB upload failed');
}

// ─── MENU DATA ─────────────────────────────────────────────
const DEFAULT_MENU = [
  { id:'b1', name:'Grill Burger', cat:'burgers', price:320, img:'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&q=80', desc:'Flame-grilled patty, fresh veggies & signature sauce' },
  { id:'b2', name:'Zinger Burger', cat:'burgers', price:350, img:'https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=500&q=80', desc:'Crispy zinger patty, crunchy lettuce, special sauce' },
  { id:'b3', name:'Zinger Twister', cat:'burgers', price:380, img:'https://images.unsplash.com/photo-1572802419224-296b0aeee0d9?w=500&q=80', desc:'Crispy zinger in a soft tortilla with fresh veggies' },
  { id:'b4', name:'Patty Burger', cat:'burgers', price:300, img:'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=500&q=80', desc:'Double patty with classic sauce & toppings' },
  { id:'w1', name:'Chicken Bhayari Roll', cat:'wraps', price:300, img:'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=500&q=80', desc:'Classic chicken bhayari in soft flaky paratha' },
  { id:'w2', name:'Seekh Kabab Roll', cat:'wraps', price:250, img:'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=500&q=80', desc:'Juicy seekh kababs rolled in fresh paratha' },
  { id:'w3', name:'Mala Boti Wrap', cat:'wraps', price:450, img:'https://images.unsplash.com/photo-1561043433-aaf687c4cf04?w=500&q=80', desc:'Spicy mala boti with crispy fries inside a wrap' },
  { id:'w4', name:'Zinger Wrap', cat:'wraps', price:350, img:'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=500&q=80', desc:'Zinger patty with lettuce & sauce in a tortilla' },
  { id:'w5', name:'Shapath Roll', cat:'wraps', price:390, img:'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=500&q=80', desc:'Loaded shapath in flaky paratha, street-style' },
  { id:'w6', name:'Dhamaka Roll', cat:'wraps', price:490, img:'https://images.unsplash.com/photo-1600891964092-4316c288032e?w=500&q=80', desc:'The ultimate roll — fully loaded, fully flavoured' },
  { id:'w7', name:'Malai Boti Roll', cat:'wraps', price:420, img:'https://images.unsplash.com/photo-1606755962773-d324e0a13086?w=500&q=80', desc:'Creamy malai boti wrapped in hot paratha' },
  { id:'w8', name:'Chicken Shawarma', cat:'wraps', price:280, img:'https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=500&q=80', desc:'Fresh grilled chicken shawarma with garlic sauce' },
  { id:'w9', name:'Special Grilled Shawarma', cat:'wraps', price:380, img:'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=500&q=80', desc:'Upgraded shawarma — extra toppings, extra flavour' },
  { id:'c1', name:'Taka Grilled Chicken', cat:'sides', price:250, img:'https://images.unsplash.com/photo-1598103442097-8b74394b95c3?w=500&q=80', desc:'Perfectly grilled taka-style chicken' },
  { id:'s1', name:'Plane Fries', cat:'sides', price:120, img:'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=500&q=80', desc:'Classic golden crispy fries' },
  { id:'s2', name:'Loaded Fries', cat:'sides', price:180, img:'https://images.unsplash.com/photo-1585109649139-366815a0d713?w=500&q=80', desc:'Fries loaded with cheese sauce & toppings' },
  { id:'s3', name:'Next Cola 1L', cat:'sides', price:120, img:'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500&q=80', desc:'Chilled Next Cola 1 litre' },
  { id:'d1', name:'Deal 1', cat:'deals', price:600, img:'https://images.unsplash.com/photo-1561758033-d89a9ad46330?w=500&q=80', desc:'2 Zinger Burgers + 2 Next Colas', includes:['2 Zinger Burgers','2 Next Colas'] },
  { id:'d2', name:'Deal 2', cat:'deals', price:420, img:'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=500&q=80', desc:'2 Zinger Twisters + 1 Plane Fries', includes:['2 Zinger Twisters','1 Plane Fries'] },
  { id:'d3', name:'Deal 3', cat:'deals', price:380, img:'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=500&q=80', desc:'1 Zinger + 1 Fries + 1 Drink', includes:['1 Zinger Burger','1 Plane Fries','1 Drink'] },
  { id:'d4', name:'Deal 4', cat:'deals', price:480, img:'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=500&q=80', desc:'2 Patty Burgers + 1L Next Cola', includes:['2 Patty Burgers','1L Next Cola'] },
  { id:'d5', name:'Deal 5', cat:'deals', price:550, img:'https://images.unsplash.com/photo-1550547660-d9450f859349?w=500&q=80', desc:'1 Zinger + 1 Shawarma + Half Drink', includes:['1 Zinger Burger','1 Shawarma','Half Drink'] },
  { id:'d6', name:'Family Deal', cat:'deals', price:1000, img:'https://images.unsplash.com/photo-1552895638-f7fe08d2f7d5?w=500&q=80', desc:'2 Patty + 2 Zingers + 1L Cola + Loaded Fries', includes:['2 Patty Burgers','2 Zingers','1L Cola','Loaded Fries'] },
  { id:'d7', name:'Mega Deal', cat:'deals', price:1250, img:'https://images.unsplash.com/photo-1607013251379-e6eecfffe234?w=500&q=80', desc:'4 Zingers + 1L Cola + 1 Loaded Fries', includes:['4 Zinger Burgers','1L Next Cola','Loaded Fries'] },
  { id:'d8', name:'Feast Deal', cat:'deals', price:1480, img:'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&q=80', desc:'5 Grill Burgers + 2 Loaded Fries + 1L Cola', includes:['5 Grill Burgers','2 Loaded Fries','1L Cola'] },
  { id:'d9', name:'Party Deal', cat:'deals', price:1500, img:'https://images.unsplash.com/photo-1551782450-a2132b4ba21d?w=500&q=80', desc:'6 Patty Burgers + 1L Cola + Loaded Fries', includes:['6 Patty Burgers','1L Cola','Loaded Fries'] },
  { id:'d10', name:'Legendary Deal', cat:'deals', price:2000, img:'https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=500&q=80', desc:'Ultimate party pack', includes:['2 Patty','2 Zingers','2 Grill','2 Loaded Fries','2L Cola'] },
];

// ─── CART — FULLY FIXED ────────────────────────────────────
const CART_KEY = 'tp_cart_v3';

function getCart() {
  try { const r = localStorage.getItem(CART_KEY); return r ? JSON.parse(r) : []; }
  catch(e) { return []; }
}

function saveCartData(cart) { localStorage.setItem(CART_KEY, JSON.stringify(cart)); }

function addToCart(item, qty) {
  qty = qty || 1;
  const cart = getCart();
  const idx = cart.findIndex(c => c.id === item.id);
  if (idx >= 0) cart[idx].qty += qty;
  else cart.push({ id:item.id, name:item.name, price:item.price, img:item.img||'', cat:item.cat||'', qty:qty });
  saveCartData(cart);
  updateCartBadge();
  showToast(item.name + ' added to cart 🛒');
  // fly animation
  const evt = window._lastClickEvent;
  if (evt) flyToCart(evt);
}

function removeFromCart(id) { saveCartData(getCart().filter(c => c.id !== id)); updateCartBadge(); }
function updateCartQty(id, qty) {
  const cart = getCart();
  const idx = cart.findIndex(c => c.id === id);
  if (idx >= 0) { if (qty <= 0) cart.splice(idx, 1); else cart[idx].qty = qty; }
  saveCartData(cart); updateCartBadge();
}
function clearCart() { localStorage.removeItem(CART_KEY); updateCartBadge(); }

function updateCartBadge() {
  const total = getCart().reduce((s,c) => s+c.qty, 0);
  document.querySelectorAll('.cart-count').forEach(el => el.textContent = total);
  const f = document.getElementById('cart-float');
  if (f) f.classList.toggle('show', total > 0);
}

// Track last click for fly animation
document.addEventListener('click', e => { window._lastClickEvent = e; }, true);

function flyToCart(e) {
  const cartIcon = document.getElementById('cart-float');
  if (!cartIcon || !e.clientX) return;
  const dot = document.createElement('div');
  const cr = cartIcon.getBoundingClientRect();
  dot.style.cssText = `position:fixed;width:12px;height:12px;background:var(--yellow);border-radius:50%;z-index:99999;pointer-events:none;left:${e.clientX}px;top:${e.clientY}px;transition:left 0.65s cubic-bezier(0.2,1,0.3,1),top 0.65s cubic-bezier(0.2,1,0.3,1),transform 0.65s,opacity 0.65s;`;
  document.body.appendChild(dot);
  requestAnimationFrame(() => requestAnimationFrame(() => {
    dot.style.left = (cr.left + cr.width/2) + 'px';
    dot.style.top = (cr.top + cr.height/2) + 'px';
    dot.style.transform = 'scale(0)';
    dot.style.opacity = '0';
  }));
  setTimeout(() => dot.remove(), 700);
}

// ─── TOAST ─────────────────────────────────────────────────
function showToast(msg, type) {
  let t = document.getElementById('tp-toast');
  if (!t) { t = document.createElement('div'); t.id = 'tp-toast'; document.body.appendChild(t); }
  t.className = 'tp-toast-el' + (type === 'error' ? ' toast-error' : '');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._t);
  t._t = setTimeout(() => t.classList.remove('show'), 2600);
}

// ─── FIREBASE SETTINGS — applies to ALL pages ──────────────
async function loadFirebaseSettings() {
  if (!db) return;
  try {
    const snap = await db.ref('settings').once('value');
    const s = snap.val(); if (!s) return;
    const b = s.branding || {};
    if (b.accentColor) {
      document.documentElement.style.setProperty('--yellow', b.accentColor);
      const hex = b.accentColor.replace('#','');
      const r=parseInt(hex.slice(0,2),16), g=parseInt(hex.slice(2,4),16), bl=parseInt(hex.slice(4,6),16);
      document.documentElement.style.setProperty('--yellow-glow', `rgba(${r},${g},${bl},0.3)`);
    }
    if (b.bgColor) document.documentElement.style.setProperty('--black', b.bgColor);
    if (b.cardRadius) document.documentElement.style.setProperty('--radius', b.cardRadius);
    if (b.restaurantName) document.querySelectorAll('.tp-brand-name').forEach(el => el.textContent = b.restaurantName);
    if (b.tagline) document.querySelectorAll('.tp-tagline').forEach(el => el.textContent = b.tagline);
    if (b.phone) document.querySelectorAll('.tp-phone').forEach(el => el.textContent = b.phone);
    if (b.address) document.querySelectorAll('.tp-address').forEach(el => el.textContent = b.address);
    if (b.logoEmoji) document.querySelectorAll('.tp-logo-emoji').forEach(el => el.textContent = b.logoEmoji);
    if (s.content?.announcementBar) {
      const bar = document.getElementById('announcement-bar');
      if (bar) { bar.innerHTML = s.content.announcementBar; bar.style.display = 'flex'; }
    }
    if (s.content?.maintenanceMode && !window.location.pathname.includes('admin')) {
      document.body.innerHTML = `<div style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:#0a0a0a;color:#fff;text-align:center;padding:40px"><div><div style="font-size:64px;margin-bottom:16px">🔧</div><h1 style="font-family:sans-serif;font-size:32px;color:#f5c842;margin-bottom:12px">Under Maintenance</h1><p style="color:#888;font-size:16px">${s.content.maintenanceMsg||'We will be back shortly!'}</p></div></div>`;
    }
  } catch(e) { console.warn('Settings:', e); }
}

// ─── PROMO CODE VALIDATION ─────────────────────────────────
async function validatePromoCode(code) {
  const now = Date.now();
  const builtIn = {
    'APP20': { discount:0.20, label:'20% App Discount' },
    'FIRSTORDER': { discount:0.20, label:'20% First Order' },
  };
  if (builtIn[code]) return builtIn[code];
  if (!db) return null;
  try {
    const snap = await db.ref('promoCodes/'+code).once('value');
    const d = snap.val(); if (!d) return null;
    if (d.expiry && d.expiry < now) return { expired:true, msg:'This promo code has expired' };
    if (d.usageLimit && (d.usageCount||0) >= d.usageLimit) return { expired:true, msg:'Promo code usage limit reached' };
    if (d.minOrder && 0 < d.minOrder) return d; // caller checks order amount
    return d;
  } catch(e) { return null; }
}

// ─── SCROLL ANIMATIONS ─────────────────────────────────────
function initScrollAnimations() {
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('in-view');
        e.target.querySelectorAll('.stagger-child').forEach((c,i) => setTimeout(() => c.classList.add('in-view'), i*120));
      }
    });
  }, { threshold:0.08, rootMargin:'0px 0px -50px 0px' });
  document.querySelectorAll('.reveal,.reveal-left,.reveal-right,.reveal-scale').forEach(el => io.observe(el));
}

// ─── TILT CARDS ────────────────────────────────────────────
function initTiltEffect() {
  if (window.matchMedia('(pointer:coarse)').matches) return;
  document.querySelectorAll('.tilt-card').forEach(card => {
    card.addEventListener('mousemove', e => {
      const r = card.getBoundingClientRect();
      const x = (e.clientX-r.left)/r.width - 0.5;
      const y = (e.clientY-r.top)/r.height - 0.5;
      card.style.transform = `perspective(800px) rotateY(${x*10}deg) rotateX(${-y*10}deg) translateZ(8px)`;
    });
    card.addEventListener('mouseleave', () => { card.style.transform = ''; });
  });
}

// ─── MOUSE PARALLAX ────────────────────────────────────────
function initMouseParallax() {
  if (window.matchMedia('(pointer:coarse)').matches) return;
  document.addEventListener('mousemove', e => {
    const x = (e.clientX/window.innerWidth - 0.5)*2;
    const y = (e.clientY/window.innerHeight - 0.5)*2;
    document.querySelectorAll('[data-parallax]').forEach(el => {
      const d = parseFloat(el.dataset.parallax)||0.02;
      el.style.transform = `translate(${x*d*80}px,${y*d*80}px)`;
    });
  });
}

// ─── SCROLL PARALLAX ───────────────────────────────────────
function initParallaxScroll() {
  window.addEventListener('scroll', () => {
    const sy = window.scrollY;
    document.querySelectorAll('[data-scroll-speed]').forEach(el => {
      const s = parseFloat(el.dataset.scrollSpeed)||0.3;
      el.style.transform = `translateY(${sy*s}px)`;
    });
  }, { passive:true });
}

// ─── CUSTOM CURSOR ─────────────────────────────────────────
function initCursor() {
  if (window.matchMedia('(pointer:coarse)').matches) return;
  const cur = document.createElement('div'); cur.id='tp-cursor';
  cur.innerHTML = '<div class="cur-dot"></div><div class="cur-ring"></div>';
  document.body.appendChild(cur);
  let mx=0,my=0,cx=0,cy=0;
  document.addEventListener('mousemove', e => { mx=e.clientX; my=e.clientY; cur.style.opacity='1'; });
  (function anim(){ cx+=(mx-cx)*0.12; cy+=(my-cy)*0.12; cur.style.left=cx+'px'; cur.style.top=cy+'px'; requestAnimationFrame(anim); })();
  document.querySelectorAll('a,button,.menu-card,.deal-card,.tilt-card').forEach(el => {
    el.addEventListener('mouseenter', () => cur.classList.add('hover'));
    el.addEventListener('mouseleave', () => cur.classList.remove('hover'));
  });
}

// ─── COUNTER ANIMATION ─────────────────────────────────────
function initCounters() {
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const target = parseInt(e.target.dataset.count);
      const suffix = e.target.dataset.suffix||'';
      let start = null;
      (function step(ts) {
        if (!start) start=ts;
        const p = Math.min((ts-start)/2000,1);
        e.target.textContent = Math.floor((1-Math.pow(1-p,3))*target) + suffix;
        if (p<1) requestAnimationFrame(step);
      })(performance.now());
      io.unobserve(e.target);
    });
  }, {threshold:0.5});
  document.querySelectorAll('[data-count]').forEach(el => io.observe(el));
}

// ─── RIPPLE ────────────────────────────────────────────────
document.addEventListener('click', e => {
  const btn = e.target.closest('.btn-primary,.btn-secondary,.menu-card-add,.deal-card button');
  if (!btn) return;
  const ripple = document.createElement('span');
  const r = btn.getBoundingClientRect(), size = Math.max(r.width,r.height);
  ripple.style.cssText = `position:absolute;border-radius:50%;background:rgba(255,255,255,0.25);width:${size}px;height:${size}px;left:${e.clientX-r.left-size/2}px;top:${e.clientY-r.top-size/2}px;transform:scale(0);animation:rippleAnim 0.6s linear;pointer-events:none;`;
  const prev = btn.style.cssText;
  btn.style.position='relative'; btn.style.overflow='hidden';
  btn.appendChild(ripple);
  setTimeout(() => ripple.remove(), 700);
});

// ─── NAVBAR ────────────────────────────────────────────────
function initNavbar() {
  const nav = document.getElementById('navbar'); if (!nav) return;
  let lastY = 0;
  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    nav.classList.toggle('scrolled', y > 50);
    if (y > lastY+8 && y > 200) nav.classList.add('nav-hide');
    else if (y < lastY-8) nav.classList.remove('nav-hide');
    lastY = y;
  }, {passive:true});
  document.getElementById('nav-hamburger')?.addEventListener('click', () => {
    document.getElementById('mobile-menu')?.classList.toggle('open');
    document.body.classList.toggle('no-scroll');
  });
}
window.closeMobileMenu = () => { document.getElementById('mobile-menu')?.classList.remove('open'); document.body.classList.remove('no-scroll'); };

// ─── PARTICLES ─────────────────────────────────────────────
function initParticles() {
  const c = document.getElementById('hero-particles'); if (!c) return;
  for (let i=0;i<28;i++) {
    const p = document.createElement('div'); p.className='hero-particle';
    p.style.cssText = `left:${Math.random()*100}%;animation-duration:${9+Math.random()*14}s;animation-delay:${Math.random()*18}s;width:${2+Math.random()*4}px;height:${2+Math.random()*4}px;`;
    c.appendChild(p);
  }
}

// ─── ITEM MODAL ────────────────────────────────────────────
let _mi=null, _mq=1;
window.openItemModal = function(id) {
  const item = DEFAULT_MENU.find(m=>m.id===id); if (!item) return;
  _mi=item; _mq=1;
  document.getElementById('modal-img').src = item.img;
  document.getElementById('modal-name').textContent = item.name;
  document.getElementById('modal-desc').textContent = item.desc;
  document.getElementById('modal-price').textContent = 'Rs. '+item.price;
  document.getElementById('modal-qty').textContent = 1;
  document.getElementById('item-modal-overlay').classList.add('show');
  document.body.style.overflow='hidden';
};
window.closeItemModal = function() {
  document.getElementById('item-modal-overlay')?.classList.remove('show');
  document.body.style.overflow='';
};
window.modalQtyChange = function(d) {
  _mq = Math.max(1,_mq+d);
  document.getElementById('modal-qty').textContent = _mq;
  if (_mi) document.getElementById('modal-price').textContent = 'Rs. '+(_mi.price*_mq);
};
window.addModalToCart = function() { if (_mi) { addToCart(_mi,_mq); window.closeItemModal(); } };
document.addEventListener('click', e => {
  if (e.target.id==='item-modal-overlay') window.closeItemModal();
  if (e.target.id==='pwa-popup-overlay') window.closePWAPopup?.();
});

// ─── MENU RENDER ───────────────────────────────────────────
function renderMenu(cat) {
  cat = cat||'all';
  const grid = document.getElementById('menu-grid'); if (!grid) return;
  const items = cat==='all' ? DEFAULT_MENU.filter(i=>i.cat!=='deals') : DEFAULT_MENU.filter(i=>i.cat===cat);
  grid.innerHTML = items.map((item,i) => `
    <div class="menu-card tilt-card reveal" style="transition-delay:${i*0.04}s" onclick="openItemModal('${item.id}')">
      <div class="menu-card-img">
        <img src="${item.img}" alt="${item.name}" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&q=80'"/>
        <div class="menu-card-overlay"></div>
        <span class="menu-card-cat-badge">${item.cat}</span>
      </div>
      <div class="menu-card-body">
        <div class="menu-card-name">${item.name}</div>
        <div class="menu-card-desc">${item.desc}</div>
        <div class="menu-card-footer">
          <div class="menu-card-price">Rs. ${item.price}</div>
          <button class="menu-card-add" onclick="event.stopPropagation();addToCart({id:'${item.id}',name:'${item.name.replace(/'/g,'\\\'')}',price:${item.price},img:'${item.img}',cat:'${item.cat}'},1)">+</button>
        </div>
      </div>
    </div>`).join('');
  initScrollAnimations(); setTimeout(initTiltEffect,100);
}

function renderDeals() {
  const grid = document.getElementById('deals-grid'); if (!grid) return;
  const deals = DEFAULT_MENU.filter(i=>i.cat==='deals');
  grid.innerHTML = deals.map((deal,i) => `
    <div class="deal-card reveal" style="transition-delay:${i*0.06}s" onclick="openItemModal('${deal.id}')">
      <div class="deal-badge">🔥 DEAL</div>
      <div class="deal-img">
        <img src="${deal.img}" alt="${deal.name}" loading="lazy"/>
        <div class="deal-img-overlay"></div>
      </div>
      <div class="deal-card-body">
        <div class="deal-name">${deal.name}</div>
        <div class="deal-includes">${(deal.includes||[]).map(x=>`<span>✦ ${x}</span>`).join('')}</div>
        <div class="deal-footer">
          <div class="deal-price">Rs. ${deal.price}</div>
          <button class="btn-primary" style="padding:10px 20px;font-size:13px" onclick="event.stopPropagation();addToCart({id:'${deal.id}',name:'${deal.name.replace(/'/g,'\\\'')}',price:${deal.price},img:'${deal.img}',cat:'deals'},1)">Add</button>
        </div>
      </div>
    </div>`).join('');
  initScrollAnimations();
}

function initMenuTabs() {
  document.querySelectorAll('.menu-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.menu-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const grid = document.getElementById('menu-grid');
      grid.style.cssText='opacity:0;transform:translateY(10px);transition:all 0.3s';
      setTimeout(() => { renderMenu(tab.dataset.cat); grid.style.cssText='opacity:1;transform:translateY(0);transition:all 0.3s'; }, 280);
    });
  });
}

// ─── PWA ───────────────────────────────────────────────────
let _dip = null;
function initPWA() {
  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault(); _dip=e;
    setTimeout(() => document.getElementById('pwa-banner')?.classList.add('show'), 3500);
    if (!localStorage.getItem('tp_pwa_shown')) {
      setTimeout(() => { document.getElementById('pwa-popup-overlay')?.classList.add('show'); localStorage.setItem('tp_pwa_shown','1'); }, 10000);
    }
  });
  document.getElementById('pwa-banner-close')?.addEventListener('click', () => document.getElementById('pwa-banner')?.classList.remove('show'));
  document.querySelectorAll('.pwa-trigger').forEach(b => b.addEventListener('click', triggerInstall));
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(()=>{});
}
async function triggerInstall() {
  if (_dip) { _dip.prompt(); const {outcome} = await _dip.userChoice; _dip=null; if(outcome==='accepted'){showToast('App installed! 20% off applied 🎉'); document.getElementById('pwa-banner')?.classList.remove('show'); window.closePWAPopup?.();} }
  else { const m=document.getElementById('pwa-popup-manual'); if(m) m.style.display='block'; document.getElementById('pwa-popup-overlay')?.classList.add('show'); }
}
window.closePWAPopup = () => document.getElementById('pwa-popup-overlay')?.classList.remove('show');

// ─── INIT ──────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  updateCartBadge();
  await loadFirebaseSettings();
  initNavbar();
  initParticles();
  initScrollAnimations();
  initMouseParallax();
  initParallaxScroll();
  initCounters();
  initCursor();
  initPWA();
  if (document.getElementById('menu-grid')) { renderMenu('all'); initMenuTabs(); }
  if (document.getElementById('deals-grid')) renderDeals();
  setTimeout(initTiltEffect, 400);
});

window.TP = { getCart, addToCart, removeFromCart, updateCartQty, clearCart, saveCartData, DEFAULT_MENU, db, auth, uploadToImgBB, validatePromoCode, showToast, updateCartBadge };
