import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: 'Idea Board — Small sparks, shared possibilities', description: 'Share an idea. Find your favorites. Help good things grow.' };
export default function Layout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
