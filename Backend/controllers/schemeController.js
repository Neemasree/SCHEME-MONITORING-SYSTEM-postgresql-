import Scheme from '../models/Scheme.js';

// @desc    Create a new scheme
// @route   POST /api/schemes
// @access  Private/Admin
const createScheme = async (req, res) => {
    const { schemeName, description, budget, district, startDate, endDate } = req.body;

    const scheme = await Scheme.create({
        schemeName,
        description,
        budget,
        district,
        startDate,
        endDate,
        createdBy: req.user._id
    });

    if (scheme) {
        res.status(201).json(scheme);
    } else {
        res.status(400).json({ message: 'Invalid scheme data' });
    }
};

// @desc    Get all schemes
// @route   GET /api/schemes
// @access  Private
const getSchemes = async (req, res) => {
    const schemes = await Scheme.aggregate([
        {
            $lookup: {
                from: 'applications',
                localField: '_id',
                foreignField: 'schemeId',
                as: 'applications'
            }
        },
        {
            $project: {
                schemeName: 1,
                description: 1,
                budget: 1,
                district: 1,
                status: 1,
                startDate: 1,
                endDate: 1,
                createdAt: 1,
                beneficiariesCount: { $size: "$applications" }
            }
        }
    ]);
    res.json(schemes);
};

// @desc    Get scheme by ID
// @route   GET /api/schemes/:id
// @access  Private
const getSchemeById = async (req, res) => {
    const scheme = await Scheme.findById(req.params.id).populate('createdBy', 'name');

    if (scheme) {
        res.json(scheme);
    } else {
        res.status(404).json({ message: 'Scheme not found' });
    }
};

// @desc    Update a scheme
// @route   PUT /api/schemes/:id
// @access  Private/Admin
const updateScheme = async (req, res) => {
    const { schemeName, description, budget, district, status, startDate, endDate } = req.body;

    const scheme = await Scheme.findById(req.params.id);

    if (scheme) {
        scheme.schemeName = schemeName || scheme.schemeName;
        scheme.description = description || scheme.description;
        scheme.budget = budget || scheme.budget;
        scheme.district = district || scheme.district;
        scheme.status = status || scheme.status;
        scheme.startDate = startDate || scheme.startDate;
        scheme.endDate = endDate || scheme.endDate;

        const updatedScheme = await scheme.save();
        res.json(updatedScheme);
    } else {
        res.status(404).json({ message: 'Scheme not found' });
    }
};

// @desc    Delete a scheme
// @route   DELETE /api/schemes/:id
// @access  Private/Admin
const deleteScheme = async (req, res) => {
    const scheme = await Scheme.findById(req.params.id);

    if (scheme) {
        await scheme.deleteOne();
        res.json({ message: 'Scheme removed' });
    } else {
        res.status(404).json({ message: 'Scheme not found' });
    }
};

export { createScheme, getSchemes, getSchemeById, updateScheme, deleteScheme };
