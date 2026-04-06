<div align="center">
  <h1>🏛️ Government Monitoring System</h1>
  <p><i>A comprehensive, role-based architecture for modernizing government scheme allocations, application tracking, and district-level performance analytics.</i></p>
  
  <p>
    <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
    <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node JS" />
    <img src="https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" />
    <img src="https://img.shields.io/badge/Sequelize-52B0E7?style=for-the-badge&logo=Sequelize&logoColor=white" alt="Sequelize" />
    <img src="https://img.shields.io/badge/Vite-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62E" alt="Vite" />
  </p>
</div>

---

## 📖 Overview

The **Government Monitoring System** solves the critical problem of disconnected, opaque public sector workflows. It brings transparency, speed, and strict verification hierarchies to the process of allocating government schemes and managing beneficiary applications. 

By migrating to a highly structured **PostgreSQL** relational database, this system ensures data integrity, fast complex analytical queries, and reliable multi-tiered tracking.

## ✨ Key Features

### 🔐 Multi-Tier Role-Based Access Control (RBAC)
Dedicated dashboards and permissions tailored to specific organizational roles:
- **System Admin**: Complete overview of all districts, overarching analytics, final approval authority, and new scheme creation.
- **District Officer**: Focuses strictly on applications specific to their regional jurisdiction. Second-tier verification logic.
- **Field Officer**: Ground-level verification dashboard focused on rapid assessment and initial reviews.

### 📊 District Monitoring Hub
A dynamic performance analytics engine that tracks:
- **Application Throughput**: Real-time aggregation of approved vs. rejected vs. pending statuses.
- **District Grading Matrix**: Automated grading algorithms scoring districts based on efficiency metrics.

### 🔍 Interactive Application Workflow
- Detailed verification modals capturing rich JSON context.
- **Audit Trails**: Every rejection or approval generates an immutable timestamped log indicating `WHO` made the decision, `WHEN`, and `WHY` (detailed remarks).

---

## 🏗️ Architecture & Tech Stack

This project was engineered with a modern, decoupled architecture:

- **Frontend (Client)**: Built with `React.js` and `Vite` for lightning-fast HMR and optimized production bundles. Styling relies on a custom CSS design system utilizing glassmorphism, fluid animations (`lucide-react`), and responsive grids.
- **Backend (API)**: Powered by `Node.js` and `Express.js`, providing robust RESTful endpoints.
- **Database (Persistence)**: Integrated with **PostgreSQL**, leveraging `Sequelize` strictly enforced Schema models for absolute data integrity.
- **State & Data**: Custom JSON storage within relational limits to maintain sequential history trees (e.g., Application remarks logging).

---

## 🚀 Getting Started

Follow these instructions to run the project in your local development environment.

### Prerequisites
- [Node.js](https://nodejs.org/en/) (v16.0 or higher)
- [PostgreSQL](https://www.postgresql.org/download/) (running on port `5432`)
- Git

### 1. Database Setup
Ensure PostgreSQL is running, then create a new database:
```sql
CREATE DATABASE govt_monitoring;
```

Configure your local environment variables in `backend/.env`:
```env
PORT=5000
DB_NAME=govt_monitoring
DB_USER=postgres
DB_PASSWORD=your_secure_password
DB_HOST=localhost
DB_PORT=5432
```

### 2. Backend Initialization
Install dependencies, run the automated database synchronizations, and populate the system with mock users & standard schemes:
```bash
cd backend
npm install

# Force-sync the Sequelize models and seed the application logic
npm run seed 

# Launch the development server
npm run dev
```

### 3. Frontend Initialization
In a separate terminal, launch the lightning-fast Vite client:
```bash
cd Frontend
npm install
npm run dev
```
Navigate to `http://localhost:5173` in your browser.

---

## 🧪 Demo Credentials

To experience the localized RBAC routing, log in with any of the pre-seeded accounts:

| Role | Username (Email) | Password |
| :--- | :--- | :--- |
| **System Administrator** | `admin@govt.in` | `password123` |
| **District Officer** | `district@govt.in` | `password123` |
| **Field Officer** | `field@govt.in` | `password123` |

---

<div align="center">
  <i>Engineered with precision for accountability and scale.</i>
</div>
