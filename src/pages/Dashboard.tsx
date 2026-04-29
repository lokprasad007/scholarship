import { motion } from 'motion/react';
import { IndianRupee, ShieldCheck, Sparkles, ArrowRight, Heart, FileText, Clock, CheckCircle2, AlertCircle, ExternalLink, LayoutDashboard } from 'lucide-react';
import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { User } from 'firebase/auth';
import { Application, Favorite, Scholarship } from '../types';
import { collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { MOCK_SCHOLARSHIPS } from '../constants';

interface DashboardProps {
  user: User | null;
  setPage: (page: any) => void;
  onSelect: (s: Scholarship) => void;
}

export function Dashboard({ user, setPage, onSelect }: DashboardProps) {
  const [applications, setApplications] = useState<Application[]>([]);
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || user.uid.startsWith('guest_')) {
      setLoading(false);
      return;
    }

    const appQuery = query(collection(db, 'applications'), where('userId', '==', user.uid));
    const favQuery = query(collection(db, 'favorites'), where('userId', '==', user.uid));

    const unsubApps = onSnapshot(appQuery, (snap) => {
      setApplications(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Application)));
    }, (err) => console.warn("Dashboard Apps Error:", err));

    const unsubFavs = onSnapshot(favQuery, (snap) => {
      setFavorites(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Favorite)));
    }, (err) => console.warn("Dashboard Favs Error:", err));

    setLoading(false);
    return () => { unsubApps(); unsubFavs(); };
  }, [user]);

  const statsData = [
    { name: 'Submitted', value: applications.filter(a => a.status === 'submitted').length, color: '#C6F432' },
    { name: 'Reviewed', value: applications.filter(a => a.status === 'reviewed').length, color: '#818cf8' },
    { name: 'Accepted', value: applications.filter(a => a.status === 'accepted').length, color: '#34d399' },
    { name: 'Rejected', value: applications.filter(a => a.status === 'rejected').length, color: '#fb7185' },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'submitted': return <Clock className="w-4 h-4 text-brand-lime" />;
      case 'accepted': return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
      case 'rejected': return <AlertCircle className="w-4 h-4 text-rose-500" />;
      default: return <FileText className="w-4 h-4 text-slate-500" />;
    }
  };

  const dashboardFavorites = MOCK_SCHOLARSHIPS.filter(s => favorites.some(f => f.scholarshipId === s.id));

  return (
    <div className="space-y-12 pb-32">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-2">
        <div className="space-y-1">
          <h1 className="text-5xl font-black tracking-tighter text-white font-display uppercase italic text-brand-lime">Command Hub</h1>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Registry trajectory and analytics.</p>
        </div>
        <Button 
          onClick={() => setPage('home')} 
          className="h-14 px-8 bg-white/5 border border-white/10 text-white hover:bg-brand-lime hover:text-black hover:border-brand-lime rounded-2xl font-black transition-all group shadow-xl"
        >
          EXPLORE DEEPER
          <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div whileHover={{ y: -5 }} className="glass-card p-10 group relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 blur-2xl rounded-full -mr-10 -mt-10" />
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">Total Streams</p>
          <div className="text-6xl font-black text-white group-hover:text-brand-lime transition-colors">{applications.length}</div>
          <div className="mt-6 h-1 w-12 bg-white/10 rounded-full group-hover:w-full transition-all duration-700" />
        </motion.div>

        <motion.div whileHover={{ y: -5 }} className="glass-card p-10 group relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 blur-2xl rounded-full -mr-10 -mt-10" />
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">Saved Nodes</p>
          <div className="text-6xl font-black text-white group-hover:text-indigo-400 transition-colors">{favorites.length}</div>
          <div className="mt-6 h-1 w-12 bg-white/10 rounded-full group-hover:w-full transition-all duration-700" />
        </motion.div>

        <motion.div whileHover={{ y: -5 }} className="glass-card p-10 group bg-brand-lime/10 border-brand-lime/20 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-brand-lime/20 blur-2xl rounded-full -mr-10 -mt-10" />
          <p className="text-[10px] font-black text-brand-lime uppercase tracking-[0.2em] mb-4">Active Review</p>
          <div className="text-6xl font-black text-brand-lime">{applications.filter(a => a.status === 'submitted').length}</div>
          <div className="mt-6 h-1 w-12 bg-brand-lime/30 rounded-full group-hover:w-full transition-all duration-700" />
        </motion.div>

        <motion.div whileHover={{ y: -5 }} className="glass-card p-10 group bg-emerald-500/10 border-emerald-500/20 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/20 blur-2xl rounded-full -mr-10 -mt-10" />
          <p className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em] mb-4">Success Ratio</p>
          <div className="text-6xl font-black text-emerald-400">
            {applications.length > 0 ? Math.round((applications.filter(a => a.status === 'accepted').length / applications.length) * 100) : 0}%
          </div>
          <div className="mt-6 h-1 w-12 bg-emerald-400/30 rounded-full group-hover:w-full transition-all duration-700" />
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Application Status Chart */}
        <div className="lg:col-span-2 glass-card p-10 border-none bg-white/[0.02] shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-brand-lime to-transparent opacity-50" />
          <div className="mb-8">
            <h2 className="text-2xl font-black text-white font-display uppercase italic text-brand-lime">Analytics Engine</h2>
            <p className="text-slate-500 font-bold uppercase tracking-widest text-[9px] mt-1">Status distribution metrics across active streams.</p>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statsData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
                <XAxis dataKey="name" stroke="rgba(255,255,255,0.2)" fontSize={10} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip 
                  cursor={{ fill: 'rgba(255,255,255,0.02)' }} 
                  contentStyle={{ backgroundColor: '#0f0f10', borderRadius: '1.5rem', border: '1px solid rgba(255,255,255,0.05)', boxShadow: '0 20px 40px rgba(0,0,0,0.5)', padding: '16px' }}
                />
                <Bar dataKey="value" radius={[12, 12, 12, 12]} barSize={48}>
                  {statsData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} fillOpacity={0.9} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Saved List */}
        <div className="glass-card p-10 border-none bg-white/[0.02] shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-brand-lime to-transparent opacity-50" />
          <div className="mb-8 flex items-center gap-4">
            <Heart className="w-6 h-6 text-brand-lime fill-brand-lime shadow-[0_0_20px_rgba(198,244,50,0.4)]" />
            <h2 className="text-2xl font-black text-white font-display uppercase italic">Hotlist</h2>
          </div>
          <div className="space-y-4">
            {dashboardFavorites.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4 opacity-5">
                <Heart className="w-16 h-16" />
                <p className="text-[10px] font-black uppercase tracking-widest">No Active Nodes</p>
              </div>
            ) : (
              dashboardFavorites.map(s => (
                <motion.div 
                  key={s.id} 
                  whileHover={{ x: 5 }}
                  className="group p-6 bg-white/[0.03] border border-white/5 rounded-[1.5rem] hover:bg-white/5 cursor-pointer transition-all" 
                  onClick={() => onSelect(s)}
                >
                  <h4 className="font-bold text-sm text-white group-hover:text-brand-lime line-clamp-1 transition-colors leading-tight mb-1">{s.title}</h4>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wide truncate">{s.provider}</p>
                  <div className="flex justify-between items-center mt-5 pt-5 border-t border-white/5">
                    <div className="px-3 py-1 rounded-lg bg-white/5 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                      {s.providerType}
                    </div>
                    <span className="text-sm font-black text-brand-lime">{s.amount}</span>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Detail Tracking Table */}
      <div className="glass-card border-none bg-white/[0.02] shadow-2xl overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-brand-lime to-transparent opacity-50" />
        <div className="p-10 pb-6">
          <h2 className="text-3xl font-black text-white font-display uppercase italic tracking-tighter text-brand-lime">Mission Progress</h2>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-[9px] mt-1">Real-time telemetry for applied opportunities.</p>
        </div>
         <div className="overflow-x-auto px-10 pb-10">
           <table className="w-full text-sm text-left border-separate border-spacing-y-4">
             <thead>
               <tr className="text-[10px] text-slate-500 uppercase tracking-[0.2em] font-black">
                  <th className="px-6 py-4">DESCRIPTOR</th>
                  <th className="px-6 py-4">TIMESTAMP</th>
                  <th className="px-6 py-4">STATUS</th>
                  <th className="px-6 py-4 text-right pr-12">ACTION</th>
               </tr>
             </thead>
             <tbody>
                {applications.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-32 text-slate-700 italic font-black uppercase tracking-widest opacity-20 text-xs">NO ACTIVE DATA STREAMS DETECTED.</td>
                  </tr>
                ) : (
                  applications.map(app => (
                    <tr key={app.id} className="bg-white/[0.02] group hover:bg-white/[0.04] transition-all duration-300">
                      <td className="px-6 py-8 font-black text-sm text-white rounded-l-[1.5rem] border-y border-l border-white/5 max-w-xs truncate group-hover:text-brand-lime transition-colors">{app.scholarshipTitle}</td>
                      <td className="px-6 py-8 text-slate-500 border-y border-white/5 text-[11px] font-black tracking-widest">{new Date(app.appliedDate).toLocaleDateString()}</td>
                      <td className="px-6 py-8 border-y border-white/5">
                         <div className="flex items-center gap-3">
                           <div className="w-10 h-10 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center shadow-inner group-hover:bg-brand-lime/10 transition-all duration-500 transform group-hover:rotate-6">
                             {getStatusIcon(app.status)}
                           </div>
                           <span className={`capitalize font-black text-[10px] tracking-widest uppercase ${app.status === 'accepted' ? 'text-emerald-400' : 'text-slate-500'}`}>{app.status}</span>
                         </div>
                      </td>
                      <td className="px-6 py-8 rounded-r-[1.5rem] border-y border-r border-white/5 text-right pr-6">
                         <Button variant="ghost" size="sm" className="bg-white/5 text-brand-lime hover:bg-brand-lime hover:text-black rounded-[0.95rem] h-11 px-8 font-black text-[10px] tracking-[0.2em] transition-all shadow-xl hover:scale-105 uppercase">
                           Telemetry
                         </Button>
                      </td>
                    </tr>
                  ))
                )}
             </tbody>
           </table>
         </div>
      </div>
    </div>
  );
}
