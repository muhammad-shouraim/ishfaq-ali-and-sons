// ===== SEARCH.JS =====

document.addEventListener('DOMContentLoaded', () => {
  initSearchSuggestions();
  initSearchPage();
});

let searchTimeout;

function initSearchSuggestions() {
  const input = document.getElementById('searchInput');
  const suggestions = document.getElementById('searchSuggestions');
  if (!input || !suggestions) return;

  input.addEventListener('input', () => {
    clearTimeout(searchTimeout);
    const q = input.value.trim();
    if (q.length < 2) { suggestions.innerHTML = ''; suggestions.style.display = 'none'; return; }
    searchTimeout = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
        const data = await res.json();
        if (data.products && data.products.length > 0) {
          suggestions.innerHTML = data.products.map(p => `
            <a href="/product/${p.slug}" class="suggestion-item" style="display:flex;align-items:center;gap:12px;padding:12px 0;border-bottom:1px solid rgba(255,255,255,0.1);color:rgba(255,255,255,0.8);transition:all 0.3s;">
              <div style="width:50px;height:50px;background:rgba(255,255,255,0.05);display:flex;align-items:center;justify-content:center;font-size:1.5rem;flex-shrink:0;"><i class="fas fa-gem"></i></div>
              <div>
                <div style="font-weight:500">${p.name}</div>
                <div style="font-size:0.85rem;color:var(--gold);font-family:var(--font-heading)">Rs. ${Number(p.price).toLocaleString()}</div>
              </div>
            </a>
          `).join('');
          suggestions.style.display = 'block';
        } else {
          suggestions.innerHTML = `<div style="padding:16px 0;color:rgba(255,255,255,0.4);text-align:center">No products found for "${q}"</div>`;
          suggestions.style.display = 'block';
        }
      } catch { suggestions.innerHTML = ''; suggestions.style.display = 'none'; }
    }, 400);
  });
}

async function initSearchPage() {
  const urlParams = new URLSearchParams(window.location.search);
  const q = urlParams.get('q');
  const container = document.getElementById('searchResults');
  if (!container || !q) return;

  try {
    const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
    const data = await res.json();
    if (data.products && data.products.length > 0) {
      container.innerHTML = `<div class="products-grid">${data.products.map(p => `
        <div class="product-card">
          <div class="product-card-image">
            <div class="product-image-placeholder-sm"><i class="fas fa-gem"></i></div>
          </div>
          <div class="product-card-body">
            <h3><a href="/product/${p.slug}">${p.name}</a></h3>
            <span class="price">Rs. ${Number(p.price).toLocaleString()}</span>
            <button class="btn btn-sm btn-gold add-to-cart-btn" data-product-id="${p.id}">Add to Bag</button>
          </div>
        </div>
      `).join('')}</div>`;
    } else {
      container.innerHTML = `<div class="empty-collection"><i class="fas fa-search"></i><h3>No Results</h3><p>No products match "${q}". Try different keywords.</p></div>`;
    }
  } catch {
    container.innerHTML = `<div class="empty-collection"><i class="fas fa-exclamation-circle"></i><h3>Error</h3><p>Something went wrong. Please try again.</p></div>`;
  }
}