# 🥔 TEMPURA POTATO — Website Package
## Complete Restaurant Website with Admin Panel, PWA & Live Tracking

---

## 📁 FILE STRUCTURE

```
tempura-potato/
├── index.html          ← Main homepage
├── checkout.html       ← Order & checkout page
├── tracking.html       ← Live order tracking
├── rider.html          ← Rider portal
├── admin.html          ← Hidden admin panel (password protected)
├── style.css           ← Global premium styles
├── app.js              ← Firebase + cart + PWA logic
├── manifest.json       ← PWA app manifest
├── sw.js               ← Service worker (offline + PWA)
└── README.md           ← This file
```

---

## 🔐 DEFAULT PASSWORDS

| Panel | Default Password |
|---|---|
| Admin Panel | `admin123` |
| Developer Settings | `devpass2026` |

**Change these immediately** via Admin → Dev Settings → Developer Settings panel.

To access Admin Panel: go to `yoursite.com/admin.html`

---

## 🚀 DEPLOYMENT ON CLOUDFLARE PAGES

1. **Create a GitHub repo** and push all these files
2. Go to **Cloudflare Dashboard → Pages**
3. Click **"Create a project"** → Connect to GitHub
4. Select your repo
5. Build settings:
   - Framework: **None**
   - Build command: *(leave empty)*
   - Build output: `/`
6. Click **Deploy**
7. Your site will be live at `yourproject.pages.dev`

### Custom Domain (optional)
- In Cloudflare Pages → Custom Domains → Add `tempurapotato.com` or any domain

---

## 🔥 FIREBASE SETUP

Your Firebase is already connected! But you need to enable these in Firebase Console:

1. **Authentication** → Enable **Google Sign-In**
2. **Realtime Database** → Set rules:
```json
{
  "rules": {
    "orders": {
      ".read": "auth != null",
      ".write": true
    },
    "riders": {
      ".read": true,
      ".write": "auth != null"
    },
    "settings": {
      ".read": true,
      ".write": "auth != null"
    },
    "menu": {
      ".read": true,
      ".write": "auth != null"
    }
  }
}
```
3. **Storage** → Enable for image uploads (future use)

---

## 📱 PWA FEATURES

- ✅ Install prompt banner (shows after 3 seconds)
- ✅ Install popup (shows after 8 seconds, first visit)
- ✅ Offline support via service worker
- ✅ App shortcuts (Order Now, View Menu)
- ✅ Rider manual install tutorial

---

## 🛵 RIDER SETUP

1. Go to **Admin Panel → Riders**
2. Fill in rider name, phone, vehicle
3. Click **"Generate Code & Register"**
4. Share the 6-character code with the rider
5. Rider goes to `yoursite.com/rider.html` and enters their code

---

## 🎨 BRANDING CHANGES

Go to **Admin Panel → Branding** to change:
- Restaurant name & tagline
- Accent color (yellow by default, fully changeable)
- Phone number & address
- WhatsApp order number
- Hero text & banners

Go to **Admin Panel → Dev Settings** for:
- Logo emoji
- Full rebranding tool
- Password changes
- Danger zone (clear orders, reset settings)

---

## 🛒 ORDER FLOW

1. Customer adds items → Cart
2. Goes to Checkout → Fills details
3. Chooses **Place Order** (Firebase) or **WhatsApp Order**
4. If Firebase: redirected to Tracking page
5. Admin Panel receives alert sound + notification
6. Admin clicks Accept → status updates live for customer
7. Admin sets rider → Rider info appears on tracking page
8. Status: Accepted → Preparing → On the Way → Delivered

---

## 📞 CONTACT INFO IN CODE

Phone: `+92-3044888775`
WhatsApp: `923044888775`
Address: Main Bazar Nishat Colony, Milad Chock, Lahore

Change in `app.js` → `WHATSAPP_NUM` variable, and in `admin.html` branding panel.

---

## ✅ FEATURES CHECKLIST

- [x] Premium homepage with Apple-style scroll effect
- [x] Burger layer explosion animation
- [x] Parallax effects (10+ effects total)
- [x] Full menu with categories & tabs
- [x] Deals section
- [x] Cart system (localStorage)
- [x] Checkout with Google Sign-In
- [x] WhatsApp ordering
- [x] Firebase order placement
- [x] Live order tracking (4 stages)
- [x] Rider card with name & phone
- [x] Live location sharing (GPS)
- [x] Admin panel (password protected)
- [x] Dev Settings (double password protected)
- [x] Full CMS branding tool
- [x] Accent color changer
- [x] Rider registration + unique codes
- [x] Rider portal with PWA install
- [x] PWA (installable app)
- [x] Offline support
- [x] Mobile-first responsive design
- [x] SEO meta tags
- [x] Marquee ticker
- [x] Floating cart button
- [x] Item modal with quantity
- [x] Promo codes (FIRSTORDER, APP20)
- [x] 20% discount for Google sign-in
