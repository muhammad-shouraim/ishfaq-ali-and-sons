const User = require('../models/User');
const Order = require('../models/Order');
const Wishlist = require('../models/Wishlist');
const Review = require('../models/Review');
const ActivityLog = require('../models/ActivityLog');

exports.listCustomers = async (req, res) => {
  try {
    const { search, isActive, page = 1, limit = 20 } = req.query;
    const query = { role: 'user' };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }
    if (isActive !== undefined && isActive !== '') {
      query.isActive = isActive === 'true' || isActive === '1';
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [customers, total] = await Promise.all([
      User.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      User.countDocuments(query)
    ]);

    res.render('admin/pages/customers', {
      title: 'Customers',
      customers,
      total,
      pages: Math.ceil(total / Number(limit)),
      currentPage: Number(page),
      query: req.query
    });
  } catch (err) {
    res.redirect('/admin?message=' + encodeURIComponent(err.message) + '&messageType=danger');
  }
};

exports.getCustomerDetail = async (req, res) => {
  try {
    const customer = await User.findById(req.params.id);
    if (!customer) return res.redirect('/admin?message=&messageType=danger');

    const [orders, wishlist, reviews, activityLogs] = await Promise.all([
      Order.find({ user: customer._id }).sort({ createdAt: -1 }),
      Wishlist.findOne({ user: customer._id }).populate('items', 'name images price slug'),
      Review.find({ user: customer._id }).populate('product', 'name images slug').sort({ createdAt: -1 }),
      ActivityLog.find({ user: customer._id }).sort({ createdAt: -1 }).limit(50)
    ]);

    const totalSpent = orders
      .filter(o => o.orderStatus !== 'cancelled')
      .reduce((sum, o) => sum + o.total, 0);

    res.render('admin/pages/customer-detail', {
      title: customer.name,
      customer,
      orders,
      wishlist: wishlist?.items || [],
      reviews,
      activityLogs,
      totalSpent,
      totalOrders: orders.length
    });
  } catch (err) {
    res.redirect('/admin?message=' + encodeURIComponent(err.message) + '&messageType=danger');
  }
};

exports.toggleBlockCustomer = async (req, res) => {
  try {
    const customer = await User.findById(req.params.id);
    if (!customer) return res.status(404).json({ message: 'Customer not found' });
    if (customer.role === 'admin') return res.status(403).json({ message: 'Cannot block admin users' });

    customer.isActive = !customer.isActive;
    await customer.save();

    await ActivityLog.create({
      user: req.user._id,
      action: customer.isActive ? 'unblock_customer' : 'block_customer',
      resource: 'User',
      resourceId: customer._id,
      details: { name: customer.name, email: customer.email },
      ip: req.ip
    });

    res.json({ success: true, isActive: customer.isActive });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteCustomer = async (req, res) => {
  try {
    const customer = await User.findById(req.params.id);
    if (!customer) return res.status(404).json({ message: 'Customer not found' });
    if (customer.role === 'admin') return res.status(403).json({ message: 'Cannot delete admin users' });

    const orderCount = await Order.countDocuments({ user: customer._id });
    if (orderCount > 0) {
      return res.status(400).json({ message: `Cannot delete customer with ${orderCount} existing orders. Please anonymize instead.` });
    }

    await Promise.all([
      User.findByIdAndDelete(customer._id),
      Wishlist.deleteMany({ user: customer._id }),
      Review.deleteMany({ user: customer._id }),
      ActivityLog.deleteMany({ user: customer._id })
    ]);

    await ActivityLog.create({
      user: req.user._id,
      action: 'delete_customer',
      resource: 'User',
      resourceId: customer._id,
      details: { name: customer.name, email: customer.email },
      ip: req.ip
    });

    res.json({ success: true, message: 'Customer deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


