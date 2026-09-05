/**
 * Bangla Haat — Inventory & Store Management
 * Core Application Logic & State Management
 */

const DB_KEY = 'stockly_inventory_v1';
const SALES_KEY = 'bangla_haat_sales_v1';

const defaultProducts = [
  {
    id: 'p1',
    name: 'Aura Desk Lamp',
    sku: 'LGT-204',
    category: 'Lighting',
    description: 'Minimalist brass-accent desk lamp with ambient warm tone, ideal for work and reading spaces.',
    expiryDate: '',
    price: 2499,
    stock: 24,
    discount: 15,
    image: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=700&q=80'
  },
  {
    id: 'p2',
    name: 'Oakline Chair',
    sku: 'FUR-118',
    category: 'Furniture',
    description: 'Handcrafted solid oak dining and lounge chair inspired by traditional Bengali artisan woodwork.',
    expiryDate: '',
    price: 8999,
    stock: 7,
    discount: 0,
    image: 'https://images.unsplash.com/photo-1505843490701-5a8a5b6a8c0b?auto=format&fit=crop&w=700&q=80'
  },
  {
    id: 'p3',
    name: 'Nova Wireless Headphones',
    sku: 'TEC-031',
    category: 'Technology',
    description: 'Studio sound wireless over-ear headphones with active noise cancellation and 36h playback.',
    expiryDate: '',
    price: 5999,
    stock: 42,
    discount: 20,
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=700&q=80'
  },
  {
    id: 'p4',
    name: 'Terra Ceramic Vase',
    sku: 'DEC-452',
    category: 'Home decor',
    description: 'Terracotta-glazed handcrafted ceramic vase made with traditional Kumartuli clay techniques.',
    expiryDate: '',
    price: 1299,
    stock: 3,
    discount: 0,
    image: 'https://images.unsplash.com/photo-1612196808214-b8e1d6145a8c?auto=format&fit=crop&w=700&q=80'
  },
  {
    id: 'p5',
    name: 'Kanso Notebook Set',
    sku: 'STN-090',
    category: 'Stationery',
    description: 'Recycled handmade paper journals bound in natural jute fabric with stitched spine.',
    expiryDate: '',
    price: 799,
    stock: 0,
    discount: 10,
    image: 'https://images.unsplash.com/photo-1531346878377-a5be20888e57?auto=format&fit=crop&w=700&q=80'
  },
  {
    id: 'p6',
    name: 'Milo Throw Blanket',
    sku: 'TEX-706',
    category: 'Textiles',
    description: 'Soft woven cotton Kantha-style throw blanket with subtle geometric stitching.',
    expiryDate: '',
    price: 2199,
    stock: 18,
    discount: 0,
    image: 'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&w=700&q=80'
  }
];

const users = {
  'admin@stockly.com': {
    email: 'admin@stockly.com',
    password: 'stockly',
    name: 'Aarav Mehta',
    role: 'admin'
  },
  'customer@stockly.com': {
    email: 'customer@stockly.com',
    password: 'stockly',
    name: 'Riya Sharma',
    role: 'customer'
  }
};

let state = {
  page: 'dashboard',
  user: null,
  filter: 'all',
  search: ''
};

/* --------------------------------------------------------------------------
   Data Helpers
   -------------------------------------------------------------------------- */
function products() {
  const saved = localStorage.getItem(DB_KEY);
  if (!saved) {
    localStorage.setItem(DB_KEY, JSON.stringify(defaultProducts));
    return defaultProducts;
  }
  try {
    return JSON.parse(saved);
  } catch (e) {
    return defaultProducts;
  }
}

function save(items) {
  localStorage.setItem(DB_KEY, JSON.stringify(items));
}

function sales() {
  try {
    return JSON.parse(localStorage.getItem(SALES_KEY) || '[]');
  } catch (e) {
    return [];
  }
}

function saveSales(rows) {
  localStorage.setItem(SALES_KEY, JSON.stringify(rows));
}

function money(n) {
  return '₹' + Number(n || 0).toLocaleString('en-IN');
}

function salePrice(p) {
  return Math.round(p.price * (1 - (p.discount || 0) / 100));
}

function esc(value) {
  if (value === null || value === undefined) return '';
  return String(value).replace(/[&<>'"]/g, c => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;'
  }[c]));
}

function img(p, cls = 'product-thumb') {
  const fallback = 'https://images.unsplash.com/photo-1512428559087-560fa5ceab42?auto=format&fit=crop&w=700&q=80';
  const src = esc(p.image || fallback);
  return `<img class="${cls}" src="${src}" alt="${esc(p.name)}" loading="lazy" onerror="this.onerror=null;this.src='${fallback}'">`;
}

function status(p) {
  if (p.stock === 0) return '<span class="status out">Out of stock</span>';
  if (p.stock < 8) return `<span class="status low">Low stock (${p.stock})</span>`;
  return '<span class="status in">In stock</span>';
}

function filtered() {
  const term = state.search.trim().toLowerCase();
  return products().filter(p => {
    const matchesFilter =
      state.filter === 'all' ||
      (state.filter === 'low' ? p.stock < 8 && p.stock > 0 :
       state.filter === 'out' ? p.stock === 0 :
       p.category.toLowerCase() === state.filter.toLowerCase());

    const matchesSearch =
      !term ||
      (`${p.name} ${p.sku} ${p.category} ${p.description || ''}`).toLowerCase().includes(term);

    return matchesFilter && matchesSearch;
  });
}

/* --------------------------------------------------------------------------
   Modal & Scroll Containment
   -------------------------------------------------------------------------- */
function show(id) {
  const modal = document.getElementById(id);
  if (!modal) return;
  modal.classList.remove('hidden');

  // Prevent page scroll when modal is open
  document.documentElement.classList.add('modal-open');
  document.body.classList.add('modal-open');

  // Focus first input inside if present
  setTimeout(() => {
    const firstInput = modal.querySelector('input:not([type="hidden"]), textarea, button');
    if (firstInput && !firstInput.disabled) firstInput.focus();
  }, 50);
}

function hide(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.add('hidden');

  // Check if any other modal is still open
  const anyOpen = document.querySelectorAll('.modal-backdrop:not(.hidden)').length > 0;
  if (!anyOpen) {
    document.documentElement.classList.remove('modal-open');
    document.body.classList.remove('modal-open');
  }
}

function toast(msg) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.remove('hidden');
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.add('hidden'), 3200);
}

/* --------------------------------------------------------------------------
   Mobile Sidebar Drawer
   -------------------------------------------------------------------------- */
function openSidebar() {
  document.getElementById('sidebar')?.classList.add('open');
  document.getElementById('sidebarBackdrop')?.classList.remove('hidden');
}

function closeSidebar() {
  document.getElementById('sidebar')?.classList.remove('open');
  document.getElementById('sidebarBackdrop')?.classList.add('hidden');
}

function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  if (sidebar?.classList.contains('open')) {
    closeSidebar();
  } else {
    openSidebar();
  }
}

/* --------------------------------------------------------------------------
   Profile Menu Toggle
   -------------------------------------------------------------------------- */
function toggleProfileMenu() {
  const menu = document.getElementById('profileMenu');
  const btn = document.getElementById('profileButton');
  if (!menu || !btn) return;

  const isOpen = !menu.classList.contains('hidden');
  if (isOpen) {
    menu.classList.add('hidden');
    btn.setAttribute('aria-expanded', 'false');
  } else {
    menu.classList.remove('hidden');
    btn.setAttribute('aria-expanded', 'true');
    // Hide notifications if open
    document.getElementById('notificationPanel')?.classList.add('hidden');
    document.getElementById('notificationButton')?.setAttribute('aria-expanded', 'false');
  }
}

function closeDropdowns() {
  const menu = document.getElementById('profileMenu');
  const profileBtn = document.getElementById('profileButton');
  if (menu && !menu.classList.contains('hidden')) {
    menu.classList.add('hidden');
    profileBtn?.setAttribute('aria-expanded', 'false');
  }

  const notif = document.getElementById('notificationPanel');
  const notifBtn = document.getElementById('notificationButton');
  if (notif && !notif.classList.contains('hidden')) {
    notif.classList.add('hidden');
    notifBtn?.setAttribute('aria-expanded', 'false');
  }
}

/* --------------------------------------------------------------------------
   Sign Out & Reset Logic
   -------------------------------------------------------------------------- */
function signOut() {
  state.user = null;
  sessionStorage.removeItem('stockly_user');
  state.page = 'dashboard';
  state.filter = 'all';
  state.search = '';

  // Completely wipe rendered application DOM content
  const appContent = document.getElementById('appContent');
  if (appContent) appContent.innerHTML = '';

  // Reset topbar & profile elements
  document.getElementById('profileName').textContent = '';
  document.getElementById('profileRole').textContent = '';
  document.getElementById('avatar').textContent = '';
  document.getElementById('menuAvatar').textContent = '';
  document.getElementById('profileMenuName').textContent = '';
  document.getElementById('profileMenuRoleBadge').textContent = '';
  document.getElementById('profileMenuEmail').textContent = '';

  // Reset search bar
  const searchInput = document.getElementById('searchInput');
  if (searchInput) searchInput.value = '';

  // Reset checkout form and result
  const checkoutForm = document.getElementById('checkoutForm');
  if (checkoutForm) checkoutForm.reset();
  const checkoutResult = document.getElementById('checkoutResult');
  if (checkoutResult) checkoutResult.innerHTML = '<p>Ready to scan or enter a product code.</p>';

  // Reset forms & clear errors
  const itemForm = document.getElementById('itemForm');
  if (itemForm) itemForm.reset();
  const discountForm = document.getElementById('discountForm');
  if (discountForm) discountForm.reset();
  const loginForm = document.getElementById('loginForm');
  if (loginForm) loginForm.reset();
  const loginError = document.getElementById('loginError');
  if (loginError) {
    loginError.textContent = '';
    loginError.classList.add('hidden');
  }

  // Close menus and dropdowns
  closeDropdowns();
  closeSidebar();

  // Close all open modals & release body scroll
  hide('itemModal');
  hide('discountModal');
  hide('billModal');
  document.documentElement.classList.remove('modal-open');
  document.body.classList.remove('modal-open');

  // Show login modal
  show('authModal');
  toast('Signed out successfully');
}

function loginAs(user) {
  state.user = user;
  sessionStorage.setItem('stockly_user', JSON.stringify(user));
  state.page = 'dashboard';
  state.filter = 'all';
  state.search = '';
  const searchInput = document.getElementById('searchInput');
  if (searchInput) searchInput.value = '';

  hide('authModal');
  closeDropdowns();
  closeSidebar();
  render(true);
  toast(`Signed in as ${user.name} (${user.role === 'admin' ? 'Administrator' : 'Customer'})`);
}

/* --------------------------------------------------------------------------
   UI Views & Templates
   -------------------------------------------------------------------------- */
function nav() {
  document.querySelectorAll('.nav-link').forEach(b => {
    b.classList.toggle('active', b.dataset.page === state.page);
  });
  document.querySelectorAll('.admin-only').forEach(e => {
    e.classList.toggle('hidden', state.user?.role !== 'admin');
  });
}

function table(rows, actions = true) {
  if (!rows || rows.length === 0) {
    return '<p class="muted" style="padding: 16px 0;">No products to display.</p>';
  }

  return `
    <div class="table-responsive">
      <table class="inventory-table">
        <thead>
          <tr>
            <th>Product</th>
            <th>Item Code</th>
            <th>Category</th>
            <th>Stock</th>
            <th>Price</th>
            ${actions ? '<th>Actions</th>' : ''}
          </tr>
        </thead>
        <tbody>
          ${rows.map(p => `
            <tr>
              <td>
                <div class="product-mini">
                  ${img(p)}
                  <div>
                    <span>${esc(p.name)}</span>
                    <small style="display:block;color:var(--muted);font-weight:400;margin-top:2px;">${esc(p.category)}</small>
                  </div>
                </div>
              </td>
              <td><code>${esc(p.sku)}</code></td>
              <td>${esc(p.category)}</td>
              <td>${status(p)}</td>
              <td>
                <b>${money(salePrice(p))}</b>
                ${p.discount ? `<small class="old-price">${money(p.price)}</small>` : ''}
              </td>
              ${actions ? `
                <td>
                  <div class="table-actions">
                    <button class="icon-btn edit" data-id="${p.id}" title="Edit product details">Edit</button>
                    <button class="icon-btn discount" data-id="${p.id}" title="Set discount %">Offer</button>
                    <button class="icon-btn delete" data-id="${p.id}" title="Delete product">Delete</button>
                  </div>
                </td>
              ` : ''}
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function dashboard() {
  const all = products();
  const total = all.reduce((s, p) => s + p.stock, 0);
  const value = all.reduce((s, p) => s + p.stock * salePrice(p), 0);
  const low = all.filter(p => p.stock > 0 && p.stock < 8);

  return `
    <div class="page-heading">
      <div>
        <p class="eyebrow">${state.user.role === 'admin' ? 'INVENTORY AT A GLANCE' : 'WELCOME BACK'}</p>
        <h1>${state.user.role === 'admin' ? 'Good morning, ' + state.user.name.split(' ')[0] : 'Discover what is in stock'}</h1>
        <p>${state.user.role === 'admin' ? 'Here is what is happening with your store today.' : 'Browse our latest curated inventory.'}</p>
      </div>
      ${state.user.role === 'admin' ? '<button class="primary" id="addProduct">+ &nbsp; Add product</button>' : ''}
    </div>

    <div class="stats">
      <div class="stat-card">
        <div class="stat-icon blue">◫</div>
        <p>Total products</p>
        <b>${all.length}</b>
        <span class="trend">↑ 12%</span>
      </div>
      <div class="stat-card">
        <div class="stat-icon green">▣</div>
        <p>Items in stock</p>
        <b>${total}</b>
        <span class="trend">↑ 8.4%</span>
      </div>
      <div class="stat-card">
        <div class="stat-icon orange">◷</div>
        <p>Low stock items</p>
        <b>${low.length}</b>
        <span class="trend down">Needs attention</span>
      </div>
      <div class="stat-card">
        <div class="stat-icon purple">₹</div>
        <p>Inventory value</p>
        <b>${money(value)}</b>
        <span class="trend">↑ 6.7%</span>
      </div>
    </div>

    <div class="dash-grid">
      <div class="panel">
        <div class="panel-head">
          <h2>Recently updated</h2>
          <button class="text-link" data-go="inventory">View inventory →</button>
        </div>
        ${table(all.slice(0, 5), false)}
      </div>

      <div class="panel">
        <div class="panel-head">
          <h2>Stock alerts</h2>
          <button class="text-link" data-go="inventory">View all</button>
        </div>
        ${low.length ? low.map(p => `
          <div class="activity">
            <span class="activity-dot"></span>
            <div>
              <b>${esc(p.name)} is running low</b>
              <small>${p.stock} units remaining · Reorder soon</small>
            </div>
          </div>
        `).join('') : '<p class="muted">Everything is comfortably stocked.</p>'}
        <div class="activity">
          <span class="activity-dot" style="background:#18a779"></span>
          <div>
            <b>Weekly stock report ready</b>
            <small>Review product movement and trends.</small>
          </div>
        </div>
      </div>
    </div>
  `;
}

function customerHome() {
  const picks = products().filter(p => p.stock > 0).slice(0, 3);
  return `
    <section class="bengal-hero">
      <div>
        <p class="eyebrow">স্বাগতম · WELCOME TO BANGLA HAAT</p>
        <h1>Stories of Bengal,<br><i>made for your home.</i></h1>
        <p>Handpicked treasures inspired by the warmth, craft, and colour of Bengal.</p>
        <button class="primary" data-go="products">Explore the collection <span>→</span></button>
      </div>
      <div class="hero-art">
        <span class="sun">☼</span>
        <span class="hero-bengali">বাংলা</span>
        <span class="hero-leaf">❦</span>
      </div>
    </section>

    <section class="customer-section">
      <div class="section-title">
        <div>
          <p class="eyebrow">CURATED FOR YOU</p>
          <h2>Today's favourites</h2>
        </div>
        <button class="text-link" data-go="products">Shop all →</button>
      </div>

      <div class="products-grid featured-products">
        ${picks.map(p => `
          <article class="product-card">
            ${img(p, 'product-image')}
            <div class="product-body">
              <p class="product-category">${esc(p.category)}</p>
              <h2 class="product-title">${esc(p.name)}</h2>
              <div class="product-meta">
                <span class="price">${money(salePrice(p))}</span>
                ${p.discount ? `<span class="discount-pill">${p.discount}% OFF</span>` : status(p)}
              </div>
            </div>
          </article>
        `).join('')}
      </div>
    </section>

    <section class="heritage-strip">
      <span>✦</span>
      <div>
        <b>Crafted with a Bengali heart</b>
        <small>Thoughtful products, festive colours, and everyday beauty — delivered from our haat to your home.</small>
      </div>
      <button class="outline-light" data-go="messages">Talk to us</button>
    </section>
  `;
}

function inventory() {
  return `
    <div class="page-heading">
      <div>
        <p class="eyebrow">PRODUCT CATALOGUE</p>
        <h1>Inventory</h1>
        <p>Monitor stock, pricing, and offers in one place.</p>
      </div>
      <button class="primary" id="addProduct">+ &nbsp; Add product</button>
    </div>

    <div class="toolbar">
      <div class="filter-tabs">
        <button class="filter ${state.filter === 'all' ? 'active' : ''}" data-filter="all">All items</button>
        <button class="filter ${state.filter === 'low' ? 'active' : ''}" data-filter="low">Low stock</button>
        <button class="filter ${state.filter === 'out' ? 'active' : ''}" data-filter="out">Out of stock</button>
      </div>
      <span class="muted">${filtered().length} products</span>
    </div>

    <div class="panel">
      ${table(filtered(), true)}
    </div>
  `;
}

function productCards() {
  const rows = filtered();
  if (!rows.length) {
    return '<p class="muted" style="grid-column: 1 / -1; padding: 20px 0;">No products match your search or filter.</p>';
  }

  return rows.map(p => `
    <article class="product-card">
      ${img(p, 'product-image')}
      <div class="product-body">
        <p class="product-category">${esc(p.category)}</p>
        <h2 class="product-title">${esc(p.name)}</h2>
        <div class="product-meta">
          <div>
            <span class="price">${money(salePrice(p))}</span>
            ${p.discount ? `<span class="old-price">${money(p.price)}</span>` : ''}
          </div>
          ${p.discount ? `<span class="discount-pill">${p.discount}% OFF</span>` : status(p)}
        </div>
        ${state.user.role === 'admin' ? `
          <div class="product-actions">
            <button class="icon-btn edit" data-id="${p.id}">Edit product</button>
            <button class="icon-btn discount" data-id="${p.id}">Set offer</button>
          </div>
        ` : `
          <div class="product-actions">
            <button class="primary" ${p.stock === 0 ? 'disabled' : ''} data-go="checkout">
              ${p.stock ? 'Buy at counter' : 'Out of stock'}
            </button>
          </div>
        `}
      </div>
    </article>
  `).join('');
}

function browse() {
  const categories = [...new Set(products().map(p => p.category))];
  return `
    <div class="page-heading">
      <div>
        <p class="eyebrow">SHOP INVENTORY</p>
        <h1>Explore products</h1>
        <p>Find beautifully crafted items with live availability and pricing.</p>
      </div>
    </div>

    <div class="toolbar">
      <div class="filter-tabs">
        <button class="filter ${state.filter === 'all' ? 'active' : ''}" data-filter="all">All</button>
        ${categories.slice(0, 5).map(c => `
          <button class="filter ${state.filter === c ? 'active' : ''}" data-filter="${esc(c)}">${esc(c)}</button>
        `).join('')}
      </div>
      <span class="muted">${filtered().length} products</span>
    </div>

    <div class="products-grid">
      ${productCards()}
    </div>
  `;
}

function discounts() {
  return `
    <div class="page-heading">
      <div>
        <p class="eyebrow">PRICE CONTROL</p>
        <h1>Offers & discounts</h1>
        <p>Create compelling offers while keeping your margins visible.</p>
      </div>
    </div>

    <div class="offer-list">
      ${products().map(p => `
        <div class="offer-row">
          <div class="product-mini">
            ${img(p)}
            <div>
              <span>${esc(p.name)}</span>
              <small style="display:block;color:var(--muted);font-weight:400;margin-top:2px;">Item code: ${esc(p.sku)}</small>
            </div>
          </div>
          <div class="offer-price">
            <b>${money(salePrice(p))}</b>
            ${p.discount ? `
              <small class="old-price">${money(p.price)}</small>
              <span class="discount-pill" style="margin-left:8px">${p.discount}% off</span>
            ` : '<small class="muted"> No active offer</small>'}
          </div>
          <button class="icon-btn discount" data-id="${p.id}">${p.discount ? 'Edit offer' : 'Add discount'}</button>
        </div>
      `).join('')}
    </div>
  `;
}

function messages() {
  return `
    <div class="mail-layout">
      <div class="page-heading">
        <div>
          <p class="eyebrow">CUSTOMER CARE</p>
          <h1>Mail us</h1>
          <p>Questions about a product or an order? We would love to hear from you.</p>
        </div>
      </div>

      <div class="mail-card">
        <div class="mail-hero">
          <h2>How can we help?</h2>
          <p>Our product team usually replies within one business day.</p>
        </div>
        <form class="item-form" id="mailForm">
          <div class="form-group">
            <label for="senderEmail">Your email</label>
            <input id="senderEmail" type="email" required placeholder="you@example.com" value="${state.user.role === 'customer' ? 'customer@example.com' : ''}" />
          </div>
          <div class="form-group">
            <label for="mailSubject">Subject</label>
            <input id="mailSubject" required placeholder="What can we help with?" />
          </div>
          <div class="form-group">
            <label for="mailBody">Message</label>
            <textarea id="mailBody" required placeholder="Tell us a little more..."></textarea>
          </div>
          <button class="primary" type="submit">Send message <span>→</span></button>
        </form>
      </div>
    </div>
  `;
}

function reports() {
  const today = new Date().toISOString().slice(0, 10);
  const rows = sales().filter(s => s.date.startsWith(today));
  const total = rows.reduce((sum, s) => sum + s.total, 0);

  return `
    <div class="page-heading">
      <div>
        <p class="eyebrow">DAILY CLOSING</p>
        <h1>End-of-day report</h1>
        <p>Download one Excel-compatible sales and inventory file when your counter closes.</p>
      </div>
      <button class="primary" id="downloadDailyReport">Download today's CSV <span>⇩</span></button>
    </div>

    <div class="stats">
      <div class="stat-card">
        <div class="stat-icon blue">⌘</div>
        <p>Today's bills</p>
        <b>${rows.length}</b>
      </div>
      <div class="stat-card">
        <div class="stat-icon green">₹</div>
        <p>Today's sales</p>
        <b>${money(total)}</b>
      </div>
    </div>

    <div class="panel">
      <div class="panel-head">
        <h2>Today's completed checkouts</h2>
        <span class="muted">${today}</span>
      </div>
      ${rows.length ? `
        <div class="table-responsive">
          <table class="inventory-table">
            <thead>
              <tr>
                <th>Bill No.</th>
                <th>Item Code</th>
                <th>Product</th>
                <th>Qty</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${rows.map(s => `
                <tr>
                  <td><code>${esc(s.billNo)}</code></td>
                  <td>${esc(s.code)}</td>
                  <td>${esc(s.name)}</td>
                  <td>${s.quantity}</td>
                  <td><b>${money(s.total)}</b></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      ` : '<p class="muted" style="padding: 16px 0;">No checkouts have been completed today.</p>'}
    </div>
  `;
}

function checkout() {
  return `
    <div class="page-heading">
      <div>
        <p class="eyebrow">STORE COUNTER</p>
        <h1>Quick checkout</h1>
        <p>Enter an item's unique code to look up its price and update stock.</p>
      </div>
    </div>

    <div class="checkout-card">
      <form id="checkoutForm" class="item-form">
        <div class="form-group">
          <label for="checkoutCode">Item code</label>
          <input id="checkoutCode" required autocomplete="off" placeholder="e.g. LGT-204" />
        </div>
        <div class="form-group">
          <label for="checkoutQuantity">Quantity</label>
          <input id="checkoutQuantity" type="number" value="1" min="1" required />
        </div>
        <button class="primary" type="submit">Find item <span>→</span></button>
      </form>
      <div id="checkoutResult" class="checkout-result">
        <p>Ready to scan or enter a product code.</p>
      </div>
    </div>
  `;
}

/* --------------------------------------------------------------------------
   Render & Page Binding
   -------------------------------------------------------------------------- */
function render(transition = true) {
  if (!state.user) return;

  nav();

  // Synchronize Topbar profile info
  const initial = (state.user.name || 'User')[0].toUpperCase();
  const roleLabel = state.user.role === 'admin' ? 'Administrator' : 'Customer';

  document.getElementById('profileName').textContent = state.user.name;
  document.getElementById('profileRole').textContent = roleLabel;
  document.getElementById('avatar').textContent = initial;

  // Synchronize Profile dropdown menu info
  document.getElementById('menuAvatar').textContent = initial;
  document.getElementById('profileMenuName').textContent = state.user.name;
  document.getElementById('profileMenuRoleBadge').textContent = roleLabel;
  document.getElementById('profileMenuEmail').textContent = state.user.email || (state.user.role === 'admin' ? 'admin@stockly.com' : 'customer@stockly.com');

  const pages = {
    dashboard: state.user.role === 'customer' ? customerHome : dashboard,
    inventory,
    checkout,
    reports,
    products: browse,
    discounts,
    messages
  };

  // Restrict admin pages if customer
  if (state.user.role !== 'admin' && ['inventory', 'discounts', 'checkout', 'reports'].includes(state.page)) {
    state.page = 'dashboard';
  }

  const appContent = document.getElementById('appContent');
  if (!appContent) return;

  const contentRenderer = () => {
    appContent.innerHTML = pages[state.page]();
    bindPage();
    document.getElementById('downloadDailyReport')?.addEventListener('click', downloadDailyReport);

    if (transition) {
      appContent.classList.remove('page-enter');
      void appContent.offsetWidth; // Trigger DOM reflow to restart CSS animation
      appContent.classList.add('page-enter');
    }
  };

  if (transition && document.startViewTransition) {
    document.startViewTransition(contentRenderer);
  } else {
    contentRenderer();
  }
}

function bindPage() {
  // Navigation buttons
  document.querySelectorAll('[data-go]').forEach(b => {
    b.onclick = () => {
      state.page = b.dataset.go;
      render(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };
  });

  // Filter tabs
  document.querySelectorAll('[data-filter]').forEach(b => {
    b.onclick = () => {
      state.filter = b.dataset.filter;
      render(false);
    };
  });

  // Add product button
  document.getElementById('addProduct')?.addEventListener('click', () => openItem());

  // Edit buttons
  document.querySelectorAll('.edit').forEach(b => {
    b.onclick = () => openItem(products().find(p => p.id === b.dataset.id));
  });

  // Discount buttons
  document.querySelectorAll('.discount').forEach(b => {
    b.onclick = () => openDiscount(b.dataset.id);
  });

  // Delete buttons
  document.querySelectorAll('.delete').forEach(b => {
    b.onclick = () => {
      const all = products();
      const p = all.find(x => x.id === b.dataset.id);
      if (!p) return;
      if (confirm(`Are you sure you want to delete "${p.name}"?`)) {
        save(all.filter(x => x.id !== p.id));
        toast('Product removed from inventory');
        render(false);
      }
    };
  });

  // Contact form submission
  document.getElementById('mailForm')?.addEventListener('submit', e => {
    e.preventDefault();
    const subject = document.getElementById('mailSubject')?.value || 'Inquiry';
    const body = document.getElementById('mailBody')?.value || '';
    toast('Opening email client...');
    setTimeout(() => {
      location.href = `mailto:support@banglahaat.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    }, 400);
  });
}

/* --------------------------------------------------------------------------
   Modals: Product & Discount Handlers
   -------------------------------------------------------------------------- */
function openItem(p) {
  const form = document.getElementById('itemForm');
  if (form) form.reset();

  document.getElementById('editId').value = p?.id || '';
  document.getElementById('itemModalTitle').textContent = p ? 'Edit product' : 'Add a product';
  document.getElementById('itemFormLabel').textContent = p ? 'UPDATE INVENTORY' : 'INVENTORY';

  if (p) {
    document.getElementById('itemName').value = p.name || '';
    document.getElementById('itemSku').value = p.sku || '';
    document.getElementById('itemCategory').value = p.category || '';
    document.getElementById('itemDescription').value = p.description || '';
    document.getElementById('itemPrice').value = p.price || '';
    document.getElementById('itemStock').value = p.stock ?? '';
    document.getElementById('itemExpiry').value = p.expiryDate || '';
    document.getElementById('itemImage').value = p.image || '';
  }

  show('itemModal');
}

function openDiscount(id) {
  const p = products().find(x => x.id === id);
  if (!p) return;
  document.getElementById('discountId').value = id;
  document.getElementById('discountPercent').value = p.discount || '';
  show('discountModal');
}

function downloadDailyReport() {
  const day = new Date().toISOString().slice(0, 10);
  const daySales = sales().filter(s => s.date.startsWith(day));
  const lines = [
    'Bangla Haat end-of-day sales report',
    `Date,${day}`,
    'Bill number,Item code,Product,Quantity,Unit price,Total,Time',
    ...daySales.map(s => [
      s.billNo,
      s.code,
      s.name,
      s.quantity,
      s.unitPrice,
      s.total,
      new Date(s.date).toLocaleTimeString('en-IN')
    ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')),
    '',
    'Current inventory',
    'Item code,Product,Quantity remaining,Price,Description,Expiry date',
    ...products().map(p => [
      p.sku,
      p.name,
      p.stock,
      p.price,
      p.description || '',
      p.expiryDate || ''
    ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
  ];

  const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `bangla-haat-end-of-day-${day}.csv`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 500);
  toast('End-of-day CSV exported');
}

/* --------------------------------------------------------------------------
   Event Listeners Setup
   -------------------------------------------------------------------------- */

// Brand link click
document.getElementById('brandLink')?.addEventListener('click', e => {
  e.preventDefault();
  state.page = 'dashboard';
  render(true);
});

// Sidebar Navigation
document.querySelectorAll('.nav-link').forEach(b => {
  b.addEventListener('click', () => {
    state.page = b.dataset.page;
    state.filter = 'all';
    render(true);
    closeSidebar();
  });
});

// Mobile Hamburger & Backdrop
document.getElementById('menuToggle')?.addEventListener('click', toggleSidebar);
document.getElementById('sidebarBackdrop')?.addEventListener('click', closeSidebar);

// Header Search
document.getElementById('searchInput')?.addEventListener('input', e => {
  state.search = e.target.value;
  if (!['products', 'inventory'].includes(state.page)) {
    state.page = state.user?.role === 'admin' ? 'inventory' : 'products';
  }
  render(false);
});

// Profile Button & Menu
document.getElementById('profileButton')?.addEventListener('click', e => {
  e.stopPropagation();
  toggleProfileMenu();
});

// Notification Button & Clear
document.getElementById('notificationButton')?.addEventListener('click', e => {
  e.stopPropagation();
  const panel = document.getElementById('notificationPanel');
  const btn = document.getElementById('notificationButton');
  if (!panel || !btn) return;

  const isOpen = !panel.classList.contains('hidden');
  if (isOpen) {
    panel.classList.add('hidden');
    btn.setAttribute('aria-expanded', 'false');
  } else {
    panel.classList.remove('hidden');
    btn.setAttribute('aria-expanded', 'true');
    // Close profile menu if open
    document.getElementById('profileMenu')?.classList.add('hidden');
    document.getElementById('profileButton')?.setAttribute('aria-expanded', 'false');
  }
});

document.getElementById('clearNotifications')?.addEventListener('click', () => {
  document.getElementById('notificationPanel')?.classList.add('hidden');
  document.getElementById('notificationButton')?.setAttribute('aria-expanded', 'false');
  const dot = document.getElementById('notificationDot');
  if (dot) dot.style.display = 'none';
  toast('Notifications marked as read');
});

// Close dropdowns on outside click
document.addEventListener('click', e => {
  const profileWrap = e.target.closest('.profile-wrap');
  const notifWrap = e.target.closest('.notification-wrap');
  if (!profileWrap && !notifWrap) {
    closeDropdowns();
  }
});

// Keyboard navigation: Escape key closes active modals & dropdowns
window.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    closeDropdowns();
    closeSidebar();

    // Close open modals if not authModal without user
    const openModals = Array.from(document.querySelectorAll('.modal-backdrop:not(.hidden)'));
    for (const m of openModals) {
      if (m.id === 'authModal' && !state.user) continue;
      hide(m.id);
    }
  }
});

// Modal close buttons (via [data-close])
document.querySelectorAll('[data-close]').forEach(b => {
  b.addEventListener('click', () => hide(b.dataset.close));
});

// Close modal when clicking on the backdrop outside .modal
document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
  backdrop.addEventListener('click', e => {
    if (e.target === backdrop) {
      if (backdrop.id === 'authModal' && !state.user) return; // Prevent closing login modal if unauthenticated
      hide(backdrop.id);
    }
  });
});

// Sign out triggers
document.getElementById('logout')?.addEventListener('click', signOut);
document.getElementById('profileSignOut')?.addEventListener('click', signOut);

// Profile Menu Demo Switch buttons
document.querySelectorAll('[data-switch-demo]').forEach(btn => {
  btn.addEventListener('click', () => {
    const targetEmail = btn.dataset.switchDemo === 'admin' ? 'admin@stockly.com' : 'customer@stockly.com';
    const targetUser = users[targetEmail];
    if (targetUser) loginAs(targetUser);
  });
});

// Login Form submission
document.getElementById('loginForm')?.addEventListener('submit', e => {
  e.preventDefault();
  const emailInput = document.getElementById('loginEmail');
  const passInput = document.getElementById('loginPassword');
  const errorEl = document.getElementById('loginError');

  const u = users[emailInput.value.trim().toLowerCase()];
  if (!u || u.password !== passInput.value) {
    errorEl.textContent = 'That email or password is not recognised. Try using one of the demo accounts below.';
    errorEl.classList.remove('hidden');
    return;
  }

  errorEl.classList.add('hidden');
  loginAs(u);
});

// Demo accounts fill in auth card
document.querySelectorAll('[data-demo]').forEach(b => {
  b.onclick = () => {
    const email = b.dataset.demo === 'admin' ? 'admin@stockly.com' : 'customer@stockly.com';
    document.getElementById('loginEmail').value = email;
    document.getElementById('loginPassword').value = 'stockly';
    document.getElementById('loginError')?.classList.add('hidden');
  };
});

// Add / Edit Product Form submission
document.getElementById('itemForm')?.addEventListener('submit', e => {
  e.preventDefault();
  const id = document.getElementById('editId').value;
  const all = products();

  const product = {
    id: id || 'p' + Date.now(),
    name: document.getElementById('itemName').value.trim(),
    sku: document.getElementById('itemSku').value.trim(),
    category: document.getElementById('itemCategory').value.trim(),
    description: document.getElementById('itemDescription').value.trim(),
    price: Number(document.getElementById('itemPrice').value),
    stock: Number(document.getElementById('itemStock').value),
    expiryDate: document.getElementById('itemExpiry').value || '',
    image: document.getElementById('itemImage').value.trim(),
    discount: 0
  };

  if (id) {
    const existing = all.find(p => p.id === id);
    if (existing) {
      product.discount = existing.discount || 0;
      Object.assign(existing, product);
    }
    toast('Product updated successfully');
  } else {
    all.unshift(product);
    toast('Product added to inventory');
  }

  save(all);
  hide('itemModal');
  render(false);
});

// Discount Form submission
document.getElementById('discountForm')?.addEventListener('submit', e => {
  e.preventDefault();
  const id = document.getElementById('discountId').value;
  const percent = Number(document.getElementById('discountPercent').value);
  const all = products();
  const p = all.find(x => x.id === id);

  if (p) {
    p.discount = percent;
    save(all);
    hide('discountModal');
    toast(`${p.name} discount set to ${percent}%`);
    render(false);
  }
});

// Counter Checkout lookup
document.addEventListener('submit', event => {
  if (event.target.id !== 'checkoutForm') return;
  event.preventDefault();

  const codeInput = document.getElementById('checkoutCode');
  const qtyInput = document.getElementById('checkoutQuantity');
  const result = document.getElementById('checkoutResult');

  const code = codeInput.value.trim().toUpperCase();
  const quantity = Number(qtyInput.value) || 1;
  const product = products().find(p => p.sku.toUpperCase() === code);

  if (!product) {
    result.innerHTML = '<p class="checkout-error">No item matches that code. Check the code and try again.</p>';
    return;
  }

  if (product.stock < quantity) {
    result.innerHTML = `<p class="checkout-error">Only ${product.stock} units of ${esc(product.name)} are currently available.</p>`;
    return;
  }

  result.innerHTML = `
    <div class="checkout-product">
      ${img(product)}
      <div>
        <p class="eyebrow">${esc(product.sku)}</p>
        <h2>${esc(product.name)}</h2>
        <p>${quantity} × ${money(salePrice(product))}</p>
      </div>
      <b>${money(salePrice(product) * quantity)}</b>
    </div>
    <button class="primary" id="confirmCheckout" data-sku="${esc(product.sku)}" data-quantity="${quantity}">
      Confirm checkout <span>→</span>
    </button>
  `;
});

// Confirm Checkout & Bill Generation
document.addEventListener('click', event => {
  const button = event.target.closest('#confirmCheckout');
  if (!button) return;

  const all = products();
  const p = all.find(x => x.sku === button.dataset.sku);
  const quantity = Number(button.dataset.quantity);
  if (!p) return;

  p.stock -= quantity;
  save(all);

  const unitPrice = salePrice(p);
  const bill = {
    billNo: `BH-${Date.now().toString().slice(-6)}`,
    code: p.sku,
    name: p.name,
    quantity,
    unitPrice,
    total: unitPrice * quantity,
    date: new Date().toISOString()
  };

  saveSales([bill, ...sales()]);

  const result = document.getElementById('checkoutResult');
  if (result) {
    result.innerHTML = `
      <p class="checkout-success">Checkout complete. ${esc(p.name)} now has ${p.stock} units in stock.</p>
      <button class="primary" id="viewBill" data-bill="${bill.billNo}">View bill <span>→</span></button>
    `;
  }

  toast('Checkout completed and receipt generated');
});

// View Bill Receipt Modal
document.addEventListener('click', event => {
  const button = event.target.closest('#viewBill');
  if (!button) return;

  const bill = sales().find(s => s.billNo === button.dataset.bill);
  if (!bill) return;

  const content = document.getElementById('billContent');
  if (content) {
    content.innerHTML = `
      <div class="bill">
        <p class="eyebrow">BANGLA HAAT · TAX INVOICE</p>
        <h2>Bill ${esc(bill.billNo)}</h2>
        <p class="muted">${new Date(bill.date).toLocaleString('en-IN')}</p>
        <hr>
        <p>
          <b>${esc(bill.name)}</b><br>
          <small>${esc(bill.code)} · ${bill.quantity} × ${money(bill.unitPrice)}</small>
        </p>
        <hr>
        <div class="bill-total">
          <span>Total paid</span>
          <b>${money(bill.total)}</b>
        </div>
        <p class="muted" style="margin-top:20px; font-size:13px;">Thank you for shopping with Bangla Haat.</p>
      </div>
    `;
  }

  show('billModal');
});

// Print Bill
document.getElementById('printBill')?.addEventListener('click', () => {
  const content = document.getElementById('billContent')?.innerHTML;
  if (!content) return;
  const win = window.open('', '_blank', 'width=520,height=640');
  if (!win) return;

  win.document.write(`
    <!doctype html>
    <html>
      <head>
        <title>Bangla Haat Invoice</title>
        <style>
          body { font-family: system-ui, -apple-system, sans-serif; padding: 36px; color: #2b1f1a; line-height: 1.5; }
          .eyebrow { color: #a23334; font-size: 11px; font-weight: bold; letter-spacing: 1.2px; text-transform: uppercase; margin: 0 0 6px; }
          h2 { margin: 0 0 4px; font-size: 22px; }
          .muted { color: #85766d; font-size: 13px; }
          hr { border: 0; border-top: 1px solid #eadfce; margin: 18px 0; }
          .bill-total { display: flex; justify-content: space-between; font-size: 18px; font-weight: bold; margin-top: 8px; }
        </style>
      </head>
      <body>
        ${content}
      </body>
    </html>
  `);
  win.document.close();
  win.print();
});

// Email Bill
document.getElementById('emailBill')?.addEventListener('click', () => {
  const billTitle = document.querySelector('#billContent h2')?.textContent || 'Bangla Haat Bill';
  const text = document.getElementById('billContent')?.innerText || '';
  location.href = `mailto:?subject=${encodeURIComponent(billTitle)}&body=${encodeURIComponent(text)}`;
});

// Supabase live product sync (optional)
if (window.banglaHaatSupabase) {
  window.banglaHaatSupabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false })
    .then(({ data, error }) => {
      if (error) {
        console.warn('Supabase product sync unavailable:', error.message);
        return;
      }
      if (!data?.length) return;
      save(data.map(p => ({
        id: p.id,
        name: p.name,
        sku: p.product_code,
        category: p.category,
        description: p.description || '',
        expiryDate: p.expiry_date || '',
        price: Number(p.price),
        stock: p.stock_quantity,
        image: p.image_url || '',
        discount: Number(p.discount_percent || 0)
      })));
      render(false);
    })
    .catch(err => {
      console.info('Supabase sync skipped (running offline/local mode):', err?.message || err);
    });
}

/* --------------------------------------------------------------------------
   App Initialization
   -------------------------------------------------------------------------- */
const savedUser = sessionStorage.getItem('stockly_user');
if (savedUser) {
  try {
    state.user = JSON.parse(savedUser);
    render(false);
  } catch (e) {
    show('authModal');
  }
} else {
  show('authModal');
}
