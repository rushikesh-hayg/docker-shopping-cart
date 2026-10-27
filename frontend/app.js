/**
 * CloudCart - Production Storefront & Checkout Application Logic
 * Integrates with Express + SQLite REST API via Nginx Reverse Proxy
 */

// Dynamic API Base Resolution:
// - Behind Nginx (Port 80/443 or default proxy): uses relative '/api'
// - Direct backend testing (Port 5000): uses '/api'
// - Local live-server (e.g. Port 5500, 3000): points to 'http://localhost:5000/api'
const API_BASE = (window.location.port === '5000') 
  ? '/api' 
  : (window.location.hostname === 'localhost' && window.location.port !== '80' && window.location.port !== '') 
    ? 'http://localhost:5000/api' 
    : '/api';

// Application State
const state = {
  products: [],
  cart: JSON.parse(localStorage.getItem('cloudcart_cart') || '[]'),
  activeCategory: 'ALL',
  searchQuery: '',
  healthStatus: 'OFFLINE'
};

// DOM Selectors
const DOM = {
  // Navigation & Tabs
  navStoreBtn: document.getElementById('nav-store-btn'),
  navAdminBtn: document.getElementById('nav-admin-btn'),
  storefrontSection: document.getElementById('storefront-section'),
  adminSection: document.getElementById('admin-section'),
  brandLogo: document.getElementById('brand-logo'),

  // Status Bar
  backendHealthText: document.getElementById('backend-health-text'),
  statusDot: document.querySelector('.status-dot'),

  // Search & Filters
  searchInput: document.getElementById('search-input'),
  searchClearBtn: document.getElementById('search-clear-btn'),
  categoryPills: document.getElementById('category-pills'),
  catalogCount: document.getElementById('catalog-count'),
  catalogGrid: document.getElementById('catalog-grid'),

  // Cart Drawer
  cartDrawerToggle: document.getElementById('cart-drawer-toggle'),
  cartDrawer: document.getElementById('cart-drawer'),
  cartBackdrop: document.getElementById('cart-backdrop'),
  cartCloseBtn: document.getElementById('cart-close-btn'),
  cartCounter: document.getElementById('cart-counter'),
  drawerItemCount: document.getElementById('drawer-item-count'),
  cartItemsContainer: document.getElementById('cart-items-container'),
  drawerFooter: document.getElementById('drawer-footer'),
  drawerSubtotal: document.getElementById('drawer-subtotal'),
  drawerTotal: document.getElementById('drawer-total'),
  emptyCartBrowseBtn: document.getElementById('empty-cart-browse-btn'),

  // Checkout Modal
  openCheckoutModalBtn: document.getElementById('open-checkout-modal-btn'),
  checkoutModal: document.getElementById('checkout-modal'),
  checkoutCloseBtn: document.getElementById('checkout-close-btn'),
  cancelCheckoutBtn: document.getElementById('cancel-checkout-btn'),
  checkoutForm: document.getElementById('checkout-form'),
  custName: document.getElementById('cust-name'),
  custEmail: document.getElementById('cust-email'),
  checkoutItemCount: document.getElementById('checkout-item-count'),
  checkoutTotalAmount: document.getElementById('checkout-total-amount'),
  checkoutErrorMsg: document.getElementById('checkout-error-msg'),
  submitOrderBtn: document.getElementById('submit-order-btn'),

  // Success Modal
  successModal: document.getElementById('success-modal'),
  successDismissBtn: document.getElementById('success-dismiss-btn'),
  viewAdminAfterOrderBtn: document.getElementById('view-admin-after-order-btn'),
  orderReceiptContent: document.getElementById('order-receipt-content'),

  // Admin Dashboard
  refreshStatsBtn: document.getElementById('refresh-stats-btn'),
  statRevenue: document.getElementById('stat-revenue'),
  statOrders: document.getElementById('stat-orders'),
  statItemsSold: document.getElementById('stat-items-sold'),
  statLowStock: document.getElementById('stat-low-stock'),
  topProductsTbody: document.getElementById('top-products-tbody'),
  recentOrdersTbody: document.getElementById('recent-orders-tbody'),

  // Toasts
  toastContainer: document.getElementById('toast-container')
};

// ============================================================================
// Initialization
// ============================================================================
document.addEventListener('DOMContentLoaded', () => {
  initEventListeners();
  checkHealth();
  loadProducts();
  updateCartUI();

  // Periodic health check every 15s
  setInterval(checkHealth, 15000);
});

// ============================================================================
// Event Listeners
// ============================================================================
function initEventListeners() {
  // Navigation Tabs
  DOM.navStoreBtn.addEventListener('click', () => switchView('store'));
  DOM.navAdminBtn.addEventListener('click', () => switchView('admin'));
  DOM.brandLogo.addEventListener('click', () => switchView('store'));

  // Search
  let searchTimeout = null;
  DOM.searchInput.addEventListener('input', (e) => {
    const val = e.target.value.trim();
    DOM.searchClearBtn.classList.toggle('hidden', val === '');
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      state.searchQuery = val;
      if (val === '') {
        loadProducts();
      } else {
        performSearch(val);
      }
    }, 250);
  });

  DOM.searchClearBtn.addEventListener('click', () => {
    DOM.searchInput.value = '';
    DOM.searchClearBtn.classList.add('hidden');
    state.searchQuery = '';
    loadProducts();
  });

  // Category Filtering
  DOM.categoryPills.addEventListener('click', (e) => {
    if (e.target.classList.contains('pill-btn')) {
      document.querySelectorAll('.pill-btn').forEach(btn => btn.classList.remove('active'));
      e.target.classList.add('active');
      state.activeCategory = e.target.dataset.category;
      loadProducts();
    }
  });

  // Cart Drawer Controls
  DOM.cartDrawerToggle.addEventListener('click', openCartDrawer);
  DOM.cartCloseBtn.addEventListener('click', closeCartDrawer);
  DOM.cartBackdrop.addEventListener('click', closeCartDrawer);
  DOM.emptyCartBrowseBtn.addEventListener('click', closeCartDrawer);

  // Checkout Modal
  DOM.openCheckoutModalBtn.addEventListener('click', openCheckoutModal);
  DOM.checkoutCloseBtn.addEventListener('click', closeCheckoutModal);
  DOM.cancelCheckoutBtn.addEventListener('click', closeCheckoutModal);
  DOM.checkoutForm.addEventListener('submit', handleCheckoutSubmit);

  // Success Modal
  DOM.successDismissBtn.addEventListener('click', () => {
    DOM.successModal.classList.add('hidden');
  });

  DOM.viewAdminAfterOrderBtn.addEventListener('click', () => {
    DOM.successModal.classList.add('hidden');
    switchView('admin');
  });

  // Admin Refresh
  DOM.refreshStatsBtn.addEventListener('click', loadAdminStats);
}

// ============================================================================
// Health Probing
// ============================================================================
async function checkHealth() {
  try {
    const res = await fetch(`${API_BASE}/health`);
    if (res.ok) {
      const data = await res.json();
      state.healthStatus = 'ONLINE';
      DOM.backendHealthText.textContent = `Online (${data.status} - Uptime: ${data.uptime_seconds}s)`;
      DOM.backendHealthText.style.color = 'var(--status-green)';
      DOM.statusDot.className = 'status-dot online';
    } else {
      throw new Error('Health check returned non-200');
    }
  } catch (err) {
    state.healthStatus = 'OFFLINE';
    DOM.backendHealthText.textContent = 'Disconnected / Service Down';
    DOM.backendHealthText.style.color = 'var(--status-rose)';
    DOM.statusDot.className = 'status-dot offline';
  }
}

// ============================================================================
// Product Catalog Operations
// ============================================================================
async function loadProducts() {
  try {
    let url = `${API_BASE}/products`;
    if (state.activeCategory !== 'ALL') {
      url += `?category=${encodeURIComponent(state.activeCategory)}`;
    }

    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const body = await res.json();

    state.products = body.data || [];
    renderCatalog(state.products);
  } catch (err) {
    console.error('Failed to fetch products:', err);
    DOM.catalogGrid.innerHTML = `
      <div class="empty-cell" style="grid-column: 1 / -1; padding: 3rem;">
        <p style="color: var(--status-rose); font-weight: 600; margin-bottom: 0.5rem;">Failed to load catalog from ${API_BASE}/products</p>
        <p style="color: var(--text-muted); font-size: 0.85rem;">Ensure backend server is running on port 5000 or Nginx container is active.</p>
        <button onclick="loadProducts()" class="secondary-btn" style="margin-top: 1rem;">Retry Connection</button>
      </div>
    `;
  }
}

async function performSearch(query) {
  try {
    const res = await fetch(`${API_BASE}/products/search?q=${encodeURIComponent(query)}`);
    if (!res.ok) throw new Error('Search request failed');
    const body = await res.json();

    let filtered = body.data || [];
    if (state.activeCategory !== 'ALL') {
      filtered = filtered.filter(p => p.category.toLowerCase() === state.activeCategory.toLowerCase());
    }

    renderCatalog(filtered);
  } catch (err) {
    showToast('Search query failed', 'error');
  }
}

function renderCatalog(products) {
  DOM.catalogCount.textContent = products.length;

  if (products.length === 0) {
    DOM.catalogGrid.innerHTML = `
      <div class="empty-cell" style="grid-column: 1 / -1; padding: 4rem;">
        <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.5" style="margin: 0 auto 1rem; color: var(--text-dim); display:block;">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
        <p style="color: var(--text-main); font-weight: 600;">No items found matching your filter</p>
        <p style="color: var(--text-muted); font-size: 0.85rem;">Try choosing another category or clearing your search keywords.</p>
      </div>
    `;
    return;
  }

  DOM.catalogGrid.innerHTML = products.map(product => {
    let stockClass = 'in-stock';
    let stockLabel = `${product.stock} in stock`;

    if (product.stock === 0) {
      stockClass = 'out-stock';
      stockLabel = 'Out of Stock';
    } else if (product.stock <= 15) {
      stockClass = 'low-stock';
      stockLabel = `Low Stock: ${product.stock}`;
    }

    const isOutOfStock = product.stock === 0;

    return `
      <article class="product-card" id="product-${product.id}">
        <div class="card-image-wrap">
          <img src="${product.image_url}" alt="${escapeHtml(product.name)}" loading="lazy" />
          <span class="card-badge">${escapeHtml(product.category)}</span>
          <span class="card-stock-tag ${stockClass}">${stockLabel}</span>
        </div>
        <div class="card-content">
          <h3 class="product-title">${escapeHtml(product.name)}</h3>
          <p class="product-desc">${escapeHtml(product.description)}</p>
          <div class="card-footer">
            <div class="product-price">$${product.price.toFixed(2)} <small>USD</small></div>
            <button 
              class="primary-btn sm add-to-cart-btn" 
              data-id="${product.id}"
              ${isOutOfStock ? 'disabled' : ''}
            >
              ${isOutOfStock ? 'Out of Stock' : `
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 5v14M5 12h14"></path>
                </svg>
                Add to Cart
              `}
            </button>
          </div>
        </div>
      </article>
    `;
  }).join('');

  // Attach card Add to Cart listeners
  DOM.catalogGrid.querySelectorAll('.add-to-cart-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const productId = parseInt(btn.dataset.id, 10);
      addToCart(productId);
    });
  });
}

// ============================================================================
// Shopping Cart Operations
// ============================================================================
function addToCart(productId) {
  const product = state.products.find(p => p.id === productId);
  if (!product) return;

  const existing = state.cart.find(item => item.product_id === productId);

  if (existing) {
    if (existing.quantity >= product.stock) {
      showToast(`Cannot add more. Warehouse stock limit reached (${product.stock}).`, 'error');
      return;
    }
    existing.quantity += 1;
  } else {
    if (product.stock <= 0) {
      showToast('This item is currently out of stock.', 'error');
      return;
    }
    state.cart.push({
      product_id: product.id,
      name: product.name,
      price: product.price,
      stock: product.stock,
      image_url: product.image_url,
      quantity: 1
    });
  }

  saveCart();
  updateCartUI();
  bumpCartCounter();
  showToast(`Added "${product.name}" to cart`, 'success');
}

function updateCartQuantity(productId, delta) {
  const item = state.cart.find(i => i.product_id === productId);
  if (!item) return;

  const newQty = item.quantity + delta;

  if (newQty <= 0) {
    removeFromCart(productId);
    return;
  }

  // Cross check latest known product stock
  const catalogProduct = state.products.find(p => p.id === productId);
  const maxStock = catalogProduct ? catalogProduct.stock : item.stock;

  if (newQty > maxStock) {
    showToast(`Maximum available inventory is ${maxStock} units.`, 'error');
    return;
  }

  item.quantity = newQty;
  saveCart();
  updateCartUI();
}

function removeFromCart(productId) {
  state.cart = state.cart.filter(item => item.product_id !== productId);
  saveCart();
  updateCartUI();
  showToast('Item removed from cart');
}

function saveCart() {
  localStorage.setItem('cloudcart_cart', JSON.stringify(state.cart));
}

function updateCartUI() {
  const totalCount = state.cart.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = state.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  DOM.cartCounter.textContent = totalCount;
  DOM.drawerItemCount.textContent = `${totalCount} item${totalCount === 1 ? '' : 's'}`;
  DOM.drawerSubtotal.textContent = `$${subtotal.toFixed(2)}`;
  DOM.drawerTotal.textContent = `$${subtotal.toFixed(2)}`;

  if (state.cart.length === 0) {
    DOM.cartItemsContainer.innerHTML = `
      <div class="empty-cart-state">
        <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.5">
          <circle cx="9" cy="21" r="1"></circle>
          <circle cx="20" cy="21" r="1"></circle>
          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
        </svg>
        <p>Your shopping cart is currently empty.</p>
        <button id="empty-cart-browse-btn" class="primary-btn sm" onclick="closeCartDrawer()">Explore Catalog</button>
      </div>
    `;
    DOM.drawerFooter.classList.add('hidden');
  } else {
    DOM.drawerFooter.classList.remove('hidden');
    DOM.cartItemsContainer.innerHTML = state.cart.map(item => `
      <div class="cart-item" id="cart-item-${item.product_id}">
        <img class="cart-item-img" src="${item.image_url}" alt="${escapeHtml(item.name)}" />
        <div class="cart-item-details">
          <div class="cart-item-title">${escapeHtml(item.name)}</div>
          <div class="cart-item-price">$${(item.price * item.quantity).toFixed(2)}</div>
          <div class="cart-item-controls">
            <div class="qty-control">
              <button class="qty-btn" onclick="updateCartQuantity(${item.product_id}, -1)">&minus;</button>
              <span class="qty-display">${item.quantity}</span>
              <button class="qty-btn" onclick="updateCartQuantity(${item.product_id}, 1)">&plus;</button>
            </div>
            <button class="remove-item-btn" onclick="removeFromCart(${item.product_id})">Remove</button>
          </div>
        </div>
      </div>
    `).join('');
  }
}

function bumpCartCounter() {
  DOM.cartCounter.classList.remove('bump');
  void DOM.cartCounter.offsetWidth; // Trigger reflow
  DOM.cartCounter.classList.add('bump');
}

function openCartDrawer() {
  DOM.cartDrawer.classList.add('open');
  DOM.cartBackdrop.classList.remove('hidden');
}

function closeCartDrawer() {
  DOM.cartDrawer.classList.remove('open');
  DOM.cartBackdrop.classList.add('hidden');
}

// ============================================================================
// Checkout Modal & Atomic Transaction Submission
// ============================================================================
function openCheckoutModal() {
  if (state.cart.length === 0) {
    showToast('Add items to cart before proceeding to checkout', 'error');
    return;
  }

  const totalCount = state.cart.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = state.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  DOM.checkoutItemCount.textContent = `${totalCount} item${totalCount === 1 ? '' : 's'}`;
  DOM.checkoutTotalAmount.textContent = `$${subtotal.toFixed(2)}`;
  DOM.checkoutErrorMsg.classList.add('hidden');

  closeCartDrawer();
  DOM.checkoutModal.classList.remove('hidden');
  DOM.custName.focus();
}

function closeCheckoutModal() {
  DOM.checkoutModal.classList.add('hidden');
  DOM.checkoutErrorMsg.classList.add('hidden');
}

async function handleCheckoutSubmit(e) {
  e.preventDefault();

  const customerName = DOM.custName.value.trim();
  const customerEmail = DOM.custEmail.value.trim();

  if (!customerName || !customerEmail) {
    showCheckoutError('Please provide your name and email address.');
    return;
  }

  const payload = {
    customer_name: customerName,
    customer_email: customerEmail,
    items: state.cart.map(item => ({
      product_id: item.product_id,
      quantity: item.quantity
    }))
  };

  // Toggle button loading state
  const btnText = DOM.submitOrderBtn.querySelector('.btn-text');
  const btnSpinner = DOM.submitOrderBtn.querySelector('.btn-spinner');
  DOM.submitOrderBtn.disabled = true;
  btnText.textContent = 'Committing Transaction...';
  btnSpinner.classList.remove('hidden');
  DOM.checkoutErrorMsg.classList.add('hidden');

  try {
    const res = await fetch(`${API_BASE}/checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || 'Transaction failed');
    }

    // Success! Clear cart
    state.cart = [];
    saveCart();
    updateCartUI();
    closeCheckoutModal();

    // Re-fetch products to reflect updated inventory counters
    await loadProducts();

    // Render receipt modal
    renderSuccessReceipt(data.data);
    showToast('Atomic transaction committed successfully!', 'success');
  } catch (err) {
    showCheckoutError(err.message);
  } finally {
    DOM.submitOrderBtn.disabled = false;
    btnText.textContent = 'Confirm & Pay';
    btnSpinner.classList.add('hidden');
  }
}

function showCheckoutError(msg) {
  DOM.checkoutErrorMsg.textContent = msg;
  DOM.checkoutErrorMsg.classList.remove('hidden');
}

function renderSuccessReceipt(order) {
  DOM.orderReceiptContent.innerHTML = `
    <div class="receipt-row">
      <span style="color: var(--text-dim);">Order ID:</span>
      <strong style="color: var(--accent-cyan-light);">#${order.order_id}</strong>
    </div>
    <div class="receipt-row">
      <span style="color: var(--text-dim);">Customer:</span>
      <span>${escapeHtml(order.customer_name)}</span>
    </div>
    <div class="receipt-row">
      <span style="color: var(--text-dim);">Email:</span>
      <span>${escapeHtml(order.customer_email)}</span>
    </div>
    <div class="receipt-row">
      <span style="color: var(--text-dim);">Items:</span>
      <span>${order.items.length} unique SKU(s)</span>
    </div>
    <div class="receipt-row" style="margin-top: 0.5rem; font-size: 0.95rem; font-weight: bold; border-top: 1px solid var(--border-color); padding-top: 0.5rem;">
      <span>Total Paid:</span>
      <span style="color: var(--status-green);">$${order.total_amount.toFixed(2)} USD</span>
    </div>
  `;

  DOM.successModal.classList.remove('hidden');
}

// ============================================================================
// View Navigation (Storefront vs. Admin)
// ============================================================================
function switchView(viewName) {
  if (viewName === 'store') {
    DOM.navStoreBtn.classList.add('active');
    DOM.navAdminBtn.classList.remove('active');
    DOM.storefrontSection.classList.remove('hidden');
    DOM.adminSection.classList.add('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } else if (viewName === 'admin') {
    DOM.navAdminBtn.classList.add('active');
    DOM.navStoreBtn.classList.remove('active');
    DOM.storefrontSection.classList.add('hidden');
    DOM.adminSection.classList.remove('hidden');
    loadAdminStats();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

// ============================================================================
// Admin Telemetry & Statistics
// ============================================================================
async function loadAdminStats() {
  DOM.refreshStatsBtn.disabled = true;
  DOM.refreshStatsBtn.textContent = 'Updating...';

  try {
    const res = await fetch(`${API_BASE}/admin/stats`);
    if (!res.ok) throw new Error('Failed to retrieve statistics');
    const { data } = await res.json();

    DOM.statRevenue.textContent = `$${data.financials.total_revenue.toFixed(2)}`;
    DOM.statOrders.textContent = data.financials.total_orders;
    DOM.statItemsSold.textContent = data.financials.total_items_sold;
    DOM.statLowStock.textContent = data.inventory.low_stock_count;

    // Render Top Products
    if (data.top_products.length > 0) {
      DOM.topProductsTbody.innerHTML = data.top_products.map(p => `
        <tr>
          <td><strong>${escapeHtml(p.name)}</strong></td>
          <td><span class="badge-tag">${escapeHtml(p.category)}</span></td>
          <td>${p.stock}</td>
          <td><strong style="color: var(--accent-cyan-light);">${p.units_sold}</strong></td>
          <td>$${p.revenue_generated.toFixed(2)}</td>
        </tr>
      `).join('');
    } else {
      DOM.topProductsTbody.innerHTML = '<tr><td colspan="5" class="empty-cell">No sales recorded yet.</td></tr>';
    }

    // Render Recent Orders
    if (data.recent_orders.length > 0) {
      DOM.recentOrdersTbody.innerHTML = data.recent_orders.map(o => `
        <tr>
          <td><strong>#${o.id}</strong></td>
          <td>${escapeHtml(o.customer_name)}<br><small style="color: var(--text-dim);">${escapeHtml(o.customer_email)}</small></td>
          <td><strong style="color: var(--status-green);">$${o.total_amount.toFixed(2)}</strong></td>
          <td><span class="badge-tag" style="color: var(--status-green); border-color: rgba(16,185,129,0.3);">${o.status}</span></td>
          <td style="font-family: var(--font-mono); font-size: 0.75rem;">${new Date(o.created_at).toLocaleDateString()} ${new Date(o.created_at).toLocaleTimeString()}</td>
        </tr>
      `).join('');
    } else {
      DOM.recentOrdersTbody.innerHTML = '<tr><td colspan="5" class="empty-cell">No transactions recorded yet.</td></tr>';
    }
  } catch (err) {
    showToast('Failed to load admin telemetry', 'error');
  } finally {
    DOM.refreshStatsBtn.disabled = false;
    DOM.refreshStatsBtn.innerHTML = `
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="23 4 23 10 17 10"></polyline>
        <polyline points="1 20 1 14 7 14"></polyline>
        <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
      </svg>
      Refresh Telemetry
    `;
  }
}

// ============================================================================
// Toast Notification Utility
// ============================================================================
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;

  DOM.toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    toast.style.transition = 'all 0.25s ease';
    setTimeout(() => toast.remove(), 250);
  }, 3000);
}

// XSS sanitization helper
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Global scope bindings for inline event handlers
window.updateCartQuantity = updateCartQuantity;
window.removeFromCart = removeFromCart;
window.closeCartDrawer = closeCartDrawer;
window.loadProducts = loadProducts;
