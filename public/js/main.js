// ===== MAIN.JS - Core functionality =====

document.addEventListener('DOMContentLoaded', () => {
  initNavToggle();
  initUserDropdown();
  initSearchToggle();
  initCartToggle();
  initToast();
});

// Nav Toggle (Mobile)
function initNavToggle() {
  const toggle = document.getElementById('navToggle');
  const links = document.getElementById('navLinks');
  if (!toggle || !links) return;
  toggle.addEventListener('click', () => {
    toggle.classList.toggle('active');
    links.classList.toggle('active');
  });
  document.querySelectorAll('#navLinks a').forEach(link => {
    link.addEventListener('click', () => {
      toggle.classList.remove('active');
      links.classList.remove('active');
    });
  });
}

// User Dropdown
function initUserDropdown() {
  const toggle = document.getElementById('userToggle');
  const menu = document.getElementById('dropdownMenu');
  if (!toggle || !menu) return;
  toggle.addEventListener('click', (e) => {
    e.stopPropagation();
    toggle.parentElement.classList.toggle('active');
  });
  document.addEventListener('click', (e) => {
    if (!toggle.parentElement.contains(e.target)) {
      toggle.parentElement.classList.remove('active');
    }
  });
}

// Search Toggle
function initSearchToggle() {
  const openBtn = document.getElementById('searchToggle');
  const overlay = document.getElementById('searchOverlay');
  const closeBtn = document.getElementById('searchClose');
  const input = document.getElementById('searchInput');
  if (!overlay) return;
  if (openBtn) openBtn.addEventListener('click', () => { overlay.classList.add('active'); if (input) setTimeout(() => input.focus(), 100); });
  if (closeBtn) closeBtn.addEventListener('click', () => overlay.classList.remove('active'));
  overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.classList.remove('active'); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') overlay.classList.remove('active'); });
}

// Cart Toggle
function initCartToggle() {
  const openBtn = document.getElementById('cartToggle');
  const overlay = document.getElementById('cartOverlay');
  const sidebar = document.getElementById('cartSidebar');
  const closeBtn = document.getElementById('cartClose');
  if (!sidebar) return;
  if (openBtn) openBtn.addEventListener('click', () => { overlay.classList.add('active'); sidebar.classList.add('active'); });
  if (closeBtn) closeBtn.addEventListener('click', () => { overlay.classList.remove('active'); sidebar.classList.remove('active'); });
  if (overlay) overlay.addEventListener('click', () => { overlay.classList.remove('active'); sidebar.classList.remove('active'); });
}

// Toast notifications
function initToast() {
  window.showToast = (message, type = 'success') => {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const icons = { success: 'fa-check-circle', error: 'fa-exclamation-circle' };
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<i class="fas ${icons[type] || icons.success}"></i> ${message}`;
    container.appendChild(toast);
    setTimeout(() => { toast.style.opacity = '0'; toast.style.transform = 'translateX(100%)'; toast.style.transition = 'all 0.3s ease'; setTimeout(() => toast.remove(), 300); }, 3000);
  };
}

// ===== QUANTITY SELECTOR =====
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('qty-btn') || e.target.closest('.qty-btn')) {
    const btn = e.target.classList.contains('qty-btn') ? e.target : e.target.closest('.qty-btn');
    const container = btn.closest('.quantity-selector');
    const input = container.querySelector('input');
    if (!input) return;
    let val = parseInt(input.value) || 1;
    if (btn.id === 'qtyMinus' || btn.textContent === '-') {
      if (val > 1) input.value = val - 1;
    } else {
      input.value = val + 1;
    }
  }
});

// ===== SIDEBAR TOGGLE =====
document.addEventListener('click', (e) => {
  if (e.target.closest('#sidebarToggle')) {
    const content = document.getElementById('sidebarContent');
    if (content) content.classList.toggle('active');
  }
});