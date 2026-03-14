import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Scheme from '../models/Scheme.js';
import Application from '../models/Application.js';
import Notification from '../models/Notification.js';
import connectDB from '../config/db.js';

dotenv.config();
connectDB();

const seedData = async () => {
    try {
        // Clear existing data
        await User.deleteMany();
        await Scheme.deleteMany();
        await Application.deleteMany();
        await Notification.deleteMany();

        console.log('🗑️  Data Cleared...');

        // 1. Create Users
        const salt = await bcrypt.genSalt(10);
        const password = await bcrypt.hash('password123', salt);

        const users = await User.insertMany([
            { name: 'Admin User', email: 'admin@test.com', password, role: 'admin' },
            { name: 'District Officer', email: 'district@test.com', password, role: 'district_officer' },
            { name: 'Field Officer', email: 'field@test.com', password, role: 'field_officer' },
        ]);

        console.log('👤 Users Seeded');

        // 2. Create Schemes
        const schemes = await Scheme.insertMany([
            { schemeName: 'Farmer Subsidy 2024', description: 'Direct financial aid for organic farming', budget: 5000000, district: 'Coimbatore', createdBy: users[0]._id },
            { schemeName: 'Rural Housing Fund', description: 'Housing loans for low income families', budget: 12000000, district: 'Salem', createdBy: users[0]._id },
            { schemeName: 'Education Scholarship', description: 'Monthly stipend for higher studies', budget: 3000000, district: 'Chennai', createdBy: users[0]._id }
        ]);

        console.log('📋 Schemes Seeded');

        // 3. Create Applications
        await Application.insertMany([
            {
                beneficiaryName: 'Ravi Kumar',
                schemeId: schemes[0]._id,
                district: 'Coimbatore',
                status: 'Pending Field Officer',
                appliedDate: new Date('2024-03-01')
            },
            {
                beneficiaryName: 'Sita Rani',
                schemeId: schemes[1]._id,
                district: 'Salem',
                status: 'Pending District Officer',
                fieldOfficerApproval: { status: true, approvedBy: users[2]._id, date: Date.now() },
                appliedDate: new Date('2024-02-15')
            },
            {
                beneficiaryName: 'John Doe',
                schemeId: schemes[2]._id,
                district: 'Chennai',
                status: 'Approved',
                fieldOfficerApproval: { status: true, approvedBy: users[2]._id, date: Date.now() },
                districtOfficerApproval: { status: true, approvedBy: users[1]._id, date: Date.now() },
                adminApproval: { status: true, approvedBy: users[0]._id, date: Date.now() },
                appliedDate: new Date('2024-01-20')
            }
        ]);

        console.log('✅ Applications Seeded');
        console.log('--- DB INITIALIZATION COMPLETE ---');
        process.exit();
    } catch (error) {
        console.error('❌ Error seeding data:', error);
        process.exit(1);
    }
};

seedData();
