import { json } from '@sveltejs/kit';
import { calculateInterestForAllUsers } from '$lib/cron/interest';
import { CRON_SECRET } from '$env/static/private';
import type { RequestEvent } from '@sveltejs/kit';

export async function POST({ request }: RequestEvent) {
  try {
    const authHeader = request.headers.get('authorization');
    const cronSecret = CRON_SECRET || 'dev-secret';
    
    if (authHeader !== `Bearer ${cronSecret}`) {
      console.error('Unauthorized cron request');
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Starting interest calculation for all users...');
    const result = await calculateInterestForAllUsers();
    console.log('Interest calculation completed successfully');

    return json({ success: true, message: 'Interest calculated for all users', result });
  } catch (error) {
    console.error('Interest calculation failed:', error);
    return json({ error: 'Failed to calculate interest' }, { status: 500 });
  }
}
