import { json } from '@sveltejs/kit';
import { authenticateUser } from '$lib/utils/auth';

export async function POST({ request }) {
  try {
    const { name, role, pin } = await request.json();

    if (!name || !role || !pin) {
      return json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!/^\d{4}$/.test(pin)) {
      return json({ error: 'PIN must be exactly 4 digits' }, { status: 400 });
    }

    const { token, user } = await authenticateUser(name, role, pin);

    return json({
      token,
      userId: user.id,
      name: user.name,
      role: user.role,
      currentBalance: user.currentBalance
    });
  } catch (error) {
    return json({ error: error.message }, { status: 401 });
  }
}