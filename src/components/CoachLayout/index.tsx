import { ReactNode } from 'react';
import TabBar from './TabBar';

interface Props {
  title: string;
  children: ReactNode;
}

export default function CoachLayout({ title, children }: Props) {
  return (
    <div className="min-h-screen bg-app flex flex-col">
      <header className="px-5 pt-6 pb-2 flex items-center gap-2">
        <div className="w-1 h-4 bg-accent rounded-full" />
        <span className="text-sm font-bold text-primary tracking-tight">{title}</span>
      </header>
      <main className="flex-1 overflow-hidden pb-14">{children}</main>
      <TabBar />
    </div>
  );
}
