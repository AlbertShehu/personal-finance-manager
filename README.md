# 💰 FinMan - Personal Finance Management App

A modern, full-stack personal finance management application built with React, Node.js, and Prisma. Track your income, expenses, budgets, and get detailed analytics to manage your financial life effectively.

![FinMan Dashboard](https://img.shields.io/badge/Status-Production%20Ready-brightgreen)
![React](https://img.shields.io/badge/React-18.2.0-blue)
![Node.js](https://img.shields.io/badge/Node.js-18.0.0-green)
![Prisma](https://img.shields.io/badge/Prisma-5.0.0-purple)

## ✨ Features

### 🔐 Authentication & Security
- **Secure Login/Register** with Gmail validation
- **JWT Token Management** for secure sessions
- **Password Reset** functionality
- **Protected Routes** for authenticated users

### 💳 Transaction Management
- **Add/Edit/Delete** transactions with categories
- **Real-time Updates** across all components
- **Income/Expense Tracking** with detailed analytics
- **Category-based Organization** for better insights

### 📊 Advanced Analytics
- **Interactive Dashboard** with real-time data
- **Monthly Trends Analysis** with visual charts
- **Category Spending Breakdown** 
- **Financial Insights** and recommendations

### 🎯 Smart Budget Management
- **Create Budgets** by category with spending limits
- **Real-time Budget Tracking** with progress bars
- **Smart Notifications** when limits are exceeded
- **Auto-refresh** when transactions change

### 🌍 Multi-language Support
- **3 Languages**: Albanian, English, German
- **Complete Translations** for all features
- **Dynamic Language Switching**

### 📱 Modern UI/UX
- **Responsive Design** - works on all devices
- **Dark/Light Mode** support
- **Modern UI** with Tailwind CSS
- **Smooth Animations** and transitions

## 🚀 Tech Stack

### Frontend
- **React 18** with Hooks and Context
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **Framer Motion** for animations
- **React Router** for navigation
- **Redux Toolkit** for state management
- **React i18next** for internationalization

### Backend
- **Node.js** with Express.js
- **Prisma ORM** with SQLite database
- **JWT** for authentication
- **Bcrypt** for password hashing
- **Nodemailer** for email functionality

### Database
- **SQLite** with Prisma migrations
- **User management** with secure authentication
- **Transaction storage** with relationships
- **Token management** for password resets

## 🛠️ Installation & Setup

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Git

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/finman-app.git
cd finman-app
```

### 2. Install Dependencies

#### Client (Frontend)
```bash
cd client
npm install
```

#### Server (Backend)
```bash
cd ../server
npm install
```

### 3. Environment Setup

#### Client Environment
Create `client/.env`:
```env
VITE_API_URL=http://localhost:5000
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

#### Server Environment
Create `server/.env`:
```env
DATABASE_URL="file:./prisma/dev.db"
JWT_SECRET=your_jwt_secret_key
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
```

### 4. Database Setup
```bash
cd server
npx prisma migrate dev
npx prisma generate
```

### 5. Run the Application

#### Start the Server
```bash
cd server
npm run dev
```

#### Start the Client
```bash
cd client
npm run dev
```

Visit `http://localhost:5173` to see the application!

## 📁 Project Structure

```
finman-app/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── features/       # Feature-specific components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── lib/            # Utilities and configurations
│   │   ├── locales/        # Translation files
│   │   ├── pages/          # Page components
│   │   ├── store/          # Redux store
│   │   └── main.jsx        # Entry point
│   ├── public/             # Static assets
│   └── package.json
├── server/                 # Node.js backend
│   ├── src/
│   │   ├── controllers/    # Route controllers
│   │   ├── middleware/     # Custom middleware
│   │   ├── routes/         # API routes
│   │   ├── utils/          # Utility functions
│   │   └── index.js        # Server entry point
│   ├── prisma/             # Database schema and migrations
│   └── package.json
└── README.md
```

## 🎯 Key Features Explained

### Real-time Budget Notifications
The app automatically monitors your spending against budget limits and shows notifications when:
- Budget is exceeded (100%+ spending)
- Budget is close to limit (80-99% spending)
- New transactions affect budget categories

### Multi-language Support
Complete translations in 3 languages with dynamic switching:
- 🇦🇱 Albanian (Shqip)
- 🇺🇸 English
- 🇩🇪 German (Deutsch)

### Responsive Design
- Mobile-first approach
- Works perfectly on phones, tablets, and desktops
- Touch-friendly interface
- Optimized performance

## 🔧 Available Scripts

### Client
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

### Server
```bash
npm run dev          # Start development server
npm start            # Start production server
npm run test         # Run tests
```

## 🚀 Deployment

### Frontend (Vercel/Netlify)
1. Build the client: `npm run build`
2. Deploy the `dist` folder
3. Set environment variables

### Backend (Railway/Heroku)
1. Set up environment variables
2. Run database migrations
3. Deploy the server code

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -m 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Your Name**
- GitHub: [@yourusername](https://github.com/yourusername)
- LinkedIn: [Your LinkedIn](https://linkedin.com/in/yourprofile)

## 🙏 Acknowledgments

- React team for the amazing framework
- Tailwind CSS for the utility-first CSS
- Prisma team for the excellent ORM
- All open-source contributors

---

⭐ **Star this repository if you found it helpful!**