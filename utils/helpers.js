const helpers = {
  formatPrice: (price) => {
    return `Rs. ${Number(price).toLocaleString()}`;
  },
  truncate: (str, len = 100) => {
    if (!str) return '';
    return str.length > len ? str.substring(0, len) + '...' : str;
  },
  date: (date) => {
    return new Date(date).toLocaleDateString('en-PK', { year: 'numeric', month: 'long', day: 'numeric' });
  },
  json: (obj) => JSON.stringify(obj),
  eq: (a, b) => a === b,
  multiply: (a, b) => a * b,
  add: (a, b) => a + b
};

module.exports = helpers;