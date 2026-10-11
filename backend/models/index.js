// Central model registry. Requiring this module registers every model with the
// shared Sequelize instance before sync/migration code runs.
const User = require('./User');
const Scheme = require('./Scheme');
const Application = require('./Application');
const AuditLog = require('./AuditLog');
const Notification = require('./Notification');
const DistrictPerformance = require('./Performance');

module.exports = {
  User,
  Scheme,
  Application,
  AuditLog,
  Notification,
  DistrictPerformance,
};
