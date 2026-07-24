module.exports = {
  siteName: 'ISHFAQ ALI & SONS',
  siteUrl: process.env.SITE_URL || 'http://localhost:5000',
  contactPhone: process.env.CONTACT_PHONE || '+92 332 9940666',
  whatsappNumber: process.env.WHATSAPP_NUMBER || '+923329940666',
  contactEmail: process.env.CONTACT_EMAIL || 'ishfaqaliandsons123@gmail.com',
  address: 'Piple Wehra, Near Aik Minar Wali Masjid, Shah Alam Mohalla, Takia Sadhu Market, Lahore, 54009, Pakistan',
  googleMapsUrl: 'https://www.google.com/maps/search/piple+wehra+near+aik+minar+wali+masjid,+Shah+Alam+Mohalla+Takia+Sadhu+market,+Lahore,+54009,+Pakistan/',
  currency: 'PKR',
  currencySymbol: 'Rs.',
  shippingCost: 200,
  freeShippingThreshold: 5000,
  taxRate: 0,
  categories: ['Karit', 'Turkish Jewelry'],
  socialLinks: {
    facebook: 'https://www.facebook.com/ishfaqali.sonsa',
    instagram: '#',
    tiktok: 'https://www.tiktok.com/@ishfaqalisons1',
    whatsapp: `https://wa.me/${process.env.WHATSAPP_NUMBER || '+923329940666'}`,
    youtube: '#'
  }
};