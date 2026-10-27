'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { database } from '../lib/supabase';

export type Result = { message: string; success?: boolean };
export async function submitIdea(_: Result, form: FormData): Promise<Result> {
  const title = String(form.get('title') ?? '').trim();
  const description = String(form.get('description') ?? '').trim();
  const nickname = String(form.get('nickname') ?? '').trim();
  if (!title || title.length > 100 || !description || description.length > 1000 || !nickname || nickname.length > 40) {
    return { message: 'Enter a title (1–100 characters), description (1–1000), and nickname (1–40).' };
  }
  try {
    const { error } = await database().rpc('submit_idea', { p_title: title, p_description: description, p_nickname: nickname });
    if (error) return { message: 'Could not save your idea. Please try again.' };
    revalidatePath('/');
    return { message: 'Your idea is on the board!', success: true };
  } catch { return { message: 'The board is temporarily unavailable.' }; }
}

export async function vote(_: Result, form: FormData): Promise<Result> {
  const ideaId = String(form.get('idea_id') ?? '');
  if (!/^[0-9a-f-]{36}$/i.test(ideaId)) return { message: 'Invalid idea.' };
  try {
    const jar = await cookies();
    let voter = jar.get('idea-voter')?.value;
    if (!voter || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(voter)) {
      voter = crypto.randomUUID();
      jar.set('idea-voter', voter, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 60 * 60 * 24 * 365 });
    }
    const { data, error } = await database().rpc('vote_for_idea', { p_idea_id: ideaId, p_voter_id: voter });
    if (error) return { message: 'Could not vote. The idea may have been removed.' };
    revalidatePath('/');
    return { message: data ? 'Vote counted!' : 'You already voted for this idea.', success: Boolean(data) };
  } catch { return { message: 'Voting is temporarily unavailable.' }; }
}
