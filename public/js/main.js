// ===== MAIN.JS - Core functionality =====

document.addEventListener('DOMContentLoaded', () => {
  initNavToggle();
  initNavDropdowns();
  initUserDropdown();
  initCartToggle();
  initToast();
});

// Nav Toggle (Mobile)
function initNavToggle() {
  const links = document.getElementById('headerNav');
  if (!links) return;
  let toggle = document.getElementById('mobileToggle');
  if (!toggle && window.innerWidth <= 1280) {
    toggle = document.createElement('div');
    toggle.className = 'mobile-toggle';
    toggle.id = 'mobileToggle';
    toggle.setAttribute('aria-label', 'Menu');
    for (let i = 0; i < 3; i++) { toggle.appendChild(document.createElement('span')); }
    const container = document.querySelector('.header .container');
    if (container) container.insertBefore(toggle, container.firstChild);
  }
  const closeBtn = document.getElementById('navMobileClose');
  if (!toggle) return;
  let overlay = document.querySelector('.nav-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.className = 'nav-overlay';
    document.body.appendChild(overlay);
  }
  overlay.addEventListener('click', closeNav);

  function openNav() {
    toggle.classList.add('active');
    links.classList.add('active');
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeNav() {
    toggle.classList.remove('active');
    links.classList.remove('active');
    overlay.classList.remove('active');
    document.body.style.overflow = '';
  }

  toggle.addEventListener('click', () => {
    if (links.classList.contains('active')) closeNav();
    else openNav();
  });

  if (closeBtn) closeBtn.addEventListener('click', closeNav);

  document.querySelectorAll('#headerNav a').forEach(link => {
    link.addEventListener('click', () => {
      if ((link.classList.contains('nav-dropdown-toggle') || link.classList.contains('nav-sub-toggle')) && window.innerWidth <= 1024) {
        return;
      }
      closeNav();
    });
  });
}

// Mobile Dropdown Toggle
function initNavDropdowns() {
  const toggles = document.querySelectorAll('.nav-dropdown-toggle');
  toggles.forEach(toggle => {
    toggle.addEventListener('click', (e) => {
      if (window.innerWidth <= 1024) {
        e.preventDefault();
        toggle.parentElement.classList.toggle('active');
      }
    });
  });
  // Mobile sub-menu toggle
  const subToggles = document.querySelectorAll('.nav-sub-toggle');
  subToggles.forEach(toggle => {
    toggle.addEventListener('click', (e) => {
      if (window.innerWidth <= 1024) {
        e.preventDefault();
        toggle.parentElement.classList.toggle('active');
      }
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

// ===== FLASH SALE COUNTDOWN =====
document.addEventListener('DOMContentLoaded', () => {
  const el = document.querySelector('.flash-countdown');
  if (!el) return;
  const end = new Date(el.dataset.end).getTime();
  function tick() {
    const now = new Date().getTime();
    const diff = end - now;
    if (diff <= 0) { el.innerHTML = '<span style="color:var(--gold);font-size:1.1rem">Sale Ended</span>'; return; }
    document.getElementById('flashDays').textContent = String(Math.floor(diff / (1000 * 60 * 60 * 24))).padStart(2, '0');
    document.getElementById('flashHours').textContent = String(Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))).padStart(2, '0');
    document.getElementById('flashMins').textContent = String(Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))).padStart(2, '0');
    document.getElementById('flashSecs').textContent = String(Math.floor((diff % (1000 * 60)) / 1000)).padStart(2, '0');
  }
  tick(); setInterval(tick, 1000);
});

// ===== SIDEBAR TOGGLE =====
document.addEventListener('click', (e) => {
  if (e.target.closest('#sidebarToggle')) {
    const content = document.getElementById('sidebarContent');
    if (content) content.classList.toggle('active');
  }
});