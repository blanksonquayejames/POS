// ==========================================================================
// Selligine POS System — Complete Application Controller
// ==========================================================================

const AppState = {
  currentStaff: null,
  activeTab: 'landing', // 'landing' | 'pos' | 'inventory' | 'reports' | 'staff' | 'settings'
  products: [],
  sales: [],
  staff: [],
  customers: [],
  auditLogs: [],
  settings: {},
  
  // POS Cart State
  cart: [],
  selectedCustomer: null,
  heldCarts: [],
  activeCategory: 'All',
  searchQuery: '',

  // Active Modals & Data
  activeModal: null,
  lastCompletedSale: null
};

// Simple Web Audio API Sound Generator for Real POS Terminal Feel
const SoundEffects = {
  ctx: null,
  init() {
    if (!this.ctx && (window.AudioContext || window.webkitAudioContext)) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
  },
  beep(freq = 880, type = 'sine', duration = 0.08) {
    try {
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {
      console.warn("Audio playback not allowed yet", e);
    }
  },
  scan() {
    this.beep(1200, 'square', 0.06);
  },
  success() {
    this.beep(587.33, 'triangle', 0.1);
    setTimeout(() => this.beep(880, 'triangle', 0.15), 100);
  },
  error() {
    this.beep(220, 'sawtooth', 0.2);
  }
};

// ==========================================================================
// Initialization & Persistence
// ==========================================================================
function initApp() {
  loadData();
  setupEventListeners();
  renderApp();
}

function loadData() {
  const storedProducts = localStorage.getItem('selligine_products');
  const storedSales = localStorage.getItem('selligine_sales');
  const storedStaff = localStorage.getItem('selligine_staff');
  const storedCustomers = localStorage.getItem('selligine_customers');
  const storedLogs = localStorage.getItem('selligine_logs');
  const storedSettings = localStorage.getItem('selligine_settings');
  const storedHeld = localStorage.getItem('selligine_held_carts');

  AppState.products = storedProducts ? JSON.parse(storedProducts) : [...INITIAL_PRODUCTS];
  AppState.sales = storedSales ? JSON.parse(storedSales) : generate14DaysSalesHistory();
  AppState.staff = storedStaff ? JSON.parse(storedStaff) : [...INITIAL_STAFF];
  AppState.customers = storedCustomers ? JSON.parse(storedCustomers) : [...INITIAL_CUSTOMERS];
  AppState.auditLogs = storedLogs ? JSON.parse(storedLogs) : [...INITIAL_AUDIT_LOGS];
  AppState.settings = storedSettings ? JSON.parse(storedSettings) : { ...INITIAL_STORE_SETTINGS };
  AppState.heldCarts = storedHeld ? JSON.parse(storedHeld) : [];

  // Default customer is Walk-in
  AppState.selectedCustomer = AppState.customers.find(c => c.id === 'cust_walkin') || AppState.customers[0];

  saveData();
}

function saveData() {
  localStorage.setItem('selligine_products', JSON.stringify(AppState.products));
  localStorage.setItem('selligine_sales', JSON.stringify(AppState.sales));
  localStorage.setItem('selligine_staff', JSON.stringify(AppState.staff));
  localStorage.setItem('selligine_customers', JSON.stringify(AppState.customers));
  localStorage.setItem('selligine_logs', JSON.stringify(AppState.auditLogs));
  localStorage.setItem('selligine_settings', JSON.stringify(AppState.settings));
  localStorage.setItem('selligine_held_carts', JSON.stringify(AppState.heldCarts));
}

function resetToDefaults() {
  if (confirm("Reset demo data to initial 40 products and 14 days of realistic sales history?")) {
    localStorage.removeItem('selligine_products');
    localStorage.removeItem('selligine_sales');
    localStorage.removeItem('selligine_staff');
    localStorage.removeItem('selligine_customers');
    localStorage.removeItem('selligine_logs');
    localStorage.removeItem('selligine_settings');
    localStorage.removeItem('selligine_held_carts');
    loadData();
    AppState.cart = [];
    alert("Selligine has been reset to default demo dataset!");
    renderApp();
  }
}

// ==========================================================================
// Authentication & Role Portal Switching
// ==========================================================================
function selectPortalRole(roleKey, staffId = null) {
  let targetStaff = null;
  if (staffId) {
    targetStaff = AppState.staff.find(s => s.id === staffId);
  } else {
    targetStaff = AppState.staff.find(s => s.roleKey === roleKey);
  }

  if (!targetStaff) {
    targetStaff = AppState.staff[0];
  }

  AppState.currentStaff = targetStaff;

  // Decide default view based on role
  if (targetStaff.roleKey === 'cashier') {
    AppState.activeTab = 'pos';
  } else if (targetStaff.roleKey === 'inventory') {
    AppState.activeTab = 'inventory';
  } else if (targetStaff.roleKey === 'accountant') {
    AppState.activeTab = 'reports';
  } else {
    AppState.activeTab = 'pos'; // Owner & GM default to POS with full nav
  }

  SoundEffects.success();
  renderApp();
}

function exitToLanding() {
  AppState.currentStaff = null;
  AppState.activeTab = 'landing';
  renderApp();
}

function switchTab(tab) {
  AppState.activeTab = tab;
  renderApp();
}

// Check role permission
function hasAccess(tabName) {
  if (!AppState.currentStaff) return false;
  const role = AppState.currentStaff.roleKey;
  if (role === 'owner') return true;
  if (role === 'manager') return tabName !== 'settings'; // GM has all except billing/system settings
  if (role === 'cashier') return tabName === 'pos';
  if (role === 'inventory') return tabName === 'inventory' || tabName === 'pos';
  if (role === 'accountant') return tabName === 'reports';
  return false;
}

// ==========================================================================
// Main UI Rendering Engine
// ==========================================================================
function renderApp() {
  const sessionBar = document.getElementById('roleSessionBar');
  const subnav = document.getElementById('appSubnav');
  const mainContent = document.getElementById('mainContentArea');

  // 1. Role Session Bar
  if (AppState.currentStaff) {
    sessionBar.style.display = 'flex';
    sessionBar.innerHTML = `
      <div class="role-session-info">
        <span>Logged in as:</span>
        <strong style="color: #60a5fa;">${escapeHtml(AppState.currentStaff.name)}</strong>
        <span class="role-badge-pill" style="background:${AppState.currentStaff.color}22; color:${AppState.currentStaff.color}; border:1px solid ${AppState.currentStaff.color}55;">
          ${escapeHtml(AppState.currentStaff.role)}
        </span>
        <span style="color:#64748b;">•</span>
        <span style="font-size:12px; color:#94a3b8;">${escapeHtml(AppState.settings.storeName)}</span>
      </div>
      <div class="role-session-actions">
        <button class="session-btn" onclick="openPortalSwitcherModal()">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          Switch Role
        </button>
        <button class="session-btn primary" onclick="exitToLanding()">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
          Demo Portal Gateway
        </button>
      </div>
    `;

    // 2. Navigation Tabs
    subnav.style.display = 'flex';
    renderSubnav(subnav);
  } else {
    sessionBar.style.display = 'none';
    subnav.style.display = 'none';
  }

  // 3. Main Views
  if (!AppState.currentStaff || AppState.activeTab === 'landing') {
    renderLandingView(mainContent);
  } else if (AppState.activeTab === 'pos') {
    renderPosView(mainContent);
  } else if (AppState.activeTab === 'inventory') {
    renderInventoryView(mainContent);
  } else if (AppState.activeTab === 'reports') {
    renderReportsView(mainContent);
  } else if (AppState.activeTab === 'staff') {
    renderStaffView(mainContent);
  } else if (AppState.activeTab === 'settings') {
    renderSettingsView(mainContent);
  }
}

function renderSubnav(container) {
  const allowed = [
    { id: 'pos', label: 'POS Terminal', icon: '🖥️' },
    { id: 'inventory', label: 'Inventory & Stock', icon: '📦', badge: AppState.products.filter(p => p.stock <= p.reorderLevel).length },
    { id: 'reports', label: 'Sales & Accounting', icon: '📊' },
    { id: 'staff', label: 'Staff Management', icon: '👥' },
    { id: 'settings', label: 'Store Settings', icon: '⚙️' }
  ].filter(item => hasAccess(item.id));

  container.innerHTML = `
    <div class="app-subnav-links">
      ${allowed.map(item => `
        <button class="tab-btn ${AppState.activeTab === item.id ? 'active' : ''}" onclick="switchTab('${item.id}')">
          <span>${item.icon}</span>
          <span>${item.label}</span>
          ${item.badge ? `<span class="badge-pill" style="background:#fef2f2; color:#ef4444;">${item.badge} low</span>` : ''}
        </button>
      `).join('')}
    </div>
    <div style="font-size:12px; color:#64748b; font-weight:600; display:flex; align-items:center; gap:8px;">
      <span style="width:8px; height:8px; background:#10b981; border-radius:50%; display:inline-block;"></span>
      Terminal Online • Shift Open
    </div>
  `;
}

// ==========================================================================
// 1. Landing Hero View (Exact match to User's Uploaded Screenshot)
// ==========================================================================
function renderLandingView(container) {
  container.innerHTML = `
    <div class="landing-view">
      <div class="hero-card-container">
        
        <!-- Left Navy Side -->
        <div class="hero-navy-col">
          <div>
            <div class="demo-pill-badge">Live Demo</div>
            <h1 class="hero-main-title">
              Explore Selligine<br>
              <span class="highlight">without signing up.</span>
            </h1>
            <p class="hero-description">
              Walk through a fully populated provision store — 40 products, real sales history, and 6 staff accounts across every role.
            </p>

            <div class="available-portals-box">
              <div class="portals-box-title">6 DEMO PORTALS AVAILABLE</div>
              <ul class="portals-list">
                <li>Business Owner</li>
                <li>General Manager</li>
                <li>Cashier</li>
                <li>Cashier</li>
                <li>Inventory Manager</li>
                <li>Accountant</li>
              </ul>
            </div>
          </div>

          <div class="hero-stats-row">
            <div class="stat-item">
              <div class="stat-number">40</div>
              <div class="stat-label">Products</div>
            </div>
            <div class="stat-item">
              <div class="stat-number">14 days</div>
              <div class="stat-label">Sales History</div>
            </div>
            <div class="stat-item">
              <div class="stat-number">6 roles</div>
              <div class="stat-label">Staff Portals</div>
            </div>
          </div>
        </div>

        <!-- Right Portal Chooser Side -->
        <div class="hero-portal-picker-col">
          <div class="picker-tag">NO SIGN-UP NEEDED</div>
          <h2 class="picker-title">Choose a portal to explore</h2>
          <p class="picker-subtitle">Each portal logs you in as a different team member with role-specific access.</p>

          <div class="role-cards-grid">
            <!-- 1. Business Owner -->
            <div class="role-portal-card" onclick="selectPortalRole('owner')">
              <div class="role-icon-box">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
              </div>
              <div class="role-info-content">
                <div class="role-card-title">Business Owner</div>
                <div class="role-person-name">Kwame Asante</div>
                <div class="role-person-desc">Full access — all settings, staff, reports, POS</div>
              </div>
              <div class="role-chevron">›</div>
            </div>

            <!-- 2. General Manager -->
            <div class="role-portal-card" onclick="selectPortalRole('manager')">
              <div class="role-icon-box">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              </div>
              <div class="role-info-content">
                <div class="role-card-title">General Manager</div>
                <div class="role-person-name">Akosua Mensah</div>
                <div class="role-person-desc">Staff, inventory, reports — no billing/settings</div>
              </div>
              <div class="role-chevron">›</div>
            </div>

            <!-- 3. Cashier (Kojo Frimpong) -->
            <div class="role-portal-card" onclick="selectPortalRole('cashier', 'staff_3')">
              <div class="role-icon-box">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="20" height="14" x="2" y="3" rx="2"/><line x1="8" x2="16" y1="21" y2="21"/><line x1="12" x2="12" y1="17" y2="21"/></svg>
              </div>
              <div class="role-info-content">
                <div class="role-card-title">Cashier</div>
                <div class="role-person-name">Kojo Frimpong</div>
                <div class="role-person-desc">POS terminal, sales, customer lookup</div>
              </div>
              <div class="role-chevron">›</div>
            </div>

            <!-- 4. Cashier (Abena Ofori) -->
            <div class="role-portal-card" onclick="selectPortalRole('cashier', 'staff_4')">
              <div class="role-icon-box">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="20" height="14" x="2" y="3" rx="2"/><line x1="8" x2="16" y1="21" y2="21"/><line x1="12" x2="12" y1="17" y2="21"/></svg>
              </div>
              <div class="role-info-content">
                <div class="role-card-title">Cashier</div>
                <div class="role-person-name">Abena Ofori</div>
                <div class="role-person-desc">POS terminal, sales, customer lookup</div>
              </div>
              <div class="role-chevron">›</div>
            </div>

            <!-- 5. Inventory Manager -->
            <div class="role-portal-card" onclick="selectPortalRole('inventory')">
              <div class="role-icon-box">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>
              </div>
              <div class="role-info-content">
                <div class="role-card-title">Inventory Manager</div>
                <div class="role-person-name">Ama Boateng</div>
                <div class="role-person-desc">Products, stock levels, adjustments</div>
              </div>
              <div class="role-chevron">›</div>
            </div>

            <!-- 6. Accountant -->
            <div class="role-portal-card" onclick="selectPortalRole('accountant')">
              <div class="role-icon-box">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" x2="12" y1="20" y2="10"/><line x1="18" x2="18" y1="20" y2="4"/><line x1="6" x2="6" y1="20" y2="16"/></svg>
              </div>
              <div class="role-info-content">
                <div class="role-card-title">Accountant</div>
                <div class="role-person-name">Yaw Darkwa</div>
                <div class="role-person-desc">Sales reports, reconciliation, audit log</div>
              </div>
              <div class="role-chevron">›</div>
            </div>
          </div>

          <div class="portal-footer-links">
            Have an account? <button onclick="openSignInModal()">Sign in</button> · <button onclick="openRegisterModal()">Register business</button>
          </div>
        </div>

      </div>
    </div>
  `;
}

// ==========================================================================
// 2. POS Terminal Checkout View
// ==========================================================================
function renderPosView(container) {
  // Filter products by search and category
  const filtered = AppState.products.filter(p => {
    const matchesCat = AppState.activeCategory === 'All' || p.category === AppState.activeCategory;
    const q = AppState.searchQuery.trim().toLowerCase();
    const matchesQuery = !q || p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q) || p.barcode.includes(q);
    return matchesCat && matchesQuery;
  });

  const cartCalculations = getCartTotals();

  container.innerHTML = `
    <div class="pos-workspace">
      
      <!-- Left Column: Search, Categories & Catalog -->
      <div class="pos-catalog-panel">
        <div class="pos-search-toolbar">
          <div class="search-input-wrap">
            <span class="search-icon">🔍</span>
            <input 
              type="text" 
              id="posSearchInput" 
              class="pos-search-input" 
              placeholder="Search product by name, SKU or barcode (e.g. Milo, Rice, 6001001001)..." 
              value="${escapeHtml(AppState.searchQuery)}"
              oninput="handlePosSearch(this.value)"
              autofocus
            />
          </div>
          <button class="barcode-badge-btn" onclick="promptBarcodeScan()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 5v14"/><path d="M8 5v14"/><path d="M12 5v14"/><path d="M17 5v14"/><path d="M21 5v14"/></svg>
            Scan Barcode
          </button>
        </div>

        <!-- Category Pills -->
        <div class="category-filter-strip">
          ${INITIAL_CATEGORIES.map(cat => {
            const count = cat === 'All' ? AppState.products.length : AppState.products.filter(p => p.category === cat).length;
            return `
              <button 
                class="cat-pill ${AppState.activeCategory === cat ? 'active' : ''}" 
                onclick="filterCategory('${escapeHtml(cat)}')">
                ${escapeHtml(cat)} (${count})
              </button>
            `;
          }).join('')}
        </div>

        <!-- Products Grid -->
        <div class="products-scroll-area">
          ${filtered.length === 0 ? `
            <div style="text-align:center; padding: 60px 20px; color:#94a3b8;">
              <div style="font-size:42px; margin-bottom:12px;">🔍</div>
              <h3>No products found</h3>
              <p style="font-size:13px; margin-top:4px;">Try searching for a different keyword or category.</p>
            </div>
          ` : `
            <div class="products-grid">
              ${filtered.map(p => {
                let stockClass = 'in-stock';
                let stockLabel = `${p.stock} in stock`;
                if (p.stock <= 0) {
                  stockClass = 'out-stock';
                  stockLabel = 'Out of Stock';
                } else if (p.stock <= p.reorderLevel) {
                  stockClass = 'low-stock';
                  stockLabel = `Low: ${p.stock} left`;
                }

                return `
                  <div class="product-card" onclick="addToCart('${p.id}')">
                    <div class="prod-card-top">
                      <span class="prod-emoji-icon">${p.image || '📦'}</span>
                      <span class="prod-stock-tag ${stockClass}">${stockLabel}</span>
                    </div>
                    <div class="prod-card-name" title="${escapeHtml(p.name)}">${escapeHtml(p.name)}</div>
                    <div class="prod-card-meta">${p.barcode}</div>
                    <div class="prod-card-bottom">
                      <div class="prod-card-price">${AppState.settings.currency} ${p.price.toFixed(2)}</div>
                      <button class="prod-add-btn" title="Add to cart">+</button>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          `}
        </div>
      </div>

      <!-- Right Column: Cart & Checkout -->
      <div class="pos-cart-panel">
        <div class="cart-header">
          <div class="cart-title-row">
            <span class="cart-title">Current Order</span>
            <span class="cart-count-badge">${AppState.cart.reduce((sum, item) => sum + item.qty, 0)} items</span>
          </div>
          <button class="cart-held-btn" onclick="openHeldOrdersModal()">
            <span>📋</span> Held Orders (${AppState.heldCarts.length})
          </button>
        </div>

        <!-- Customer Selection Bar -->
        <div class="cart-customer-bar">
          <select class="cust-select" onchange="handleSelectCustomer(this.value)">
            ${AppState.customers.map(c => `
              <option value="${c.id}" ${AppState.selectedCustomer && AppState.selectedCustomer.id === c.id ? 'selected' : ''}>
                👤 ${escapeHtml(c.name)} ${c.points > 0 ? `(${c.points} pts)` : ''}
              </option>
            `).join('')}
          </select>
          <button class="cust-add-quick-btn" onclick="openQuickAddCustomerModal()">+ New</button>
        </div>

        <!-- Cart Items List -->
        <div class="cart-items-scroll">
          ${AppState.cart.length === 0 ? `
            <div class="empty-cart-state">
              <div class="empty-cart-icon">🛒</div>
              <h4 style="color:#475569; margin-bottom:6px;">Cart is empty</h4>
              <p style="font-size:12px;">Click any product from the catalog or scan a barcode to begin checkout.</p>
            </div>
          ` : `
            ${AppState.cart.map(item => `
              <div class="cart-item-row">
                <div class="cart-item-details">
                  <div class="cart-item-title">${escapeHtml(item.name)}</div>
                  <div class="cart-item-sub">${AppState.settings.currency} ${item.price.toFixed(2)} / unit</div>
                </div>
                <div class="cart-item-qty-controls">
                  <button class="qty-btn" onclick="updateCartQty('${item.productId}', -1)">−</button>
                  <span class="qty-number">${item.qty}</span>
                  <button class="qty-btn" onclick="updateCartQty('${item.productId}', 1)">+</button>
                </div>
                <div class="cart-item-total">
                  ${AppState.settings.currency} ${(item.price * item.qty).toFixed(2)}
                </div>
                <button class="cart-item-remove-btn" title="Remove item" onclick="removeFromCart('${item.productId}')">✕</button>
              </div>
            `).join('')}
          `}
        </div>

        <!-- Cart Summary & Charge Button -->
        <div class="cart-summary-box">
          <div class="cart-sum-row">
            <span>Subtotal</span>
            <strong>${AppState.settings.currency} ${cartCalculations.subtotal.toFixed(2)}</strong>
          </div>
          <div class="cart-sum-row">
            <span>${AppState.settings.taxName} (${AppState.settings.taxRate}%)</span>
            <span>${AppState.settings.currency} ${cartCalculations.tax.toFixed(2)}</span>
          </div>
          ${cartCalculations.discount > 0 ? `
            <div class="cart-sum-row discount">
              <span>Order Discount</span>
              <span>-${AppState.settings.currency} ${cartCalculations.discount.toFixed(2)}</span>
            </div>
          ` : ''}
          <div class="cart-sum-row grand-total">
            <span>Payable Total</span>
            <span style="color:#16a34a;">${AppState.settings.currency} ${cartCalculations.total.toFixed(2)}</span>
          </div>

          <div class="cart-action-buttons">
            <button class="btn-cart-secondary" onclick="holdCurrentCart()" ${AppState.cart.length === 0 ? 'disabled' : ''}>
              ⏸️ Park Cart
            </button>
            <button class="btn-cart-secondary" onclick="clearCart()" ${AppState.cart.length === 0 ? 'disabled' : ''}>
              🗑️ Clear
            </button>
          </div>

          <button 
            class="btn-cart-checkout" 
            onclick="openPaymentModal()" 
            ${AppState.cart.length === 0 ? 'disabled' : ''}>
            <span>⚡ CHARGE</span>
            <span>${AppState.settings.currency} ${cartCalculations.total.toFixed(2)}</span>
          </button>
        </div>

      </div>

    </div>
  `;
}

// ==========================================================================
// Cart Operations
// ==========================================================================
function addToCart(productId) {
  const prod = AppState.products.find(p => p.id === productId);
  if (!prod) return;

  if (prod.stock <= 0 && !AppState.settings.allowNegativeStock) {
    SoundEffects.error();
    alert(`"${prod.name}" is currently out of stock!`);
    return;
  }

  const existing = AppState.cart.find(c => c.productId === productId);
  if (existing) {
    if (existing.qty >= prod.stock && !AppState.settings.allowNegativeStock) {
      SoundEffects.error();
      alert(`Cannot add more: Only ${prod.stock} units available in stock!`);
      return;
    }
    existing.qty += 1;
  } else {
    AppState.cart.push({
      productId: prod.id,
      name: prod.name,
      price: prod.price,
      costPrice: prod.costPrice,
      qty: 1,
      image: prod.image,
      barcode: prod.barcode
    });
  }

  SoundEffects.scan();
  renderApp();
}

function updateCartQty(productId, delta) {
  const item = AppState.cart.find(c => c.productId === productId);
  if (!item) return;

  const prod = AppState.products.find(p => p.id === productId);
  const newQty = item.qty + delta;

  if (newQty <= 0) {
    removeFromCart(productId);
    return;
  }

  if (prod && newQty > prod.stock && !AppState.settings.allowNegativeStock) {
    SoundEffects.error();
    alert(`Only ${prod.stock} units available in stock!`);
    return;
  }

  item.qty = newQty;
  SoundEffects.beep(950, 'sine', 0.05);
  renderApp();
}

function removeFromCart(productId) {
  AppState.cart = AppState.cart.filter(c => c.productId !== productId);
  SoundEffects.beep(400, 'sine', 0.08);
  renderApp();
}

function clearCart() {
  if (AppState.cart.length === 0) return;
  if (confirm("Clear all items in the current cart?")) {
    AppState.cart = [];
    renderApp();
  }
}

function getCartTotals() {
  const subtotal = AppState.cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const tax = parseFloat((subtotal * (AppState.settings.taxRate / 100)).toFixed(2));
  const discount = 0;
  const total = parseFloat((subtotal + tax - discount).toFixed(2));
  return { subtotal, tax, discount, total };
}

function handlePosSearch(val) {
  AppState.searchQuery = val;
  // If exact barcode match, automatically add to cart!
  const exactBarcodeMatch = AppState.products.find(p => p.barcode === val.trim());
  if (exactBarcodeMatch) {
    addToCart(exactBarcodeMatch.id);
    AppState.searchQuery = '';
    const input = document.getElementById('posSearchInput');
    if (input) input.value = '';
    return;
  }
  renderApp();
  // Keep focus on input
  setTimeout(() => {
    const input = document.getElementById('posSearchInput');
    if (input) {
      input.focus();
      input.setSelectionRange(input.value.length, input.value.length);
    }
  }, 10);
}

function promptBarcodeScan() {
  const sampleBarcodes = AppState.products.slice(0, 5).map(p => `${p.name}: ${p.barcode}`).join('\n');
  const code = prompt(`Simulate Barcode Scanner input.\nSample Barcodes in store:\n${sampleBarcodes}\n\nEnter or scan barcode:`, "6001001001");
  if (code) {
    handlePosSearch(code.trim());
  }
}

function filterCategory(cat) {
  AppState.activeCategory = cat;
  renderApp();
}

function handleSelectCustomer(custId) {
  AppState.selectedCustomer = AppState.customers.find(c => c.id === custId) || AppState.customers[0];
}

// Hold / Park Cart feature
function holdCurrentCart() {
  if (AppState.cart.length === 0) return;
  const note = prompt("Enter a reference note for this parked cart (e.g. Customer stepped out for cash):", `Parked ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);
  if (note === null) return;

  AppState.heldCarts.push({
    id: `held_${Date.now()}`,
    timeStr: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    dateStr: new Date().toLocaleDateString("en-GB"),
    customer: AppState.selectedCustomer,
    items: [...AppState.cart],
    note: note || "Parked order"
  });

  AppState.cart = [];
  saveData();
  SoundEffects.beep(600, 'triangle', 0.1);
  alert("Order parked successfully! You can recall it anytime from 'Held Orders'.");
  renderApp();
}

function recallHeldCart(heldId) {
  const index = AppState.heldCarts.findIndex(h => h.id === heldId);
  if (index === -1) return;

  if (AppState.cart.length > 0) {
    if (!confirm("Your current cart will be replaced by the held cart. Proceed?")) return;
  }

  const held = AppState.heldCarts.splice(index, 1)[0];
  AppState.cart = held.items;
  AppState.selectedCustomer = held.customer;
  saveData();
  closeModal();
  SoundEffects.success();
  renderApp();
}

// ==========================================================================
// 3. Payment Modal & Checkout Processing
// ==========================================================================
let currentPaymentMethod = 'Cash';

function openPaymentModal() {
  if (AppState.cart.length === 0) return;
  const totals = getCartTotals();
  currentPaymentMethod = 'Cash';

  const modalHtml = `
    <div class="modal-header">
      <div class="modal-title">Complete Checkout</div>
      <button class="modal-close-btn" onclick="closeModal()">✕</button>
    </div>
    <div class="modal-body">
      <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; padding:16px; margin-bottom:20px; text-align:center;">
        <div style="font-size:12px; font-weight:700; color:#64748b; text-transform:uppercase;">Amount Payable</div>
        <div style="font-size:32px; font-weight:800; color:#152d4a; margin-top:4px;">
          ${AppState.settings.currency} ${totals.total.toFixed(2)}
        </div>
        <div style="font-size:12px; color:#64748b; margin-top:2px;">
          Customer: <strong>${escapeHtml(AppState.selectedCustomer.name)}</strong> (${AppState.cart.reduce((s, i) => s + i.qty, 0)} items)
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">Select Payment Method</label>
        <div style="display:grid; grid-template-columns: repeat(4, 1fr); gap:8px;">
          <button class="tender-quick-btn" id="payMethodCash" style="background:#152d4a; color:#fff;" onclick="selectPayMethod('Cash')">💵 Cash</button>
          <button class="tender-quick-btn" id="payMethodMoMo" onclick="selectPayMethod('Mobile Money')">📱 MoMo</button>
          <button class="tender-quick-btn" id="payMethodCard" onclick="selectPayMethod('Card')">💳 Card</button>
          <button class="tender-quick-btn" id="payMethodSplit" onclick="selectPayMethod('Split')">⚖️ Split</button>
        </div>
      </div>

      <!-- Dynamic method container -->
      <div id="paymentMethodFields">
        ${renderCashTenderFields(totals.total)}
      </div>

    </div>
    <div class="modal-footer">
      <button class="btn-secondary" onclick="closeModal()">Cancel</button>
      <button class="btn-primary" style="background:#16a34a;" onclick="processFinalPayment()">
        ✓ Complete & Print Receipt
      </button>
    </div>
  `;

  showModal(modalHtml);
}

function selectPayMethod(method) {
  currentPaymentMethod = method;
  const totals = getCartTotals();
  ['Cash', 'Mobile Money', 'Card', 'Split'].forEach(m => {
    const id = m === 'Mobile Money' ? 'payMethodMoMo' : `payMethod${m}`;
    const btn = document.getElementById(id);
    if (btn) {
      if (m === method) {
        btn.style.background = '#152d4a';
        btn.style.color = '#fff';
      } else {
        btn.style.background = '#f1f5f9';
        btn.style.color = '#1e293b';
      }
    }
  });

  const container = document.getElementById('paymentMethodFields');
  if (method === 'Cash') {
    container.innerHTML = renderCashTenderFields(totals.total);
  } else if (method === 'Mobile Money') {
    container.innerHTML = `
      <div class="form-group" style="margin-top:14px;">
        <label class="form-label">Network Provider</label>
        <select class="form-select" id="momoProvider">
          <option>MTN MoMo (*170#)</option>
          <option>Telecel Cash</option>
          <option>AT Money</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Customer Mobile Number</label>
        <input type="text" class="form-input" id="momoPhone" value="${AppState.selectedCustomer.phone !== 'N/A' ? AppState.selectedCustomer.phone : '+233 24 '}" placeholder="+233 24 000 0000" />
      </div>
      <div class="form-group">
        <label class="form-label">Transaction Reference / Approval Code</label>
        <input type="text" class="form-input" id="momoRef" value="MM-${Math.floor(100000 + Math.random() * 900000)}" />
      </div>
    `;
  } else if (method === 'Card') {
    container.innerHTML = `
      <div class="form-group" style="margin-top:14px;">
        <label class="form-label">Card Type & POS Terminal Approval</label>
        <select class="form-select">
          <option>Visa Debit / Credit</option>
          <option>Mastercard</option>
          <option>Gh-Link Local Card</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Terminal Authorization Code</label>
        <input type="text" class="form-input" value="AUTH-${Math.floor(1000 + Math.random() * 9000)}" />
      </div>
    `;
  } else {
    // Split
    const half = (totals.total / 2).toFixed(2);
    container.innerHTML = `
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-top:14px;">
        <div class="form-group">
          <label class="form-label">Cash Amount (${AppState.settings.currency})</label>
          <input type="number" step="0.5" class="form-input" id="splitCashAmount" value="${half}" />
        </div>
        <div class="form-group">
          <label class="form-label">MoMo / Card Amount (${AppState.settings.currency})</label>
          <input type="number" step="0.5" class="form-input" id="splitOtherAmount" value="${(totals.total - half).toFixed(2)}" />
        </div>
      </div>
    `;
  }
}

function renderCashTenderFields(total) {
  const round10 = Math.ceil(total / 10) * 10;
  const round20 = Math.ceil(total / 20) * 20;
  const round50 = Math.ceil(total / 50) * 50;
  const round100 = Math.ceil(total / 100) * 100;

  return `
    <div class="form-group" style="margin-top:14px;">
      <label class="form-label">Cash Tendered (${AppState.settings.currency})</label>
      <input 
        type="number" 
        step="0.5" 
        id="cashTenderedInput" 
        class="form-input" 
        style="font-size:18px; font-weight:700;" 
        value="${total.toFixed(2)}" 
        oninput="calculateChange(${total})" 
      />
      <div class="tender-quick-buttons">
        <button class="tender-quick-btn" onclick="setCashTender(${total}, ${total})">Exact (${total.toFixed(2)})</button>
        ${round10 > total ? `<button class="tender-quick-btn" onclick="setCashTender(${round10}, ${total})">${round10}</button>` : ''}
        ${round20 > total ? `<button class="tender-quick-btn" onclick="setCashTender(${round20}, ${total})">${round20}</button>` : ''}
        ${round50 > total ? `<button class="tender-quick-btn" onclick="setCashTender(${round50}, ${total})">${round50}</button>` : ''}
        ${round100 > total ? `<button class="tender-quick-btn" onclick="setCashTender(${round100}, ${total})">${round100}</button>` : ''}
      </div>
    </div>
    <div style="background:#f0fdf4; border:1px solid #bbf7d0; border-radius:8px; padding:12px; display:flex; justify-content:space-between; align-items:center;">
      <span style="font-weight:600; color:#166534; font-size:14px;">Change Due:</span>
      <span id="cashChangeDisplay" style="font-size:22px; font-weight:800; color:#15803d;">${AppState.settings.currency} 0.00</span>
    </div>
  `;
}

function setCashTender(val, total) {
  const input = document.getElementById('cashTenderedInput');
  if (input) {
    input.value = val.toFixed(2);
    calculateChange(total);
  }
}

function calculateChange(total) {
  const input = document.getElementById('cashTenderedInput');
  const display = document.getElementById('cashChangeDisplay');
  if (!input || !display) return;
  const tendered = parseFloat(input.value) || 0;
  const change = Math.max(0, tendered - total);
  display.innerText = `${AppState.settings.currency} ${change.toFixed(2)}`;
}

function processFinalPayment() {
  const totals = getCartTotals();
  let tendered = totals.total;
  let change = 0;

  if (currentPaymentMethod === 'Cash') {
    const input = document.getElementById('cashTenderedInput');
    tendered = input ? parseFloat(input.value) || totals.total : totals.total;
    if (tendered < totals.total) {
      SoundEffects.error();
      alert(`Tendered cash (${AppState.settings.currency} ${tendered.toFixed(2)}) is less than total amount due (${AppState.settings.currency} ${totals.total.toFixed(2)})!`);
      return;
    }
    change = parseFloat((tendered - totals.total).toFixed(2));
  }

  // 1. Decrement product stock in inventory
  AppState.cart.forEach(cartItem => {
    const prod = AppState.products.find(p => p.id === cartItem.productId);
    if (prod) {
      prod.stock = Math.max(0, prod.stock - cartItem.qty);
    }
  });

  // 2. Generate Transaction Record
  const newReceiptNum = `REC-${10000 + AppState.sales.length + 1}`;
  const now = new Date();

  const saleRecord = {
    id: `TX-${Date.now()}`,
    receiptNumber: newReceiptNum,
    timestamp: now.toISOString(),
    dateStr: now.toLocaleDateString("en-GB"),
    timeStr: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    cashierId: AppState.currentStaff.id,
    cashierName: AppState.currentStaff.name,
    customerId: AppState.selectedCustomer.id,
    customerName: AppState.selectedCustomer.name,
    items: [...AppState.cart],
    subtotal: totals.subtotal,
    tax: totals.tax,
    discount: totals.discount,
    total: totals.total,
    paymentMethod: currentPaymentMethod,
    tendered: tendered,
    change: change,
    status: "Completed"
  };

  AppState.sales.unshift(saleRecord);

  // 3. Update customer stats if registered
  if (AppState.selectedCustomer && AppState.selectedCustomer.id !== 'cust_walkin') {
    AppState.selectedCustomer.points += Math.floor(totals.total / 10);
    AppState.selectedCustomer.totalSpent += totals.total;
    AppState.selectedCustomer.visits += 1;
  }

  // 4. Audit Log
  AppState.auditLogs.unshift({
    id: `log_${Date.now()}`,
    timestamp: now.toISOString(),
    staffName: AppState.currentStaff.name,
    role: AppState.currentStaff.role,
    action: "Sale Completed",
    details: `${newReceiptNum} • ${AppState.settings.currency} ${totals.total.toFixed(2)} via ${currentPaymentMethod} (${AppState.cart.length} items)`
  });

  // Reset Cart
  AppState.cart = [];
  AppState.lastCompletedSale = saleRecord;
  saveData();

  SoundEffects.success();
  closeModal();
  openReceiptModal(saleRecord);
}

// ==========================================================================
// 4. Thermal Receipt Modal & Printing
// ==========================================================================
function openReceiptModal(sale) {
  const modalHtml = `
    <div class="modal-header">
      <div class="modal-title">Payment Successful • Receipt Preview</div>
      <button class="modal-close-btn" onclick="closeModal()">✕</button>
    </div>
    <div class="modal-body" style="background:#f1f5f9; padding:20px;">
      
      <!-- Printable Thermal Receipt Container -->
      <div id="printableReceiptArea" class="receipt-paper-view">
        <div class="receipt-header">
          <div class="receipt-store-title">${escapeHtml(AppState.settings.storeName)}</div>
          <div class="receipt-meta">${escapeHtml(AppState.settings.tagline)}</div>
          <div class="receipt-meta">${escapeHtml(AppState.settings.address)}</div>
          <div class="receipt-meta">Tel: ${escapeHtml(AppState.settings.phone)}</div>
          <div class="receipt-divider"></div>
          <div class="receipt-meta" style="display:flex; justify-content:space-between;">
            <span>Receipt: <strong>${sale.receiptNumber}</strong></span>
            <span>${sale.dateStr} ${sale.timeStr}</span>
          </div>
          <div class="receipt-meta" style="display:flex; justify-content:space-between;">
            <span>Cashier: ${escapeHtml(sale.cashierName)}</span>
            <span>Cust: ${escapeHtml(sale.customerName)}</span>
          </div>
        </div>

        <table class="receipt-table">
          <thead>
            <tr>
              <th>Item</th>
              <th style="text-align:center;">Qty</th>
              <th style="text-align:right;">Price</th>
              <th style="text-align:right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${sale.items.map(i => `
              <tr>
                <td>${escapeHtml(i.name)}</td>
                <td style="text-align:center;">${i.qty}</td>
                <td style="text-align:right;">${i.price.toFixed(2)}</td>
                <td style="text-align:right;">${(i.price * i.qty).toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="receipt-divider"></div>

        <div class="receipt-calc-row">
          <span>Subtotal:</span>
          <span>${AppState.settings.currency} ${sale.subtotal.toFixed(2)}</span>
        </div>
        <div class="receipt-calc-row">
          <span>${AppState.settings.taxName} (${AppState.settings.taxRate}%):</span>
          <span>${AppState.settings.currency} ${sale.tax.toFixed(2)}</span>
        </div>
        ${sale.discount > 0 ? `
          <div class="receipt-calc-row">
            <span>Discount:</span>
            <span>-${AppState.settings.currency} ${sale.discount.toFixed(2)}</span>
          </div>
        ` : ''}
        <div class="receipt-calc-row grand">
          <span>TOTAL:</span>
          <span>${AppState.settings.currency} ${sale.total.toFixed(2)}</span>
        </div>

        <div class="receipt-divider"></div>

        <div class="receipt-calc-row">
          <span>Payment Mode:</span>
          <span>${sale.paymentMethod}</span>
        </div>
        <div class="receipt-calc-row">
          <span>Tendered:</span>
          <span>${AppState.settings.currency} ${sale.tendered.toFixed(2)}</span>
        </div>
        <div class="receipt-calc-row">
          <span>Change:</span>
          <span>${AppState.settings.currency} ${sale.change.toFixed(2)}</span>
        </div>

        <div class="receipt-footer-notes">
          <div>${escapeHtml(AppState.settings.receiptFooter)}</div>
          <div class="receipt-barcode-code">||| |||| || ||||| |||</div>
          <div style="font-size:10px; margin-top:2px;">${sale.receiptNumber}</div>
        </div>
      </div>

    </div>
    <div class="modal-footer">
      <button class="btn-secondary" onclick="downloadReceiptTxt('${sale.receiptNumber}')">
        💾 Download Text
      </button>
      <button class="btn-secondary" onclick="window.print()">
        🖨️ Print Receipt
      </button>
      <button class="btn-primary" onclick="closeModal(); renderApp();">
        + New Sale
      </button>
    </div>
  `;

  showModal(modalHtml);
}

function downloadReceiptTxt(receiptNumber) {
  const sale = AppState.sales.find(s => s.receiptNumber === receiptNumber) || AppState.lastCompletedSale;
  if (!sale) return;

  const content = `
========================================
       ${AppState.settings.storeName}
    ${AppState.settings.tagline}
     ${AppState.settings.address}
          Tel: ${AppState.settings.phone}
========================================
Receipt: ${sale.receiptNumber}
Date:    ${sale.dateStr} ${sale.timeStr}
Cashier: ${sale.cashierName}
Customer: ${sale.customerName}
----------------------------------------
ITEM            QTY   PRICE    TOTAL
----------------------------------------
${sale.items.map(i => `${i.name.padEnd(16).substring(0, 16)} ${String(i.qty).padStart(3)}  ${i.price.toFixed(2).padStart(7)}  ${(i.price * i.qty).toFixed(2).padStart(7)}`).join('\n')}
----------------------------------------
Subtotal:       ${AppState.settings.currency} ${sale.subtotal.toFixed(2)}
Tax (${AppState.settings.taxRate}%):      ${AppState.settings.currency} ${sale.tax.toFixed(2)}
TOTAL:          ${AppState.settings.currency} ${sale.total.toFixed(2)}
----------------------------------------
Payment:        ${sale.paymentMethod}
Tendered:       ${AppState.settings.currency} ${sale.tendered.toFixed(2)}
Change:         ${AppState.settings.currency} ${sale.change.toFixed(2)}
========================================
${AppState.settings.receiptFooter}
========================================
  `;

  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${sale.receiptNumber}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

// ==========================================================================
// 5. Inventory Management Screen
// ==========================================================================
let inventoryFilterCat = 'All';
let inventoryFilterStatus = 'all';
let inventorySearchQuery = '';

function renderInventoryView(container) {
  const filtered = AppState.products.filter(p => {
    const matchesCat = inventoryFilterCat === 'All' || p.category === inventoryFilterCat;
    const q = inventorySearchQuery.trim().toLowerCase();
    const matchesQuery = !q || p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q) || p.barcode.includes(q);
    let matchesStatus = true;
    if (inventoryFilterStatus === 'low') matchesStatus = p.stock > 0 && p.stock <= p.reorderLevel;
    else if (inventoryFilterStatus === 'out') matchesStatus = p.stock <= 0;
    else if (inventoryFilterStatus === 'ok') matchesStatus = p.stock > p.reorderLevel;
    return matchesCat && matchesQuery && matchesStatus;
  });

  const lowStockCount = AppState.products.filter(p => p.stock > 0 && p.stock <= p.reorderLevel).length;
  const outOfStockCount = AppState.products.filter(p => p.stock <= 0).length;

  container.innerHTML = `
    <div class="view-container">
      <div class="page-header-row">
        <div>
          <h2 class="page-title">Inventory & Product Catalog</h2>
          <p class="page-subtitle">Track stock levels, reorder alerts, intake supplies, and update selling prices.</p>
        </div>
        <div class="page-actions-group">
          <button class="btn-secondary" onclick="exportInventoryCSV()">
            📥 Export CSV
          </button>
          <button class="btn-primary" onclick="openAddProductModal()">
            + Add New Product
          </button>
        </div>
      </div>

      <!-- Quick KPI Chips -->
      <div style="display:flex; gap:12px; margin-bottom:16px;">
        <button class="tender-quick-btn ${inventoryFilterStatus === 'all' ? 'active' : ''}" style="${inventoryFilterStatus === 'all' ? 'background:#152d4a; color:#fff;' : ''}" onclick="setInventoryStatusFilter('all')">
          All Products (${AppState.products.length})
        </button>
        <button class="tender-quick-btn ${inventoryFilterStatus === 'low' ? 'active' : ''}" style="${inventoryFilterStatus === 'low' ? 'background:#f59e0b; color:#fff;' : ''}" onclick="setInventoryStatusFilter('low')">
          ⚠️ Low Stock Alerts (${lowStockCount})
        </button>
        <button class="tender-quick-btn ${inventoryFilterStatus === 'out' ? 'active' : ''}" style="${inventoryFilterStatus === 'out' ? 'background:#ef4444; color:#fff;' : ''}" onclick="setInventoryStatusFilter('out')">
          🚫 Out of Stock (${outOfStockCount})
        </button>
      </div>

      <!-- Data Table Card -->
      <div class="data-card-table">
        <div class="table-filter-toolbar">
          <input 
            type="text" 
            class="table-search-input" 
            placeholder="Search inventory by name, SKU, or barcode..." 
            value="${escapeHtml(inventorySearchQuery)}"
            oninput="handleInventorySearch(this.value)"
          />
          <div style="display:flex; gap:10px; align-items:center;">
            <span style="font-size:13px; color:#64748b; font-weight:600;">Category:</span>
            <select class="form-select" style="width:auto; padding:6px 12px; font-size:13px;" onchange="handleInventoryCatFilter(this.value)">
              ${INITIAL_CATEGORIES.map(cat => `
                <option value="${cat}" ${inventoryFilterCat === cat ? 'selected' : ''}>${cat}</option>
              `).join('')}
            </select>
          </div>
        </div>

        <div class="table-scroll">
          <table class="custom-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>Barcode / SKU</th>
                <th style="text-align:right;">Cost Price</th>
                <th style="text-align:right;">Selling Price</th>
                <th style="text-align:right;">Margin</th>
                <th style="text-align:center;">Stock Level</th>
                <th style="text-align:right;">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${filtered.map(p => {
                const margin = p.price - p.costPrice;
                const marginPct = ((margin / p.price) * 100).toFixed(0);
                let badge = `<span class="stock-badge ok">● ${p.stock} In Stock</span>`;
                if (p.stock <= 0) badge = `<span class="stock-badge out">● 0 Out of Stock</span>`;
                else if (p.stock <= p.reorderLevel) badge = `<span class="stock-badge low">● ${p.stock} Low Stock</span>`;

                return `
                  <tr>
                    <td>
                      <div style="display:flex; align-items:center; gap:10px;">
                        <span style="font-size:22px;">${p.image || '📦'}</span>
                        <div>
                          <strong>${escapeHtml(p.name)}</strong>
                          <div style="font-size:11px; color:#64748b;">${p.unit || 'unit'}</div>
                        </div>
                      </div>
                    </td>
                    <td><span style="background:#f1f5f9; padding:3px 8px; border-radius:4px; font-size:12px;">${escapeHtml(p.category)}</span></td>
                    <td style="font-family:var(--font-mono); font-size:12px;">${p.barcode}</td>
                    <td style="text-align:right;">${AppState.settings.currency} ${p.costPrice.toFixed(2)}</td>
                    <td style="text-align:right; font-weight:700; color:#152d4a;">${AppState.settings.currency} ${p.price.toFixed(2)}</td>
                    <td style="text-align:right; color:#16a34a; font-weight:600;">${marginPct}%</td>
                    <td style="text-align:center;">${badge}</td>
                    <td style="text-align:right;">
                      <div style="display:inline-flex; gap:6px;">
                        <button class="session-btn" style="background:#f1f5f9; color:#334155; border:1px solid #cbd5e1;" onclick="openAdjustStockModal('${p.id}')">
                          ± Adjust Stock
                        </button>
                        <button class="session-btn" style="background:#eff6ff; color:#2563eb; border:1px solid #bfdbfe;" onclick="openEditProductModal('${p.id}')">
                          ✎ Edit
                        </button>
                      </div>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

function handleInventorySearch(val) {
  inventorySearchQuery = val;
  renderApp();
}

function handleInventoryCatFilter(val) {
  inventoryFilterCat = val;
  renderApp();
}

function setInventoryStatusFilter(val) {
  inventoryFilterStatus = val;
  renderApp();
}

function openAddProductModal() {
  const modalHtml = `
    <div class="modal-header">
      <div class="modal-title">Add New Retail Product</div>
      <button class="modal-close-btn" onclick="closeModal()">✕</button>
    </div>
    <div class="modal-body">
      <div class="form-group">
        <label class="form-label">Product Name *</label>
        <input type="text" id="newProdName" class="form-input" placeholder="e.g. Cerelac Wheat 400g" required />
      </div>
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
        <div class="form-group">
          <label class="form-label">Category</label>
          <select id="newProdCat" class="form-select">
            ${INITIAL_CATEGORIES.filter(c => c !== 'All').map(c => `<option value="${c}">${c}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Emoji / Icon</label>
          <input type="text" id="newProdEmoji" class="form-input" value="🥣" />
        </div>
      </div>
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
        <div class="form-group">
          <label class="form-label">Barcode Number</label>
          <input type="text" id="newProdBarcode" class="form-input" value="600100${1000 + AppState.products.length + 1}" />
        </div>
        <div class="form-group">
          <label class="form-label">SKU</label>
          <input type="text" id="newProdSKU" class="form-input" value="PRD-${100 + AppState.products.length + 1}" />
        </div>
      </div>
      <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:12px;">
        <div class="form-group">
          <label class="form-label">Cost Price (${AppState.settings.currency})</label>
          <input type="number" step="0.5" id="newProdCost" class="form-input" value="15.00" />
        </div>
        <div class="form-group">
          <label class="form-label">Selling Price (${AppState.settings.currency})</label>
          <input type="number" step="0.5" id="newProdPrice" class="form-input" value="20.00" />
        </div>
        <div class="form-group">
          <label class="form-label">Initial Stock</label>
          <input type="number" id="newProdStock" class="form-input" value="25" />
        </div>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn-secondary" onclick="closeModal()">Cancel</button>
      <button class="btn-primary" onclick="saveNewProduct()">Save Product</button>
    </div>
  `;
  showModal(modalHtml);
}

function saveNewProduct() {
  const name = document.getElementById('newProdName').value.trim();
  if (!name) {
    alert("Please enter product name");
    return;
  }

  const newProd = {
    id: `prod_${Date.now()}`,
    name: name,
    category: document.getElementById('newProdCat').value,
    image: document.getElementById('newProdEmoji').value || '📦',
    barcode: document.getElementById('newProdBarcode').value.trim(),
    sku: document.getElementById('newProdSKU').value.trim(),
    costPrice: parseFloat(document.getElementById('newProdCost').value) || 0,
    price: parseFloat(document.getElementById('newProdPrice').value) || 0,
    stock: parseInt(document.getElementById('newProdStock').value) || 0,
    unit: 'unit',
    reorderLevel: 8
  };

  AppState.products.unshift(newProd);

  AppState.auditLogs.unshift({
    id: `log_${Date.now()}`,
    timestamp: new Date().toISOString(),
    staffName: AppState.currentStaff.name,
    role: AppState.currentStaff.role,
    action: "Product Added",
    details: `Added new product "${newProd.name}" (Stock: ${newProd.stock}, Price: ${AppState.settings.currency} ${newProd.price})`
  });

  saveData();
  closeModal();
  SoundEffects.success();
  renderApp();
}

function openAdjustStockModal(productId) {
  const prod = AppState.products.find(p => p.id === productId);
  if (!prod) return;

  const modalHtml = `
    <div class="modal-header">
      <div class="modal-title">Adjust Stock Level • ${escapeHtml(prod.name)}</div>
      <button class="modal-close-btn" onclick="closeModal()">✕</button>
    </div>
    <div class="modal-body">
      <div style="display:flex; justify-content:space-between; align-items:center; background:#f8fafc; padding:12px; border-radius:8px; margin-bottom:16px;">
        <span>Current Stock Level:</span>
        <strong style="font-size:18px; color:#152d4a;">${prod.stock} units</strong>
      </div>
      <div class="form-group">
        <label class="form-label">Adjustment Type</label>
        <select id="adjType" class="form-select">
          <option value="add">Add Units (+ Received from supplier / Return)</option>
          <option value="remove">Remove Units (- Damaged / Expired / Loss)</option>
          <option value="set">Set Exact Count (Physical audit count)</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Quantity</label>
        <input type="number" id="adjQty" class="form-input" value="10" min="1" />
      </div>
      <div class="form-group">
        <label class="form-label">Reason / Notes</label>
        <input type="text" id="adjReason" class="form-input" placeholder="e.g. Restock invoice #892 from Accra Wholesalers" />
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn-secondary" onclick="closeModal()">Cancel</button>
      <button class="btn-primary" onclick="saveStockAdjustment('${prod.id}')">Apply Stock Adjustment</button>
    </div>
  `;
  showModal(modalHtml);
}

function saveStockAdjustment(productId) {
  const prod = AppState.products.find(p => p.id === productId);
  if (!prod) return;

  const type = document.getElementById('adjType').value;
  const qty = parseInt(document.getElementById('adjQty').value) || 0;
  const reason = document.getElementById('adjReason').value.trim() || 'Manual stock update';

  const oldStock = prod.stock;
  if (type === 'add') {
    prod.stock += qty;
  } else if (type === 'remove') {
    prod.stock = Math.max(0, prod.stock - qty);
  } else {
    prod.stock = Math.max(0, qty);
  }

  AppState.auditLogs.unshift({
    id: `log_${Date.now()}`,
    timestamp: new Date().toISOString(),
    staffName: AppState.currentStaff.name,
    role: AppState.currentStaff.role,
    action: "Stock Adjusted",
    details: `${prod.name}: ${oldStock} -> ${prod.stock} units (${reason})`
  });

  saveData();
  closeModal();
  SoundEffects.success();
  renderApp();
}

function openEditProductModal(productId) {
  const prod = AppState.products.find(p => p.id === productId);
  if (!prod) return;

  const modalHtml = `
    <div class="modal-header">
      <div class="modal-title">Edit Product • ${escapeHtml(prod.name)}</div>
      <button class="modal-close-btn" onclick="closeModal()">✕</button>
    </div>
    <div class="modal-body">
      <div class="form-group">
        <label class="form-label">Product Name</label>
        <input type="text" id="editProdName" class="form-input" value="${escapeHtml(prod.name)}" />
      </div>
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
        <div class="form-group">
          <label class="form-label">Category</label>
          <select id="editProdCat" class="form-select">
            ${INITIAL_CATEGORIES.filter(c => c !== 'All').map(c => `
              <option value="${c}" ${prod.category === c ? 'selected' : ''}>${c}</option>
            `).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Emoji Icon</label>
          <input type="text" id="editProdEmoji" class="form-input" value="${prod.image || '📦'}" />
        </div>
      </div>
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
        <div class="form-group">
          <label class="form-label">Cost Price (${AppState.settings.currency})</label>
          <input type="number" step="0.5" id="editProdCost" class="form-input" value="${prod.costPrice}" />
        </div>
        <div class="form-group">
          <label class="form-label">Selling Price (${AppState.settings.currency})</label>
          <input type="number" step="0.5" id="editProdPrice" class="form-input" value="${prod.price}" />
        </div>
      </div>
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
        <div class="form-group">
          <label class="form-label">Current Stock</label>
          <input type="number" id="editProdStock" class="form-input" value="${prod.stock}" />
        </div>
        <div class="form-group">
          <label class="form-label">Reorder Alert Level</label>
          <input type="number" id="editProdReorder" class="form-input" value="${prod.reorderLevel}" />
        </div>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn-secondary" onclick="closeModal()">Cancel</button>
      <button class="btn-primary" onclick="saveEditedProduct('${prod.id}')">Save Changes</button>
    </div>
  `;
  showModal(modalHtml);
}

function saveEditedProduct(productId) {
  const prod = AppState.products.find(p => p.id === productId);
  if (!prod) return;

  prod.name = document.getElementById('editProdName').value.trim();
  prod.category = document.getElementById('editProdCat').value;
  prod.image = document.getElementById('editProdEmoji').value.trim();
  prod.costPrice = parseFloat(document.getElementById('editProdCost').value) || prod.costPrice;
  prod.price = parseFloat(document.getElementById('editProdPrice').value) || prod.price;
  prod.stock = parseInt(document.getElementById('editProdStock').value) || prod.stock;
  prod.reorderLevel = parseInt(document.getElementById('editProdReorder').value) || prod.reorderLevel;

  AppState.auditLogs.unshift({
    id: `log_${Date.now()}`,
    timestamp: new Date().toISOString(),
    staffName: AppState.currentStaff.name,
    role: AppState.currentStaff.role,
    action: "Product Updated",
    details: `Updated details for "${prod.name}" (Price: ${AppState.settings.currency} ${prod.price})`
  });

  saveData();
  closeModal();
  SoundEffects.success();
  renderApp();
}

function exportInventoryCSV() {
  let csv = "Product Name,Category,Barcode,SKU,Cost Price,Selling Price,Stock Level,Reorder Level\n";
  AppState.products.forEach(p => {
    csv += `"${p.name}","${p.category}","${p.barcode}","${p.sku}",${p.costPrice},${p.price},${p.stock},${p.reorderLevel}\n`;
  });

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Selligine_Inventory_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

// ==========================================================================
// 6. Reports, Analytics & Accountant Screen
// ==========================================================================
function renderReportsView(container) {
  // Compute Key Analytics from 14-day history
  const totalRevenue = AppState.sales.reduce((sum, s) => sum + s.total, 0);
  const totalTax = AppState.sales.reduce((sum, s) => sum + s.tax, 0);
  const totalTransactions = AppState.sales.length;
  const avgBasket = totalTransactions > 0 ? (totalRevenue / totalTransactions) : 0;

  // Estimated gross profit
  let totalCost = 0;
  AppState.sales.forEach(sale => {
    sale.items.forEach(item => {
      totalCost += (item.costPrice || (item.price * 0.75)) * item.qty;
    });
  });
  const grossProfit = totalRevenue - totalCost - totalTax;

  // Breakdown by payment methods
  const methods = { Cash: 0, "Mobile Money": 0, Card: 0, Split: 0 };
  AppState.sales.forEach(s => {
    if (methods[s.paymentMethod] !== undefined) {
      methods[s.paymentMethod] += s.total;
    } else {
      methods["Mobile Money"] += s.total;
    }
  });

  // Daily revenue trend for past 14 days
  const dailyData = {};
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toLocaleDateString("en-GB", { month: 'short', day: 'numeric' });
    dailyData[key] = 0;
  }
  AppState.sales.forEach(s => {
    const d = new Date(s.timestamp);
    const key = d.toLocaleDateString("en-GB", { month: 'short', day: 'numeric' });
    if (dailyData[key] !== undefined) {
      dailyData[key] += s.total;
    }
  });

  const dayKeys = Object.keys(dailyData);
  const maxDayVal = Math.max(...Object.values(dailyData), 100);

  container.innerHTML = `
    <div class="view-container">
      <div class="page-header-row">
        <div>
          <h2 class="page-title">Sales Reports & Financial Ledger</h2>
          <p class="page-subtitle">14-Day provision store financial performance, payment reconciliation, and audit logs.</p>
        </div>
        <div class="page-actions-group">
          <button class="btn-primary" onclick="openZReportModal()">
            📑 End-of-Day Z-Report
          </button>
        </div>
      </div>

      <!-- KPI Metrics -->
      <div class="analytics-metrics-grid">
        <div class="metric-card">
          <div class="metric-header">
            <span>14-DAY TOTAL REVENUE</span>
            <span>💰</span>
          </div>
          <div class="metric-val">${AppState.settings.currency} ${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          <div class="metric-trend up">↑ +14.2% vs previous period</div>
        </div>

        <div class="metric-card">
          <div class="metric-header">
            <span>ESTIMATED GROSS PROFIT</span>
            <span>📈</span>
          </div>
          <div class="metric-val" style="color:#059669;">${AppState.settings.currency} ${grossProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          <div class="metric-trend up">Margin: ~${((grossProfit / totalRevenue) * 100).toFixed(1)}%</div>
        </div>

        <div class="metric-card">
          <div class="metric-header">
            <span>TRANSACTIONS COUNT</span>
            <span>🧾</span>
          </div>
          <div class="metric-val">${totalTransactions}</div>
          <div class="metric-trend up">100% completed</div>
        </div>

        <div class="metric-card">
          <div class="metric-header">
            <span>AVERAGE BASKET SIZE</span>
            <span>🛒</span>
          </div>
          <div class="metric-val">${AppState.settings.currency} ${avgBasket.toFixed(2)}</div>
          <div class="metric-trend" style="color:#64748b;">Per customer visit</div>
        </div>
      </div>

      <!-- Charts Row -->
      <div class="analytics-charts-grid">
        
        <!-- Daily Sales Trend Bar Chart -->
        <div class="chart-card">
          <div class="chart-title">
            <span>Daily Revenue Trend (Last 14 Days)</span>
            <span style="font-size:12px; color:#64748b; font-weight:normal;">Hover bars for exact revenue</span>
          </div>
          <div class="svg-chart-container" style="display:flex; align-items:flex-end; gap:8px; padding-bottom:24px; border-bottom:1px solid #e2e8f0;">
            ${dayKeys.map(k => {
              const val = dailyData[k];
              const pct = (val / maxDayVal) * 100;
              return `
                <div style="flex:1; display:flex; flex-direction:column; align-items:center; height:100%; justify-content:flex-end;" title="${k}: ${AppState.settings.currency} ${val.toFixed(2)}">
                  <div style="font-size:9.5px; color:#64748b; margin-bottom:4px; font-weight:600;">${Math.round(val)}</div>
                  <div style="width:100%; background:linear-gradient(180deg, #2563eb 0%, #1d4ed8 100%); border-radius:4px 4px 0 0; height:${Math.max(8, pct)}%; transition:height 0.3s;"></div>
                  <div style="font-size:9.5px; color:#94a3b8; margin-top:6px; white-space:nowrap; transform:rotate(-45deg);">${k}</div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- Payment Method Breakdown -->
        <div class="chart-card">
          <div class="chart-title">Payment Method Share</div>
          <div style="display:flex; flex-direction:column; gap:16px; margin-top:10px;">
            ${Object.keys(methods).map(m => {
              const val = methods[m];
              const pct = totalRevenue > 0 ? ((val / totalRevenue) * 100).toFixed(1) : 0;
              let color = '#2563eb';
              if (m === 'Cash') color = '#10b981';
              if (m === 'Card') color = '#8b5cf6';
              if (m === 'Split') color = '#f59e0b';

              return `
                <div>
                  <div style="display:flex; justify-content:space-between; font-size:13px; font-weight:600; margin-bottom:6px;">
                    <span>${m}</span>
                    <span>${AppState.settings.currency} ${val.toFixed(2)} (${pct}%)</span>
                  </div>
                  <div style="height:8px; background:#f1f5f9; border-radius:4px; overflow:hidden;">
                    <div style="height:100%; width:${pct}%; background:${color}; border-radius:4px;"></div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

      </div>

      <!-- Cash Drawer Reconciliation Tool -->
      <div class="reconcile-card">
        <h3 style="font-size:16px; font-weight:700; color:#0f172a; margin-bottom:4px;">Cash Drawer Reconciliation & Float Audit</h3>
        <p style="font-size:13px; color:#64748b;">Calculate opening float, total cash sales received today, and verify against counted register cash.</p>

        <div class="reconcile-grid">
          <div class="reconcile-field">
            <label>Opening Cash Float</label>
            <input type="number" id="reconFloat" value="200.00" oninput="updateDrawerRecon()" />
          </div>
          <div class="reconcile-field">
            <label>Total Cash Sales (Today)</label>
            <input type="number" id="reconSales" value="640.00" readonly style="background:#f8fafc;" />
          </div>
          <div class="reconcile-field">
            <label>Cash Paid Out / Expenses</label>
            <input type="number" id="reconPaidOut" value="40.00" oninput="updateDrawerRecon()" />
          </div>
          <div class="reconcile-field">
            <label>Actual Counted Register Cash</label>
            <input type="number" id="reconCounted" value="800.00" oninput="updateDrawerRecon()" />
          </div>
        </div>

        <div id="reconVarianceBox" class="variance-indicator balanced">
          <span>Expected Cash: <strong>${AppState.settings.currency} 800.00</strong></span>
          <span>Status: <strong>BALANCED (0.00 Variance)</strong></span>
        </div>
      </div>

      <!-- Audit Logs Table -->
      <div class="data-card-table" style="margin-top:24px;">
        <div class="table-filter-toolbar">
          <h3 style="font-size:15px; font-weight:700;">System Audit Trail (Security & Compliance)</h3>
          <span style="font-size:12px; color:#64748b;">All sales, price edits, and inventory events</span>
        </div>
        <div class="table-scroll">
          <table class="custom-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Staff Member</th>
                <th>Action</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              ${AppState.auditLogs.slice(0, 15).map(log => `
                <tr>
                  <td style="white-space:nowrap; font-size:12px; color:#64748b;">
                    ${new Date(log.timestamp).toLocaleString("en-GB")}
                  </td>
                  <td>
                    <strong>${escapeHtml(log.staffName)}</strong>
                    <div style="font-size:11px; color:#64748b;">${escapeHtml(log.role)}</div>
                  </td>
                  <td>
                    <span style="background:#eff6ff; color:#1e40af; padding:3px 8px; border-radius:4px; font-weight:600; font-size:11.5px;">
                      ${escapeHtml(log.action)}
                    </span>
                  </td>
                  <td style="color:#334155;">${escapeHtml(log.details)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  `;
}

function updateDrawerRecon() {
  const opening = parseFloat(document.getElementById('reconFloat').value) || 0;
  const sales = parseFloat(document.getElementById('reconSales').value) || 0;
  const paidOut = parseFloat(document.getElementById('reconPaidOut').value) || 0;
  const counted = parseFloat(document.getElementById('reconCounted').value) || 0;

  const expected = opening + sales - paidOut;
  const diff = counted - expected;

  const box = document.getElementById('reconVarianceBox');
  if (!box) return;

  if (Math.abs(diff) < 0.01) {
    box.className = 'variance-indicator balanced';
    box.innerHTML = `<span>Expected: <strong>${AppState.settings.currency} ${expected.toFixed(2)}</strong></span><span>Status: <strong>PERFECTLY BALANCED (0.00 Variance)</strong></span>`;
  } else if (diff > 0) {
    box.className = 'variance-indicator over';
    box.innerHTML = `<span>Expected: <strong>${AppState.settings.currency} ${expected.toFixed(2)}</strong></span><span>Status: <strong>OVER by +${AppState.settings.currency} ${diff.toFixed(2)}</strong></span>`;
  } else {
    box.className = 'variance-indicator short';
    box.innerHTML = `<span>Expected: <strong>${AppState.settings.currency} ${expected.toFixed(2)}</strong></span><span>Status: <strong>SHORT by -${AppState.settings.currency} ${Math.abs(diff).toFixed(2)} (Cash Shortage)</strong></span>`;
  }
}

function openZReportModal() {
  const today = new Date().toLocaleDateString("en-GB");
  const todaySales = AppState.sales.filter(s => s.dateStr === today);
  const revenue = todaySales.reduce((s, x) => s + x.total, 0);
  const tax = todaySales.reduce((s, x) => s + x.tax, 0);
  const cashTotal = todaySales.filter(s => s.paymentMethod === 'Cash').reduce((s, x) => s + x.total, 0);
  const momoTotal = todaySales.filter(s => s.paymentMethod === 'Mobile Money').reduce((s, x) => s + x.total, 0);

  const modalHtml = `
    <div class="modal-header">
      <div class="modal-title">End-of-Day Z-Report (${today})</div>
      <button class="modal-close-btn" onclick="closeModal()">✕</button>
    </div>
    <div class="modal-body" style="background:#f8fafc;">
      <div class="receipt-paper-view" style="max-width:360px;">
        <div class="receipt-header">
          <div class="receipt-store-title">${escapeHtml(AppState.settings.storeName)}</div>
          <div class="receipt-meta">DAILY Z-REPORT SUMMARY</div>
          <div class="receipt-meta">Generated: ${new Date().toLocaleString("en-GB")}</div>
          <div class="receipt-meta">Accountant: ${escapeHtml(AppState.currentStaff.name)}</div>
        </div>

        <div class="receipt-calc-row">
          <span>Gross Transactions:</span>
          <strong>${todaySales.length} sales</strong>
        </div>
        <div class="receipt-calc-row">
          <span>Total Net Sales:</span>
          <strong>${AppState.settings.currency} ${(revenue - tax).toFixed(2)}</strong>
        </div>
        <div class="receipt-calc-row">
          <span>Total Tax (${AppState.settings.taxName}):</span>
          <strong>${AppState.settings.currency} ${tax.toFixed(2)}</strong>
        </div>
        <div class="receipt-calc-row grand">
          <span>TOTAL GROSS:</span>
          <strong>${AppState.settings.currency} ${revenue.toFixed(2)}</strong>
        </div>

        <div class="receipt-divider"></div>
        <div style="font-size:11px; font-weight:700; margin-bottom:4px;">PAYMENT BREAKDOWN:</div>
        <div class="receipt-calc-row">
          <span>Cash Sales:</span>
          <span>${AppState.settings.currency} ${cashTotal.toFixed(2)}</span>
        </div>
        <div class="receipt-calc-row">
          <span>Mobile Money:</span>
          <span>${AppState.settings.currency} ${momoTotal.toFixed(2)}</span>
        </div>
        <div class="receipt-calc-row">
          <span>Other / Card:</span>
          <span>${AppState.settings.currency} ${(revenue - cashTotal - momoTotal).toFixed(2)}</span>
        </div>

        <div class="receipt-footer-notes">
          <div>Z-REPORT AUDIT VERIFIED</div>
          <div>All transactions logged to store ledger</div>
        </div>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn-secondary" onclick="closeModal()">Close</button>
      <button class="btn-primary" onclick="window.print()">🖨️ Print Z-Report</button>
    </div>
  `;
  showModal(modalHtml);
}

// ==========================================================================
// 7. Staff Management Screen
// ==========================================================================
function renderStaffView(container) {
  container.innerHTML = `
    <div class="view-container">
      <div class="page-header-row">
        <div>
          <h2 class="page-title">Staff & Access Control</h2>
          <p class="page-subtitle">Manage store staff accounts, role permissions, and terminal credentials.</p>
        </div>
        <button class="btn-primary" onclick="openAddStaffModal()">+ Add New Staff</button>
      </div>

      <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(320px, 1fr)); gap:18px;">
        ${AppState.staff.map(s => `
          <div style="background:#fff; border:1px solid #e2e8f0; border-radius:12px; padding:20px; box-shadow:0 1px 3px rgba(0,0,0,0.05);">
            <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:12px;">
              <div style="display:flex; gap:12px; align-items:center;">
                <div style="width:44px; height:44px; border-radius:10px; background:${s.color}15; color:${s.color}; display:flex; align-items:center; justify-content:center; font-weight:800; font-size:16px;">
                  ${s.avatar}
                </div>
                <div>
                  <h4 style="font-size:16px; font-weight:700; color:#0f172a;">${escapeHtml(s.name)}</h4>
                  <div style="font-size:12px; color:#64748b;">${escapeHtml(s.email)}</div>
                </div>
              </div>
              <span class="role-badge-pill" style="background:${s.color}18; color:${s.color}; border:1px solid ${s.color}44;">
                ${escapeHtml(s.role)}
              </span>
            </div>

            <div style="font-size:13px; color:#475569; margin-bottom:16px; min-height:36px; line-height:1.4;">
              ${escapeHtml(s.desc)}
            </div>

            <div style="border-top:1px solid #f1f5f9; padding-top:12px; display:flex; justify-content:space-between; align-items:center;">
              <span style="font-size:12px; color:#64748b;">PIN: •••• (${s.pin})</span>
              <button class="session-btn" style="background:#f1f5f9; color:#1e293b; border:1px solid #cbd5e1;" onclick="selectPortalRole('${s.roleKey}', '${s.id}')">
                Switch to this Staff
              </button>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function openAddStaffModal() {
  const modalHtml = `
    <div class="modal-header">
      <div class="modal-title">Add Staff Member</div>
      <button class="modal-close-btn" onclick="closeModal()">✕</button>
    </div>
    <div class="modal-body">
      <div class="form-group">
        <label class="form-label">Full Name</label>
        <input type="text" id="newStaffName" class="form-input" placeholder="e.g. Samuel Mensah" />
      </div>
      <div class="form-group">
        <label class="form-label">Role</label>
        <select id="newStaffRole" class="form-select">
          <option value="cashier">Cashier</option>
          <option value="inventory">Inventory Manager</option>
          <option value="accountant">Accountant</option>
          <option value="manager">General Manager</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Terminal Access PIN (4 Digits)</label>
        <input type="password" id="newStaffPin" class="form-input" maxlength="4" placeholder="7890" />
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn-secondary" onclick="closeModal()">Cancel</button>
      <button class="btn-primary" onclick="saveNewStaff()">Create Staff Account</button>
    </div>
  `;
  showModal(modalHtml);
}

function saveNewStaff() {
  const name = document.getElementById('newStaffName').value.trim();
  const roleKey = document.getElementById('newStaffRole').value;
  const pin = document.getElementById('newStaffPin').value.trim() || '1234';
  if (!name) return alert("Please enter staff name");

  const rolesMap = {
    cashier: { label: "Cashier", color: "#059669", desc: "POS terminal, sales, customer lookup" },
    inventory: { label: "Inventory Manager", color: "#d97706", desc: "Products, stock levels, adjustments" },
    accountant: { label: "Accountant", color: "#7c3aed", desc: "Sales reports, reconciliation, audit log" },
    manager: { label: "General Manager", color: "#0284c7", desc: "Staff, inventory, reports — no billing/settings" }
  };

  const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  AppState.staff.push({
    id: `staff_${Date.now()}`,
    name: name,
    role: rolesMap[roleKey].label,
    roleKey: roleKey,
    avatar: initials,
    color: rolesMap[roleKey].color,
    pin: pin,
    email: `${name.toLowerCase().replace(/\s+/g, '.')}@selligine.store`,
    desc: rolesMap[roleKey].desc
  });

  saveData();
  closeModal();
  SoundEffects.success();
  renderApp();
}

// ==========================================================================
// 8. Store Settings Screen
// ==========================================================================
function renderSettingsView(container) {
  container.innerHTML = `
    <div class="view-container">
      <div class="page-header-row">
        <div>
          <h2 class="page-title">Store Settings & Configuration</h2>
          <p class="page-subtitle">Configure business details, receipt headers, tax rules, and demo resets.</p>
        </div>
        <button class="btn-primary" onclick="saveStoreSettings()">Save Changes</button>
      </div>

      <div style="background:#fff; border:1px solid #e2e8f0; border-radius:12px; padding:24px; max-width:760px; box-shadow:var(--shadow-sm);">
        <h3 style="font-size:16px; font-weight:700; margin-bottom:16px;">Business Information</h3>
        
        <div class="form-group">
          <label class="form-label">Store Trade Name</label>
          <input type="text" id="settStoreName" class="form-input" value="${escapeHtml(AppState.settings.storeName)}" />
        </div>

        <div class="form-group">
          <label class="form-label">Tagline / Slogan</label>
          <input type="text" id="settTagline" class="form-input" value="${escapeHtml(AppState.settings.tagline)}" />
        </div>

        <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
          <div class="form-group">
            <label class="form-label">Store Phone Number</label>
            <input type="text" id="settPhone" class="form-input" value="${escapeHtml(AppState.settings.phone)}" />
          </div>
          <div class="form-group">
            <label class="form-label">Store Email</label>
            <input type="email" id="settEmail" class="form-input" value="${escapeHtml(AppState.settings.email)}" />
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Store Physical Address</label>
          <input type="text" id="settAddress" class="form-input" value="${escapeHtml(AppState.settings.address)}" />
        </div>

        <hr style="border:none; border-top:1px solid #e2e8f0; margin:20px 0;" />
        <h3 style="font-size:16px; font-weight:700; margin-bottom:16px;">Tax & Currency</h3>

        <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:12px;">
          <div class="form-group">
            <label class="form-label">Currency Symbol</label>
            <input type="text" id="settCurrency" class="form-input" value="${escapeHtml(AppState.settings.currency)}" />
          </div>
          <div class="form-group">
            <label class="form-label">Tax Rate (%)</label>
            <input type="number" step="0.1" id="settTaxRate" class="form-input" value="${AppState.settings.taxRate}" />
          </div>
          <div class="form-group">
            <label class="form-label">Tax Label</label>
            <input type="text" id="settTaxName" class="form-input" value="${escapeHtml(AppState.settings.taxName)}" />
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Thermal Receipt Footer Message</label>
          <textarea id="settFooter" class="form-textarea" rows="2">${escapeHtml(AppState.settings.receiptFooter)}</textarea>
        </div>

        <hr style="border:none; border-top:1px solid #e2e8f0; margin:20px 0;" />
        <h3 style="font-size:16px; font-weight:700; color:#b91c1c; margin-bottom:8px;">Danger Zone: Reset Demo</h3>
        <p style="font-size:13px; color:#64748b; margin-bottom:14px;">Restore original 40 provision store products and 14 days sales transactions.</p>
        <button class="btn-secondary" style="color:#ef4444; border-color:#fca5a5;" onclick="resetToDefaults()">
          🔄 Reset All Demo Data to Defaults
        </button>
      </div>
    </div>
  `;
}

function saveStoreSettings() {
  AppState.settings.storeName = document.getElementById('settStoreName').value.trim();
  AppState.settings.tagline = document.getElementById('settTagline').value.trim();
  AppState.settings.phone = document.getElementById('settPhone').value.trim();
  AppState.settings.email = document.getElementById('settEmail').value.trim();
  AppState.settings.address = document.getElementById('settAddress').value.trim();
  AppState.settings.currency = document.getElementById('settCurrency').value.trim();
  AppState.settings.taxRate = parseFloat(document.getElementById('settTaxRate').value) || 0;
  AppState.settings.taxName = document.getElementById('settTaxName').value.trim();
  AppState.settings.receiptFooter = document.getElementById('settFooter').value.trim();

  saveData();
  SoundEffects.success();
  alert("Store settings saved successfully!");
  renderApp();
}

// ==========================================================================
// Extra Utility Modals (Switch Role, Held Orders, Customer Quick Add, Register)
// ==========================================================================
function openPortalSwitcherModal() {
  const modalHtml = `
    <div class="modal-header">
      <div class="modal-title">Switch Active Staff Portal</div>
      <button class="modal-close-btn" onclick="closeModal()">✕</button>
    </div>
    <div class="modal-body">
      <div style="display:flex; flex-direction:column; gap:10px;">
        ${AppState.staff.map(s => `
          <div 
            onclick="selectPortalRole('${s.roleKey}', '${s.id}'); closeModal();" 
            style="display:flex; align-items:center; justify-content:space-between; padding:12px; border:1px solid #e2e8f0; border-radius:8px; cursor:pointer; background:${AppState.currentStaff && AppState.currentStaff.id === s.id ? '#eff6ff' : '#fff'};">
            <div style="display:flex; align-items:center; gap:12px;">
              <span style="width:34px; height:34px; border-radius:8px; background:${s.color}15; color:${s.color}; display:flex; align-items:center; justify-content:center; font-weight:bold;">${s.avatar}</span>
              <div>
                <strong>${escapeHtml(s.name)}</strong>
                <div style="font-size:12px; color:#64748b;">${escapeHtml(s.role)}</div>
              </div>
            </div>
            <span style="font-size:13px; color:#2563eb; font-weight:600;">Switch ›</span>
          </div>
        `).join('')}
      </div>
    </div>
  `;
  showModal(modalHtml);
}

function openHeldOrdersModal() {
  const modalHtml = `
    <div class="modal-header">
      <div class="modal-title">Parked / Held Orders (${AppState.heldCarts.length})</div>
      <button class="modal-close-btn" onclick="closeModal()">✕</button>
    </div>
    <div class="modal-body">
      ${AppState.heldCarts.length === 0 ? `
        <div style="text-align:center; padding:30px; color:#94a3b8;">
          <div style="font-size:32px; margin-bottom:8px;">📋</div>
          <h4>No Parked Orders</h4>
          <p style="font-size:12px;">Click "Park Cart" during POS sales to hold an order for later recall.</p>
        </div>
      ` : `
        <div style="display:flex; flex-direction:column; gap:10px;">
          ${AppState.heldCarts.map(h => `
            <div style="border:1px solid #e2e8f0; border-radius:8px; padding:14px; background:#f8fafc; display:flex; justify-content:space-between; align-items:center;">
              <div>
                <strong style="color:#0f172a;">${escapeHtml(h.note)}</strong>
                <div style="font-size:12px; color:#64748b; margin-top:2px;">
                  Customer: ${escapeHtml(h.customer ? h.customer.name : 'Walk-in')} • ${h.items.length} items (${h.timeStr})
                </div>
              </div>
              <button class="btn-primary" style="padding:6px 14px; font-size:13px;" onclick="recallHeldCart('${h.id}')">
                Recall Order
              </button>
            </div>
          `).join('')}
        </div>
      `}
    </div>
  `;
  showModal(modalHtml);
}

function openQuickAddCustomerModal() {
  const modalHtml = `
    <div class="modal-header">
      <div class="modal-title">Quick Add Customer</div>
      <button class="modal-close-btn" onclick="closeModal()">✕</button>
    </div>
    <div class="modal-body">
      <div class="form-group">
        <label class="form-label">Customer Name</label>
        <input type="text" id="quickCustName" class="form-input" placeholder="e.g. Ama Serwaa" />
      </div>
      <div class="form-group">
        <label class="form-label">Phone Number (MoMo / SMS Receipts)</label>
        <input type="text" id="quickCustPhone" class="form-input" placeholder="+233 24 000 0000" />
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn-secondary" onclick="closeModal()">Cancel</button>
      <button class="btn-primary" onclick="saveQuickCustomer()">Save & Select</button>
    </div>
  `;
  showModal(modalHtml);
}

function saveQuickCustomer() {
  const name = document.getElementById('quickCustName').value.trim();
  const phone = document.getElementById('quickCustPhone').value.trim() || 'N/A';
  if (!name) return alert("Please enter customer name");

  const newCust = {
    id: `cust_${Date.now()}`,
    name: name,
    phone: phone,
    email: '',
    points: 10,
    balanceDebt: 0.00,
    totalSpent: 0.00,
    visits: 1
  };

  AppState.customers.unshift(newCust);
  AppState.selectedCustomer = newCust;
  saveData();
  closeModal();
  SoundEffects.success();
  renderApp();
}

function openRegisterModal() {
  const modalHtml = `
    <div class="modal-header">
      <div class="modal-title">Register Your Business on Selligine</div>
      <button class="modal-close-btn" onclick="closeModal()">✕</button>
    </div>
    <div class="modal-body">
      <p style="font-size:13.5px; color:#64748b; margin-bottom:16px;">
        Get started with Selligine retail POS for your supermarket, provision store, or boutique in minutes.
      </p>
      <div class="form-group">
        <label class="form-label">Business / Shop Name</label>
        <input type="text" id="regShopName" class="form-input" placeholder="e.g. Osu Premier Supermarket" />
      </div>
      <div class="form-group">
        <label class="form-label">Business Owner Name</label>
        <input type="text" id="regOwnerName" class="form-input" placeholder="e.g. Nana Kwame" />
      </div>
      <div class="form-group">
        <label class="form-label">Phone Number</label>
        <input type="text" class="form-input" placeholder="+233 24 123 4567" />
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn-secondary" onclick="closeModal()">Cancel</button>
      <button class="btn-primary" onclick="completeRegistration()">Create Business</button>
    </div>
  `;
  showModal(modalHtml);
}

function completeRegistration() {
  const shop = document.getElementById('regShopName').value.trim();
  const owner = document.getElementById('regOwnerName').value.trim();
  if (shop) AppState.settings.storeName = shop;
  if (owner) {
    const ownerStaff = AppState.staff.find(s => s.roleKey === 'owner');
    if (ownerStaff) ownerStaff.name = owner;
  }
  saveData();
  closeModal();
  selectPortalRole('owner');
}

function openSignInModal() {
  const modalHtml = `
    <div class="modal-header">
      <div class="modal-title">Sign In to Selligine</div>
      <button class="modal-close-btn" onclick="closeModal()">✕</button>
    </div>
    <div class="modal-body">
      <div class="form-group">
        <label class="form-label">Select Staff Profile</label>
        <select id="signInStaffSelect" class="form-select">
          ${AppState.staff.map(s => `<option value="${s.id}">${s.name} (${s.role})</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Enter 4-Digit PIN</label>
        <input type="password" id="signInPin" class="form-input" placeholder="••••" maxlength="4" value="1234" />
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn-secondary" onclick="closeModal()">Cancel</button>
      <button class="btn-primary" onclick="completeSignIn()">Sign In</button>
    </div>
  `;
  showModal(modalHtml);
}

function completeSignIn() {
  const staffId = document.getElementById('signInStaffSelect').value;
  const staff = AppState.staff.find(s => s.id === staffId);
  if (staff) {
    AppState.currentStaff = staff;
    AppState.activeTab = staff.roleKey === 'cashier' ? 'pos' : staff.roleKey === 'inventory' ? 'inventory' : staff.roleKey === 'accountant' ? 'reports' : 'pos';
    closeModal();
    SoundEffects.success();
    renderApp();
  }
}

// Modal Container Helpers
function showModal(innerHtml) {
  const backdrop = document.getElementById('globalModalBackdrop');
  const windowEl = document.getElementById('globalModalWindow');
  windowEl.innerHTML = innerHtml;
  backdrop.classList.add('open');
}

function closeModal() {
  const backdrop = document.getElementById('globalModalBackdrop');
  backdrop.classList.remove('open');
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function setupEventListeners() {
  // Close modal on backdrop click
  const backdrop = document.getElementById('globalModalBackdrop');
  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) closeModal();
  });

  // Global Keyboard shortcuts (F2: focus search, F8: checkout, Esc: close modal)
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
    if (e.key === 'F2') {
      e.preventDefault();
      const input = document.getElementById('posSearchInput');
      if (input) input.focus();
    }
  });
}

// Start Application on Load
window.addEventListener('DOMContentLoaded', initApp);
