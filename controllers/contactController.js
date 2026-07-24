exports.getContact = (req, res) => {
  res.render('pages/contact', { title: 'Contact Us' });
};

exports.postContact = async (req, res) => {
  try {
    const { name, phone, message } = req.body;
    // Email sending will be configured later
    console.log('Contact Form Submission:', { name, phone, message });
    res.json({ success: true, message: 'Thank you for your message. We will get back to you soon.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};