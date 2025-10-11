import { json } from '@sveltejs/kit';

export async function GET({ locals }) {
  const session = await locals.auth();
  return json(session);
}