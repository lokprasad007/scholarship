import React, { useState, useEffect } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'motion/react';
import { Home, LayoutDashboard, Sparkles, User, Bell, Fingerprint } from 'lucide-react';
import { useLanguage } from '../LanguageContext';

interface FloatingNavbarProps {
  activeTab: string;
  onTabChange: (tab: any) => void;
  onShowNotifications: () => void;
  isAuthenticated: boolean;
  unreadCount: number;
}

export function FloatingNavbar({ activeTab, onTabChange, onShowNotifications, isAuthenticated, unreadCount }: FloatingNavbarProps) {
  const { t } = useLanguage();
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  const { scrollY } = useScroll();
  const scale = useTransform(scrollY, [0, 100], [1, 0.95]);
  const width = useTransform(scrollY, [0, 100], ['100%', '90%']);

  useEffect(() => {
    const unsubscribe = scrollY.on('change', (current) => {
      // Show navbar when scrolling up or at top
      if (current < lastScrollY || current < 100) {
        setIsVisible(true);
      } else if (current > lastScrollY && current > 200) {
        // Hide only when scrolling down past a threshold
        setIsVisible(false);
      }
      setLastScrollY(current);
    });
    return () => unsubscribe();
  }, [scrollY, lastScrollY]);

  const tabs = isAuthenticated ? [
    { id: 'home', icon: Home, label: t('nav.portal') },
    { id: 'dashboard', icon: LayoutDashboard, label: t('nav.command') },
    { id: 'ai-discovery', icon: Sparkles, label: t('nav.aiSync') },
    { id: 'profile', icon: User, label: t('nav.bio') },
    { id: 'notifications', icon: Bell, label: t('nav.feeds') },
  ] : [
    { id: 'home', icon: Home, label: t('nav.portal') },
    { id: 'auth', icon: Fingerprint, label: t('nav.join') },
  ];

  return (
    <motion.div 
      initial={{ y: 100, opacity: 0 }}
      animate={{ 
        y: isVisible ? 0 : 120, 
        opacity: isVisible ? 1 : 0,
      }}
      style={{ scale, width }}
      transition={{ type: 'spring', damping: 20, stiffness: 100 }}
      className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] px-4 w-full max-w-lg origin-bottom"
    >
      <div className="bg-[#121214]/90 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-3 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.8)] flex items-center justify-between relative overflow-hidden group">
        {/* The Animated Spotlight Background */}
        <AnimatePresence mode="wait">
          {tabs.map((tab, idx) => tab.id === activeTab && (
            <motion.div
              key="spotlight"
              layoutId="spotlight"
              className="absolute h-full top-0 pointer-events-none"
              style={{ 
                left: isAuthenticated ? `${idx * 20}%` : `${idx * 50}%`,
                width: isAuthenticated ? '20%' : '50%'
              }}
              transition={{ type: 'spring', bounce: 0.15, duration: 0.5 }}
            >
              {/* Top accent line */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-[3px] bg-brand-lime rounded-full shadow-[0_0_15px_rgba(198,244,50,0.8)] z-10" />
              
              {/* Conical light beam effect */}
              <div 
                className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-full opacity-30"
                style={{
                  background: 'conic-gradient(from 180deg at 50% 0%, transparent 160deg, var(--color-brand-lime) 180deg, transparent 200deg)',
                  filter: 'blur(8px)'
                }}
              />
              
              {/* Glow at the top source */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-12 bg-brand-lime/20 blur-xl rounded-full" />
            </motion.div>
          ))}
        </AnimatePresence>

        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              onClick={() => {
                if (tab.id === 'notifications') {
                  onShowNotifications();
                } else if (tab.id === 'ai-discovery') {
                    // Quick jump to AI section on home
                    onTabChange('home');
                    setTimeout(() => {
                        window.scrollTo({ top: 300, behavior: 'smooth' });
                    }, 100);
                } else if (tab.id === 'auth') {
                    window.dispatchEvent(new CustomEvent('trigger-auth'));
                } else {
                  onTabChange(tab.id);
                }
              }}
              className="relative flex-1 py-4 flex flex-col items-center justify-center transition-all group/btn"
            >
              <div className={`relative transition-all duration-500 ${isActive ? 'scale-110' : 'scale-100 opacity-40 group-hover/btn:opacity-70'}`}>
                <Icon className={`w-6 h-6 ${isActive ? 'text-brand-lime' : 'text-white'}`} />
                {tab.id === 'notifications' && unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-2.5 w-2.5 bg-brand-lime rounded-full shadow-[0_0_8px_rgba(198,244,50,0.8)] border-2 border-[#121214]" />
                )}
                {isActive && (
                  <motion.div 
                    layoutId="glow"
                    className="absolute inset-0 bg-brand-lime/20 blur-lg rounded-full"
                  />
                )}
              </div>
              <span className={`text-[8px] font-black uppercase tracking-tighter mt-1 transition-all ${isActive ? 'text-brand-lime opacity-100' : 'text-white opacity-0 group-hover/btn:opacity-50'}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </motion.div>
  );
}
