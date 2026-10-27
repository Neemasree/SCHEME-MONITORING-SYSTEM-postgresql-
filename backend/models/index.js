// Central model registry for API use. Database schema changes are managed by
// versioned SQL migrations; this module must not be used to bootstrap tables.
const User = require('./User');
const Scheme = require('./Scheme');
const Application = require('./Application');
const AuditLog = require('./AuditLog');
const Notification = require('./Notification');

module.exports = {
  User,
  Scheme,
  Application,
  AuditLog,
  Notification,
};
