const express = require('express');
const router = express.Router();
const path = require('path');
const multer = require('multer');
const { requireAdmin, requireSuperAdmin, requireAdminRole } = require('../middleware/adminAuth');

const storage = multer.diskStorage({
  destination: function (req, file, cb) { cb(null, path.join(__dirname, '../public/uploads')); },
  filename: function (req, file, cb) { cb(null, Date.now() + '-' + Math.random().toString(36).substring(2, 8) + path.extname(file.originalname)); }
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 }, fileFilter: (req, file, cb) => { const allowed = /jpeg|jpg|png|gif|webp|svg|pdf/; cb(null, allowed.test(path.extname(file.originalname).toLowerCase())); } });

const adminCtrl = require('../controllers/adminController');
const productCtrl = require('../controllers/adminProductController');
const categoryCtrl = require('../controllers/adminCategoryController');
const orderCtrl = require('../controllers/adminOrderController');
const customerCtrl = require('../controllers/adminCustomerController');
const couponCtrl = require('../controllers/adminCouponController');
const reviewCtrl = require('../controllers/adminReviewController');
const pageCtrl = require('../controllers/adminPageController');
const mediaCtrl = require('../controllers/adminMediaController');
const settingCtrl = require('../controllers/adminSettingController');

router.use(requireAdmin);

// Dashboard
router.get('/admin', adminCtrl.getDashboard);
router.get('/admin/reports/:type', adminCtrl.getReports);
router.get('/admin/reports/export/:type/:format', adminCtrl.exportReport);

// Products
router.get('/admin/products', productCtrl.listProducts);
router.get('/admin/products/create', productCtrl.getCreateProduct);
router.post('/admin/products/create', upload.fields([{ name: 'images', maxCount: 20 }, { name: 'thumbnail', maxCount: 1 }]), productCtrl.createProduct);
router.get('/admin/products/edit/:id', productCtrl.getEditProduct);
router.post('/admin/products/edit/:id', upload.fields([{ name: 'images', maxCount: 20 }, { name: 'thumbnail', maxCount: 1 }]), productCtrl.updateProduct);
router.post('/admin/products/delete/:id', productCtrl.deleteProduct);
router.post('/admin/products/bulk', productCtrl.bulkAction);
router.post('/admin/products/:id/variants', productCtrl.manageVariants);
router.post('/admin/products/:id/duplicate', productCtrl.duplicateProduct);
router.post('/admin/products/:id/toggle-status', productCtrl.toggleStatus);
router.get('/api/admin/products', productCtrl.apiListProducts);

// Categories
router.get('/admin/categories', categoryCtrl.listCategories);
router.get('/admin/categories/create', categoryCtrl.getCreateCategory);
router.post('/admin/categories/create', upload.fields([{ name: 'image', maxCount: 1 }, { name: 'banner', maxCount: 1 }]), categoryCtrl.createCategory);
router.get('/admin/categories/edit/:id', categoryCtrl.getEditCategory);
router.post('/admin/categories/edit/:id', upload.fields([{ name: 'image', maxCount: 1 }, { name: 'banner', maxCount: 1 }]), categoryCtrl.updateCategory);
router.post('/admin/categories/delete/:id', categoryCtrl.deleteCategory);

// Orders
router.get('/admin/orders', orderCtrl.listOrders);
router.get('/admin/orders/:id', orderCtrl.getOrderDetail);
router.post('/admin/orders/:id/status', orderCtrl.updateOrderStatus);
router.post('/admin/orders/:id/tracking', orderCtrl.setTracking);
router.get('/admin/orders/:id/invoice', orderCtrl.getInvoice);
router.get('/admin/orders/:id/invoice/pdf', orderCtrl.downloadInvoicePdf);

// Customers
router.get('/admin/customers', customerCtrl.listCustomers);
router.get('/admin/customers/:id', customerCtrl.getCustomerDetail);
router.post('/admin/customers/:id/block', customerCtrl.toggleBlockCustomer);
router.post('/admin/customers/:id/delete', requireSuperAdmin, customerCtrl.deleteCustomer);

// Coupons
router.get('/admin/coupons', couponCtrl.list);
router.get('/admin/coupons/create', couponCtrl.createForm);
router.post('/admin/coupons/create', couponCtrl.create);
router.get('/admin/coupons/edit/:id', couponCtrl.editForm);
router.post('/admin/coupons/edit/:id', couponCtrl.update);
router.post('/admin/coupons/delete/:id', couponCtrl.delete);

// Reviews
router.get('/admin/reviews', reviewCtrl.list);
router.post('/admin/reviews/:id/approve', reviewCtrl.approve);
router.post('/admin/reviews/:id/reject', reviewCtrl.reject);
router.post('/admin/reviews/:id/reply', reviewCtrl.reply);
router.post('/admin/reviews/:id/delete', reviewCtrl.delete);
router.get('/admin/reviews/report', reviewCtrl.report);

// Pages
router.get('/admin/pages', pageCtrl.list);
router.get('/admin/pages/create', pageCtrl.createForm);
router.post('/admin/pages/create', upload.single('featuredImage'), pageCtrl.create);
router.get('/admin/pages/edit/:id', pageCtrl.editForm);
router.post('/admin/pages/edit/:id', upload.single('featuredImage'), pageCtrl.update);
router.post('/admin/pages/delete/:id', pageCtrl.delete);

// Media
router.get('/admin/media', mediaCtrl.list);
router.post('/admin/media/upload', upload.array('files', 20), mediaCtrl.upload);
router.post('/admin/media/folder', mediaCtrl.createFolder);
router.post('/admin/media/delete/:id', mediaCtrl.delete);
router.get('/api/admin/media', mediaCtrl.apiList);

// Settings
router.get('/admin/settings', settingCtrl.index);
router.post('/admin/settings', settingCtrl.save);
router.get('/admin/settings/payment', settingCtrl.payment);
router.post('/admin/settings/payment', settingCtrl.savePayment);

module.exports = router;