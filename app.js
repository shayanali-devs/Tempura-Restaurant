// ╔══════════════════════════════════════════════════════════╗
// ║  TEMPURA POTATO — core.js                               ║
// ║  Single source of truth: Cart · Firebase · Settings     ║
// ╚══════════════════════════════════════════════════════════╝

// ─── FIREBASE ─────────────────────────────────────────────
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

let _fbInitialized = false;
function getFirebase() {
  if (!_fbInitialized && typeof firebase !== 'undefined') {
    try { firebase.initializeApp(firebaseConfig); } catch(e) {}
    _fbInitialized = true;
  }
  return typeof firebase !== 'undefined' ? firebase : null;
}
window.getDB  = () => { const f = getFirebase(); return f ? f.database() : null; };
window.getAuth = () => { const f = getFirebase(); return f ? f.auth() : null; };

// ─── IMGBB ────────────────────────────────────────────────
const IMGBB_KEY = 'ab7a51eaed988c67582fc8bcc877df5a';
window.uploadToImgBB = async function(file) {
  const form = new FormData();
  form.append('image', file);
  const res = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_KEY}`, { method:'POST', body:form });
  const data = await res.json();
  if (data.success) return data.data.url;
  throw new Error('ImgBB upload failed');
};

// ─── CART — bulletproof localStorage ─────────────────────
const CART_KEY = 'tp_cart_v2';

const Cart = {
  get() {
    try { return JSON.parse(localStorage.getItem(CART_KEY) || '[]'); }
    catch(e) { return []; }
  },
  save(items) {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
    Cart._notify();
  },
  add(item, qty = 1) {
    const items = Cart.get();
    const idx = items.findIndex(c => c.id === item.id);
    if (idx > -1) items[idx].qty += qty;
    else items.push({ id:item.id, name:item.name, price:item.price, image:item.image||'', cat:item.cat, qty });
    Cart.save(items);
    Toast.show(`${item.name} added to cart 🛒`);
  },
  remove(id) {
    Cart.save(Cart.get().filter(c => c.id !== id));
  },
  updateQty(id, qty) {
    if (qty < 1) { Cart.remove(id); return; }
    const items = Cart.get();
    const idx = items.findIndex(c => c.id === id);
    if (idx > -1) { items[idx].qty = qty; Cart.save(items); }
  },
  clear() { localStorage.removeItem(CART_KEY); Cart._notify(); },
  total() { return Cart.get().reduce((s,c) => s + c.price * c.qty, 0); },
  count() { return Cart.get().reduce((s,c) => s + c.qty, 0); },
  _listeners: [],
  onChange(fn) { Cart._listeners.push(fn); },
  _notify() { Cart._listeners.forEach(fn => fn(Cart.get())); }
};
window.Cart = Cart;

// ─── TOAST ────────────────────────────────────────────────
const Toast = {
  show(msg, duration = 2400) {
    let el = document.getElementById('tp-toast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'tp-toast';
      el.style.cssText = `position:fixed;bottom:90px;left:50%;transform:translateX(-50%) translateY(16px);
        background:var(--yellow,#f5c842);color:var(--black,#0a0a0a);padding:12px 26px;border-radius:30px;
        font-weight:700;font-size:14px;z-index:99999;opacity:0;transition:all .3s ease;
        white-space:nowrap;pointer-events:none;font-family:'Barlow',sans-serif;`;
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.style.opacity = '1';
    el.style.transform = 'translateX(-50%) translateY(0)';
    clearTimeout(el._t);
    el._t = setTimeout(() => {
      el.style.opacity = '0';
      el.style.transform = 'translateX(-50%) translateY(16px)';
    }, duration);
  }
};
window.Toast = Toast;

// ─── SETTINGS LOADER — apply Firebase branding to every page ──
window.loadSiteSettings = async function() {
  const db = getDB();
  if (!db) return;
  try {
    const snap = await db.ref('settings').once('value');
    const s = snap.val() || {};
    const b = s.branding || {};
    const r = document.documentElement;

    if (b.accentColor)    r.style.setProperty('--yellow', b.accentColor);
    if (b.accentColorGlow) r.style.setProperty('--yellow-glow', b.accentColorGlow);
    if (b.bgColor)        r.style.setProperty('--black', b.bgColor);
    if (b.cardColor)      r.style.setProperty('--black3', b.cardColor);
    if (b.fontDisplay)    loadGoogleFont(b.fontDisplay);
    if (b.brandName) {
      document.querySelectorAll('.nav-brand,.footer-brand,[data-brand]').forEach(el => el.textContent = b.brandName);
    }
    if (b.tagline) {
      document.querySelectorAll('.nav-sub,.footer-tagline,[data-tagline]').forEach(el => el.textContent = b.tagline);
    }
    if (b.logoEmoji) {
      document.querySelectorAll('.nav-logo-icon,.footer-logo-icon,[data-logo-emoji]').forEach(el => el.textContent = b.logoEmoji);
    }
    if (b.heroHeadline) {
      const h = document.querySelector('.hero-title-line2');
      if (h) h.textContent = b.heroHeadline;
    }
    if (b.heroBadge) {
      const hb = document.querySelector('.hero-badge');
      if (hb) hb.textContent = b.heroBadge;
    }
    if (b.announcementBar) {
      const ab = document.querySelector('.pwa-banner span');
      if (ab) ab.innerHTML = b.announcementBar;
    }
    if (b.maintenanceMode) {
      showMaintenanceBanner();
    }
    // Store locally for offline
    localStorage.setItem('tp_settings_cache', JSON.stringify(s));
  } catch(e) {
    // Fallback to cache
    try {
      const cached = JSON.parse(localStorage.getItem('tp_settings_cache') || '{}');
      if (cached.branding?.accentColor) {
        document.documentElement.style.setProperty('--yellow', cached.branding.accentColor);
      }
    } catch(e2) {}
  }
};

function loadGoogleFont(name) {
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?family=${name.replace(/ /g,'+')}:wght@700;900&display=swap`;
  document.head.appendChild(link);
}

function showMaintenanceBanner() {
  let b = document.getElementById('maintenance-banner');
  if (!b) {
    b = document.createElement('div');
    b.id = 'maintenance-banner';
    b.style.cssText = `position:fixed;top:0;left:0;right:0;z-index:99998;background:#ff4444;color:#fff;
      text-align:center;padding:10px;font-weight:700;font-size:14px;font-family:'Barlow',sans-serif;`;
    b.textContent = '⚠️ Site under maintenance. Some features may be limited.';
    document.body.prepend(b);
  }
}

// ─── PROMO CODE EXPIRY ENGINE ──────────────────────────────
window.PromoEngine = {
  async validate(code) {
    const db = getDB();
    if (!db) return this._localCheck(code);
    try {
      const snap = await db.ref('promoCodes/' + code.toUpperCase()).once('value');
      const p = snap.val();
      if (!p) return { valid: false, msg: 'Invalid promo code' };
      if (p.expiresAt && Date.now() > p.expiresAt) return { valid: false, msg: 'This promo code has expired' };
      if (p.usageLimit && p.usedCount >= p.usageLimit) return { valid: false, msg: 'Promo code usage limit reached' };
      // Increment usage
      await db.ref('promoCodes/' + code.toUpperCase() + '/usedCount').set((p.usedCount||0)+1);
      return { valid: true, discount: p.discount || 0.20, msg: `${Math.round((p.discount||0.20)*100)}% discount applied!` };
    } catch(e) { return this._localCheck(code); }
  },
  _localCheck(code) {
    const codes = { 'FIRSTORDER': 0.20, 'APP20': 0.20, 'WELCOME10': 0.10 };
    if (codes[code.toUpperCase()]) return { valid:true, discount:codes[code.toUpperCase()], msg:`${Math.round(codes[code.toUpperCase()]*100)}% discount!` };
    return { valid:false, msg:'Invalid promo code' };
  }
};

// ─── NAV CART BADGE UPDATER ────────────────────────────────
function updateCartBadge() {
  const count = Cart.count();
  const badge = document.getElementById('cart-float-count');
  const float = document.getElementById('cart-float');
  if (badge) badge.textContent = count;
  if (float) float.classList.toggle('show', count > 0);
}
Cart.onChange(updateCartBadge);
document.addEventListener('DOMContentLoaded', updateCartBadge);

// ─── MENU DATA — single source, both pages read from here ──
window.MENU_DATA = [
  // BURGERS
  { id:'b1', name:'Grill Burger',    cat:'burgers', price:320,
    image:'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&q=80',
    desc:'Flame-grilled chicken patty with crispy lettuce, tomato & our signature sauce' },
  { id:'b2', name:'Zinger Burger',   cat:'burgers', price:350,
    image:'https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=400&q=80',
    desc:'Extra-crispy zinger fillet, fresh slaw, secret zinger sauce — pure heat' },
  { id:'b3', name:'Zinger Twister',  cat:'burgers', price:380,
    image:'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=400&q=80',
    desc:'Crispy zinger wrapped in a soft flour tortilla with fresh veggies' },
  { id:'b4', name:'Patty Burger',    cat:'burgers', price:280,
    image:'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=400&q=80',
    desc:'Classic double-pressed chicken patty with cheese and sauce' },

  // WRAPS & ROLLS
  { id:'w1', name:'Chicken Bhayari Paratha Roll', cat:'wraps', price:300,
    image:'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=400&q=80',
    desc:'Slow-cooked chicken bhayari tightly wrapped in fresh hot paratha' },
  { id:'w2', name:'Seekh Kabab Paratha Roll',     cat:'wraps', price:250,
    image:'https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=400&q=80',
    desc:'Juicy hand-made seekh kababs in flaky golden paratha' },
  { id:'w3', name:'Mala Boti Wrap',               cat:'wraps', price:450,
    image:'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&q=80',
    desc:'Spicy mala boti with crispy fries — the wrap that burns good' },
  { id:'w4', name:'Chicken BBQ Wrap',             cat:'wraps', price:300,
    image:'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&q=80',
    desc:'Smoky BBQ chicken strips in warm paratha with garlic sauce' },
  { id:'w5', name:'Zinger Wrap',                  cat:'wraps', price:350,
    image:'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=400&q=80',
    desc:'Crispy zinger with lettuce, pickles & sauce in a soft tortilla' },
  { id:'w6', name:'Shapath Roll',                 cat:'wraps', price:390,
    image:'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=400&q=80',
    desc:'Loaded street-style shapath in flaky paratha — Lahore original' },
  { id:'w7', name:'Dhamaka Roll',                 cat:'wraps', price:490,
    image:'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&q=80',
    desc:'The ultimate fully-loaded roll — every flavour in one bite' },
  { id:'w8', name:'Malai Boti Paratha Roll',      cat:'wraps', price:420,
    image:'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&q=80',
    desc:'Creamy malai boti straight off the grill, wrapped in hot paratha' },
  { id:'w9', name:'Chicken Taka Paratha Roll',    cat:'wraps', price:280,
    image:'https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=400&q=80',
    desc:'Taka-style spiced chicken — crispy, saucy, and satisfying' },

  // SHAWARMA
  { id:'s1', name:'Grill Shawarma',          cat:'shawarma', price:280,
    image:'https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=400&q=80',
    desc:'Fresh-grilled chicken shawarma with garlic sauce and pickles' },
  { id:'s2', name:'Special Grilled Shawarma', cat:'shawarma', price:380,
    image:'https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=400&q=80',
    desc:'Upgraded shawarma — extra toppings, double sauce, maximum flavour' },
  { id:'s3', name:'2 Shawarma',              cat:'shawarma', price:380,
    image:'https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=400&q=80',
    desc:'Two classic shawarmas — great value, great flavour' },
  { id:'s4', name:'Half Chicken Zinger Shawarma', cat:'shawarma', price:550,
    image:'https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=400&q=80',
    desc:'Half chicken zinger shawarma — massive, satisfying, legendary' },

  // SIDES
  { id:'f1', name:'Plane Fries',    cat:'sides', price:120,
    image:'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400&q=80',
    desc:'Classic golden crispy fries — light, crunchy, perfect' },
  { id:'f2', name:'Loaded Fries',   cat:'sides', price:180,
    image:'https://images.unsplash.com/photo-1585109649139-366815a0d713?w=400&q=80',
    desc:'Fries piled with cheese sauce, chilli flakes & secret drizzle' },
  { id:'f3', name:'Taka Grilled Chicken', cat:'sides', price:250,
    image:'https://images.unsplash.com/photo-1598103442097-8b74394b95c1?w=400&q=80',
    desc:'Perfectly grilled taka-style chicken — 330g of pure protein' },
  { id:'f4', name:'1 Litre Next Cola', cat:'sides', price:120,
    image:'https://images.unsplash.com/photo-1581006852262-e4307cf6283a?w=400&q=80',
    desc:'Chilled Next Cola — the perfect sidekick to any meal' },

  // DEALS
  { id:'d1', name:'Deal 1', cat:'deals', price:600,
    image:'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&q=80',
    desc:'2 Zinger Burgers + 2 Next Colas',
    includes:['2 Zinger Burgers','2 Next Colas'] },
  { id:'d2', name:'Deal 2', cat:'deals', price:420,
    image:'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=400&q=80',
    desc:'2 Zinger Twisters + 1 Plane Fries',
    includes:['2 Zinger Twisters','1 Plane Fries'] },
  { id:'d3', name:'Deal 3', cat:'deals', price:380,
    image:'https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=400&q=80',
    desc:'1 Zinger Burger + 1 Plane Fries + 1 Drink',
    includes:['1 Zinger Burger','1 Plane Fries','1 Red Drink'] },
  { id:'d4', name:'Deal 4', cat:'deals', price:480,
    image:'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=400&q=80',
    desc:'2 Patty Burgers + 1 Litre Next Cola',
    includes:['2 Patty Burgers','1 Litre Next Cola'] },
  { id:'d5', name:'Deal 5', cat:'deals', price:550,
    image:'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&q=80',
    desc:'1 Zinger Burger + 1 Chicken Shawarma + Half Drink',
    includes:['1 Zinger Burger','1 Chicken Shawarma','1 Half Drink'] },
  { id:'d6', name:'Deal 6 — Family', cat:'deals', price:1000,
    image:'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80',
    desc:'2 Patty + 2 Zinger + 1L Cola + Loaded Fries',
    includes:['2 Patty Burgers','2 Zinger Burgers','1 Litre Next Cola','1 Loaded Fries'] },
  { id:'d7', name:'Deal 7 — Mega',  cat:'deals', price:1250,
    image:'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80',
    desc:'4 Zingers + 1L Cola + Loaded Fries',
    includes:['4 Zinger Burgers','1 Litre Next Cola','1 Loaded Fries'] },
  { id:'d8', name:'Deal 8 — Feast', cat:'deals', price:1480,
    image:'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80',
    desc:'5 Grill Burgers + 2 Loaded Fries + 1L Cola',
    includes:['5 Grill Burgers','2 Loaded Fries','1 Litre Next Cola'] },
  { id:'d9', name:'Deal 9 — Party', cat:'deals', price:1500,
    image:'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80',
    desc:'6 Patty Burgers + Cola + Loaded Fries',
    includes:['6 Patty Burgers','1 Litre Next Cola','1 Loaded Fries'] },
  { id:'d10', name:'Deal 10 — Legend', cat:'deals', price:2000,
    image:'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80',
    desc:'The ultimate party pack — feeds a crew',
    includes:['2 Patty','2 Zinger','2 Grill Burgers','2 Loaded Fries','2L Cola'] },
];
