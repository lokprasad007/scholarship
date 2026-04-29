import { useState } from 'react';
import { User } from 'firebase/auth';
import { UserProfile } from '../types';
import { db } from '../lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { User as UserIcon, Mail, Phone, MapPin, Briefcase, DollarSign, Calendar } from 'lucide-react';

interface ProfileProps {
  user: User | null;
  profile: UserProfile | null;
  onUpdate: (p: UserProfile) => void;
}

import { motion } from 'motion/react';
import { IndianRupee, ShieldCheck, Sparkles, ChevronLeft } from 'lucide-react';
import { useLanguage } from '../LanguageContext';

export function Profile({ user, profile, onUpdate }: ProfileProps) {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    name: profile?.name || user?.displayName || '',
    age: profile?.age || 18,
    income: profile?.income || 0,
    qualification: profile?.qualification || 'Undergraduate',
    location: profile?.location || '',
    interests: profile?.interests?.join(', ') || ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  if (!user || !profile) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setIsSaving(true);
    const newProfile: UserProfile = {
      userId: user.uid,
      email: user.email || '',
      name: formData.name,
      age: formData.age,
      income: formData.income,
      qualification: formData.qualification,
      location: formData.location,
      interests: formData.interests.split(',').map(i => i.trim()).filter(i => i),
      createdAt: profile?.createdAt || new Date().toISOString()
    };

    try {
      if (user.uid.startsWith('guest_')) {
        toast.info("Guest profile updated locally");
        onUpdate(newProfile);
        setIsEditing(false);
        return;
      }
      await setDoc(doc(db, 'users', user.uid), newProfile);
      onUpdate(newProfile);
      toast.success("Profile updated successfully!");
      setIsEditing(false);
    } catch (error) {
      console.error("Profile Update Error:", error);
      toast.error("Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-32">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-card p-1 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-brand-lime/10 blur-[120px] -mr-40 -mt-40" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-indigo-500/10 blur-[100px] -ml-20 -mb-20" />
        
        <div className="bg-[#0f0f10] rounded-[1.95rem] p-6 md:p-10 relative z-10">
          <div className="flex flex-col md:flex-row gap-6 items-center md:items-start text-center md:text-left">
            <div className="relative group">
              <div className="absolute inset-0 bg-brand-lime/20 blur-2xl rounded-full scale-0 group-hover:scale-125 transition-transform duration-500" />
              <div className="w-28 h-28 md:w-36 md:h-36 rounded-full p-1 bg-gradient-to-tr from-brand-lime to-indigo-500 relative z-10">
                <div className="w-full h-full rounded-full bg-[#0f0f10] p-1.5 overflow-hidden">
                  <img 
                    src={user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`} 
                    className="w-full h-full rounded-full object-cover" 
                    alt="Profile" 
                    referrerPolicy="no-referrer"
                  />
                </div>
              </div>
            </div>

            <div className="flex-1 space-y-4">
              <div className="space-y-1">
                <h1 className="text-3xl md:text-5xl font-black tracking-tighter text-white font-display uppercase italic">
                  {profile.name || user.displayName || 'PULSE USER'}
                </h1>
                <p className="text-brand-lime font-bold tracking-widest text-[9px] md:text-[10px]">
                  @{user.email?.split('@')[0].toUpperCase()}_VAULT
                </p>
              </div>

              <p className="text-slate-400 text-sm md:text-base font-medium leading-relaxed max-w-xl mx-auto md:mx-0">
                 {t('profile.pursuing')} <span className="text-white font-bold">{profile.qualification}</span> {t('profile.in')} <span className="text-white font-bold">{profile.location}</span>. 
                 {t('profile.optimizing')}
              </p>

              <div className="flex flex-wrap gap-3 md:gap-4 pt-2 justify-center md:justify-start">
                <div className="text-center px-5 py-3 glass-panel rounded-2xl border-transparent hover:border-white/10 transition-all flex flex-col items-center">
                  <p className="text-xl font-black text-white">{profile.age}</p>
                  <p className="text-[8px] text-slate-500 font-black uppercase tracking-widest mt-1">{t('auth.age')}</p>
                </div>
                <div className="text-center px-5 py-3 glass-panel rounded-2xl border-transparent hover:border-white/10 transition-all flex flex-col items-center">
                  <p className="text-xl font-black text-white">ACTIVE</p>
                  <p className="text-[8px] text-slate-500 font-black uppercase tracking-widest mt-1">Status</p>
                </div>
                <div className="text-center px-5 py-3 glass-panel rounded-2xl border-transparent hover:border-white/10 transition-all flex flex-col items-center">
                  <p className="text-xl font-black text-white">{profile.interests.length}</p>
                  <p className="text-[8px] text-slate-500 font-black uppercase tracking-widest mt-1">Traits</p>
                </div>
              </div>
            </div>

            <Button 
               variant="ghost" 
               className="md:self-start bg-white/5 border border-white/10 rounded-xl h-10 px-5 text-xs font-black hover:bg-white/10 text-white tracking-widest"
               onClick={() => setIsEditing(!isEditing)}
            >
              {isEditing ? t('common.cancel') : t('common.edit')}
            </Button>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-8">
          <div className="flex items-center gap-3 px-2">
            <div className="h-8 w-1.5 bg-indigo-500 rounded-full shadow-[0_0_15px_rgba(99,102,241,0.5)]" />
            <h2 className="text-2xl font-black tracking-tight text-white font-display uppercase">Biometric Matrix</h2>
          </div>

          <div className="glass-card p-6 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{t('auth.name')}</label>
                <div className="p-3 bg-white/[0.02] border border-white/5 rounded-[1rem] text-xs font-bold text-white shadow-inner">
                  {profile.name || 'ANONYMOUS'}
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{t('auth.location')}</label>
                <div className="p-3 bg-white/[0.02] border border-white/5 rounded-[1rem] text-xs font-bold text-white shadow-inner">
                  {profile.location || 'GLOBAL'}
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{t('auth.qualification')}</label>
                <div className="p-3 bg-white/[0.02] border border-white/5 rounded-[1rem] text-xs font-bold text-white shadow-inner truncate">
                  {profile.qualification.split(' ')[0].toUpperCase()}
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{t('auth.income')}</label>
                <div className="p-3 bg-white/[0.02] border border-white/5 rounded-[1rem] text-xs font-bold text-white shadow-inner flex items-center gap-1">
                  <IndianRupee className="w-3 h-3" />
                  {profile.income}
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Vault ID</label>
              <div className="p-3 bg-white/[0.02] border border-white/5 rounded-[1rem] text-xs font-bold text-slate-500 truncate">
                {user.email}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-8">
           <div className="flex items-center gap-3 px-2">
             <div className="h-8 w-1.5 bg-brand-lime rounded-full shadow-[0_0_15px_rgba(198,244,50,0.5)]" />
             <h2 className="text-2xl font-black tracking-tight text-white font-display uppercase">Neural Update</h2>
           </div>

           {isEditing ? (
             <motion.form 
               onSubmit={handleSubmit}
               initial={{ opacity: 0, x: 20 }}
               animate={{ opacity: 1, x: 0 }}
               className="glass-card p-6 space-y-4"
             >
               <div className="space-y-3">
                 <div className="space-y-1.5">
                   <Label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">{t('auth.name')}</Label>
                   <Input 
                     className="bg-white/[0.03] border-white/10 rounded-xl h-12 text-sm text-white font-bold focus-visible:ring-brand-lime"
                     value={formData.name} 
                     onChange={(e) => setFormData({...formData, name: e.target.value})} 
                   />
                 </div>
                 
                 <div className="grid grid-cols-2 gap-3">
                   <div className="space-y-1.5">
                     <Label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">{t('auth.location')}</Label>
                     <Input 
                       className="bg-white/[0.03] border-white/10 rounded-xl h-12 text-sm text-white font-bold focus-visible:ring-brand-lime"
                       value={formData.location} 
                       onChange={(e) => setFormData({...formData, location: e.target.value})} 
                     />
                   </div>
                   <div className="space-y-1.5">
                     <Label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">{t('auth.income')}</Label>
                     <Input 
                       type="number"
                       className="bg-white/[0.03] border-white/10 rounded-xl h-12 text-sm text-white font-bold focus-visible:ring-brand-lime"
                       value={formData.income} 
                       onChange={(e) => setFormData({...formData, income: Number(e.target.value)})} 
                     />
                   </div>
                 </div>

                 <div className="space-y-1.5">
                    <Label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">{t('auth.qualification')}</Label>
                    <Select 
                      value={formData.qualification} 
                      onValueChange={val => setFormData({...formData, qualification: val})}
                    >
                      <SelectTrigger className="bg-white/[0.03] border-white/10 rounded-xl h-12 text-sm text-white font-bold">
                        <SelectValue placeholder="Selection Required" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#171717]/95 backdrop-blur-2xl text-white border-white/10 rounded-xl">
                        <SelectItem value="Secondary (10th)">Grade 10</SelectItem>
                        <SelectItem value="Higher Secondary (12th)">Grade 12</SelectItem>
                        <SelectItem value="Undergraduate">University</SelectItem>
                        <SelectItem value="Postgraduate">Doctorate</SelectItem>
                      </SelectContent>
                    </Select>
                 </div>
               </div>

               <Button 
                 type="submit"
                 disabled={isSaving}
                 className="w-full h-12 bg-brand-lime text-black font-black rounded-xl shadow-lg mt-2 active:scale-95 transition-all text-xs tracking-widest"
               >
                 {isSaving ? t('common.loading') : t('auth.finalize')}
               </Button>
             </motion.form>
           ) : (
             <div className="glass-card p-12 flex flex-col items-center justify-center text-center space-y-6">
                <div className="relative group p-6">
                  <div className="absolute inset-0 bg-brand-lime/20 blur-3xl rounded-full animate-pulse" />
                  <div className="relative w-24 h-24 rounded-[2rem] bg-brand-lime/10 border border-brand-lime/20 flex items-center justify-center text-brand-lime shadow-inner">
                    <ShieldCheck className="w-12 h-12" />
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-black text-white tracking-tighter uppercase font-display">System Integrity</h3>
                  <p className="text-slate-500 text-sm max-w-[240px] font-medium leading-relaxed mx-auto">
                    Biometric tokens and academic credentials successfully encrypted within the ScholarPulse Vault.
                  </p>
                </div>
                <div className="flex gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-brand-lime animate-pulse" />
                  <div className="w-2.5 h-2.5 rounded-full bg-brand-lime animate-pulse opacity-50" style={{ animationDelay: '0.2s' }} />
                  <div className="w-2.5 h-2.5 rounded-full bg-brand-lime animate-pulse opacity-20" style={{ animationDelay: '0.4s' }} />
                </div>
             </div>
           )}
        </div>
      </div>
    </div>
  );
}
