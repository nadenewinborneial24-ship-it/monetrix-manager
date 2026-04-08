const handleResource = require('./_crud');
module.exports = async function handler(req, res) {
  return handleResource(req, res, 'tasks');
};
