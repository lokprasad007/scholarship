import { User } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { GraduationCap, LayoutDashboard, User as UserIcon, LogOut, Search, Bell } from 'lucide-react';
import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Notification } from '../types';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDistanceToNow } from 'date-fns';

interface NavbarProps {
  user: User | null;
  onLogin: () => void;
  onLogout: () => void;
  setCurrentPage: (page: 'home' | 'dashboard' | 'profile' | 'detail') => void;
  currentPage: string;
}

export function Navbar({ user, onLogin, onLogout, setCurrentPage, currentPage }: NavbarProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'notifications'), where('userId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification));
      setNotifications(notes.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    });
    return unsubscribe;
  }, [user]);

  return (
    <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 w-fit">
      <div className="glass-panel px-6 h-20 flex items-center gap-2 rounded-[2.5rem] border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
        <div 
          className="flex items-center gap-3 pr-4 border-r border-white/5 cursor-pointer group"
          onClick={() => setCurrentPage('home')}
        >
          <div className="bg-brand-lime p-2.5 rounded-2xl group-hover:scale-110 transition-all shadow-[0_0_20px_rgba(198,244,50,0.3)]">
            <GraduationCap className="w-6 h-6 text-black" />
          </div>
          <span className="font-black text-xl tracking-tighter text-white hidden md:inline-block font-display uppercase">
            SP
          </span>
        </div>

        <div className="flex items-center gap-1 px-2">
          <Button 
            variant="ghost" 
            onClick={() => setCurrentPage('home')}
            className={`h-14 px-5 rounded-[1.8rem] gap-2 transition-all ${currentPage === 'home' ? 'bg-white/10 text-brand-lime font-black' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
          >
            <Search className="w-5 h-5" />
            <span className="hidden sm:inline">FIND</span>
          </Button>

          {user && (
            <>
              <Button 
                variant="ghost" 
                onClick={() => setCurrentPage('dashboard')}
                className={`h-14 px-5 rounded-[1.8rem] gap-2 transition-all ${currentPage === 'dashboard' ? 'bg-white/10 text-brand-lime font-black' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
              >
                <LayoutDashboard className="w-5 h-5" />
                <span className="hidden sm:inline">HUB</span>
              </Button>

              <div className="w-px h-8 bg-white/5 mx-1" />

              <Sheet>
                <SheetTrigger>
                  <div className="relative h-14 w-14 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/5 rounded-[1.8rem] transition-all cursor-pointer">
                    <Bell className="w-6 h-6" />
                    {unreadCount > 0 && (
                      <span className="absolute top-3 right-3 h-2.5 w-2.5 bg-brand-lime rounded-full shadow-[0_0_10px_rgba(198,244,50,0.8)]" />
                    )}
                  </div>
                </SheetTrigger>
                <SheetContent className="bg-[#0a0a0b]/95 backdrop-blur-3xl text-white border-white/10 w-full sm:max-w-md rounded-l-[3rem]">
                  <SheetHeader className="mt-8 text-left">
                    <SheetTitle className="text-3xl font-black text-white tracking-tighter">NOTIFICATIONS</SheetTitle>
                  </SheetHeader>
                  <ScrollArea className="h-[calc(100vh-150px)] mt-8 pr-4">
                    {notifications.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-40 opacity-20 mt-12">
                        <Bell className="w-10 h-10 mb-2" />
                        <p className="text-sm font-bold uppercase tracking-widest">All Clear</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {notifications.map(note => (
                          <div key={note.id} className={`p-6 rounded-[2rem] border transition-all ${note.read ? 'bg-white/[0.02] border-white/5' : 'bg-brand-lime/10 border-brand-lime/20'}`}>
                            <h4 className="font-bold text-base">{note.title}</h4>
                            <p className="text-sm text-slate-400 mt-2 leading-relaxed">{note.message}</p>
                            <span className="text-[10px] font-black text-slate-500 mt-4 block tracking-widest uppercase">
                              {formatDistanceToNow(new Date(note.createdAt))} ago
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </SheetContent>
              </Sheet>

              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setCurrentPage('profile')}
                className={`h-14 w-14 rounded-[1.8rem] transition-all ${currentPage === 'profile' ? 'bg-white/10 text-brand-lime border border-white/10 shadow-[inner_0_0_10px_rgba(255,255,255,0.05)]' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
              >
                <UserIcon className="w-6 h-6" />
              </Button>

              <div className="w-px h-8 bg-white/5 mx-1" />

              <Button variant="ghost" size="icon" onClick={onLogout} className="h-14 w-14 text-red-500 hover:bg-red-500/10 rounded-[1.8rem]">
                <LogOut className="w-6 h-6" />
              </Button>
            </>
          )}

          {!user && (
            <Button onClick={onLogin} className="h-14 px-8 bg-brand-lime text-black hover:bg-brand-lime/90 rounded-[1.8rem] font-black tracking-tighter ml-2 lg:hidden shadow-[0_10px_30px_rgba(198,244,50,0.2)]">
              SIGN IN
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
}
