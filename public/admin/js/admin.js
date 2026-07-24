// ===== ADMIN.JS =====
document.addEventListener('DOMContentLoaded', function() {
  initAdminSidebar();
  initConfirmDialogs();
  initImagePreview();
  initMediaUpload();
  initCharts();
  initBulkActions();
});

function initAdminSidebar() {
  const toggle = document.getElementById('adminSidebarToggle');
  const sidebar = document.querySelector('.admin-sidebar');
  if (toggle && sidebar) {
    toggle.addEventListener('click', function() { sidebar.classList.toggle('open'); });
  }
  // Highlight active nav
  document.querySelectorAll('.admin-sidebar-nav a').forEach(function(link) {
    if (link.href === window.location.href || window.location.href.includes(link.getAttribute('href'))) {
      link.classList.add('active');
    }
  });
}

function initConfirmDialogs() {
  document.querySelectorAll('[data-confirm]').forEach(function(el) {
    el.addEventListener('click', function(e) {
      if (!confirm(this.dataset.confirm || 'Are you sure?')) e.preventDefault();
    });
  });
}

function initImagePreview() {
  document.querySelectorAll('input[type="file"][data-preview]').forEach(function(input) {
    input.addEventListener('change', function() {
      const preview = document.getElementById(this.dataset.preview);
      if (!preview || !this.files || !this.files[0]) return;
      const reader = new FileReader();
      reader.onload = function(e) { preview.src = e.target.result; preview.style.display = 'block'; };
      reader.readAsDataURL(this.files[0]);
    });
  });
}

function initMediaUpload() {
  const dropzone = document.getElementById('mediaDropzone');
  const input = document.getElementById('mediaFileInput');
  if (!dropzone || !input) return;
  dropzone.addEventListener('click', function() { input.click(); });
  dropzone.addEventListener('dragover', function(e) { e.preventDefault(); this.style.borderColor = '#D4AF37'; });
  dropzone.addEventListener('dragleave', function() { this.style.borderColor = '#e0e0e0'; });
  dropzone.addEventListener('drop', function(e) {
    e.preventDefault(); this.style.borderColor = '#e0e0e0';
    if (e.dataTransfer.files.length) { input.files = e.dataTransfer.files; input.dispatchEvent(new Event('change')); }
  });
}

function initCharts() {
  var salesChart = document.getElementById('salesChart');
  if (salesChart && typeof Chart !== 'undefined') {
    new Chart(salesChart, {
      type: 'line',
      data: {
        labels: salesChart.dataset.labels ? JSON.parse(salesChart.dataset.labels) : [],
        datasets: [{
          label: 'Revenue',
          data: salesChart.dataset.values ? JSON.parse(salesChart.dataset.values) : [],
          borderColor: '#D4AF37',
          backgroundColor: 'rgba(212,175,55,0.1)',
          fill: true,
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true } }
      }
    });
  }
}

function initBulkActions() {
  var selectAll = document.getElementById('selectAll');
  if (selectAll) {
    selectAll.addEventListener('change', function() {
      document.querySelectorAll('.bulk-item').forEach(function(cb) { cb.checked = selectAll.checked; });
    });
  }
  var bulkActionBtn = document.getElementById('bulkActionBtn');
  var bulkActionSelect = document.getElementById('bulkAction');
  if (bulkActionBtn && bulkActionSelect) {
    bulkActionBtn.addEventListener('click', function() {
      var action = bulkActionSelect.value;
      var ids = [];
      document.querySelectorAll('.bulk-item:checked').forEach(function(cb) { ids.push(cb.value); });
      if (!ids.length) { alert('Select items first'); return; }
      if (!action) { alert('Select an action'); return; }
      if (!confirm('Apply "' + action + '" to ' + ids.length + ' items?')) return;
      var form = document.createElement('form');
      form.method = 'POST';
      form.action = window.location.pathname + '/bulk';
      form.innerHTML = '<input name="action" value="' + action + '">' +
        ids.map(function(id) { return '<input name="ids" value="' + id + '">'; }).join('');
      document.body.appendChild(form);
      form.submit();
    });
  }
}

// ===== TOAST =====
function adminToast(message, type) {
  type = type || 'success';
  var container = document.getElementById('adminToastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'adminToastContainer';
    container.style.cssText = 'position:fixed;top:20px;right:20px;z-index:99999;display:flex;flex-direction:column;gap:8px;';
    document.body.appendChild(container);
  }
  var toast = document.createElement('div');
  toast.style.cssText = 'padding:12px 20px;border-radius:6px;font-size:0.85rem;box-shadow:0 4px 12px rgba(0,0,0,0.1);animation:slideInRight 0.3s;min-width:250px;';
  toast.style.background = type === 'success' ? '#d4edda' : type === 'error' ? '#f8d7da' : '#fff3cd';
  toast.style.color = type === 'success' ? '#155724' : type === 'error' ? '#721c24' : '#856404';
  toast.style.border = '1px solid ' + (type === 'success' ? '#c3e6cb' : type === 'error' ? '#f5c6cb' : '#ffeeba');
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(function() {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    toast.style.transition = 'all 0.3s';
    setTimeout(function() { toast.remove(); }, 300);
  }, 3000);
}

// ===== DYNAMIC VARIANTS =====
var variantIndex = 0;
function addVariant() {
  var container = document.getElementById('variantsContainer');
  if (!container) return;
  var idx = variantIndex++;
  var html = '<div class="variant-row" style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr auto;gap:8px;margin-bottom:8px;align-items:end;">' +
    '<div class="form-group"><label>Name</label><input name="variants[' + idx + '][name]" placeholder="e.g. Gold" required></div>' +
    '<div class="form-group"><label>SKU</label><input name="variants[' + idx + '][sku]" placeholder="VAR-SKU"></div>' +
    '<div class="form-group"><label>Price</label><input type="number" name="variants[' + idx + '][price]" step="0.01"></div>' +
    '<div class="form-group"><label>Stock</label><input type="number" name="variants[' + idx + '][stock]" value="0"></div>' +
    '<button type="button" onclick="this.parentElement.remove()" style="padding:10px;background:#dc3545;color:#fff;border:none;border-radius:6px;cursor:pointer;"><i class="fas fa-times"></i></button>' +
    '</div>';
  container.insertAdjacentHTML('beforeend', html);
}

// ===== SPECIFICATION ROWS =====
var specIndex = 0;
function addSpec() {
  var container = document.getElementById('specsContainer');
  if (!container) return;
  var idx = specIndex++;
  var html = '<div style="display:grid;grid-template-columns:1fr 2fr auto;gap:8px;margin-bottom:8px;align-items:end;">' +
    '<div class="form-group"><label>Label</label><input name="specifications[' + idx + '][label]" placeholder="e.g. Material"></div>' +
    '<div class="form-group"><label>Value</label><input name="specifications[' + idx + '][value]" placeholder="e.g. 18K Gold"></div>' +
    '<button type="button" onclick="this.parentElement.remove()" style="padding:10px;background:#dc3545;color:#fff;border:none;border-radius:6px;cursor:pointer;"><i class="fas fa-times"></i></button>' +
    '</div>';
  container.insertAdjacentHTML('beforeend', html);
}