// ===== AUTH.JS =====

document.addEventListener('DOMContentLoaded', () => {
  const forgotForm = document.getElementById('forgotForm');
  if (forgotForm) forgotForm.addEventListener('submit', handleForgotPassword);

  const profileForm = document.getElementById('profileForm');
  if (profileForm) profileForm.addEventListener('submit', handleUpdateProfile);

  const contactForm = document.getElementById('contactForm');
  if (contactForm) contactForm.addEventListener('submit', handleContact);

  const checkoutForm = document.getElementById('checkoutForm');
  if (checkoutForm) checkoutForm.addEventListener('submit', handleCheckout);

  const newsletterForm = document.getElementById('newsletterForm');
  if (newsletterForm) newsletterForm.addEventListener('submit', handleNewsletter);
});

async function handleForgotPassword(e) {
  e.preventDefault();
  const form = e.target;
  const btn = form.querySelector('button[type="submit"]');
  btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
  try {
    const res = await fetch('/forgot-password', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: form.email.value })
    });
    const data = await res.json();
    window.showToast(data.message || 'Check your email', 'success');
    btn.disabled = false; btn.textContent = 'Send Reset Link';
  } catch {
    window.showToast('Connection error', 'error');
    btn.disabled = false; btn.textContent = 'Send Reset Link';
  }
}

async function handleUpdateProfile(e) {
  e.preventDefault();
  const form = e.target;
  const btn = form.querySelector('button[type="submit"]');
  btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
  try {
    const res = await fetch('/profile', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: form.name.value, phone: form.phone.value })
    });
    const data = await res.json();
    if (data.success) {
      window.showToast('Profile updated', 'success');
    } else {
      window.showToast(data.message || 'Update failed', 'error');
    }
  } catch { window.showToast('Connection error', 'error'); }
  btn.disabled = false; btn.textContent = 'Update Profile';
}

async function handleContact(e) {
  e.preventDefault();
  const form = e.target;
  const btn = form.querySelector('button[type="submit"]');
  btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
  try {
    const res = await fetch('/api/contact', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: form.name.value, phone: form.phone.value, message: form.message.value })
    });
    const data = await res.json();
    if (data.success) {
      window.showToast('Message sent! We will contact you soon.', 'success');
      form.reset();
    } else {
      window.showToast(data.message || 'Failed to send', 'error');
    }
  } catch { window.showToast('Connection error', 'error'); }
  btn.disabled = false; btn.textContent = 'Send Message';
}

async function handleCheckout(e) {
  e.preventDefault();
  const form = e.target;
  const btn = document.getElementById('placeOrderBtn');
  if (!btn) return;
  btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Placing Order...';
  try {
    const res = await fetch('/api/checkout', {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({
        name: form.name.value, phone: form.phone.value, address: form.address.value,
        city: form.city.value, postalCode: form.postalCode.value,
        paymentMethod: form.paymentMethod.value, notes: form.notes.value
      })
    });
    const data = await res.json();
    if (data.success) {
      window.showToast('Order placed successfully!', 'success');
      setTimeout(() => { window.location.href = `/order/success/${data.orderId}`; }, 500);
    } else {
      window.showToast(data.message || 'Order failed', 'error');
      btn.disabled = false; btn.textContent = 'Place Order';
    }
  } catch {
    window.showToast('Connection error', 'error');
    btn.disabled = false; btn.textContent = 'Place Order';
  }
}

async function handleNewsletter(e) {
  e.preventDefault();
  const input = e.target.querySelector('input');
  const email = input ? input.value : '';
  if (!email) return;
  try {
    const res = await fetch('/api/newsletter/subscribe', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    const data = await res.json();
    window.showToast(data.message || 'Subscribed!', data.success ? 'success' : 'error');
    if (data.success && input) input.value = '';
  } catch {
    window.showToast('Connection error', 'error');
  }
}