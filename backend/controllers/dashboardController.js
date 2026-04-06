const Scheme = require('../models/Scheme');
const Application = require('../models/Application');
const DistrictPerformance = require('../models/Performance');

exports.getStats = async (req, res) => {
  try {
    const totalSchemes = await Scheme.count();
    const totalApplications = await Application.count();
    const approvedApplications = await Application.count({ where: { status: 'Approved' } });
    const pendingApplications = await Application.count({ where: { status: ['Pending Field Officer', 'Pending District Officer'] } });

    res.json({
      totalSchemes,
      totalApplications,
      approvedApplications,
      pendingApplications,
      // Add more as needed by DashboardCards
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getAnalytics = async (req, res) => {
  try {
    // District Stats
    const performances = await DistrictPerformance.findAll();
    const districtStats = performances.map(p => ({
      district: p.district,
      total: p.totalApplications,
      approved: p.approved,
      pending: p.pending,
      rejected: p.rejected,
    }));

    // Status Data for Pie Chart
    const applications = await Application.findAll();
    const statusCounts = {};
    applications.forEach(app => {
      statusCounts[app.status] = (statusCounts[app.status] || 0) + 1;
    });
    const statusData = Object.keys(statusCounts).map(name => ({
      name,
      value: statusCounts[name],
    }));

    // Scheme Data for Pie Chart
    const schemeCounts = {};
    applications.forEach(app => {
      schemeCounts[app.scheme] = (schemeCounts[app.scheme] || 0) + 1;
    });
    const schemeData = Object.keys(schemeCounts).map(name => ({
      name,
      value: schemeCounts[name],
    }));

    // Trend Data (Mocked for now since we don't have historical data in the seed)
    const trendData = [
      { month: 'Oct', applications: 120 },
      { month: 'Nov', applications: 190 },
      { month: 'Dec', applications: 150 },
      { month: 'Jan', applications: 280 },
      { month: 'Feb', applications: 220 },
      { month: 'Mar', applications: 350 },
    ];

    res.json({
      districtStats,
      statusData,
      schemeData,
      trendData,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
