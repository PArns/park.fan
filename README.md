# 🎢 Park.Fan Dashboard

A modern, responsive Next.js 15 dashboard for real-time theme park statistics and analytics.

## ✨ Features

- **Real-time Statistics** - Live data from theme parks worldwide
- **Modern UI/UX** - Clean, responsive design with Tailwind CSS
- **Dark/Light Mode** - Automatic theme switching with user preference
- **Wait Time Rankings** - Top 3 busiest and quietest rides globally
- **Park Rankings** - Best performing theme parks by continent
- **Global Coverage** - Statistics from parks across all continents
- **Interactive Charts** - Visualize wait times and park data
- **Mobile Optimized** - Perfect experience on all devices
- **Localized Formatting** - Dates, times, and numbers in your local format
- **Search with Autocomplete** - Quickly find parks and rides

## 🚀 Tech Stack

- **Framework**: Next.js 15 with App Router
- **Styling**: Tailwind CSS with custom theme system
- **UI Components**: Custom component library with class-variance-authority
- **Icons**: Lucide React
- **Fonts**: Geist Sans & Geist Mono
- **Theme**: next-themes for dark/light mode
- **Analytics**: Vercel Analytics

## 📊 Data Sources

- **API**: [park.fan API](https://api.park.fan/statistics)
- **Coverage**: Theme parks from all continents
- **Update Frequency**: Real-time data updates every 5 minutes
- **Metrics**: Wait times, park operations, global statistics, ride rankings
- **Ride Data**: Individual ride wait times with longest/shortest rankings

## �️ Development

### Prerequisites

- Node.js 18+
- pnpm (recommended package manager)

### Installation

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to view the dashboard.

- **📱 Mobile-First** - Optimiert für die Nutzung unterwegs

## 🚀 Development

This project uses [Next.js 15](https://nextjs.org) with TypeScript and Tailwind CSS.

### Prerequisites

- [Node.js](https://nodejs.org) (Version 18 or higher)
- [pnpm](https://pnpm.io) as Package Manager

### Installation

1. Clone the repository:

```bash
git clone https://github.com/PArns/park.fan.git
cd park.fan
```

2. Install dependencies:

```bash
pnpm install
```

3. Start development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Available Scripts

```bash
pnpm dev          # Start development server
pnpm prebuild     # Generate build info (automatically run before build)
pnpm build        # Create production build
pnpm start        # Start production server
pnpm lint         # Run code linting
pnpm format       # Format code with Prettier
```

## 🔧 Build System

The project includes an automatic build information system that generates version details:

- **Version**: From package.json
- **Build Number**: Git commit count (local) or timestamp-based (Vercel)
- **Build Date**: Automatically generated
- **Git Hash**: Commit hash from git or Vercel environment

### Vercel Deployment

This project is optimized for Vercel deployment. The build system automatically detects Vercel environment and uses appropriate methods to generate build information even with shallow git clones.

**Environment Variables (Vercel)**:

- `VERCEL_GIT_COMMIT_SHA` - Used for git hash and build number generation
- `VERCEL_ENV` - Deployment environment detection

## 🛠 Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS with CSS Variables
- **UI Components:** Custom component library with class-variance-authority
- **Theme:** next-themes for dark/light mode switching
- **Package Manager:** pnpm
- **Deployment:** Vercel (recommended)

## 📁 Project Structure

```
park.fan/
├── app/                      # Next.js App Router
│   ├── analytics/           # Analytics page
│   ├── api/                 # API routes
│   ├── globals.css          # Global styles with theme variables
│   ├── layout.tsx           # Root layout with SEO meta tags
│   ├── page.tsx             # Homepage
│   └── sitemap.ts           # Dynamic sitemap generation
├── components/              # Reusable UI components
│   ├── layout/             # Layout components (Header, Footer, etc.)
│   └── ui/                 # UI components (Button, Card, etc.)
├── lib/                    # Utility functions and API
│   ├── api.ts              # API functions and data transformation
│   ├── api-types.ts        # TypeScript types for API data
│   └── build-info.ts       # Auto-generated build information
├── public/                 # Static assets
│   ├── manifest.json       # PWA manifest
│   └── robots.txt          # SEO robots file
├── scripts/                # Build scripts
│   └── generate-build-info.js # Build info generation script
└── package.json            # Project dependencies and scripts
```

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the [MIT License](LICENSE).

## 👨‍💻 Creator

Developed by **Patrick Arns**

- Portfolio: [arns.dev](https://arns.dev)
- GitHub: [@PArns](https://github.com/PArns)

## 📞 Contact

For questions or suggestions, reach us at:

- Website: [park.fan](https://park.fan)
- Email: hello@park.fan

---

**Status:** 🚧 Under Construction - Coming Soon!
