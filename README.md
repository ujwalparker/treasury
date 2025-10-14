# Treasury

A digital banking system for families to teach children financial responsibility and saving habits through a points-based reward system.

## Features

### Authentication & Security
- **4-Digit PIN Authentication**: Simple and secure PIN-based login for both parents and children
- **WebAuthn Biometric Support**: Optional fingerprint/face recognition login using device biometrics
- **Role-Based Access Control**: Separate parent and child user roles with appropriate permissions
- **JWT Token Authentication**: Secure session management

### Dashboard & Wallet
- **Balance Overview**: Real-time display of current bank points
- **Transaction History**: View recent transactions with type indicators (credit/debit/fine/spend/interest)
- **Mobile-Responsive Design**: Optimized for mobile devices with touch-friendly interface

### Parent Management Features
- **Read-Only Safety Mode**: Toggle between view-only and edit modes to prevent accidental transactions
- **Child Selection**: Manage multiple children from a single parent account
- **Transaction Recording**: Record various transaction types with predefined activities
- **Weekly Interest Calculation**: One-click savings bonus calculation based on current balance
- **System Configuration**: Customize coin values, interest rates, and starting capital

### Transaction System
- **Predefined Activities**: Pre-configured activities for common behaviors and privileges
- **Custom Amounts**: Override default point values for flexible transaction management
- **Activity Categories**: Organized by Daily Discipline, Core Responsibility, Exceptional Behavior, Infractions, and Privileges
- **Real-Time Balance Updates**: Instant balance updates after transaction recording

## Tech Stack

- **Frontend**: SvelteKit with TypeScript and Tailwind CSS
- **Backend**: SvelteKit API routes with server-side rendering
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT tokens with WebAuthn biometric support
- **Deployment**: Render with Node.js adapter

## Local Development

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd treasury
   ```

2. **Install dependencies**
   ```bash
   yarn install
   ```

3. **Environment Setup**
   - Copy `.env.example` to `.env`
   - Configure `DATABASE_URL` for PostgreSQL
   - Set a secure `JWT_SECRET`

4. **Database Setup**
   ```bash
   npx prisma db push
   npx prisma db seed
   ```

5. **Start Development Server**
   ```bash
   yarn dev
   ```

6. **Access Application**
   - Open [http://localhost:5173](http://localhost:5173)
   - Use default credentials below to login

## Default Login

- **Parent**:
  - Name: Parent
  - PIN: 1234

- **Child**:
  - Name: Child
  - PIN: 1234

## System Architecture

### Points System
The Treasury uses a configurable points-based currency system:
- **1 Rupee Coin** = 10 Points (configurable)
- **2 Rupee Coin** = 20 Points (configurable)
- **50 Paisa Coin** = 5 Points (configurable)
- **25 Paisa Coin** = 2 Points (configurable)
- **Starting Capital** = 480 Points (configurable)
- **Weekly Interest Rate** = 10% (configurable)

### Transaction Types
- **CREDIT** (+): Points earned for positive behaviors and completed tasks
- **DEBIT** (-): Points spent on privileges and rewards
- **FINE** (-): Points deducted for negative behaviors
- **SPEND** (-): Planned purchases and treats
- **INTEREST** (+): Weekly savings bonus based on current balance

### Predefined Activities

#### Positive Behaviors (Credits)
- **Daily Discipline** (2-5 points): Making bed, brushing teeth, Bible reading, following schedule
- **Core Responsibility** (5-10 points): Completing studies, writing practice, helping with chores
- **Exceptional Behavior** (5-10 points): Helping siblings, showing respect, hobby time

#### Negative Behaviors (Fines)
- **Minor Infractions** (5 points): Wasting time, not following schedule
- **Major Infractions** (10-15 points): Disobedience, disrespectful responses

#### Privileges (Spending)
- **Screen Time** (20 points): 30 minutes of TV/device time
- **Play Area Visit** (40 points): Trip to playground or play area
- **Treats** (60 points): Planned junk food or special treats

### Parent Dashboard Features
- **Safety Mode Toggle**: Read-only mode prevents accidental transactions
- **Multi-Child Management**: Handle multiple children from single parent account
- **Custom Transaction Amounts**: Override default point values when needed
- **One-Click Interest**: Calculate and apply weekly savings bonuses
- **System Configuration**: Adjust all point values and system settings

### Child Dashboard Features
- **Balance Display**: Current points with visual balance card
- **Transaction History**: Recent activity with color-coded transaction types
- **Read-Only Access**: Children can view but not modify their accounts

## Database Schema

The application uses Prisma ORM with the following key models:
- **User**: Stores user information, roles, PIN hashes, and current balances
- **Transaction**: Records all point transactions with type, amount, and activity details
- **Activity**: Predefined activities with default point values and categories
- **Config**: System-wide configuration for coin values and interest rates
- **WebAuthnCredential**: Biometric authentication credentials
- **SavingsBonus**: Historical record of interest calculations

## API Endpoints

### Authentication APIs

#### Auth.js Session
- `GET /api/auth/session` - Get current Auth.js session

#### PIN Authentication
- `POST /api/auth/sessions` - Create PIN session or verify PIN
  - Body: `{ email, pin }` - Create new session
  - Body: `{ pin, verify: true }` - Verify current session PIN

#### User Lookup
- `GET /api/auth/users?email={email}` - Get users by email

#### WebAuthn (Biometric)
- `POST /api/auth/web-authn` - Generate WebAuthn options or verify credentials
  - Body: `{ username }` - Generate registration/authentication options
  - Body: `{ username, id, rawId, type, response, verify: true }` - Verify credential

### Family Management APIs

#### Families (RESTful)
- `GET /api/families` - Get current user's family data
- `POST /api/families` - Create or update family
  - Body: `{ name, theme, interests }`
- `GET /api/families/children` - Get children in family
- `POST /api/families/children` - Add child to family
  - Body: `{ name, email?, pin, yearOfBirth? }`
- `PATCH /api/families/children` - Bulk update children
  - Body: `{ children: [{ id, yearOfBirth }, ...] }`
- `DELETE /api/families/children/{childId}` - Delete child
- `DELETE /api/families/children/{childId}/pin` - Clear child PIN
- `GET /api/families/me/setup` - Check if family setup is complete
- `GET /api/families/me/activities` - Get predefined activities (parent only)
- `GET /api/families/me/config` - Get family currency config
- `PUT /api/families/me/config` - Update family currency config
  - Body: `{ interestRate, currencyModels?, currencyTemplateId? }`

#### Family AI Services
- `GET /api/families/names?tags={tags}&theme={theme}` - Generate AI family names
- `GET /api/families/wordcloud?parentName={name}&theme={theme}` - Generate AI word cloud

#### Family Verification
- `GET /api/families/verify` - Start parent verification and get first question
- `POST /api/families/verify` - Submit answer and get next question or result
  - Body: `{ questionIndex, selectedIndex }`

### Transaction APIs

#### User Transactions (RESTful)
- `GET /api/users/me/transactions` - Get current user's transactions
- `GET /api/users/[userId]/transactions` - Get specific user's transactions (parent can access children)
- `POST /api/users/[userId]/transactions` - Create transaction for user
  - Body: `{ type, amount, activity, category }`

### User Management APIs

#### Current User
- `GET /api/users/me` - Get current user profile
- `PUT /api/users/me/pin` - Update user PIN
  - Body: `{ pin: "1234" }`
- `GET /api/users/me/wallet` - Get current user wallet balance

### Currency Templates

- `GET /api/templates` - Get all currency templates with models

### Admin APIs

#### System Configuration
- `GET /api/config` - Get admin config (LLM settings, etc.) - ADMIN only
- `PUT /api/config` - Update admin config - ADMIN only
  - Body: `{ defaultLlmProvider?, groqApiKey?, geminiApiKey?, groqModel?, geminiModel?, verificationKeywords? }`
- `GET /api/config/models` - Get available LLM models - ADMIN only

### Cron/Scheduled APIs

- `POST /api/cron/interest` - Calculate interest for all users
  - Requires: `Authorization: Bearer {CRON_SECRET}`

### API Usage Notes

#### Authentication
- Most APIs require Auth.js session (Google OAuth)
- PIN session stored in `pin-session` cookie
- Some endpoints support JWT Bearer tokens

#### Role-Based Access
- **PARENT**: Full access to family management, children, transactions, activities
- **CHILD**: Limited to own wallet and transactions
- **ADMIN**: Access to system configuration and currency templates

#### Common Patterns
- All POST/PUT requests use `Content-Type: application/json`
- All endpoints return JSON responses
- Error responses: `{ error: "message" }`
- Success responses vary by endpoint

## Deployment

### Prerequisites

1. A [Render account](https://render.com)
2. Your code pushed to a Git repository (GitHub, GitLab, etc.)

### Automatic Deployment via Blueprint

1. Log in to your Render dashboard
2. Click on "New" and select "Blueprint"
3. Connect your Git repository
4. Select the repository containing the Treasury application
5. Render will automatically detect the `render.yaml` configuration and create:
   - Web service for the application
   - Cron job for automatic interest calculation (runs daily at midnight)
6. Update the cron job URL in `render.yaml` to match your actual Render app URL
7. Click "Apply" to start the deployment

### Manual Deployment

If you prefer to configure services manually:

1. **Create a PostgreSQL database:**
   - In the Render dashboard, click on "New" and select "PostgreSQL"
   - Name: treasury-db
   - Database: treasury
   - User: treasury
   - Region: (select nearest)
   - Plan: Free

2. **Create a Web Service:**
   - Click on "New" and select "Web Service"
   - Connect your repository
   - Name: treasury
   - Build Command: `yarn install && npx prisma generate && yarn build`
   - Start Command: `npx prisma db push && npx prisma db seed && node build`
   - Plan: Free
   - Add the following environment variables:
     - NODE_ENV: production
     - DATABASE_URL: (copy from your PostgreSQL instance)
     - JWT_SECRET: (generate a secure random string)

### Post-Deployment

After successful deployment:

1. The application should be available at your Render URL (e.g., `https://treasury-rhi2.onrender.com`)
2. Default login credentials:
   - Parent: PIN 1234
   - Child: PIN 1234

### Troubleshooting

- **Database Connection Issues**: Verify the DATABASE_URL environment variable is correctly set and that the database is running
- **Build Failures**: Check build logs for specific errors
- **Deployment Timeouts**: Render free tier has limited resources, so the initial build might take some time
- **Cold Starts**: Free tier instances spin down after periods of inactivity, which may cause a delay on the first request