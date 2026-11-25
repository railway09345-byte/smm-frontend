# aminoid Social AI Studio — React.js + Vite Platform

An autonomous AI-powered multi-channel social media content generation, approval governance, and scheduling platform built with React.js, React Router, and Vite.

## 📁 Project Structure

```
social-ai-platform/
├── public/                  # Public assets (images, icons, fonts)
│   ├── fonts/
│   ├── icons/
│   └── images/
├── src/
│   ├── assets/              # Component-level static assets
│   │   ├── fonts/
│   │   ├── icons/
│   │   └── images/
│   ├── components/          # Modular, reusable React components
│   │   ├── common/          # Toast, Badges, Modals, Buttons
│   │   │   └── Toast.jsx
│   │   ├── layout/          # Application headers & footers
│   │   │   ├── Navbar.jsx
│   │   │   └── Footer.jsx
│   │   └── ui/              # Rich interactive visual elements
│   │       └── MediaArtwork.jsx
│   ├── contexts/            # Global state providers
│   │   ├── AuthContext.jsx  # Authentication, demo sessions & membership
│   │   └── ContentContext.jsx # Brand content library, approvals & scheduling
│   ├── pages/               # Top-level view routes
│   │   ├── HomePage.jsx     # Public landing page with live interactive demo
│   │   ├── AuthPage.jsx     # Sign In, Sign Up, Forgot Password, OTP & Reset
│   │   ├── PricingPage.jsx  # Membership tiers ($29, $79, $199) & renewal simulator
│   │   ├── OnboardingPage.jsx # 3-step brand profile onboarding wizard
│   │   └── DashboardPage.jsx # 12-view daily planner, content studio & approval hub
│   ├── routes/              # Client-side routing configuration
│   │   └── AppRoutes.jsx
│   ├── services/            # API client and mock data layer
│   │   ├── api.js
│   │   └── mediaArtwork.jsx
│   ├── styles/              # Design system & modular stylesheets
│   │   ├── animations.css
│   │   ├── components.css
│   │   ├── global.css
│   │   ├── index.css
│   │   ├── layout.css
│   │   ├── reset.css
│   │   ├── responsive.css
│   │   └── variables.css
│   ├── utils/               # Utilities & storage wrappers
│   │   ├── formatters.js
│   │   └── storage.js
│   ├── App.jsx              # Main app wrapper with context providers
│   └── main.jsx             # React DOM root entrypoint
├── .env.example             # Environment variable schema
├── .gitignore               # Standard gitignore
├── index.html               # Vite HTML entry point
├── package.json             # Dependencies & scripts
└── vite.config.js           # Vite configuration with React plugin
```

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Local Development Server
```bash
npm run dev
```

### 3. Build for Production
```bash
npm run build
```

## 🌟 Key Features
- **Zero-Prompt AI Daily Planner**: Autonomous batch generation for Images, Reels, and Text Posts tailored to aminoid brand profile.
- **Real-Time Content Studio**: Interactive headline, caption, hashtag, and CTA editor with live visual simulator.
- **Approval-First Governance Hub**: 7-stage review queue ensuring only approved content enters the Content Calendar.
- **Multi-Channel Management**: Connected Instagram, Facebook, YouTube, and LinkedIn workflows.
