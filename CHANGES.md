# Treasury Config Page Updates

## Changes Made

### 1. Updated Config Page UI
- Replaced number input fields with Melt UI Slider controls
- Added visual feedback with current values displayed prominently
- Improved UX with interactive sliders for all coin values and interest rate

### 2. Removed Starting Capital
- Removed `startingCapital` field from `FamilyConfig` schema
- Parents can now add initial capital as a transaction instead
- Updated API endpoints to exclude `startingCapital`

### 3. Updated Files
- `src/routes/config/+page.svelte` - Implemented Melt UI sliders
- `prisma/schema.prisma` - Removed `startingCapital` from FamilyConfig
- `src/routes/api/family/config/+server.ts` - Removed startingCapital handling
- `src/lib/services/api.ts` - Updated to use `/family/config` endpoint
- `prisma/seed.ts` - Removed obsolete Config model reference

### 4. Slider Ranges
- 1 Rupee Coin: 1-50 points
- 2 Rupee Coin: 1-100 points
- 50 Paisa Coin: 1-25 points
- 25 Paisa Coin: 1-10 points
- Weekly Interest Rate: 1-50%

## Next Steps

Run the following commands to apply changes:

```bash
# Apply database migration
yarn prisma db push

# Regenerate Prisma client
yarn prisma generate

# Restart development server
yarn dev
```
