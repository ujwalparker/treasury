# Treasury API Endpoints

## Authentication APIs

### Auth.js Session
- `GET /api/auth/session` - Get current Auth.js session

### PIN Authentication
- `POST /api/auth/sessions` - Create PIN session or verify PIN
  - Body: `{ email, pin }` - Create new session
  - Body: `{ pin, verify: true }` - Verify current session PIN

### User Lookup
- `GET /api/auth/users?email={email}` - Get users by email

### WebAuthn (Biometric)
- `POST /api/auth/web-authn` - Generate WebAuthn options or verify credentials
  - Body: `{ username }` - Generate registration/authentication options
  - Body: `{ username, id, rawId, type, response, verify: true }` - Verify credential

## Family Management APIs

### Families (RESTful)
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

### Family AI Services
- `GET /api/families/names?tags={tags}&theme={theme}` - Generate AI family names
- `GET /api/families/wordcloud?parentName={name}&theme={theme}` - Generate AI word cloud



## Transaction APIs

### User Transactions (RESTful)
- `GET /api/users/me/transactions` - Get current user's transactions
- `GET /api/users/[userId]/transactions` - Get specific user's transactions (parent can access children)
- `POST /api/users/[userId]/transactions` - Create transaction for user
  - Body: `{ type, amount, activity, category }`

## User Management APIs

### Current User
- `GET /api/users/me` - Get current user profile
- `PUT /api/users/me/pin` - Update user PIN
  - Body: `{ pin: "1234" }`
- `GET /api/users/me/wallet` - Get current user wallet balance

## Currency Templates

- `GET /api/templates` - Get all currency templates with models

## Admin APIs

### System Configuration
- `GET /api/config` - Get admin config (LLM settings, etc.) - ADMIN only
- `PUT /api/config` - Update admin config - ADMIN only
  - Body: `{ defaultLlmProvider?, groqApiKey?, geminiApiKey?, groqModel?, geminiModel?, verificationKeywords? }`
- `GET /api/config/models` - Get available LLM models - ADMIN only

## Cron/Scheduled APIs

- `POST /api/cron/interest` - Calculate interest for all users
  - Requires: `Authorization: Bearer {CRON_SECRET}`

### Family Verification
- `GET /api/families/verify` - Start parent verification and get first question
- `POST /api/families/verify` - Submit answer and get next question or result
  - Body: `{ questionIndex, selectedIndex }`

## API Usage Notes

### Authentication
- Most APIs require Auth.js session (Google OAuth)
- PIN session stored in `pin-session` cookie
- Some endpoints support JWT Bearer tokens

### Role-Based Access
- **PARENT**: Full access to family management, children, transactions, activities
- **CHILD**: Limited to own wallet and transactions
- **ADMIN**: Access to system configuration and currency templates

### Common Patterns
- All POST/PUT requests use `Content-Type: application/json`
- All endpoints return JSON responses
- Error responses: `{ error: "message" }`
- Success responses vary by endpoint

### Migration Status
- ✅ RESTful endpoints available under `/api/families/*` and `/api/users/*`
- ✅ Parent verification endpoints migrated to RESTful pattern
- ✅ Legacy `/api/family` POST endpoint removed (all actions migrated)
