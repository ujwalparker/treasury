import { prisma } from '$lib/server/prisma';

export async function calculateInterestForAllUsers() {
  try {
    const families = await prisma.family.findMany({
      include: {
        config: true,
        users: {
          where: {
            roles: { has: 'CHILD' }
          }
        }
      }
    });

    for (const family of families) {
      if (!family.config) continue;

      const { interestRate, interestDuration } = family.config;
      const now = new Date();

      for (const user of family.users) {
        const lastInterestDate = user.lastInterestDate || user.createdAt;
        const daysSinceLastInterest = Math.floor(
          (now.getTime() - lastInterestDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (daysSinceLastInterest >= interestDuration) {
          const interestAmount = Math.floor((user.currentBalance * interestRate) / 100);

          if (interestAmount > 0) {
            await prisma.transaction.create({
              data: {
                userId: user.id,
                type: 'INTEREST',
                amount: interestAmount,
                activity: 'Automatic Interest',
                category: 'INTEREST'
              }
            });

            await prisma.user.update({
              where: { id: user.id },
              data: {
                currentBalance: { increment: interestAmount },
                lastInterestDate: now
              }
            });

            await prisma.savingsBonus.create({
              data: {
                userId: user.id,
                amount: interestAmount,
                balance: user.currentBalance,
                bonusDate: now
              }
            });
          }
        }
      }
    }

    console.log('Interest calculation completed');
  } catch (error) {
    console.error('Interest calculation failed:', error);
  }
}
