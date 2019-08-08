const acis = require('./acis');
const provider = { acis };

module.exports = {
  fromProvider(type) {
    const Provider = provider[type];
    return new Provider();
  }
};