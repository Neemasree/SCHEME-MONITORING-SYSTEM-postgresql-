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
        const users = await User.create([
            { name: 'Admin', email: 'admin@test.com', password: 'Admin@123', role: 'admin' },
            { name: 'Salem District Officer', email: 'salem_do@test.com', password: 'password123', role: 'district_officer', district: 'Salem' },
            { name: 'Coimbatore District Officer', email: 'coimbatore_do@test.com', password: 'password123', role: 'district_officer', district: 'Coimbatore' },
            { name: 'Chennai District Officer', email: 'chennai_do@test.com', password: 'password123', role: 'district_officer', district: 'Chennai' },
            { name: 'Madurai District Officer', email: 'madurai_do@test.com', password: 'password123', role: 'district_officer', district: 'Madurai' },
            { name: 'Salem Field Officer', email: 'salem_fo@test.com', password: 'password123', role: 'field_officer', district: 'Salem' },
            { name: 'Coimbatore Field Officer', email: 'coimbatore_fo@test.com', password: 'password123', role: 'field_officer', district: 'Coimbatore' },
            { name: 'Chennai Field Officer', email: 'chennai_fo@test.com', password: 'password123', role: 'field_officer', district: 'Chennai' },
            { name: 'Madurai Field Officer', email: 'madurai_fo@test.com', password: 'password123', role: 'field_officer', district: 'Madurai' },
        ]);

        console.log('👤 Users Seeded');

        // 2. Create Schemes
        const schemes = await Scheme.insertMany([
            { schemeName: 'Farmer Subsidy 2.0', description: 'Direct financial aid for organic farming', budget: 5000000, district: 'Coimbatore', startDate: new Date('2024-01-01'), endDate: new Date('2024-12-31'), createdBy: users[0]._id },
            { schemeName: 'PMAY Housing Rural', description: 'Housing loans for low income families', budget: 12000000, district: 'Salem', startDate: new Date('2024-01-01'), endDate: new Date('2024-12-31'), createdBy: users[0]._id },
            { schemeName: 'Post-Matric Scholarship', description: 'Monthly stipend for higher studies', budget: 3000000, district: 'Chennai', startDate: new Date('2024-01-01'), endDate: new Date('2024-12-31'), createdBy: users[0]._id },
            { schemeName: 'MSME Growth Fund', description: 'Support for small scale businesses', budget: 8000000, district: 'Madurai', startDate: new Date('2024-01-01'), endDate: new Date('2024-12-31'), createdBy: users[0]._id },
            { schemeName: 'Green Energy Initiative', description: 'Subsidies for solar panel installations', budget: 15000000, district: 'Salem', startDate: new Date('2024-01-01'), endDate: new Date('2024-12-31'), createdBy: users[0]._id },
            { schemeName: 'Skill India Training', description: 'Vocational training for unemployed youth', budget: 4000000, district: 'Coimbatore', startDate: new Date('2024-01-01'), endDate: new Date('2024-12-31'), createdBy: users[0]._id },
            { schemeName: 'Widow Pension Scheme', description: 'Monthly financial support for widows', budget: 2000000, district: 'Madurai', startDate: new Date('2024-01-01'), endDate: new Date('2024-12-31'), createdBy: users[0]._id },
        ]);

        console.log('📋 Schemes Seeded');

        // 3. Create Applications (Voluminous Data)
        const districts = ['Salem', 'Coimbatore', 'Chennai', 'Madurai'];
        const statuses = ['Pending Field Officer', 'Pending District Officer', 'Pending Admin', 'Approved', 'Rejected'];
        const names = ['Arjun', 'Bala', 'Chitra', 'Deepak', 'Eswar', 'Fathima', 'Ganesh', 'Hema', 'Indira', 'Jagan', 'Kavitha', 'Lokesh', 'Manoj', 'Nisha', 'Omprakash', 'Priya', 'Quasim', 'Raju', 'Sangeetha', 'Tharun', 'Uma', 'Varun', 'Waseem', 'Xavier', 'Yash', 'Zeenat'];

        const applications = [];

        // Generate 50 realistic applications
        for (let i = 0; i < 50; i++) {
            const district = districts[i % districts.length];
            const status = statuses[i % statuses.length];
            const scheme = schemes[i % schemes.length];
            const name = names[i % names.length] + ' ' + (i > 25 ? 'Kumar' : 'Reddy');

            // Random date in last 5 months
            const date = new Date();
            date.setMonth(date.getMonth() - Math.floor(Math.random() * 5));
            date.setDate(Math.floor(Math.random() * 28) + 1);

            const app = {
                beneficiaryName: name,
                schemeId: scheme._id,
                district: district,
                status: status,
                appliedDate: date,
                remarks: []
            };

            // Add mock approvals based on status
            if (status === 'Pending District Officer' || status === 'Pending Admin' || status === 'Approved') {
                app.fieldOfficerApproval = { status: true, approvedBy: users[5]._id, date: new Date() };
                app.remarks.push({ role: 'field_officer', text: 'Documents verified on ground.', date: new Date() });
            }
            if (status === 'Pending Admin' || status === 'Approved') {
                app.districtOfficerApproval = { status: true, approvedBy: users[1]._id, date: new Date() };
                app.remarks.push({ role: 'district_officer', text: 'Application eligibility confirmed.', date: new Date() });
            }
            if (status === 'Approved') {
                app.adminApproval = { status: true, approvedBy: users[0]._id, date: new Date() };
                app.remarks.push({ role: 'admin', text: 'Final fund disbursement approved.', date: new Date() });
            }
            if (status === 'Rejected') {
                app.remarks.push({ role: 'field_officer', text: 'Incomplete documentation.', date: new Date() });
            }

            applications.push(app);
        }

        await Application.insertMany(applications);

        console.log('✅ 50 Applications Seeded');
        console.log('--- DB INITIALIZATION COMPLETE ---');
        process.exit();
    } catch (error) {
        console.error('❌ Error seeding data:', error);
        process.exit(1);
    }
};

seedData();
