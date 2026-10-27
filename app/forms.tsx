'use client';

import { useActionState, useEffect, useRef } from 'react';
import { submitIdea, vote } from './actions';

export function IdeaForm() {
  const [state, action, pending] = useActionState(submitIdea, { message: '' });
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => { if (state.success) ref.current?.reset(); }, [state]);
  return <form ref={ref} action={action} className="idea-form">
    <label>Your nickname<input name="nickname" required maxLength={40} placeholder="e.g. curiouscat" autoComplete="nickname" /></label>
    <label>Idea title<input name="title" required maxLength={100} placeholder="A little spark of something good" /></label>
    <label>Description<textarea name="description" required maxLength={1000} rows={4} placeholder="What is it, and why would it help?" /></label>
    <button disabled={pending}>{pending ? 'Sharing…' : 'Share your idea ↗'}</button>
    <p role="status" className="status">{state.message}</p>
  </form>;
}

export function VoteForm({ id, count }: { id: string; count: number }) {
  const [state, action, pending] = useActionState(vote, { message: '' });
  return <form action={action} className="vote-form">
    <input type="hidden" name="idea_id" value={id} />
    <button className="vote" disabled={pending} aria-label={`Upvote idea, ${count} votes`}><span aria-hidden="true">↑</span> {count}</button>
    <span role="status" className="vote-status">{state.message}</span>
  </form>;
}
