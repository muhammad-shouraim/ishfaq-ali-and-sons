// ===== WISHLIST.JS =====

document.addEventListener('DOMContentLoaded', () => {
  loadWishlistCount();
  setupWishlistListeners();
});

async function loadWishlistCount() {
  try {
    const res = await fetch('/api/wishlist');
    const data = await res.json();
    const badge = document.getElementById('wishlistCount');
    if (badge) badge.textContent = (data.items && data.items.length) || 0;
  } catch {}
}

async function loadWishlistPage() {
  const container = document.getElementById('wishlistContent');
  if (!container) return;
  try {
    const res = await fetch('/api/wishlist');
    const data = await res.json();
    if (!data.items || data.items.length === 0) {
      container.innerHTML = `<div class="empty-collection"><i class="far fa-heart"></i><h3>Your Wishlist is Empty</h3><p>Save your favorite pieces to your wishlist.</p><a href="/shop" class="btn btn-gold">Browse Collection</a></div>`;
      return;
    }
    container.innerHTML = `<div class="products-grid">${data.items.map(item => `
      <div class="product-card">
        <div class="product-card-image">
          <div class="product-image-placeholder-sm"><i class="fas fa-gem"></i></div>
          <button class="wishlist-toggle-sm active wishlist-remove-btn" data-product-id="${item._id}"><i class="fas fa-heart" style="color:#e74c3c"></i></button>
        </div>
        <div class="product-card-body">
          <h3><a href="/product/${item.slug || item._id}">${item.name}</a></h3>
          <span class="price">Rs. ${Number(item.price).toLocaleString()}</span>
          <button class="btn btn-sm btn-gold add-to-cart-btn" data-product-id="${item._id}">Add to Bag</button>
        </div>
      </div>
    `).join('')}</div>`;
    document.querySelectorAll('.wishlist-remove-btn').forEach(btn => btn.addEventListener('click', handleRemoveWishlist));
  } catch {}
}

function setupWishlistListeners() {
  document.addEventListener('click', async (e) => {
    const btn = e.target.closest('.wishlist-toggle, .wishlist-toggle-sm');
    if (!btn) return;
    const productId = btn.dataset.productId;
    if (!productId) return;
    try {
      const res = await fetch('/api/wishlist/toggle', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId })
      });
      const data = await res.json();
      if (data.success) {
        window.showToast(data.message, data.inWishlist ? 'success' : 'error');
        loadWishlistCount();
        loadWishlistPage();
        if (data.inWishlist) { btn.innerHTML = '<i class="fas fa-heart" style="color:#e74c3c"></i>'; btn.classList.add('active'); }
        else { btn.innerHTML = '<i class="far fa-heart"></i>'; btn.classList.remove('active'); }
      }
    } catch {}
  });
}

async function handleRemoveWishlist(e) {
  const btn = e.currentTarget;
  const productId = btn.dataset.productId;
  try {
    const res = await fetch(`/api/wishlist/remove/${productId}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) {
      window.showToast('Removed from wishlist', 'error');
      loadWishlistCount();
      loadWishlistPage();
    }
  } catch {}
}

// Check if item is in wishlist
async function checkWishlistStatus(productId) {
  try {
    const res = await fetch('/api/wishlist');
    const data = await res.json();
    return data.items && data.items.some(i => i._id === productId || i === productId);
  } catch { return false; }
}