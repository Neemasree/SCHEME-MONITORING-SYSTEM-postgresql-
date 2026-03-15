const authUser = async (req, res) => {
    const { email, password } = req.body;

    console.log(`🔍 Login Attempt: ${email}`);
    const user = await User.findOne({ email });

    if (user) {
        console.log(`✅ User found: ${user.email} | Role: ${user.role}`);
        const isMatch = await user.matchPassword(password);
        console.log(`🔑 Password Match: ${isMatch}`);

        if (isMatch) {
            res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                district: user.district,
                token: generateToken(user._id)
            });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } else {
        console.log(`❌ No user found with email: ${email}`);
        res.status(401).json({ message: 'Invalid email or password' });
    }
};

// @desc    Register a new officer/admin (Initial setup or admin action)
// @route   POST /api/auth/register
// @access  Public (Should be protected in production, but open for initial setup)
const registerUser = async (req, res) => {
    const { name, email, password, role, district } = req.body;

    const userExists = await User.findOne({ email });

    if (userExists) {
        res.status(400).json({ message: 'User already exists' });
        return;
    }

    const user = await User.create({
        name,
        email,
        password,
        role,
        district
    });

    if (user) {
        res.status(201).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            district: user.district,
            token: generateToken(user._id)
        });
    } else {
        res.status(400).json({ message: 'Invalid user data' });
    }
};

export { authUser, registerUser };
