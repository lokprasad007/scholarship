import { useState, useEffect } from 'react';
import { auth, db, signInWithGoogle, logout } from './lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, setDoc, collection, query, where, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { Navbar } from './components/Navbar';
import { Home } from './pages/Home';
import { Dashboard } from './pages/Dashboard';
import { Profile } from './pages/Profile';
import { ScholarshipDetail } from './pages/ScholarshipDetail';
import { Auth } from './pages/Auth';
import { FloatingNavbar } from './components/FloatingNavbar';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Bell } from 'lucide-react';
import { UserProfile, Scholarship, Application, Notification } from './types';
import { Toaster, toast } from 'sonner';
import { AnimatePresence, motion } from 'motion/react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [currentPage, setCurrentPage] = useState<'home' | 'dashboard' | 'profile' | 'detail'>('home');
  const [selectedScholarship, setSelectedScholarship] = useState<Scholarship | null>(null);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showDesktopAuth, setShowDesktopAuth] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    const handleTriggerAuth = () => setShowDesktopAuth(true);
    window.addEventListener('trigger-auth', handleTriggerAuth);
    return () => window.removeEventListener('trigger-auth', handleTriggerAuth);
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      // Don't overwrite if it's a guest user (already set via onComplete in Auth)
      if (!firebaseUser && user?.uid?.startsWith('guest_')) {
        setLoading(false);
        return;
      }

      setUser(firebaseUser);
      if (firebaseUser) {
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (userDoc.exists()) {
          setProfile(userDoc.data() as UserProfile);
        } else {
          // New user, trigger onboarding
          setShowDesktopAuth(true);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, [user]);

  useEffect(() => {
    if (!user || user.uid.startsWith('guest_')) {
      setNotifications([]);
      return;
    }

    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items: Notification[] = [];
      snapshot.forEach((doc) => items.push({ id: doc.id, ...doc.data() } as Notification));
      setNotifications(items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    }, (error) => {
      console.warn("Notification Snapshot Error:", error);
    });

    return unsubscribe;
  }, [user]);

  const handleApply = async (scholarship: Scholarship) => {
    if (!user) {
      toast.error("Please sign in to apply");
      setShowDesktopAuth(true);
      return;
    }
    
    try {
      if (user.uid.startsWith('guest_')) {
        toast.info("Application processed via Guest Protocol (Simulated)");
        // Add fake notification locally if needed, for now just success
        setNotifications(prev => [{
          id: 'fake_' + Date.now(),
          userId: user.uid,
          title: "Guest Application Received",
          message: `Your guest application for ${scholarship.title} was simulated successfully.`,
          type: 'status',
          read: false,
          createdAt: new Date().toISOString()
        }, ...prev]);
        toast.success("Guest application simulation complete!");
        return;
      }

      const applicationRef = collection(db, 'applications');
      await addDoc(applicationRef, {
        userId: user.uid,
        scholarshipId: scholarship.id,
        scholarshipTitle: scholarship.title,
        status: 'submitted',
        appliedDate: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
      });
      
      // Add notification
      await addDoc(collection(db, 'notifications'), {
        userId: user.uid,
        title: "Application Submitted",
        message: `Your application for ${scholarship.title} has been received.`,
        type: 'status',
        read: false,
        createdAt: new Date().toISOString()
      });

      toast.success("Application submitted successfully!");
    } catch (error) {
      console.error("Apply Error:", error);
      toast.error("Failed to submit application");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0a0a0b]">
        <motion.div 
          animate={{ rotate: 360, scale: [1, 1.2, 1] }}
          transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
          className="w-16 h-16 border-b-2 border-brand-lime rounded-full shadow-[0_10px_20px_-5px_rgba(198,244,50,0.3)]"
        />
      </div>
    );
  }

  // Automatic splash ONLY on mobile if not logged in
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024;
  const needsAuth = !user || !profile;
  const isAuthPage = needsAuth && (isMobile || showDesktopAuth || currentPage === 'profile' || currentPage === 'dashboard');

  if (isAuthPage) {
    return <Auth onComplete={(u, p) => {
      setUser(u);
      setProfile(p);
      setShowDesktopAuth(false);
      setCurrentPage('home');
    }} />;
  }

  return (
    <div className="min-h-screen text-white font-sans relative bg-[#0a0a0b] overflow-x-hidden selection:bg-brand-lime selection:text-black">
      {/* Background Decor */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <img 
          src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=2000" 
          alt="Abstract 3D Background"
          className="w-full h-full object-cover opacity-30 grayscale-[0.5]"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-tr from-[#0a0a0b] via-transparent to-[#0a0a0b]" />
        
        {/* Animated Glow Blobs */}
        <div className="absolute top-[10%] left-[15%] w-[400px] h-[400px] bg-indigo-500/10 blur-[150px] animate-pulse rounded-full" />
        <div className="absolute bottom-[20%] right-[10%] w-[500px] h-[500px] bg-brand-lime/5 blur-[180px] animate-pulse rounded-full" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-500/5 blur-[200px] rounded-full" />
      </div>

      <Toaster position="top-right" theme="dark" closeButton />

      <main className="container mx-auto px-4 py-8 max-w-7xl pb-32">
        <AnimatePresence mode="wait">
          {currentPage === 'home' && (
            <motion.div
              key="home"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <Home 
                user={user} 
                profile={profile} 
                onSelect={(s) => {
                  setSelectedScholarship(s);
                  setCurrentPage('detail');
                }}
              />
            </motion.div>
          )}

          {currentPage === 'dashboard' && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
            >
              <Dashboard user={user} setPage={setCurrentPage} onSelect={(s) => {
                setSelectedScholarship(s);
                setCurrentPage('detail');
              }} />
            </motion.div>
          )}

          {currentPage === 'profile' && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Profile user={user} profile={profile} onUpdate={(p) => {
                setProfile(p);
                setCurrentPage('home');
              }} />
            </motion.div>
          )}

          {currentPage === 'detail' && selectedScholarship && (
            <motion.div
              key="detail"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <ScholarshipDetail 
                scholarship={selectedScholarship} 
                user={user}
                onApply={() => handleApply(selectedScholarship)}
                onBack={() => setCurrentPage('home')}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <FloatingNavbar 
        activeTab={currentPage} 
        onTabChange={setCurrentPage} 
        onShowNotifications={() => setShowNotifications(true)}
        isAuthenticated={!!user && !!profile}
        unreadCount={notifications.length}
      />

      <Sheet open={showNotifications} onOpenChange={setShowNotifications}>
        <SheetContent className="bg-[#0a0a0b]/95 backdrop-blur-3xl text-white border-white/10 w-full sm:max-w-md rounded-l-[3rem] z-[200]">
          <SheetHeader className="mt-8 text-left">
            <SheetTitle className="text-3xl font-black text-white tracking-tighter italic uppercase">NOTIFICATIONS</SheetTitle>
            <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">
              System Updates & Application Alerts
            </p>
          </SheetHeader>
          <div className="mt-12 space-y-4">
            {notifications.length === 0 ? (
              <div className="py-20 text-center space-y-4">
                <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto opacity-20">
                  <Bell className="w-8 h-8" />
                </div>
                <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">No active alerts</p>
              </div>
            ) : (
              notifications.map(notif => (
                <div key={notif.id} className="p-6 bg-white/5 rounded-[1.5rem] border border-white/5 relative group overflow-hidden">
                   <div className="absolute top-0 left-0 w-1 h-full bg-brand-lime opacity-40" />
                   <p className="text-white font-bold tracking-tight">{notif.title}</p>
                   <p className="text-slate-400 text-sm mt-1">{notif.message}</p>
                   <p className="text-[10px] text-slate-600 font-black uppercase tracking-widest mt-4">{new Date(notif.createdAt).toLocaleDateString()}</p>
                </div>
              ))
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
