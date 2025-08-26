# 🌱 Scrapless Mobile

An intelligent food waste reduction platform that helps users track their pantry, reduce food waste, and save money through AI-powered insights and recommendations.

## 🔗 Live Application

**Access the app**: https://studio--scrapless-bzy61.us-central1.hosted.app/ 

> 📱 **Best Experience**: For optimal functionality, please access this application on your mobile phone. The app is designed as a mobile-first experience and works best on smartphones for features like camera scanning, voice input, and on-the-go pantry management.

## 📖 Overview

Scrapless is a comprehensive mobile web application designed to combat food waste while helping users save money. The platform combines real-world data tracking with AI-powered analytics to provide personalized insights, recipe suggestions, and shopping recommendations.

### Key Features

- **Smart Pantry Management**: Track food items with AI-powered expiration predictions
- **Waste Logging**: Record and analyze food waste patterns with multiple input methods (camera, voice, text)
- **AI Kitchen Coach**: Get personalized insights and actionable solutions to reduce waste
- **Recipe Suggestions**: AI-generated recipes based on available ingredients and expiring items
- **Smart Shopping Lists**: Data-driven shopping recommendations to prevent future waste
- **Virtual Savings Tracking**: Monitor financial savings from waste reduction efforts
- **Real-time Analytics**: Comprehensive insights into consumption patterns and environmental impact

## 🛠 Tech Stack

### Frontend
- **Framework**: Next.js 15.3.3 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS with custom design system
- **UI Components**: Radix UI primitives with custom components
- **Animations**: Framer Motion
- **Charts**: Recharts for data visualization
- **State Management**: Zustand for client-side state

### Backend & AI
- **AI Framework**: Google Genkit with Gemini 2.5 Pro
- **Database**: Firebase Firestore with offline persistence
- **Authentication**: Firebase Auth with session management
- **Cloud Functions**: Firebase Functions (Node.js 20)
- **AI Flows**: 14+ specialized AI workflows for different features

### Development Tools
- **Build Tool**: Turbopack (development)
- **Package Manager**: npm
- **Type Checking**: TypeScript with strict mode
- **Linting**: ESLint with Next.js configuration

## 🏗 Project Structure

```
src/
├── ai/                     # AI workflows and Genkit configuration
│   ├── flows/             # Specialized AI flows (14 different flows)
│   ├── genkit.ts          # Genkit configuration
│   └── schemas.ts         # Zod schemas for AI inputs/outputs
├── app/                   # Next.js App Router pages
│   ├── dashboard/         # Main dashboard page
│   ├── pantry/           # Pantry management
│   ├── my-waste/         # Waste analytics
│   ├── kitchen-coach/    # AI insights and recommendations
│   ├── cook-shop/        # Recipe and shopping features
│   └── [other pages]/
├── components/           # Reusable React components
│   ├── ui/              # Base UI components (shadcn/ui)
│   ├── dashboard/       # Dashboard-specific components
│   ├── pantry/          # Pantry-related components
│   ├── auth/            # Authentication components
│   └── assistant/       # AI chat assistant
├── hooks/               # Custom React hooks
├── lib/                 # Utility functions and configurations
├── stores/              # Zustand state management
├── types/               # TypeScript type definitions
└── services/            # External service integrations
```

## 🚀 Getting Started

### Prerequisites

- Node.js 20 or higher
- npm or yarn package manager
- Firebase project with Firestore and Authentication enabled
- Google AI API key for Genkit

### Environment Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd Scrapless_mobile
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
# Create .env.local file with:
GOOGLE_GENAI_API_KEY=your_google_ai_api_key
# Firebase config is in src/lib/firebase.ts
```

4. Configure Firebase:
   - Update the Firebase configuration in `src/lib/firebase.ts`
   - Set up Firestore security rules (see `firestore.rules`)
   - Enable Authentication providers

### Development

Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:9002`

### AI Development

Run Genkit in development mode:
```bash
npm run genkit:dev
```

This starts the Genkit developer UI for testing AI flows.

### Build for Production

```bash
npm run build
npm run start
```

## 🤖 AI Features

Scrapless leverages Google's Gemini 2.5 Pro through Genkit for various AI-powered features:

### AI Flows

1. **Food Waste Logging**: Extract food items from photos, voice, or text
2. **Pantry Item Logging**: Smart detection of groceries with shelf-life predictions
3. **Recipe Suggestions**: Generate personalized recipes based on available ingredients
4. **Kitchen Coach Analysis**: Analyze consumption patterns and provide insights
5. **Shopping List Generation**: Create smart shopping lists based on usage patterns
6. **Chat Assistant**: Conversational AI for food-related questions
7. **Waste Pattern Analysis**: Identify hidden patterns in waste behavior
8. **Item-specific Insights**: Storage tips and recipe suggestions for specific items

### AI Schemas

All AI interactions are type-safe using Zod schemas defined in `src/ai/schemas.ts`, covering:
- Input/output validation for all AI flows
- Complex data structures for recipes, insights, and analytics
- Comprehensive error handling and type safety

## 🗄 Database Schema

The application uses Firebase Firestore with the following main collections:

### Users Collection Structure
```
users/{userId}/
├── settings/           # User preferences and configuration
├── pantryItems/       # Current and archived pantry items
├── wasteLogs/         # Food waste tracking records
├── savingsEvents/     # Virtual savings calculations
├── recipes/           # Saved and generated recipes
├── shoppingLists/     # AI-generated shopping lists
└── greenPointsEvents/ # Gamification points tracking
```

### Security Rules
- Users can only access their own data (`userId` matches `auth.uid`)
- All reads/writes require authentication
- Offline persistence enabled for better UX

## 🎨 Design System

### Color Palette
- **Primary**: Green theme reflecting sustainability
- **Secondary**: Complementary colors for different data types
- **Chart Colors**: Consistent color scheme for data visualization

### Typography
- **Primary Font**: Inter (body text)
- **Headlines**: Inter with various weights
- **Code**: Monospace for technical content

### Component Architecture
- Built on Radix UI primitives for accessibility
- Consistent spacing and sizing using Tailwind classes
- Custom variants using `class-variance-authority`
- Responsive design with mobile-first approach

## 📊 Key Components

### Dashboard
- Real-time impact tracking (savings, carbon footprint)
- Quick action buttons for common tasks
- Smart notifications and insights
- Progress tracking towards savings goals

### Pantry Management
- Visual grid of pantry items with expiration indicators
- Smart categorization and filtering
- Bulk operations and item editing
- Integration with recipe suggestions

### Waste Analytics
- Interactive charts showing waste patterns
- Time-series analysis with configurable timeframes
- Category breakdowns and trend analysis
- Actionable insights based on patterns

### Kitchen Coach
- AI-powered pattern analysis
- Personalized action plans
- Solution tracking and progress monitoring
- Gamification elements for engagement

## 🔧 Configuration Files

### Next.js Configuration (`next.config.ts`)
- TypeScript and ESLint error ignoring for builds
- Image optimization for external domains
- Custom routing and middleware setup

### Tailwind Configuration (`tailwind.config.ts`)
- Custom color system with CSS variables
- Extended theme for consistent design
- Animation utilities
- Component-specific styling

### Firebase Configuration
- Firestore offline persistence
- Authentication with session management
- Security rules for data protection

## 📈 Analytics & Insights

The platform provides comprehensive analytics including:

### Performance Metrics
- Pantry health score (0-100)
- Waste reduction percentage
- Virtual savings accumulation
- Environmental impact (CO2e tracking)

### Pattern Recognition
- Consumption velocity by food category
- Waste lag time analysis
- Seasonal consumption patterns
- Shopping behavior insights

### Predictive Features
- Expiration date estimation using AI
- Waste risk prediction
- Shopping recommendation timing
- Budget optimization suggestions

## 🌍 Environmental Impact

Scrapless tracks and displays environmental metrics:
- Carbon footprint calculation for food waste
- Water savings from waste reduction
- Equivalent environmental impact visualizations
- Sustainability score tracking

## 🔐 Security & Privacy

### Data Protection
- Firebase Authentication with secure session management
- Client-side encryption for sensitive data
- Firestore security rules enforcing user data isolation
- GDPR-compliant data handling

### AI Privacy
- No personal data sent to AI models beyond necessary context
- Local data processing where possible
- Transparent AI decision-making with explanations
- User control over AI feature usage

## 🚀 Deployment

### Firebase Hosting
The application is configured for deployment on Firebase Hosting:
```bash
firebase deploy
```

### Environment Requirements
- Firebase project with Firestore, Auth, and Functions enabled
- Google AI API access for Genkit
- Proper environment variable configuration

## 🤝 Contributing

1. Follow the established code structure and naming conventions
2. Add comprehensive TypeScript types for new features
3. Include Zod schemas for any AI-related functionality
4. Write component documentation and prop interfaces
5. Test across different screen sizes and devices

## 📄 License

This project is part of the Scrapless ecosystem for reducing food waste through technology.

---

**Built with ❤️ for sustainability and food waste reduction**
