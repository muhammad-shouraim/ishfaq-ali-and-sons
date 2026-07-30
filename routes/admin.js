const express = require('express');
const router = express.Router();
const path = require('path');
const ADMIN_PATH = require('../config/adminPath');
const { protectAdmin, requireAdmin, requireSuperAdmin, requireAdminRole } = require('../middleware/adminAuth');
const upload = require('../middleware/upload');

const adminCtrl = require('../controllers/adminController');
const productCtrl = require('../controllers/adminProductController');
const categoryCtrl = require('../controllers/adminCategoryController');
const orderCtrl = require('../controllers/adminOrderController');
const { generateInvoice } = require('../controllers/invoiceController');
const customerCtrl = require('../controllers/adminCustomerController');
const couponCtrl = require('../controllers/adminCouponController');
const reviewCtrl = require('../controllers/adminReviewController');
const pageCtrl = require('../controllers/adminPageController');
const mediaCtrl = require('../controllers/adminMediaController');
const settingCtrl = require('../controllers/adminSettingController');
const promoCtrl = require('../controllers/adminPromotionController');

router.use(protectAdmin);
router.use(ADMIN_PATH, requireAdmin);

// ===== DASHBOARD =====
router.get(ADMIN_PATH, adminCtrl.getDashboard);
router.get(ADMIN_PATH + '/reports/:type', adminCtrl.getReports);
router.get(ADMIN_PATH + '/reports/export/:type/:format', adminCtrl.exportReport);

// Dashboard AJAX widgets
router.get(ADMIN_PATH + '/api/top-selling', adminCtrl.getTopSelling);
router.get(ADMIN_PATH + '/api/revenue-data', adminCtrl.getRevenueData);
router.get(ADMIN_PATH + '/api/activity-log', adminCtrl.getActivityLog);
router.get(ADMIN_PATH + '/api/low-stock', adminCtrl.getLowStock);

// ===== PRODUCTS =====
router.get(ADMIN_PATH + '/products', productCtrl.listProducts);
router.get(ADMIN_PATH + '/products/create', productCtrl.getCreateProduct);
router.post(ADMIN_PATH + '/products/create', upload.fields([{ name: 'images', maxCount: 20 }, { name: 'thumbnail', maxCount: 1 }]), upload.fixPaths, productCtrl.createProduct);
router.get(ADMIN_PATH + '/products/edit/:id', productCtrl.getEditProduct);
router.post(ADMIN_PATH + '/products/edit/:id', upload.fields([{ name: 'images', maxCount: 20 }, { name: 'thumbnail', maxCount: 1 }]), upload.fixPaths, productCtrl.updateProduct);
router.post(ADMIN_PATH + '/products/delete/:id', productCtrl.deleteProduct);
router.post(ADMIN_PATH + '/products/bulk', productCtrl.bulkAction);
router.post(ADMIN_PATH + '/products/:id/variants', productCtrl.manageVariants);
router.post(ADMIN_PATH + '/products/:id/remove-image', productCtrl.removeImage);
router.post(ADMIN_PATH + '/products/:id/duplicate', productCtrl.duplicateProduct);
router.post(ADMIN_PATH + '/products/:id/toggle-status', productCtrl.toggleStatus);
router.get(ADMIN_PATH + '/products/scan-broken', productCtrl.scanBrokenImages);
router.post(ADMIN_PATH + '/products/fix-broken/:id', productCtrl.fixBrokenImages);
router.get('/api/admin/products', productCtrl.apiListProducts);

// ===== CATEGORIES =====
router.get(ADMIN_PATH + '/categories', categoryCtrl.listCategories);
router.get(ADMIN_PATH + '/categories/create', categoryCtrl.getCreateCategory);
router.post(ADMIN_PATH + '/categories/create', upload.fields([{ name: 'image', maxCount: 1 }, { name: 'banner', maxCount: 1 }]), upload.fixPaths, categoryCtrl.createCategory);
router.get(ADMIN_PATH + '/categories/edit/:id', categoryCtrl.getEditCategory);
router.post(ADMIN_PATH + '/categories/edit/:id', upload.fields([{ name: 'image', maxCount: 1 }, { name: 'banner', maxCount: 1 }]), upload.fixPaths, categoryCtrl.updateCategory);
router.post(ADMIN_PATH + '/categories/delete/:id', categoryCtrl.deleteCategory);

// ===== ORDERS =====
router.get(ADMIN_PATH + '/orders', orderCtrl.listOrders);
router.get(ADMIN_PATH + '/orders/:id', orderCtrl.getOrderDetail);
router.post(ADMIN_PATH + '/orders/:id/status', orderCtrl.updateOrderStatus);
router.post(ADMIN_PATH + '/orders/:id/tracking', orderCtrl.setTracking);
router.get(ADMIN_PATH + '/orders/:id/invoice', orderCtrl.getInvoice);
router.get(ADMIN_PATH + '/orders/:id/invoice/pdf', generateInvoice);
router.post(ADMIN_PATH + '/orders/:id/notes', orderCtrl.saveInternalNotes);
router.post(ADMIN_PATH + '/orders/bulk-status', orderCtrl.bulkStatusUpdate);
router.get(ADMIN_PATH + '/orders/:id/packing-slip', orderCtrl.packingSlip);

// ===== CUSTOMERS =====
router.get(ADMIN_PATH + '/customers', customerCtrl.listCustomers);
router.get(ADMIN_PATH + '/customers/:id', customerCtrl.getCustomerDetail);
router.post(ADMIN_PATH + '/customers/:id/block', customerCtrl.toggleBlockCustomer);
router.post(ADMIN_PATH + '/customers/:id/delete', requireSuperAdmin, customerCtrl.deleteCustomer);
router.post(ADMIN_PATH + '/customers/:id/notes', customerCtrl.saveNotes);
router.post(ADMIN_PATH + '/customers/:id/tags', customerCtrl.saveTags);

// ===== COUPONS =====
router.get(ADMIN_PATH + '/coupons', couponCtrl.list);
router.get(ADMIN_PATH + '/coupons/create', couponCtrl.createForm);
router.post(ADMIN_PATH + '/coupons/create', couponCtrl.create);
router.get(ADMIN_PATH + '/coupons/edit/:id', couponCtrl.editForm);
router.post(ADMIN_PATH + '/coupons/edit/:id', couponCtrl.update);
router.post(ADMIN_PATH + '/coupons/delete/:id', couponCtrl.delete);

// ===== REVIEWS =====
router.get(ADMIN_PATH + '/reviews', reviewCtrl.list);
router.post(ADMIN_PATH + '/reviews/:id/approve', reviewCtrl.approve);
router.post(ADMIN_PATH + '/reviews/:id/reply', reviewCtrl.reply);
router.post(ADMIN_PATH + '/reviews/:id/delete', reviewCtrl.delete);

// ===== PAGES =====
router.get(ADMIN_PATH + '/pages', pageCtrl.list);
router.get(ADMIN_PATH + '/pages/create', pageCtrl.createForm);
router.post(ADMIN_PATH + '/pages/create', upload.single('featuredImage'), pageCtrl.create);
router.get(ADMIN_PATH + '/pages/edit/:id', pageCtrl.editForm);
router.post(ADMIN_PATH + '/pages/edit/:id', upload.single('featuredImage'), pageCtrl.update);
router.post(ADMIN_PATH + '/pages/delete/:id', pageCtrl.delete);

// ===== MEDIA =====
router.get(ADMIN_PATH + '/media', mediaCtrl.list);
router.post(ADMIN_PATH + '/media/upload', upload.array('files', 20), mediaCtrl.upload);
router.post(ADMIN_PATH + '/media/folder', mediaCtrl.createFolder);
router.post(ADMIN_PATH + '/media/delete/:id', mediaCtrl.delete);
router.get('/api/admin/media', mediaCtrl.apiList);

// ===== MAINTENANCE MODE =====
router.post(ADMIN_PATH + '/maintenance-toggle', async (req, res) => {
  const Setting = require('../models/Setting');
  const setting = await Setting.findOne({ where: { key: 'maintenance_mode' } });
  const newVal = setting && setting.value === 'true' ? 'false' : 'true';
  await Setting.upsert({ key: 'maintenance_mode', value: newVal });
  res.json({ success: true, maintenanceMode: newVal === 'true' });
});

// ===== SETTINGS =====
router.get(ADMIN_PATH + '/settings', settingCtrl.list);
router.post(ADMIN_PATH + '/settings', settingCtrl.update);
router.get(ADMIN_PATH + '/settings/payment', settingCtrl.getPaymentSettings);
router.post(ADMIN_PATH + '/settings/payment', settingCtrl.updatePayment);

// ===== PROMOTIONS =====
router.get(ADMIN_PATH + '/promotions', promoCtrl.list);
router.get(ADMIN_PATH + '/promotions/create', promoCtrl.createForm);
router.post(ADMIN_PATH + '/promotions/create', promoCtrl.create);
router.get(ADMIN_PATH + '/promotions/edit/:id', promoCtrl.editForm);
router.post(ADMIN_PATH + '/promotions/edit/:id', promoCtrl.update);
router.post(ADMIN_PATH + '/promotions/toggle/:id', promoCtrl.toggle);
router.post(ADMIN_PATH + '/promotions/delete/:id', promoCtrl.delete);

// ===== ABANDONED CARTS =====
router.use(ADMIN_PATH + '/abandoned-carts', require('./abandonedCarts'));

module.exports = router;
