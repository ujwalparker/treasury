# Treasury Infrastructure Guidelines

## Deployment Platform
- **Primary**: Render Hobby Plan (zero-cost)
- **Alternative**: Any Node.js compatible platform

## Tech Stack Requirements
- **Runtime**: Node.js (supported by Render free tier)
- **Framework**: SvelteKit with Node.js adapter
- **Database**: PostgreSQL (Render provides free PostgreSQL)
- **ORM**: Prisma (lightweight, no additional infrastructure)

## Database Strategy
- **Production**: PostgreSQL on Render (free tier: 1GB storage, 1 month retention)
- **Development**: SQLite (schema compatible with PostgreSQL)
- **Migration**: Prisma handles schema compatibility between SQLite/PostgreSQL

## Cost Structure
- **Total Infrastructure Cost**: $0
- **Render Web Service**: Free (750 hours/month)
- **Render PostgreSQL**: Free (1GB storage)
- **Domain**: Uses Render subdomain (free)

## Deployment Configuration
```yaml
# render.yaml
services:
  - type: web
    name: treasury
    env: node
    plan: free
    buildCommand: npm install && npx prisma generate && npm run build
    startCommand: npx prisma db push && npx prisma db seed && node build
    
  - type: pserv
    name: treasury-db
    plan: free
    databaseName: treasury
    user: treasury
```

## Environment Variables
```bash
DATABASE_URL=postgresql://user:pass@host:port/db
JWT_SECRET=secure-random-string
NODE_ENV=production
```

## Limitations & Considerations
- **Free Tier Limits**: 750 hours/month, spins down after 15min inactivity
- **Database**: 1GB storage, 1 month retention on free tier
- **Performance**: Cold starts after inactivity periods
- **Scaling**: Upgrade to paid plans for production use

## Security
- JWT tokens for session management
- bcrypt for PIN hashing
- WebAuthn for biometric authentication
- Environment variables for secrets