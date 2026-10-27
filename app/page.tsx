import { configured, database } from '../lib/supabase';
import { IdeaForm, VoteForm } from './forms';
export const dynamic = 'force-dynamic';
type Idea = { id: string; title: string; description: string; author_nickname: string; vote_count: number };
export default async function Home() {
  let ideas: Idea[] = [];
  let unavailable = !configured();
  if (!unavailable) {
    try {
      const { data, error } = await database().from('ideas').select('id,title,description,author_nickname,vote_count').order('vote_count', { ascending: false }).order('created_at', { ascending: false }).limit(100);
      unavailable = Boolean(error);
      ideas = data ?? [];
    } catch { unavailable = true; }
  }
  return <main>
    <header><a href="/" className="brand"><span className="brand-icon">✳</span> Idea Board</a><span className="header-note">A home for what’s next</span></header>
    <section className="intro"><p className="eyebrow">SMALL SPARKS. SHARED POSSIBILITIES.</p><h1>Good ideas start<br />with <em>you.</em></h1><p>Share a thought, champion a favorite, and help<br className="desktop" /> the next great thing take shape.</p></section>
    <div className="board-layout"><aside><div className="panel"><span className="eyebrow">MAKE A LITTLE SPACE FOR POSSIBILITY</span><h2>What’s your idea?</h2><p>No pitch deck needed. Just a spark.</p>{unavailable ? <p role="status">The board is not available yet. Please check back soon.</p> : <IdeaForm />}</div><p className="footnote">Open to everyone. No account needed.<br />One vote per idea, per browser identity.</p></aside>
    <section aria-labelledby="board-title"><div className="board-heading"><h2 id="board-title">The idea board <span>{ideas.length}</span></h2><span>Most loved first ↓</span></div>
    {unavailable ? <div className="empty"><h3>A little preparation in progress</h3><p>We’ll be ready for your ideas soon.</p></div> : ideas.length === 0 ? <div className="empty"><span className="spark">✧</span><h3>Every great thing starts somewhere.</h3><p>Be the first to share a spark.</p></div> : <div className="ideas">{ideas.map((idea) => <article className="idea" key={idea.id}><div className="idea-body"><h3>{idea.title}</h3><p>{idea.description}</p><span className="author"><span className="avatar" aria-hidden="true">{idea.author_nickname.slice(0, 1).toUpperCase()}</span>{idea.author_nickname}</span></div><VoteForm id={idea.id} count={idea.vote_count} /></article>)}</div>}
    </section></div><footer>Made for ideas worth sharing. <span>Keep it kind. Keep it curious.</span></footer>
  </main>;
}
