# Treasury Technical Guidelines

## Project Structure
```
treasury/
├── src/
│   ├── lib/
│   │   ├── components/     # Reusable Svelte components
│   │   ├── services/       # API client and business logic
│   │   ├── stores/         # Svelte stores for state management
│   │   └── utils/          # Utility functions
│   ├── routes/
│   │   ├── api/           # SvelteKit API routes
│   │   ├── login/         # Authentication pages
│   │   ├── manage/        # Parent transaction management
│   │   ├── config/        # System configuration
│   │   └── +page.svelte   # Dashboard
│   └── app.html           # HTML template
├── prisma/
│   ├── schema.prisma      # Database schema
│   └── seed.ts           # Initial data seeding
└── docs/                 # Documentation
```

## Authentication System

### PIN Authentication
- **Format**: 4-digit numeric PIN
- **Storage**: bcrypt hashed in database
- **Session**: JWT tokens with configurable expiration
- **Roles**: PARENT and CHILD with role-based access control

### Biometric Authentication (WebAuthn)
- **Platform**: Device biometrics (TouchID, FaceID, Windows Hello)
- **Fallback**: PIN authentication always available
- **Storage**: Public key credentials in database
- **Security**: Platform authenticator with user verification required

## Frontend Architecture

### Views & Access Control

#### 1. Dashboard (Both Roles)
- **Child Access**: Balance display, transaction history (read-only)
- **Parent Access**: Same as child + navigation to management features
- **Features**: Real-time balance, recent transactions, responsive design

#### 2. Transaction Management (Parent Only)
- **Safety Mode**: Read-only toggle to prevent accidental transactions
- **Child Selection**: Multi-child support from single parent account
- **Activity Selection**: Predefined activities with default point values
- **Custom Amounts**: Override default values for flexibility
- **Interest Calculation**: One-click weekly savings bonus

#### 3. System Configuration (Parent Only)
- **Coin Values**: Configure point values for all coin types
- **Interest Rate**: Set weekly savings bonus percentage
- **Starting Capital**: Configure initial points for new users
- **Real-time Updates**: Changes apply immediately

### UI/UX Standards
- **Mobile-First**: Responsive design optimized for mobile devices
- **Touch-Friendly**: Large buttons and touch targets
- **Color Coding**: Transaction types visually distinguished
- **Loading States**: Clear feedback for all async operations
- **Error Handling**: User-friendly error messages

## Backend Architecture

### API Design
- **Framework**: SvelteKit API routes
- **Authentication**: JWT middleware for protected routes
- **Validation**: Input validation on all endpoints
- **Error Handling**: Consistent error response format

### Key Endpoints
```
POST /api/auth/login                    # PIN authentication
POST /api/auth/webauthn/generate-options # Biometric setup
POST /api/auth/webauthn/verify          # Biometric verification
GET  /api/wallet                        # Current balance
GET  /api/transactions                  # Transaction history
POST /api/transactions                  # Create transaction
GET  /api/activities                    # Predefined activities
GET  /api/users/children               # Child users (parent only)
GET  /api/config                       # System configuration
PUT  /api/config                       # Update configuration
POST /api/interest/calculate           # Weekly interest calculation
```

### Database Schema
- **Users**: Authentication, roles, balances
- **Transactions**: All point movements with full audit trail
- **Activities**: Predefined activities with categories and default values
- **Config**: System-wide configuration settings
- **WebAuthnCredentials**: Biometric authentication data
- **SavingsBonus**: Historical interest calculations

## Security Implementation
- **PIN Security**: bcrypt hashing with salt rounds
- **JWT Tokens**: Secure session management
- **Role-Based Access**: Endpoint-level authorization
- **WebAuthn**: FIDO2 compliant biometric authentication
- **Input Validation**: Server-side validation for all inputs
- **HTTPS**: Required for WebAuthn and production deployment

## Data Management
- **Real-time Updates**: Immediate balance updates after transactions
- **Transaction History**: Complete audit trail with timestamps
- **Backup Strategy**: Database backups through hosting provider
- **Data Retention**: Configurable through hosting provider settings

## Performance Considerations
- **Client-Side Caching**: Svelte stores for state management
- **Optimistic Updates**: UI updates before server confirmation
- **Lazy Loading**: Components loaded as needed
- **Database Indexing**: Optimized queries for transaction history