import Application from '../models/Application.js';
import Scheme from '../models/Scheme.js';

// @desc    Get dashboard summary stats
// @route   GET /api/dashboard/stats
// @access  Private
const getDashboardStats = async (req, res) => {
    const totalSchemes = await Scheme.countDocuments();
    const totalApplications = await Application.countDocuments();
    const pendingApprovals = await Application.countDocuments({ status: { $regex: /Pending/ } });
    const approvedCases = await Application.countDocuments({ status: 'Approved' });

    res.json({
        totalSchemes,
        totalApplications,
        pendingApprovals,
        approvedCases
    });
};

// @desc    Get analytics for charts
// @route   GET /api/dashboard/analytics
// @access  Private
const getAnalytics = async (req, res) => {
    // 1. Status Distribution
    const statusData = await Application.aggregate([
        { $group: { _id: "$status", value: { $sum: 1 } } },
        { $project: { name: "$_id", value: 1, _id: 0 } }
    ]);

    // 2. Scheme Distribution
    const schemeData = await Application.aggregate([
        {
            $lookup: {
                from: 'schemes',
                localField: 'schemeId',
                foreignField: '_id',
                as: 'scheme'
            }
        },
        { $unwind: "$scheme" },
        { $group: { _id: "$scheme.schemeName", value: { $sum: 1 } } },
        { $project: { name: "$_id", value: 1, _id: 0 } }
    ]);

    // 3. District Stats
    const districtStats = await Application.aggregate([
        {
            $group: {
                _id: "$district",
                total: { $sum: 1 },
                approved: {
                    $sum: { $cond: [{ $eq: ["$status", "Approved"] }, 1, 0] }
                },
                rejected: {
                    $sum: { $cond: [{ $eq: ["$status", "Rejected"] }, 1, 0] }
                },
                pending: {
                    $sum: { $cond: [{ $regex: /Pending/ }, 1, 0] }
                }
            }
        },
        { $project: { district: "$_id", total: 1, approved: 1, rejected: 1, pending: 1, _id: 0 } }
    ]);

    // 4. Trend Data (Last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const trendData = await Application.aggregate([
        { $match: { appliedDate: { $gte: sixMonthsAgo } } },
        {
            $group: {
                _id: {
                    month: { $month: "$appliedDate" },
                    year: { $year: "$appliedDate" }
                },
                applications: { $sum: 1 }
            }
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } },
        {
            $project: {
                month: {
                    $arrayElemAt: [
                        ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
                        "$_id.month"
                    ]
                },
                applications: 1,
                _id: 0
            }
        }
    ]);

    res.json({
        statusData,
        schemeData,
        districtStats,
        trendData
    });
};

export { getDashboardStats, getAnalytics };
