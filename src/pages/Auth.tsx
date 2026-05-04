import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, Fingerprint, Sparkles, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { auth, db } from '../lib/firebase';
import { 
  signInAnonymously, 
  GoogleAuthProvider, 
  signInWithPopup 
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { UserProfile } from '../types';
import { toast } from 'sonner';

interface AuthProps {
  onComplete: (user: any, profile: UserProfile) => void;
}

type AuthStep = 'splash' | 'personal' | 'academic';

export function Auth({ onComplete }: AuthProps) {
  const [step, setStep] = useState<AuthStep>('splash');
  const [isProcessing, setIsProcessing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    age: 18,
    location: '',
    qualification: 'Undergraduate',
    income: 500000,
    interests: [] as string[]
  });

  const handleGoogleSignIn = async () => {
    setIsProcessing(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      // Check if profile exists
      const userDoc = await getDoc(doc(db, 'users', result.user.uid));
      if (userDoc.exists()) {
        const profile = userDoc.data() as UserProfile;
        toast.success("Identity Resumed");
        onComplete(result.user, profile);
        return;
      }

      setFormData(prev => ({ 
        ...prev, 
        name: result.user.displayName || '', 
        email: result.user.email || '' 
      }));
      setStep('personal');
    } catch (error: any) {
      console.error("Auth Error:", error);
      toast.error(`Authentication failed: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBeginOnboarding = async () => {
    setStep('personal');
  };

  const handleFinalize = async () => {
    setIsProcessing(true);
    try {
      let user = auth.currentUser;
      
      if (!user) {
        try {
          const result = await signInAnonymously(auth);
          user = result.user;
        } catch (authError: any) {
          if (authError.code === 'auth/admin-restricted-operation') {
             toast.info("Connecting via Guest Protocol (Local Only)");
             user = { uid: 'guest_' + Math.random().toString(36).substr(2, 9), isAnonymous: true } as any;
          } else {
            throw authError;
          }
        }
      }
      
      const profile: UserProfile = {
        userId: user!.uid,
        name: formData.name,
        email: formData.email || `temp_${user!.uid}@pulse.protocol`,
        phone: formData.phone,
        age: formData.age,
        location: formData.location,
        qualification: formData.qualification,
        income: formData.income,
        interests: formData.interests,
        createdAt: new Date().toISOString()
      };

      if (!user!.isAnonymous || user!.uid.startsWith('guest_')) {
        try {
          await setDoc(doc(db, 'users', user!.uid), profile);
        } catch (dbError) {
          console.warn("Firestore save failed for guest, using local state", dbError);
        }
      } else {
        await setDoc(doc(db, 'users', user!.uid), profile);
      }
      
      toast.success("Identity Sync Complete");
      onComplete(user, profile);
    } catch (error: any) {
      console.error("Sync Error:", error);
      toast.error(`Sync Error: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-[#0a0a0b] overflow-hidden flex flex-col md:flex-row items-center justify-center">
      
      {/* Background Ambience */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[10%] right-[10%] w-[1000px] h-[1000px] bg-brand-lime/10 blur-[200px] -mr-96 -mt-96 animate-pulse" />
        <div className="absolute bottom-[10%] left-[10%] w-[800px] h-[800px] bg-indigo-500/10 blur-[180px] -ml-40 -mb-40 animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <AnimatePresence mode="wait">
        {step === 'splash' && (
          <motion.div 
            key="splash"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.9, filter: 'blur(10px)' }}
            className="relative z-10 w-full h-full flex flex-col md:flex-row"
          >
            <div className="flex-1 relative overflow-hidden h-[45vh] md:h-full group">
               <motion.img 
                 initial={{ scale: 1.2 }}
                 animate={{ scale: 1 }}
                 transition={{ duration: 10, repeat: Infinity, repeatType: 'reverse' }}
                 src="https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=2670&auto=format&fit=crop" 
                 className="w-full h-full object-cover grayscale opacity-60 brightness-75"
                 alt="Future Tech"
               />
               <div className="absolute inset-0 splash-gradient hidden md:block" />
               <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0b] via-transparent to-transparent md:hidden" />
               
               <div className="absolute top-12 left-12 hidden md:flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/5 backdrop-blur-3xl border border-white/10 rounded-2xl flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-brand-lime" />
                  </div>
                  <span className="text-xl font-black text-white italic tracking-tighter">PULSE.PROTOCOL</span>
               </div>
            </div>

            <div className="flex-1 p-8 md:p-24 flex flex-col justify-center gap-12 md:gap-16 bg-[#0a0a0b]/80 backdrop-blur-2xl border-l border-white/5 relative">
              <div className="space-y-6 md:space-y-8">
                <div className="flex items-center gap-4 md:hidden mb-8">
                  <div className="w-10 h-10 bg-brand-lime rounded-xl flex items-center justify-center text-black">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <span className="text-lg font-black text-white italic">SCHOLARPULSE</span>
                </div>
                <motion.h1 
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-6xl md:text-[7rem] font-black tracking-tighter text-white font-display leading-[0.85] uppercase italic"
                >
                  Beyond <br /><span className="text-brand-lime">Funding.</span>
                </motion.h1>
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-slate-500 font-bold uppercase tracking-[0.4em] text-[10px] md:text-xs max-w-sm"
                >
                  Personalized discovery for government and private scholarships worldwide.
                </motion.p>
              </div>

              <div className="flex flex-col gap-5">
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button 
                    onClick={handleGoogleSignIn}
                    disabled={isProcessing}
                    className="h-24 md:h-28 bg-brand-lime text-black font-black text-xl md:text-2xl rounded-[2.5rem] shadow-[0_30px_60px_-15px_rgba(198,244,50,0.4)] transition-all w-full md:w-[26rem] uppercase tracking-widest border-b-8 border-black/20"
                  >
                    {isProcessing ? "SYNCING..." : "INITIATE IDENTITY SYNC"}
                  </Button>
                </motion.div>
                <Button 
                  variant="ghost" 
                  onClick={handleBeginOnboarding}
                  className="h-20 md:h-24 text-white font-black text-lg md:text-xl rounded-[2.5rem] border-2 border-white/10 hover:bg-white/5 w-full md:w-[26rem] uppercase tracking-widest"
                >
                  BEGIN BIOMETRIC ENTRY
                </Button>
              </div>
              
              <div className="absolute bottom-12 right-12 hidden md:block opacity-20">
                <p className="text-[10px] font-black tracking-widest text-white uppercase origin-right rotate-90 translate-x-1/2">VER 4.2.0 // PULSE CORE</p>
              </div>
            </div>
          </motion.div>
        )}

        {step === 'personal' && (
          <motion.div 
            key="personal"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1, filter: 'blur(20px)' }}
            className="relative z-10 w-full max-w-2xl p-6 md:p-10 space-y-8 bg-white/[0.02] backdrop-blur-3xl border border-white/5 rounded-[3.5rem] shadow-2xl overflow-y-auto max-h-[90vh]"
          >
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-lime/10 border border-brand-lime/20 text-[9px] font-black text-brand-lime uppercase tracking-widest">
                <Fingerprint className="w-3 h-3" /> Step 01 / 02
              </div>
              <h2 className="text-4xl md:text-6xl font-black tracking-tighter text-white font-display uppercase italic">IDENTITY</h2>
              <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Primary bio-metric identification for the registry.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5 md:col-span-2">
                <Label className="text-[9px] font-black text-slate-600 uppercase tracking-widest ml-4">Full Legal Identity</Label>
                <div className="relative group">
                  <input 
                    placeholder="ENTER NAME"
                    className="glass-input w-full px-6 text-lg tracking-tight h-14"
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="space-y-1.5">
                <Label className="text-[9px] font-black text-slate-600 uppercase tracking-widest ml-4">Mobile String</Label>
                <div className="relative group">
                  <input 
                    placeholder="MOBILE NUMBER"
                    className="glass-input w-full px-6 text-lg tracking-tight h-14"
                    value={formData.phone}
                    onChange={e => setFormData({...formData, phone: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[9px] font-black text-slate-600 uppercase tracking-widest ml-4">Communication Hub</Label>
                <div className="relative group">
                  <input 
                    placeholder="EMAIL (OPTIONAL)"
                    className="glass-input w-full px-6 text-lg tracking-tight h-14"
                    value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                  />
                </div>
              </div>
            </div>

            <Button 
              onClick={() => setStep('academic')}
              disabled={!formData.name || !formData.phone}
              className="h-20 md:h-22 bg-white/5 border border-white/10 hover:bg-brand-lime hover:text-black hover:border-brand-lime text-white font-black rounded-[2rem] shadow-2xl active:scale-95 transition-all w-full text-lg md:text-xl uppercase tracking-[0.2em]"
            >
              PROCEED TO MATRIX <ArrowRight className="ml-4 w-6 h-6" />
            </Button>
          </motion.div>
        )}

        {step === 'academic' && (
          <motion.div 
            key="academic"
            initial={{ opacity: 0, scale: 0.9, x: 100 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            className="relative z-10 w-full max-w-3xl p-6 md:p-10 space-y-8 bg-[#0f0f10] border border-white/5 rounded-[3.5rem] shadow-2xl overflow-y-auto max-h-[90vh]"
          >
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[9px] font-black text-indigo-400 uppercase tracking-widest">
                  <Sparkles className="w-3 h-3" /> Final Sync
                </div>
                <h2 className="text-4xl md:text-6xl font-black tracking-tighter text-white font-display uppercase italic text-indigo-400">MATRIX</h2>
                <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Calibrating funding eligibility parameters.</p>
              </div>
              <button 
                onClick={() => setStep('personal')} 
                className="w-12 h-12 rounded-[1.2rem] bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-white/10 transition-all active:scale-90"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-[9px] font-black text-slate-600 uppercase tracking-widest ml-4">Chronos Age</Label>
                  <div className="relative group">
                    <input 
                      type="number"
                      placeholder="ENTER AGE"
                      className="glass-input w-full px-6 text-lg font-black tracking-tight h-14"
                      value={formData.age}
                      onChange={e => setFormData({...formData, age: Number(e.target.value)})}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[9px] font-black text-slate-600 uppercase tracking-widest ml-4">Locale Hub</Label>
                  <div className="relative group">
                    <input 
                      placeholder="E.G. NEW YORK, USA"
                      className="glass-input w-full px-6 text-lg font-bold tracking-tight h-14"
                      value={formData.location}
                      onChange={e => setFormData({...formData, location: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-[9px] font-black text-slate-600 uppercase tracking-widest ml-4">Academic Tier</Label>
                  <div className="relative group">
                    <select 
                      className="glass-input w-full px-6 text-lg font-bold tracking-tight appearance-none bg-[#0a0a0b] h-14"
                      value={formData.qualification}
                      onChange={e => setFormData({...formData, qualification: e.target.value})}
                    >
                      <option value="Secondary (10th)">Grade 10 Registry</option>
                      <option value="Higher Secondary (12th)">Grade 12 Protocol</option>
                      <option value="Undergraduate">University Tier</option>
                      <option value="Postgraduate">Advanced Doctorate</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[9px] font-black text-slate-600 uppercase tracking-widest ml-4">Economic Index (Annual)</Label>
                  <div className="relative group">
                    <input 
                      type="number"
                      placeholder="ESTIMATED REVENUE"
                      className="glass-input w-full px-6 text-lg font-black tracking-tight h-14"
                      value={formData.income}
                      onChange={e => setFormData({...formData, income: Number(e.target.value)})}
                    />
                  </div>
                </div>
              </div>
            </div>

            <Button 
              onClick={handleFinalize}
              disabled={isProcessing || !formData.age || !formData.location}
              className="h-20 md:h-24 bg-brand-lime text-black font-black rounded-[2.5rem] shadow-[0_20px_50px_-10px_rgba(198,244,50,0.4)] active:scale-95 transition-all w-full text-xl uppercase tracking-[0.2em] border-b-4 border-black/20"
            >
              {isProcessing ? "UPLOAD IN PROGRESS..." : "ESTABLISH VAULT CONNECTION"}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
