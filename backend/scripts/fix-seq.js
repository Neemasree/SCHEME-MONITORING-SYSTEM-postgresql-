const { sequelize } = require('./config/db');

async function fixSequences() {
  try {
    await sequelize.query(`SELECT setval('"Schemes_id_seq"', (SELECT MAX(id) FROM "Schemes"))`);
    await sequelize.query(`SELECT setval('"Applications_id_seq"', (SELECT MAX(id) FROM "Applications"))`);
    await sequelize.query(`SELECT setval('"Users_id_seq"', (SELECT MAX(id) FROM "Users"))`);
    await sequelize.query(`SELECT setval('"Performances_id_seq"', (SELECT MAX(id) FROM "Performances"))`);
    console.log('Sequences synced with max IDs!');
  } catch (error) {
    console.error('Error fixing sequence:', error.message);
  } finally {
    await sequelize.close();
  }
}

fixSequences();
