// ===== CART.JS =====

document.addEventListener('DOMContentLoaded', () => {
  loadCartCount();
  loadCartSidebar();
  setupCartListeners();
});

async function loadCartCount() {
  try {
    const res = await fetch('/api/cart');
    const data = await res.json();
    const badge = document.getElementById('cartCount');
    if (badge) badge.textContent = data.count || 0;
  } catch {}
}

async function loadCartSidebar() {
  const body = document.getElementById('cartBody');
  const footer = document.getElementById('cartFooter');
  if (!body || !footer) return;
  try {
    const res = await fetch('/api/cart');
    const data = await res.json();
    if (!data.items || data.items.length === 0) {
      body.innerHTML = `<div class="cart-empty"><i class="fas fa-shopping-bag"></i><p>Your bag is empty</p><a href="/shop" class="btn btn-gold">Start Shopping</a></div>`;
      footer.style.display = 'none';
      return;
    }
    body.innerHTML = data.items.map(item => `
      <div class="cart-item">
        <div class="cart-item-image"><i class="fas fa-gem"></i></div>
        <div class="cart-item-info">
          <h4>${item.product ? item.product.name : 'Product'}</h4>
          <span class="item-price">Rs. ${Number(item.product ? item.product.price : 0).toLocaleString()}</span>
          <div class="cart-item-qty">
            <button class="qty-change" data-id="${item.product ? item.product._id : ''}" data-action="minus">-</button>
            <span>${item.quantity}</span>
            <button class="qty-change" data-id="${item.product ? item.product._id : ''}" data-action="plus">+</button>
            <button class="cart-item-remove" data-id="${item.product ? item.product._id : ''}"><i class="fas fa-trash-alt"></i></button>
          </div>
        </div>
      </div>
    `).join('');
    footer.style.display = 'flex';
    document.getElementById('cartSubtotal').textContent = `Rs. ${Number(data.subtotal).toLocaleString()}`;
    document.querySelectorAll('.qty-change').forEach(btn => btn.addEventListener('click', handleQtyChange));
    document.querySelectorAll('.cart-item-remove').forEach(btn => btn.addEventListener('click', handleRemoveItem));
  } catch {}
}

function setupCartListeners() {
  // Add to cart buttons
  document.addEventListener('click', async (e) => {
    const btn = e.target.closest('.add-to-cart-btn');
    if (!btn) return;
    const productId = btn.dataset.productId;
    if (!productId) return;
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    try {
      const res = await fetch('/api/cart/add', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, quantity: 1 })
      });
      const data = await res.json();
      if (data.success) {
        window.showToast('Added to bag!', 'success');
        loadCartCount();
        loadCartSidebar();
      } else {
        window.showToast(data.message || 'Failed to add', 'error');
      }
    } catch {
      window.showToast('Error adding to cart', 'error');
    }
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-shopping-bag"></i> Add to Bag';
  });
}

async function handleQtyChange(e) {
  const btn = e.currentTarget;
  const productId = btn.dataset.id;
  const currentQty = parseInt(btn.closest('.cart-item-qty').querySelector('span').textContent);
  const action = btn.dataset.action;
  const newQty = action === 'plus' ? currentQty + 1 : currentQty - 1;
  if (newQty < 1) return;
  try {
    const res = await fetch('/api/cart/update', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId, quantity: newQty })
    });
    const data = await res.json();
    if (data.success) {
      loadCartCount();
      loadCartSidebar();
      loadCartPage();
    }
  } catch { window.showToast('Error updating cart', 'error'); }
}

async function handleRemoveItem(e) {
  const btn = e.currentTarget;
  const productId = btn.dataset.id;
  try {
    const res = await fetch(`/api/cart/remove/${productId}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) {
      window.showToast('Removed from bag', 'success');
      loadCartCount();
      loadCartSidebar();
      loadCartPage();
    }
  } catch { window.showToast('Error removing item', 'error'); }
}

// Cart page specific
async function loadCartPage() {
  const container = document.getElementById('cartItems');
  const summary = document.getElementById('cartSummary');
  if (!container) return;
  try {
    const res = await fetch('/api/cart');
    const data = await res.json();
    if (!data.items || data.items.length === 0) {
      container.innerHTML = `<div class="empty-collection"><i class="fas fa-shopping-bag"></i><h3>Your Cart is Empty</h3><p>Start shopping to add items to your cart.</p><a href="/shop" class="btn btn-gold">Start Shopping</a></div>`;
      if (summary) summary.style.display = 'none';
      return;
    }
    if (summary) summary.style.display = 'block';
    container.innerHTML = data.items.map(item => `
      <div class="cart-item">
        <div class="cart-item-image"><i class="fas fa-gem"></i></div>
        <div class="cart-item-info">
          <h4>${item.product ? item.product.name : 'Product'}</h4>
          <span class="item-price">Rs. ${Number(item.product ? item.product.price : 0).toLocaleString()}</span>
          <div class="cart-item-qty">
            <button class="qty-change" data-id="${item.product ? item.product._id : ''}" data-action="minus">-</button>
            <span>${item.quantity}</span>
            <button class="qty-change" data-id="${item.product ? item.product._id : ''}" data-action="plus">+</button>
            <button class="cart-item-remove" data-id="${item.product ? item.product._id : ''}"><i class="fas fa-trash-alt"></i></button>
          </div>
        </div>
        <div class="cart-item-total" style="font-weight:600;color:var(--gold);font-family:var(--font-heading);font-size:1.1rem">
          Rs. ${Number((item.product ? item.product.price : 0) * item.quantity).toLocaleString()}
        </div>
      </div>
    `).join('');

    const subtotal = data.subtotal;
    const shipping = subtotal >= 5000 ? 0 : 200;
    document.getElementById('summarySubtotal').textContent = `Rs. ${Number(subtotal).toLocaleString()}`;
    document.getElementById('summaryShipping').textContent = shipping === 0 ? 'Free' : `Rs. ${shipping}`;
    document.getElementById('summaryTotal').textContent = `Rs. ${Number(subtotal + shipping).toLocaleString()}`;

    document.querySelectorAll('.qty-change').forEach(btn => btn.addEventListener('click', handleQtyChange));
    document.querySelectorAll('.cart-item-remove').forEach(btn => btn.addEventListener('click', handleRemoveItem));
  } catch {}
}

// Coupon
document.addEventListener('submit', async (e) => {
  if (!e.target.id === 'couponForm') return;
  e.preventDefault();
  const input = document.getElementById('couponInput');
  const msg = document.getElementById('couponMessage');
  if (!input || !msg) return;
  try {
    const res = await fetch('/api/cart/coupon', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: input.value })
    });
    const data = await res.json();
    if (data.success) {
      msg.innerHTML = `<span style="color:#27ae60">Coupon applied! Discount: Rs. ${Number(data.discount).toLocaleString()}</span>`;
      document.getElementById('discountRow').style.display = 'flex';
      document.getElementById('summaryDiscount').textContent = `-Rs. ${Number(data.discount).toLocaleString()}`;
      loadCartPage();
    } else {
      msg.innerHTML = `<span style="color:#e74c3c">${data.message}</span>`;
    }
  } catch { msg.innerHTML = `<span style="color:#e74c3c">Error applying coupon</span>`; }
});