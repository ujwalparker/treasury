-- Migration script to convert old coin fields to new CurrencyModel structure
-- This should be run manually after schema changes

-- Step 1: Create CurrencyModel table (handled by prisma db push)

-- Step 2: Migrate existing FamilyConfig data to CurrencyModel
-- For each existing FamilyConfig, create corresponding CurrencyModel entries
INSERT INTO "CurrencyModel" (id, "configId", name, type, value, "sortOrder", "createdAt", "updatedAt")
SELECT 
  gen_random_uuid(),
  fc.id,
  '25 Paisa Coin',
  'COIN',
  fc."paisa25Value",
  1,
  NOW(),
  NOW()
FROM "FamilyConfig" fc
WHERE EXISTS (SELECT 1 FROM "FamilyConfig" WHERE id = fc.id)
ON CONFLICT DO NOTHING;

INSERT INTO "CurrencyModel" (id, "configId", name, type, value, "sortOrder", "createdAt", "updatedAt")
SELECT 
  gen_random_uuid(),
  fc.id,
  '50 Paisa Coin',
  'COIN',
  fc."paisa50Value",
  2,
  NOW(),
  NOW()
FROM "FamilyConfig" fc
WHERE EXISTS (SELECT 1 FROM "FamilyConfig" WHERE id = fc.id)
ON CONFLICT DO NOTHING;

INSERT INTO "CurrencyModel" (id, "configId", name, type, value, "sortOrder", "createdAt", "updatedAt")
SELECT 
  gen_random_uuid(),
  fc.id,
  '1 Rupee Coin',
  'COIN',
  fc."rupeeCoinValue",
  3,
  NOW(),
  NOW()
FROM "FamilyConfig" fc
WHERE EXISTS (SELECT 1 FROM "FamilyConfig" WHERE id = fc.id)
ON CONFLICT DO NOTHING;

INSERT INTO "CurrencyModel" (id, "configId", name, type, value, "sortOrder", "createdAt", "updatedAt")
SELECT 
  gen_random_uuid(),
  fc.id,
  '2 Rupee Coin',
  'COIN',
  fc."twoRupeeCoinValue",
  4,
  NOW(),
  NOW()
FROM "FamilyConfig" fc
WHERE EXISTS (SELECT 1 FROM "FamilyConfig" WHERE id = fc.id)
ON CONFLICT DO NOTHING;

-- Step 3: Drop old columns (handled by prisma db push after schema update)
