# Government Scheme Monitoring System (PostgreSQL Edition)

A robust, role-based web application designed to monitor, manage, and evaluate government schemes and benficiary applications across various districts efficiently. This system connects System Administrators, District Officers, and Field Officers onto a single unified platform.

## 🌟 Key Features

* **Role-Based Access Control**: Tailored dashboards and capabilities for System Admins, District Officers, and Field Officers.
* **Scheme Management**: End-to-end scheme creation, tracking, and budget allocation.
* **Application Processing Workflow**: Multi-step verification workflow for beneficiary applications with comprehensive "remarks" history tracing for rejections/approvals.
* **Analytics & Performance Tracking**: District-wise performance grading, pending counts, approval rates, and dynamic charting.
* **Real-time Notification System**: Stay updated with vital alerts directly in the navigation hub.

## 🛠 Tech Stack

* **Frontend**: React.js with Vite, Lucide Icons, plain CSS.
* **Backend**: Node.js, Express.js.
* **Database**: PostgreSQL with Sequelize ORM.

## 🚀 Getting Started

### Prerequisites
* Node.js (v16+)
* PostgreSQL running locally on port `5432`

### 1. Database Setup
Create a PostgreSQL database named `govt_monitoring`.
Update `backend/.env` with your PostgreSQL credentials:
```env
PORT=5000
DB_NAME=govt_monitoring
DB_USER=postgres
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=5432
```

### 2. Backend Initialization
Install packages and seed the database with initial test data:
```bash
cd backend
npm install
npm run seed
npm run dev
```

### 3. Frontend Initialization
In a separate terminal, start the React server:
```bash
cd Frontend
npm install
npm run dev
```

## 🔐 Default Test Accounts

| Role | Email | Password |
| :--- | :--- | :--- |
| **System Admin** | `admin@govt.in` | `password123` |
| **District Officer** | `district@govt.in` | `password123` |
| **Field Officer** | `field@govt.in` | `password123` |

## 📦 Recent Updates
* Successfully migrated the entire persistence layer to **PostgreSQL**.
* Revamped PostgreSQL Object Relational mapping for precise query mapping.
* Optimized UI metrics mapping for the District Monitoring Hub.
* Integrated strict schema structures tracking verification footprints.
