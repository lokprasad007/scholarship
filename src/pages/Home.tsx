import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { Scholarship, UserProfile } from '../types';
import { MOCK_SCHOLARSHIPS } from '../constants';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { motion } from 'motion/react';
import { Search, Filter, Sparkles, MapPin, Calendar, IndianRupee, ArrowRight, Star, Fingerprint } from 'lucide-react';
import { geminiService } from '../services/geminiService';
import { toast } from 'sonner';

interface HomeProps {
  user: User | null;
  profile: UserProfile | null;
  onSelect: (s: Scholarship) => void;
}

export function Home({ user, profile, onSelect }: HomeProps) {
  const [scholarships, setScholarships] = useState<Scholarship[]>(MOCK_SCHOLARSHIPS);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [matchResults, setMatchResults] = useState<{ scholarshipId: string; matchScore: number; reason: string }[]>([]);

  useEffect(() => {
    if (profile && scholarships.length > 0) {
      handleMatch();
    }
  }, [profile]);

  const handleMatch = async () => {
    if (!profile) return;
    const matches = await geminiService.matchScholarships(profile, scholarships);
    setMatchResults(matches);
  };

  const handleDiscover = async () => {
    if (!profile) {
      toast.error("Please update your profile first for personalized discovery.");
      return;
    }
    setIsDiscovering(true);
    const newSchemes = await geminiService.discoverNewScholarships(profile);
    
    // In a real app, we'd save these to Firestore. 
    // For MVP, we'll merge them into the local state with temp IDs.
    const discovered = newSchemes.map((s, i) => ({
      ...s,
      id: `discovered-${Date.now()}-${i}`,
      rating: 4.0,
      reviewCount: 0,
      qualifications: s.qualifications || [profile.qualification]
    } as Scholarship));

    setScholarships([...discovered, ...scholarships]);
    setIsDiscovering(false);
    toast.success("AI discovered 5 new scholarships matching your profile!");
  };

  const [filterType, setFilterType] = useState<'all' | 'government' | 'private'>('all');
  const [filterQual, setFilterQual] = useState<string>('all');
  const [minAmount, setMinAmount] = useState<string>('all');
  const [deadlineRange, setDeadlineRange] = useState<string>('all');

  const filteredScholarships = scholarships.filter(s => {
    const matchesSearch = s.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.provider.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || s.providerType === filterType;
    const matchesQual = filterQual === 'all' || s.qualifications.includes(filterQual);
    
    let matchesAmount = true;
    if (minAmount !== 'all') {
      const min = parseInt(minAmount);
      // Fallback: try to parse numeric value from the amount string if numericAmount is missing
      const actualAmount = s.numericAmount || parseInt(s.amount.replace(/[^0-9]/g, '')) || 0;
      matchesAmount = actualAmount >= min;
    }

    let matchesDeadline = true;
    if (deadlineRange !== 'all') {
      const now = new Date();
      const deadline = new Date(s.deadline);
      const diffTime = deadline.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (deadlineRange === '7') matchesDeadline = diffDays >= 0 && diffDays <= 7;
      else if (deadlineRange === '30') matchesDeadline = diffDays >= 0 && diffDays <= 30;
      else if (deadlineRange === '90') matchesDeadline = diffDays >= 0 && diffDays <= 90;
    }
    
    return matchesSearch && matchesType && matchesQual && matchesAmount && matchesDeadline;
  });

  return (
    <div className="relative min-h-screen">
      {/* Nature Background Layer */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-[#0a0a0b]/85 z-10 backdrop-blur-[4px]" />
        <img 
          src="https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?auto=format&fit=crop&q=80&w=2070" 
          alt="Dark Nature" 
          className="w-full h-full object-cover grayscale opacity-20"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0b] via-transparent to-[#0a0a0b] z-20" />
      </div>

      <div className="relative z-10 space-y-12">
      {/* Search & AI Section */}
      <section className="text-center space-y-6 max-w-4xl mx-auto py-20 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold uppercase tracking-widest text-slate-300 backdrop-blur-xl">
            <Sparkles className="w-3 h-3 text-brand-lime" />
            AI Precision Matching
          </div>
          <h1 className="text-6xl md:text-8xl font-extrabold tracking-tighter text-white font-display leading-[0.9] text-balance drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)]">
            Find your <br />
            <span className="text-brand-lime drop-shadow-[0_0_15px_rgba(198,244,50,0.4)]">future</span>, funded.
          </h1>
          <p className="text-xl text-slate-200 max-w-xl mx-auto font-medium drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
            Personalized discovery for government and private scholarships worldwide.
          </p>

          {/* Desktop Onboarding Trigger */}
          {!user && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="hidden lg:flex flex-col items-center gap-4 mt-8"
            >
              <Button 
                onClick={() => {
                  // This will trigger the Auth page becausecurrentPage remains 'home'
                  // but needsAuth is true and we'll signal to show it on desktop in App.tsx
                  // Actually, I'll just use a window event as a simple global bridge
                  window.dispatchEvent(new CustomEvent('trigger-auth'));
                }}
                className="h-20 px-12 bg-white/5 border border-white/10 hover:bg-white/10 text-white font-black rounded-3xl group transition-all"
              >
                <Fingerprint className="w-6 h-6 mr-3 text-brand-lime group-hover:scale-110 transition-all" />
                INITIATE IDENTITY SYNC
              </Button>
              <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em]">Protocol inactive // Connect to proceed</p>
            </motion.div>
          )}
        </motion.div>
        
        <div className="flex flex-col gap-6 mt-12 max-w-2xl mx-auto">
          <div className="relative group">
            <div className="absolute inset-x-0 bottom-0 h-1/2 bg-brand-lime/10 blur-[100px] opacity-0 group-focus-within:opacity-100 transition-opacity" />
            <div className="relative flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-500" />
                <Input 
                  placeholder="What are you studying?" 
                  className="pl-14 h-16 border-white/10 bg-white/[0.04] backdrop-blur-2xl text-white rounded-[1.8rem] focus-visible:ring-brand-lime focus-visible:bg-white/[0.08] transition-all text-lg"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button 
                className="h-16 px-10 bg-brand-lime text-black hover:bg-brand-lime/90 gap-3 font-black rounded-[1.8rem] shadow-[0_15px_40px_-10px_rgba(198,244,50,0.3)] transition-all active:scale-95"
                onClick={user ? handleDiscover : () => toast.error("Sign in to use AI discovery")}
                disabled={isDiscovering}
              >
                {isDiscovering ? (
                  <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}>
                    <Sparkles className="w-6 h-6" />
                  </motion.div>
                ) : (
                  <>
                    <Sparkles className="w-6 h-6" />
                    AI DISCOVER
                  </>
                )}
              </Button>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center justify-center gap-3">
             <div className="w-[200px]">
                <Select value={filterType} onValueChange={(val: any) => setFilterType(val)}>
                  <SelectTrigger className="glass-panel border-white/10 rounded-[1.2rem] text-white h-12 shadow-inner">
                    <SelectValue placeholder="All Providers" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#171717]/95 backdrop-blur-2xl text-white border-white/10 rounded-[1.2rem]">
                    <SelectItem value="all">All Providers</SelectItem>
                    <SelectItem value="government">Government</SelectItem>
                    <SelectItem value="private">Private</SelectItem>
                  </SelectContent>
                </Select>
             </div>
             
             <div className="w-[200px]">
                <Select value={filterQual} onValueChange={setFilterQual}>
                  <SelectTrigger className="glass-panel border-white/10 rounded-[1.2rem] text-white h-12 shadow-inner">
                    <SelectValue placeholder="Qualification" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#171717]/95 backdrop-blur-2xl text-white border-white/10 rounded-[1.2rem]">
                    <SelectItem value="all">All Levels</SelectItem>
                    <SelectItem value="10th">10th Std</SelectItem>
                    <SelectItem value="12th">12th Std</SelectItem>
                    <SelectItem value="Undergraduate">University</SelectItem>
                    <SelectItem value="Postgraduate">Doctorate</SelectItem>
                  </SelectContent>
                </Select>
             </div>
             
             <div className="w-[200px]">
                <Select value={minAmount} onValueChange={setMinAmount}>
                  <SelectTrigger className="glass-panel border-white/10 rounded-[1.2rem] text-white h-12 shadow-inner">
                    <SelectValue placeholder="Min Amount" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#171717]/95 backdrop-blur-2xl text-white border-white/10 rounded-[1.2rem]">
                    <SelectItem value="all">Any Amount</SelectItem>
                    <SelectItem value="10000">₹10,000+</SelectItem>
                    <SelectItem value="50000">₹50,000+</SelectItem>
                    <SelectItem value="100000">₹1,00,000+</SelectItem>
                    <SelectItem value="500000">₹5,00,000+</SelectItem>
                  </SelectContent>
                </Select>
             </div>

             <div className="w-[200px]">
                <Select value={deadlineRange} onValueChange={setDeadlineRange}>
                  <SelectTrigger className="glass-panel border-white/10 rounded-[1.2rem] text-white h-12 shadow-inner">
                    <SelectValue placeholder="Deadline" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#171717]/95 backdrop-blur-2xl text-white border-white/10 rounded-[1.2rem]">
                    <SelectItem value="all">Any Deadline</SelectItem>
                    <SelectItem value="7">Next 7 Days</SelectItem>
                    <SelectItem value="30">Next 30 Days</SelectItem>
                    <SelectItem value="90">Next 90 Days</SelectItem>
                  </SelectContent>
                </Select>
             </div>
             
             {(searchTerm || filterType !== 'all' || filterQual !== 'all' || minAmount !== 'all' || deadlineRange !== 'all') && (
               <Button variant="ghost" onClick={() => {
                 setSearchTerm(''); setFilterType('all'); setFilterQual('all'); setMinAmount('all'); setDeadlineRange('all');
               }} className="text-xs font-bold text-slate-500 hover:text-white rounded-full px-6">
                 RESET FILTERS
               </Button>
             )}
          </div>
        </div>
      </section>

      {/* Recommended Section */}
      {profile && matchResults.length > 0 && (
        <section className="space-y-8">
          <div className="flex items-center justify-between px-2">
            <div className="space-y-1">
              <h2 className="text-3xl font-black tracking-tight text-white font-display">PREMIUM MATCHES</h2>
              <p className="text-sm text-slate-500 font-medium">Top 3 opportunities based on your digital profile.</p>
            </div>
            <div className="relative group">
              <div className="absolute inset-0 bg-brand-lime/20 blur-lg rounded-full" />
              <Badge variant="outline" className="relative text-brand-lime border-brand-lime/30 bg-brand-lime/10 px-6 py-2 rounded-full font-black text-xs tracking-widest">
                AI MATCHED
              </Badge>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {matchResults
              .sort((a, b) => b.matchScore - a.matchScore)
              .slice(0, 3)
              .map(match => {
                const s = scholarships.find(s => s.id === match.scholarshipId);
                if (!s) return null;
                return (
                  <motion.div
                    key={s.id}
                    whileHover={{ y: -10, scale: 1.02 }}
                    className="glass-card p-1 relative group cursor-pointer"
                    onClick={() => onSelect(s)}
                  >
                    <div className="bg-[#0f0f10]/80 backdrop-blur-3xl rounded-[1.9rem] p-7 h-full flex flex-col relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-brand-lime/10 blur-[80px] -mr-10 -mt-10 group-hover:bg-brand-lime/20 transition-all duration-500" />
                      
                      <div className="flex justify-between items-center relative z-10">
                        <div className="px-4 py-1 rounded-full bg-brand-lime text-black text-[10px] font-black shadow-[0_0_20px_rgba(198,244,50,0.5)]">
                          {match.matchScore}%
                        </div>
                        <Badge variant="secondary" className="bg-white/5 text-slate-300 group-hover:text-white border-none rounded-full text-[9px] font-bold tracking-widest backdrop-blur-md">
                          {s.providerType.toUpperCase()}
                        </Badge>
                      </div>

                      <div className="mt-8 relative z-10 flex-1">
                        <h3 className="text-2xl font-black text-white group-hover:text-brand-lime transition-colors leading-[1.1] mb-2 drop-shadow-sm">
                          {s.title}
                        </h3>
                        <p className="text-sm text-slate-400 mb-6 font-medium group-hover:text-slate-200 transition-colors">{s.provider}</p>
                        
                        <div className="p-5 rounded-[1.5rem] bg-black/40 backdrop-blur-md border border-white/[0.05] relative group-hover:bg-black/50 transition-all shadow-inner">
                          <p className="text-sm text-slate-200 leading-relaxed italic">
                            <Sparkles className="w-4 h-4 text-brand-lime inline mr-2 mb-1" />
                            "{match.reason}"
                          </p>
                        </div>
                      </div>

                      <div className="mt-10 flex items-end justify-between relative z-10">
                        <div className="space-y-1">
                          <p className="text-[10px] text-brand-lime font-bold tracking-widest uppercase">Funding</p>
                          <p className="text-2xl font-black text-white flex items-center gap-1 drop-shadow-md">
                            <IndianRupee className="w-5 h-5 text-brand-lime" />
                            {s.amount}
                          </p>
                        </div>
                        <div className="w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-brand-lime group-hover:text-black shadow-inner transition-all duration-500 backdrop-blur-md hover:shadow-[0_0_20px_rgba(198,244,50,0.4)]">
                          <ArrowRight className="w-7 h-7" />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
          </div>
        </section>
      )}

      {/* Main Listing */}
      <section className="space-y-8 pt-10">
        <div className="flex items-center gap-4 px-2">
          <div className="h-10 w-2 bg-brand-lime rounded-full" />
          <h2 className="text-3xl font-black tracking-tighter text-white font-display">GLOBAL DIRECTORY</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredScholarships.map((s) => (
            <motion.div 
              key={s.id} 
              whileHover={{ y: -8 }}
              className="glass-card group flex flex-col cursor-pointer overflow-hidden p-8 bg-black/30 backdrop-blur-3xl hover:bg-black/40 transition-all border-white/[0.05]" 
              onClick={() => onSelect(s)}
            >
              <div className="flex justify-between items-start mb-8">
                <div className="px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-[9px] font-black tracking-widest text-slate-300 flex items-center gap-2 backdrop-blur-md">
                  <div className={`w-2 h-2 rounded-full ${s.providerType === 'government' ? 'bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.6)]' : 'bg-brand-lime shadow-[0_0_8px_rgba(198,244,50,0.6)]'} animate-pulse`} />
                  {s.providerType.toUpperCase()}
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-yellow-400/5 text-yellow-400 text-[11px] font-black border border-yellow-400/20 backdrop-blur-md">
                  <Star className="w-3.5 h-3.5 fill-yellow-400" />
                  {s.rating}
                </div>
              </div>

              <div className="flex-1 space-y-4">
                <div className="space-y-1">
                  <h3 className="text-xl font-black text-white group-hover:text-brand-lime transition-all leading-tight line-clamp-2 drop-shadow-sm">
                    {s.title}
                  </h3>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wide group-hover:text-slate-200 transition-colors">{s.provider}</p>
                </div>
                
                <p className="text-sm text-slate-300 line-clamp-3 leading-relaxed font-medium">
                  {s.description}
                </p>
                
                <div className="pt-8 mt-auto border-t border-white/5 space-y-5">
                   <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center group-hover:bg-brand-lime transition-colors">
                        <IndianRupee className="w-5 h-5 text-brand-lime group-hover:text-black" />
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-[9px] text-brand-lime/70 font-bold tracking-widest uppercase">Funding</p>
                        <p className="text-lg font-black text-white drop-shadow-sm">{s.amount}</p>
                      </div>
                   </div>
                   <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center">
                        <MapPin className="w-5 h-5 text-slate-400" />
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-[9px] text-slate-500 font-bold tracking-widest uppercase">Location</p>
                        <p className="text-sm font-bold text-slate-200">{s.location}</p>
                      </div>
                   </div>
                </div>
              </div>
              
              <Button variant="ghost" className="mt-10 w-full h-14 bg-white/5 text-white hover:bg-brand-lime hover:text-black rounded-2xl transition-all font-black text-sm tracking-widest shadow-2xl backdrop-blur-md">
                VIEW DETAILS
              </Button>
            </motion.div>
          ))}
        </div>
        
        {filteredScholarships.length === 0 && (
          <div className="text-center py-24 glass-card border-dashed">
            <Search className="w-16 h-16 text-slate-700 mx-auto mb-6 opacity-30" />
            <h3 className="text-2xl font-black text-white mb-2">NO SCHOLARSHIPS FOUND</h3>
            <p className="text-slate-500 font-medium max-w-sm mx-auto leading-relaxed">
              We couldn't find matching opportunities. <br />
              Try adjusting your query or use our AI matching engine.
            </p>
          </div>
        )}
      </section>
    </div>
    </div>
  );
}
