// ===== SHOP.JS =====

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('productsGrid')) initShop();
  if (document.getElementById('catProductsGrid')) initCategoryShop();
});

function initShop() {
  const categoryFilter = document.getElementById('categoryFilter');
  const sortSelect = document.getElementById('sortSelect');
  const minPrice = document.getElementById('minPrice');
  const maxPrice = document.getElementById('maxPrice');
  const priceBtn = document.getElementById('priceFilterBtn');
  const clearBtn = document.getElementById('clearFilters');
  const pagination = document.getElementById('pagination');

  let currentPage = 1;
  const params = new URLSearchParams();

  function buildParams() {
    const cat = categoryFilter ? document.querySelector('input[name="category"]:checked')?.value : '';
    if (cat) params.set('category', cat);
    if (sortSelect && sortSelect.value) params.set('sort', sortSelect.value);
    if (minPrice && minPrice.value) params.set('minPrice', minPrice.value);
    if (maxPrice && maxPrice.value) params.set('maxPrice', maxPrice.value);
    params.set('page', currentPage);
  }

  async function loadProducts() {
    const grid = document.getElementById('productsGrid');
    if (!grid) return;
    params.delete('category'); params.delete('sort'); params.delete('minPrice'); params.delete('maxPrice'); params.delete('page');
    buildParams();
    try {
      const res = await fetch(`/api/products?${params.toString()}`);
      const data = await res.json();
      const count = document.getElementById('resultCount');
      if (count) count.textContent = `Showing ${data.total} product${data.total !== 1 ? 's' : ''}`;
      if (data.products && data.products.length > 0) {
        grid.innerHTML = data.products.map(p => `
          <div class="product-card">
            <div class="product-card-image">
              <a href="/product/${p.slug}">
                <img src="${p.thumbnail || '/images/newlogo.png'}" alt="${p.name}" style="width:100%;height:100%;object-fit:cover">
              </a>
              ${p.comparePrice > 0 ? '<span class="badge badge-sale">Sale</span>' : ''}
              <button class="wishlist-toggle-sm" data-product-id="${p.id}"><i class="far fa-heart"></i></button>
            </div>
            <div class="product-card-body">
              <h3><a href="/product/${p.slug}">${p.name}</a></h3>
              ${p.comparePrice > 0 ? '<span class="price old-price">Rs. ' + Number(p.price).toLocaleString() + '</span><span class="price sale-price">Rs. ' + Number(p.comparePrice).toLocaleString() + '</span>' : '<span class="price">Rs. ' + Number(p.price).toLocaleString() + '</span>'}
              <button class="btn btn-sm btn-gold add-to-cart-btn" data-product-id="${p.id}">Add to Bag</button>
            </div>
          </div>
        `).join('');
        if (pagination && data.pages > 1) {
          pagination.innerHTML = Array.from({ length: data.pages }, (_, i) =>
            `<button class="${i + 1 === data.currentPage ? 'active' : ''}" data-page="${i + 1}">${i + 1}</button>`
          ).join('');
          pagination.querySelectorAll('button').forEach(btn => btn.addEventListener('click', () => {
            currentPage = Number(btn.dataset.page);
            loadProducts();
          }));
        } else if (pagination) pagination.innerHTML = '';
      } else {
        grid.innerHTML = `<div class="empty-collection"><i class="fas fa-gem"></i><h3>No Products Yet</h3><p>Products will be added soon. Stay tuned for our luxury collection.</p></div>`;
        if (pagination) pagination.innerHTML = '';
      }
    } catch { /* ignore */ }
  }

  if (categoryFilter) categoryFilter.querySelectorAll('input').forEach(input => input.addEventListener('change', () => { currentPage = 1; loadProducts(); }));
  if (sortSelect) sortSelect.addEventListener('change', () => { currentPage = 1; loadProducts(); });
  if (priceBtn) priceBtn.addEventListener('click', () => { currentPage = 1; loadProducts(); });
  if (clearBtn) clearBtn.addEventListener('click', () => {
    if (categoryFilter) categoryFilter.querySelector('input[value=""]').checked = true;
    if (sortSelect) sortSelect.value = '';
    if (minPrice) minPrice.value = '';
    if (maxPrice) maxPrice.value = '';
    currentPage = 1;
    loadProducts();
  });

  loadProducts();
}

function initCategoryShop() {
  const sortSelect = document.getElementById('catSortSelect');
  const grid = document.getElementById('catProductsGrid');
  const params = new URLSearchParams();
  params.set('category', categorySlug || '');

  async function loadProducts() {
    if (!grid) return;
    if (sortSelect && sortSelect.value) params.set('sort', sortSelect.value);
    try {
      const res = await fetch(`/api/products?${params.toString()}`);
      const data = await res.json();
      if (data.products && data.products.length > 0) {
        grid.innerHTML = data.products.map(p => `
          <div class="product-card">
            <div class="product-card-image">
              <a href="/product/${p.slug}">
                <img src="${p.thumbnail || '/images/newlogo.png'}" alt="${p.name}" style="width:100%;height:100%;object-fit:cover">
              </a>
              ${p.comparePrice > 0 ? '<span class="badge badge-sale">Sale</span>' : ''}
              <button class="wishlist-toggle-sm" data-product-id="${p.id}"><i class="far fa-heart"></i></button>
            </div>
            <div class="product-card-body">
              <h3><a href="/product/${p.slug}">${p.name}</a></h3>
              ${p.comparePrice > 0 ? '<span class="price old-price">Rs. ' + Number(p.price).toLocaleString() + '</span><span class="price sale-price">Rs. ' + Number(p.comparePrice).toLocaleString() + '</span>' : '<span class="price">Rs. ' + Number(p.price).toLocaleString() + '</span>'}
              <button class="btn btn-sm btn-gold add-to-cart-btn" data-product-id="${p.id}">Add to Bag</button>
            </div>
          </div>
        `).join('');
      } else {
        grid.innerHTML = `<div class="empty-collection"><i class="fas fa-gem"></i><h3>No Products Yet</h3><p>Products in this category will be available soon.</p></div>`;
      }
    } catch { /* ignore */ }
  }

  if (sortSelect) sortSelect.addEventListener('change', loadProducts);
  loadProducts();
}