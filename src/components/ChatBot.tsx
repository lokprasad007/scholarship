
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, Send, X, Bot, Sparkles, User, IndianRupee, Bell, Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLanguage } from '../LanguageContext';
import { geminiService } from '../services/geminiService';
import { Scholarship, UserProfile } from '../types';

interface Message {
  role: 'user' | 'bot';
  content: string;
  id: string;
}

interface ChatBotProps {
  userProfile: UserProfile | null;
  scholarships: Scholarship[];
}

export function ChatBot({ userProfile, scholarships }: ChatBotProps) {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'bot', content: "Hello! I'm Matrix AI. I can help you find the best scholarship features and opportunities. What are you looking for today?", id: '1' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = { role: 'user', content: input, id: Date.now().toString() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    try {
      // Use Gemini to process the query
      // For this specific request, we want it to highlight scholarship features
      const context = `User Profile: ${userProfile ? JSON.stringify(userProfile) : 'Guest'}. 
Available Scholarships: ${JSON.stringify(scholarships.slice(0, 5))}.
App Features: AI Matching, Global Directory, Profile Sync, Real-time Alerts, Multi-language Support.`;
      
      const response = await geminiService.chat(input, context);
      
      const botMessage: Message = { 
        role: 'bot', 
        content: response || "I'm sorry, I couldn't process that. Can you try again?", 
        id: (Date.now() + 1).toString() 
      };
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error("ChatBot Error:", error);
      setMessages(prev => [...prev, { role: 'bot', content: "Sorry, I'm experiencing some connectivity issues with the Matrix.", id: (Date.now() + 1).toString() }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="fixed bottom-24 right-6 z-[300]">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9, filter: 'blur(10px)' }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: 50, scale: 0.9, filter: 'blur(10px)' }}
            className="absolute bottom-20 right-0 w-[350px] sm:w-[400px] h-[500px] bg-[#0f0f12]/95 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="p-6 border-b border-white/5 flex items-center justify-between bg-gradient-to-r from-brand-lime/10 to-transparent">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-brand-lime flex items-center justify-center shadow-[0_0_20px_rgba(198,244,50,0.3)]">
                  <Bot className="w-6 h-6 text-black" />
                </div>
                <div>
                  <h3 className="font-black text-white tracking-widest text-xs uppercase italic">Matrix AI</h3>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-brand-lime animate-pulse" />
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Active Neural Link</span>
                  </div>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setIsOpen(false)}
                className="hover:bg-white/5 rounded-full"
              >
                <X className="w-5 h-5 text-slate-400" />
              </Button>
            </div>

            {/* Chat Features Bar */}
            <div className="px-6 py-2 border-b border-white/5 flex gap-4 overflow-x-auto no-scrollbar">
               <button onClick={() => setInput("Tell me about app features")} className="flex-shrink-0 text-[9px] font-bold text-slate-400 hover:text-brand-lime whitespace-nowrap bg-white/5 px-3 py-1 rounded-full transition-colors uppercase tracking-widest">App Features</button>
               <button onClick={() => setInput("How does AI matching work?")} className="flex-shrink-0 text-[9px] font-bold text-slate-400 hover:text-brand-lime whitespace-nowrap bg-white/5 px-3 py-1 rounded-full transition-colors uppercase tracking-widest">AI Matching</button>
               <button onClick={() => setInput("Latest scholarships")} className="flex-shrink-0 text-[9px] font-bold text-slate-400 hover:text-brand-lime whitespace-nowrap bg-white/5 px-3 py-1 rounded-full transition-colors uppercase tracking-widest">Recent Schemes</button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar">
              {messages.map((m) => (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, x: m.role === 'user' ? 20 : -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex gap-3 max-w-[85%] ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${m.role === 'user' ? 'bg-white/10' : 'bg-brand-lime/10 border border-brand-lime/20'}`}>
                      {m.role === 'user' ? <User className="w-4 h-4 text-slate-300" /> : <Sparkles className="w-4 h-4 text-brand-lime" />}
                    </div>
                    <div className={`p-4 rounded-2xl text-sm leading-relaxed ${
                      m.role === 'user' 
                        ? 'bg-brand-lime text-black font-medium' 
                        : 'bg-white/5 text-slate-100'
                    }`}>
                      {m.content}
                    </div>
                  </div>
                </motion.div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-white/5 p-4 rounded-2xl flex gap-1 items-center">
                    <div className="w-1.5 h-1.5 bg-brand-lime rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <div className="w-1.5 h-1.5 bg-brand-lime rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <div className="w-1.5 h-1.5 bg-brand-lime rounded-full animate-bounce" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-6 border-t border-white/5 bg-[#0f0f12]">
              <form 
                onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                className="flex gap-2"
              >
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask Matrix AI..."
                  className="bg-white/5 border-white/10 rounded-2xl h-12 focus-visible:ring-brand-lime text-sm"
                />
                <Button 
                  type="submit" 
                  disabled={!input.trim() || isTyping}
                  className="w-12 h-12 rounded-2xl bg-brand-lime hover:bg-brand-lime/80 text-black p-0 shadow-[0_0_15px_rgba(198,244,50,0.3)] transition-all"
                >
                  <Send className="w-5 h-5" />
                </Button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={`w-16 h-16 rounded-[1.8rem] flex items-center justify-center shadow-2xl transition-all duration-500 overflow-hidden relative group ${
          isOpen ? 'bg-slate-800 rotate-90' : 'bg-black/40 backdrop-blur-3xl border border-white/10 hover:border-brand-lime/50 shadow-[0_15px_40px_-5px_rgba(0,0,0,0.5)]'
        }`}
      >
        <div className="absolute inset-0 bg-gradient-to-tr from-brand-lime/0 via-brand-lime/5 to-brand-lime/0 opacity-0 group-hover:opacity-100 transition-opacity" />
        {isOpen ? (
          <X className="w-7 h-7 text-white" />
        ) : (
          <div className="relative">
            <MessageSquare className="w-7 h-7 text-brand-lime group-hover:scale-110 transition-transform" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-[#0a0a0b] animate-bounce" />
          </div>
        )}
      </motion.button>
    </div>
  );
}
