const { sequelize } = require('../config/db');
const Scheme = require('../models/Scheme');
const Application = require('../models/Application');
const DistrictPerformance = require('../models/Performance');
const User = require('../models/User');
const Notification = require('../models/Notification');

const userData = [
  {
    name: 'Admin User',
    email: 'admin@govt.in',
    password: 'password123',
    role: 'admin',
  },
  {
    name: 'District Officer',
    email: 'district@govt.in',
    password: 'password123',
    role: 'district_officer',
  },
  {
    name: 'Field Officer',
    email: 'field@govt.in',
    password: 'password123',
    role: 'field_officer',
  },
];
const schemesData = [
  {
    id: 1,
    schemeName: "Farmer Subsidy Scheme",
    description: "Financial support for buying seeds and fertilizers.",
    budget: "₹500 Crores",
    district: "Salem",
    status: "Active",
    beneficiariesCount: 4500,
  },
  {
    id: 2,
    schemeName: "Girl Child Education Fund",
    description: "Scholarship for higher education of girl children.",
    budget: "₹200 Crores",
    district: "Coimbatore",
    status: "Active",
    beneficiariesCount: 12000,
  },
  {
    id: 3,
    schemeName: "Rural Housing Scheme",
    description: "Assistance to build concrete houses in rural areas.",
    budget: "₹1000 Crores",
    district: "Madurai",
    status: "Active",
    beneficiariesCount: 3200,
  },
];

const applicationsData = [
  {
    id: 101,
    beneficiary: "Ravi Kumar",
    scheme: "Farmer Subsidy Scheme",
    district: "Salem",
    status: "Pending Field Officer",
    dateApplied: "2026-03-10",
  },
  {
    id: 102,
    beneficiary: "Lakshmi",
    scheme: "Girl Child Education Fund",
    district: "Coimbatore",
    status: "Pending District Officer",
    dateApplied: "2026-03-11",
  },
  {
    id: 103,
    beneficiary: "Murugan",
    scheme: "Rural Housing Scheme",
    district: "Madurai",
    status: "Approved",
    dateApplied: "2026-03-01",
  },
  {
    id: 104,
    beneficiary: "Anitha",
    scheme: "Girl Child Education Fund",
    district: "Chennai",
    status: "Rejected",
    dateApplied: "2026-02-25",
  },
  {
    id: 105,
    beneficiary: "Karthik",
    scheme: "Farmer Subsidy Scheme",
    district: "Salem",
    status: "Pending Field Officer",
    dateApplied: "2026-03-14",
  },
];

const performanceData = [
  {
    id: 1,
    district: "Salem",
    totalApplications: 500,
    approved: 300,
    pending: 150,
    rejected: 50,
    rating: "A",
  },
  {
    id: 2,
    district: "Coimbatore",
    totalApplications: 800,
    approved: 600,
    pending: 100,
    rejected: 100,
    rating: "A+",
  },
  {
    id: 3,
    district: "Madurai",
    totalApplications: 400,
    approved: 200,
    pending: 150,
    rejected: 50,
    rating: "B",
  },
];

const notificationsData = [
  {
    title: "New Application",
    message: "A new scheme application is pending your review.",
    type: "info",
    role: "admin",
  },
  {
    title: "Approval Success",
    message: "Scheme budget was approved successfully.",
    type: "success",
    role: "admin",
  },
  {
    title: "Alert",
    message: "District Salem has low budget remaining.",
    type: "warning",
    role: "admin",
  },
];

const seedDatabase = async () => {
  try {
    await sequelize.authenticate();
    console.log('Connected to PostgreSQL for seeding.');

    // Force sync to reset the DB for initial development
    await sequelize.sync({ force: true });
    console.log('All models synchronized with the database.');

    await User.bulkCreate(userData, { individualHooks: true });
    console.log('Users data seeded.');

    await Scheme.bulkCreate(schemesData);
    console.log('Schemes data seeded.');

    await Application.bulkCreate(applicationsData);
    console.log('Applications data seeded.');

    await DistrictPerformance.bulkCreate(performanceData);
    console.log('Performance data seeded.');

    await Notification.bulkCreate(notificationsData);
    console.log('Notification data seeded.');

    // Fix PostgreSQL auto-increment sequences since we're providing hardcoded IDs
    const tables = ['Users', 'Schemes', 'Applications', 'Performances', 'Notifications'];
    for (const table of tables) {
      try {
        await sequelize.query(`SELECT setval('"${table}_id_seq"', (SELECT MAX(id) FROM "${table}"))`);
      } catch (e) {
        // Safe to ignore if table uses different sequences or doesn't exist
      }
    }
    console.log('Auto-increment sequences synced.');

    console.log('Database seeding complete!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
