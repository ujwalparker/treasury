import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Define constants for the string-based enums
const Role = {
  PARENT: 'PARENT',
  CHILD: 'CHILD'
};

const TransactionType = {
  CREDIT: 'CREDIT',
  DEBIT: 'DEBIT',
  FINE: 'FINE',
  SPEND: 'SPEND',
  INTEREST: 'INTEREST'
};

const ActivityCategory = {
  DAILY_DISCIPLINE: 'DAILY_DISCIPLINE',
  CORE_RESPONSIBILITY: 'CORE_RESPONSIBILITY',
  EXCEPTIONAL_BEHAVIOR: 'EXCEPTIONAL_BEHAVIOR',
  MINOR_INFRACTION: 'MINOR_INFRACTION',
  MAJOR_INFRACTION: 'MAJOR_INFRACTION',
  PRIVILEGE: 'PRIVILEGE',
  INTEREST: 'INTEREST'
};

async function main() {
  // Create default currency template
  const adminConfig = await prisma.adminConfig.upsert({
    where: { id: 'default-admin-config' },
    update: {},
    create: { id: 'default-admin-config' }
  });

  const inrTemplate = await prisma.currencyTemplate.upsert({
    where: { code: 'INR' },
    update: {},
    create: {
      name: 'Indian Rupee',
      code: 'INR',
      isDefault: true,
      adminConfigId: adminConfig.id
    }
  });

  const currencyModels = [
    { name: '25 Paisa Coin', type: 'COIN', value: 2, sortOrder: 1 },
    { name: '50 Paisa Coin', type: 'COIN', value: 5, sortOrder: 2 },
    { name: '1 Rupee Coin', type: 'COIN', value: 10, sortOrder: 3 },
    { name: '2 Rupee Coin', type: 'COIN', value: 20, sortOrder: 4 },
    { name: '5 Rupee Coin', type: 'COIN', value: 50, sortOrder: 5 },
    { name: '10 Rupee Note', type: 'NOTE', value: 100, sortOrder: 6 },
    { name: '20 Rupee Note', type: 'NOTE', value: 200, sortOrder: 7 },
    { name: '50 Rupee Note', type: 'NOTE', value: 500, sortOrder: 8 },
    { name: '100 Rupee Note', type: 'NOTE', value: 1000, sortOrder: 9 },
  ];

  for (const cm of currencyModels) {
    await prisma.currencyTemplateModel.upsert({
      where: { id: `${inrTemplate.id}-${cm.name}` },
      update: cm,
      create: { id: `${inrTemplate.id}-${cm.name}`, templateId: inrTemplate.id, ...cm }
    });
  }

  // Create predefined activities
  // Daily Discipline activities
  await createActivity('Making bed in the morning', 'Daily discipline task', TransactionType.CREDIT, 2, ActivityCategory.DAILY_DISCIPLINE);
  await createActivity('Brushing teeth (morning & night)', 'Daily discipline task', TransactionType.CREDIT, 2, ActivityCategory.DAILY_DISCIPLINE);
  await createActivity('Daily Bible Reading / The Daily Bread', 'Daily discipline task', TransactionType.CREDIT, 3, ActivityCategory.DAILY_DISCIPLINE);
  await createActivity('Following the day\'s schedule on time', 'Daily discipline task', TransactionType.CREDIT, 5, ActivityCategory.DAILY_DISCIPLINE);
  
  // Core Responsibilities
  await createActivity('Completing all scheduled study/revision', 'Core responsibility', TransactionType.CREDIT, 10, ActivityCategory.CORE_RESPONSIBILITY);
  await createActivity('Completing writing practice (Hindi/English)', 'Core responsibility', TransactionType.CREDIT, 10, ActivityCategory.CORE_RESPONSIBILITY);
  await createActivity('Helping with a daily chore', 'Core responsibility', TransactionType.CREDIT, 5, ActivityCategory.CORE_RESPONSIBILITY);
  
  // Exceptional Behavior
  await createActivity('Playing with/helping sister without being asked', 'Exceptional behavior', TransactionType.CREDIT, 10, ActivityCategory.EXCEPTIONAL_BEHAVIOR);
  await createActivity('Showing outstanding respect to parents/elders', 'Exceptional behavior', TransactionType.CREDIT, 5, ActivityCategory.EXCEPTIONAL_BEHAVIOR);
  await createActivity('Working on a hobby for 30 mins', 'Exceptional behavior', TransactionType.CREDIT, 5, ActivityCategory.EXCEPTIONAL_BEHAVIOR);
  
  // Minor Infractions
  await createActivity('Wasting time', 'Minor infraction', TransactionType.FINE, 5, ActivityCategory.MINOR_INFRACTION);
  await createActivity('Not following the schedule', 'Minor infraction', TransactionType.FINE, 5, ActivityCategory.MINOR_INFRACTION);
  
  // Major Infractions
  await createActivity('Disobedience (Not listening when told once)', 'Major infraction', TransactionType.FINE, 10, ActivityCategory.MAJOR_INFRACTION);
  await createActivity('Replying back with a disrespectful answer', 'Major infraction', TransactionType.FINE, 15, ActivityCategory.MAJOR_INFRACTION);
  
  // Privileges
  await createActivity('30 minutes of TV / Screen Time', 'Privilege', TransactionType.SPEND, 20, ActivityCategory.PRIVILEGE);
  await createActivity('A trip to the Play Area', 'Privilege', TransactionType.SPEND, 40, ActivityCategory.PRIVILEGE);
  await createActivity('Eating Junk Food (a specific, planned treat)', 'Privilege', TransactionType.SPEND, 60, ActivityCategory.PRIVILEGE);
  
  // Interest
  await createActivity('Weekly Savings Bonus', 'Weekly 10% interest on savings', TransactionType.INTEREST, 0, ActivityCategory.INTEREST);

  console.log('Seed data created successfully');
}

async function createActivity(
  name: string,
  description: string,
  type: string,
  amount: number,
  category: string
) {
  const id = `${name.replace(/[^a-zA-Z0-9]/g, '-')}-${type}`;
  
  await prisma.activity.upsert({
    where: { id },
    update: {
      amount,
      description,
      category
    },
    create: {
      id,
      name,
      description,
      type,
      amount,
      category
    }
  });
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
