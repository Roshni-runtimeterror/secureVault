# secureVault
Build a simple secure document vault where users can upload files, protect them with encryption, view their stored files, and download them securely.
🔐 SecureVault

Your Files. Your Security.


✨ Features

- 🔐 Simple user authentication
- 📁 Secure file upload
- 🛡️ File protection using Node.js cryptographic capabilities
- 📊 Security dashboard
- 📂 Personal file vault
- ⬇️ Protected file downloads
- 🗑️ File deletion
- 📋 Security activity log
- 📈 Security score
- 📱 Responsive design
- ⚡ Simple React + Node.js architecture

---

🖥️ Dashboard

The dashboard provides an overview of your vault security:

┌─────────────────────────────────────────┐
│              SECUREVAULT                │
│                                         │
│   Security Score       Protected Files  │
│        94%                    12        │
│                                         │
│   Storage Used          Recent Activity │
│    24.6 MB              File Protected  │
│                         File Uploaded   │
│                                         │
│           📁 My Secure Vault            │
│                                         │
│   Project.pdf      🔒 Protected         │
│   Report.docx     🔒 Protected         │
│   Notes.txt       🔒 Protected         │
└─────────────────────────────────────────┘

---

🛠️ Tech Stack

Frontend

- ⚛️ React
- ⚡ Vite
- 🎨 CSS
- 🟨 JavaScript

Backend

- 🟢 Node.js
- 🚂 Express.js
- 🔐 Node.js Crypto
- 📦 Multer / file handling

---

📁 Project Structure

SecureVault intentionally uses a small and simple structure.

SecureVault/
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── App.css
│   └── index.html
│
├── backend/
│   ├── server.js
│   ├── auth.js
│   └── vault.js
│
├── package.json
└── README.md

The project avoids unnecessary components, services, utilities, and configuration files.

---

🔒 How SecureVault Works

          USER
            │
            ▼
      Login / Register
            │
            ▼
      Security Dashboard
            │
            ▼
        Upload File
            │
            ▼
     Backend Validation
            │
            ▼
      File Protection
            │
            ▼
       Secure Storage
            │
            ▼
        My Vault
       ┌────┴────┐
       ▼         ▼
   Download    Delete

---

🚀 Getting Started

1. Clone the repository

git clone YOUR_GITHUB_REPOSITORY_URL

2. Open the project

cd SecureVault

3. Install dependencies

Install the frontend dependencies:

cd frontend
npm install

Install the backend dependencies:

cd ../backend
npm install

4. Start the backend

node server.js

5. Start the frontend

Open another terminal:

cd frontend
npm run dev

Then open the local URL shown by Vite in your browser.

---

🔑 Main API Endpoints

Authentication

POST /api/register
POST /api/login

File Management

POST   /api/upload
GET    /api/files
GET    /api/download/:id
DELETE /api/files/:id

Activity

GET /api/activity

---

🛡️ Security Approach

SecureVault demonstrates basic security principles such as:

- Password protection
- File validation
- Backend-controlled file operations
- Cryptographic file protection
- Authentication before accessing protected files
- Environment variables for sensitive configuration
- Avoiding hardcoded secrets

⚠️ Important

SecureVault is a student/hackathon demonstration project and should not be considered enterprise-grade security software.

It does not claim to provide:

- 100% security
- Unbreakable protection
- Enterprise-level cloud security
- Professional security auditing

---

🎨 Design

SecureVault uses a modern cybersecurity-inspired interface featuring:

- 🌑 Dark theme
- 🟢 Security-focused accent colors
- 🔵 Glowing UI elements
- 🔐 Lock and shield visuals
- 🪟 Glass-style cards
- 📊 Dashboard statistics
- ✨ Smooth interactions
- 📱 Responsive layout

---

📌 Future Improvements

Possible future versions could include:

- 🔑 Two-factor authentication
- ☁️ Cloud storage
- 🔗 Secure file-sharing links
- ⏳ Expiring download links
- 🦠 File malware scanning
- 👥 Role-based access
- 📧 Security notifications
- 🗄️ Database-backed storage
- 📜 Advanced audit logs

---

🎯 Project Goals

The main goals of SecureVault are to:

1. Demonstrate secure file-handling concepts.
2. Build a practical cybersecurity application.
3. Combine React with a Node.js backend.
4. Maintain a small and understandable codebase.
5. Provide a professional security-focused user experience.

---

👨‍💻 Built With

React + Node.js + Express + JavaScript

Built as a security-focused learning and hackathon project.

---

⚠️ Disclaimer

SecureVault is created for educational and demonstration purposes.

Do not use this project to store highly sensitive or irreplaceable information without performing a proper security review and implementing production-grade security controls.

---

⭐ If You Like This Project

Give the repository a ⭐ on GitHub and feel free to explore the code.

SecureVault — Protect what matters. 🔐
