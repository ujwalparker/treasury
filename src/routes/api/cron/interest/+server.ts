import { json } from '@sveltejs/kit';
import { calculateInterestForAllUsers } from '$lib/cron/interest';
import type { RequestEvent } from '@sveltejs/kit';

export async function POST({ request }: RequestEvent) {
  try {
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET || 'dev-secret';
    
    if (authHeader !== `Bearer ${cronSecret}`) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    await calculateInterestForAllUsers();

    return json({ success: true, message: 'Interest calculated for all users' });
  } catch (error) {
    return json({ error: 'Failed to calculate interest' }, { status: 500 });
  }
}
