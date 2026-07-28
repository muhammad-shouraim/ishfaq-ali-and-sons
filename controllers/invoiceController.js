const PDFDocument = require('pdfkit');
const Order = require('../models/Order');
const Product = require('../models/Product');
const constants = require('../config/constants');

exports.generateInvoice = async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    const items = typeof order.items === 'string' ? JSON.parse(order.items) : (order.items || []);
    const doc = new PDFDocument({ size: 'A4', margin: 40 });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=invoice-${order.orderNumber || order.id}.pdf`);
    doc.pipe(res);

    const gold = '#C8A96E';
    const black = '#1C1C1C';
    const gray = '#777777';

    doc.fontSize(22).font('Helvetica-Bold').fillColor(gold).text('ISHFAQ ALI & SONS', { align: 'center' });
    doc.fontSize(8).font('Helvetica').fillColor(gray).text('Luxury Jewelry', { align: 'center' });
    doc.moveDown(0.5);

    doc.fontSize(7.5).font('Helvetica').fillColor(black);
    doc.text('Piple Wehra, Near Aik Minar Wali Masjid, Shah Alam Mohalla', { align: 'center' });
    doc.text('Takia Sadhu Market, Lahore, 54009, Pakistan', { align: 'center' });
    doc.text('Phone: +92 332 9940666 | Email: ishfaqaliandsons123@gmail.com', { align: 'center' });
    doc.moveDown(0.3);

    doc.moveTo(40, doc.y).lineTo(550, doc.y).strokeColor('#E5DDD0').stroke();
    doc.moveDown(0.5);

    doc.fontSize(16).font('Helvetica-Bold').fillColor(black).text(`INVOICE #${order.orderNumber || order.id}`, { align: 'left' });
    doc.fontSize(8).font('Helvetica').fillColor(gray).text(`Date: ${new Date(order.createdAt).toLocaleDateString('en-GB')}`, { align: 'left' });
    doc.text(`Payment Method: ${order.paymentMethod || 'N/A'}`);
    doc.text(`Status: ${order.orderStatus || 'Pending'}`);
    doc.moveDown(0.5);

    doc.fontSize(9).font('Helvetica-Bold').fillColor(black).text('Bill To:');
    doc.fontSize(8.5).font('Helvetica').fillColor(black);
    doc.text(`Name: ${order.customerName || order.shippingName || 'N/A'}`);
    doc.text(`Phone: ${order.customerPhone || order.shippingPhone || 'N/A'}`);
    doc.text(`Address: ${[order.shippingAddress, order.shippingCity].filter(Boolean).join(', ') || order.shippingAddress || 'N/A'}`);
    doc.moveDown(0.8);

    const tableTop = doc.y;
    const col1 = 40, col2 = 200, col3 = 340, col4 = 440, col5 = 510;
    const rowH = 18;

    doc.rect(40, tableTop - 4, 510, rowH).fill(gold);
    doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(8);
    doc.text('ITEM', col1 + 6, tableTop + 2);
    doc.text('SKU', col2 + 6, tableTop + 2);
    doc.text('PRICE', col3 + 6, tableTop + 2);
    doc.text('QTY', col4 + 6, tableTop + 2);
    doc.text('TOTAL', col5 + 6, tableTop + 2);

    let y = tableTop + rowH + 2;
    doc.fillColor(black).font('Helvetica').fontSize(8);

    let subtotal = 0;
    for (const item of items) {
      const name = item.name || (item.product ? item.product.name : 'Product');
      const sku = item.sku || (item.product ? item.product.sku : '-');
      const price = Number(item.price || (item.product ? item.product.price : 0));
      const qty = item.quantity || 1;
      const total = price * qty;
      subtotal += total;

      if (y > 720) { doc.addPage(); y = 40; }

      doc.text(name.length > 22 ? name.substring(0, 20) + '..' : name, col1 + 6, y);
      doc.text(sku, col2 + 6, y);
      doc.text(`Rs. ${price.toLocaleString()}`, col3 + 6, y);
      doc.text(String(qty), col4 + 6, y);
      doc.text(`Rs. ${total.toLocaleString()}`, col5 + 6, y);
      y += rowH;
    }

    y += 10;
    const discount = Number(order.discount || 0);
    const shipping = subtotal >= 5000 ? 0 : 200;
    const grandTotal = subtotal - discount + shipping;

    doc.moveTo(350, y - 4).lineTo(550, y - 4).strokeColor('#E5DDD0').stroke();

    doc.fontSize(9).font('Helvetica');
    doc.text('Subtotal:', 350, y); doc.text(`Rs. ${subtotal.toLocaleString()}`, 430, y, { align: 'right', width: 120 });
    y += 16;
    doc.text('Shipping:', 350, y); doc.text(shipping === 0 ? 'Free' : `Rs. ${shipping}`, 430, y, { align: 'right', width: 120 });
    y += 16;
    if (discount > 0) {
      doc.text('Discount:', 350, y); doc.text(`-Rs. ${discount.toLocaleString()}`, 430, y, { align: 'right', width: 120 });
      y += 16;
    }
    doc.moveTo(350, y - 4).lineTo(550, y - 4).strokeColor(gold).stroke();
    doc.font('Helvetica-Bold').fillColor(gold).fontSize(11);
    doc.text('TOTAL:', 350, y); doc.text(`Rs. ${grandTotal.toLocaleString()}`, 410, y, { align: 'right', width: 140 });
    doc.moveDown(1.5);

    doc.fillColor(gray).font('Helvetica').fontSize(7.5);
    doc.text('Thank you for shopping with ISHFAQ ALI & SONS!', 40, null, { align: 'center' });
    doc.text('For inquiries, contact us at +92 332 9940666 or ishfaqaliandsons123@gmail.com', { align: 'center' });
    doc.text('Visit us: Piple Wehra, Near Aik Minar Wali Masjid, Shah Alam Mohalla, Lahore', { align: 'center' });

    doc.end();
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
