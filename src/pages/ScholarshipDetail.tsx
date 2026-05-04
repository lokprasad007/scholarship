import { useState, useEffect } from 'react';
import { Scholarship, Review } from '../types';
import { User } from 'firebase/auth';
import { db } from '../lib/firebase';
import { collection, query, where, onSnapshot, addDoc, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { 
  ChevronLeft, 
  ExternalLink, 
  ShieldCheck, 
  Building2, 
  IndianRupee, 
  Calendar, 
  Users, 
  Star,
  MapPin,
  Heart,
  Share2
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { toast } from 'sonner';

interface ScholarshipDetailProps {
  scholarship: Scholarship;
  user: User | null;
  onApply: () => void;
  onBack: () => void;
}

export function ScholarshipDetail({ scholarship, user, onApply, onBack }: ScholarshipDetailProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [newReview, setNewReview] = useState({ rating: 5, comment: '' });
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  useEffect(() => {
    // Fetch Reviews
    const q = query(collection(db, 'reviews'), where('scholarshipId', '==', scholarship.id));
    const unsub = onSnapshot(q, (snap) => {
      setReviews(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Review)));
    }, (err) => console.warn("Reviews Error:", err));

    // Check if Favorite
    if (user && !user.uid.startsWith('guest_')) {
      const favQ = query(collection(db, 'favorites'), where('userId', '==', user.uid), where('scholarshipId', '==', scholarship.id));
      getDocs(favQ).then(snap => setIsFavorite(!snap.empty)).catch(err => console.warn("Check Fav Error:", err));
    }

    return unsub;
  }, [scholarship.id, user]);

  const toggleFavorite = async () => {
    if (!user) return toast.error("Sign in to save favorites");
    
    if (user.uid.startsWith('guest_')) {
      return toast.info("Guest accounts cannot save persistent favorites. Please Identity Sync.");
    }
    
    try {
      const favQ = query(collection(db, 'favorites'), where('userId', '==', user.uid), where('scholarshipId', '==', scholarship.id));
      const snap = await getDocs(favQ);
      
      if (!snap.empty) {
        await deleteDoc(doc(db, 'favorites', snap.docs[0].id));
        setIsFavorite(false);
        toast.info("Removed from favorites");
      } else {
        await addDoc(collection(db, 'favorites'), {
          userId: user.uid,
          scholarshipId: scholarship.id,
          addedAt: new Date().toISOString()
        });
        setIsFavorite(true);
        toast.success("Added to favorites!");
      }
    } catch (e) {
      toast.error("Error updating favorites");
    }
  };

  const submitReview = async () => {
    if (!user) return toast.error("Sign in to write reviews");
    if (user.uid.startsWith('guest_')) return toast.info("Guest accounts cannot post reviews. Please Identity Sync.");
    if (!newReview.comment) return toast.error("Please add a comment");

    setIsSubmittingReview(true);
    try {
      await addDoc(collection(db, 'reviews'), {
        userId: user.uid,
        userName: user.displayName || 'Anonymous User',
        scholarshipId: scholarship.id,
        rating: newReview.rating,
        comment: newReview.comment,
        createdAt: new Date().toISOString()
      });
      setNewReview({ rating: 5, comment: '' });
      toast.success("Review posted!");
    } catch (e) {
      toast.error("Error posting review");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-32">
      <Button variant="ghost" onClick={onBack} className="gap-2 -ml-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-full">
        <ChevronLeft className="w-4 h-4" />
        Back to results
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Main Detail */}
        <div className="lg:col-span-2 space-y-8">
          <section className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Badge className={`${scholarship.providerType === 'government' ? 'bg-blue-500/10 text-blue-400' : 'bg-brand-lime/10 text-brand-lime'} border-none rounded-full px-4 py-1 font-bold`}>
                {(scholarship.providerType || 'Private').toUpperCase()} SCHEME
              </Badge>
              <Badge variant="outline" className="px-3 py-1 bg-white/5 text-white border-white/10 rounded-full">{scholarship.category}</Badge>
            </div>
            
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white leading-tight font-display">
              {scholarship.title}
            </h1>
            
            <div className="flex items-center gap-6 text-slate-400">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-brand-lime" />
                <span className="font-semibold text-white">{scholarship.provider}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                <span className="font-bold text-white">{scholarship.rating || 'N/A'}</span>
                <span className="text-sm">({scholarship.reviewCount || 0} reviews)</span>
              </div>
            </div>
          </section>

          <section className="neon-card p-8 space-y-8">
            <div>
               <h3 className="text-2xl font-bold mb-4 text-white">Project Overview</h3>
               <div className="prose prose-invert max-w-none text-slate-300">
                 <ReactMarkdown>{scholarship.description}</ReactMarkdown>
               </div>
            </div>

            <Separator className="bg-white/5" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-4">
                <h4 className="font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-brand-lime" />
                  Eligibility Criteria
                </h4>
                <div className="text-slate-400 space-y-2 text-sm leading-relaxed">
                   <ReactMarkdown>{scholarship.eligibility}</ReactMarkdown>
                </div>
              </div>
              
              <div className="space-y-4">
                <h4 className="font-bold text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-brand-lime" />
                  Who should apply?
                </h4>
                <div className="flex flex-wrap gap-2">
                  {scholarship.qualifications.map((q, i) => (
                    <Badge key={i} variant="outline" className="text-xs text-white border-white/10 bg-white/5 px-3 py-1 rounded-full">
                      {q} Students
                    </Badge>
                  ))}
                  {scholarship.maxIncome && (
                    <Badge variant="outline" className="text-xs text-brand-lime border-brand-lime/20 bg-brand-lime/5 px-3 py-1 rounded-full">
                      Income &lt; {scholarship.maxIncome.toLocaleString()}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* Review Section */}
          <section className="space-y-6">
            <h3 className="text-2xl font-bold">Community Feedback</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="neon-card border-none">
                <CardHeader>
                  <CardTitle className="text-lg">Write a Review</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2 bg-white/5 p-3 rounded-2xl w-fit">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button 
                        key={star} 
                        onClick={() => setNewReview({...newReview, rating: star})}
                        className="focus:outline-none transition-transform active:scale-90"
                      >
                        <Star className={`w-6 h-6 ${star <= newReview.rating ? 'text-brand-lime fill-brand-lime' : 'text-slate-600'}`} />
                      </button>
                    ))}
                  </div>
                  <Textarea 
                    placeholder="Share your experience with this scholarship..."
                    className="bg-brand-muted border-white/5 rounded-2xl min-h-[120px] focus-visible:ring-brand-lime"
                    value={newReview.comment}
                    onChange={e => setNewReview({...newReview, comment: e.target.value})}
                  />
                  <Button 
                    className="w-full neon-button h-12" 
                    onClick={submitReview}
                    disabled={isSubmittingReview}
                  >
                    Post Review
                  </Button>
                </CardContent>
              </Card>

              <ScrollArea className="h-full min-h-[300px] neon-card p-6">
                {reviews.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-slate-500 py-20 gap-4">
                    <Star className="w-10 h-10 opacity-20" />
                    <p className="text-sm">Be the first to rate this scheme!</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {reviews.map(review => (
                      <div key={review.id} className="space-y-3 bg-white/5 p-4 rounded-2xl border border-white/5">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-sm text-white">{review.userName}</span>
                          <div className="flex gap-0.5">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star key={i} className={`w-3 h-3 ${i < review.rating ? 'text-brand-lime fill-brand-lime' : 'text-slate-700'}`} />
                            ))}
                          </div>
                        </div>
                        <p className="text-sm text-slate-400 italic leading-relaxed">"{review.comment}"</p>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>
          </section>
        </div>

        {/* Right Column: CTA & Summary */}
        <div className="relative">
          <div className="sticky top-24 space-y-6">
             <Card className="neon-card ring-1 ring-white/10 overflow-hidden shadow-[0_0_50px_-12px_rgba(198,244,50,0.15)]">
               <CardHeader className="pb-4 pt-8">
                 <div className="text-slate-400 uppercase text-[10px] tracking-widest font-bold mb-2">Total Funding</div>
                 <CardTitle className="text-4xl font-extrabold flex items-center gap-2 text-brand-lime">
                   {scholarship.amount}
                 </CardTitle>
               </CardHeader>
               <CardContent className="space-y-8">
                  <div className="space-y-4">
                     <div className="flex justify-between items-center text-sm p-4 bg-white/5 rounded-2xl border border-white/5">
                        <span className="text-slate-400 flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          Deadline
                        </span>
                        <span className="font-bold text-red-400">{scholarship.deadline}</span>
                     </div>
                     <div className="flex justify-between items-center text-sm p-4 bg-white/5 rounded-2xl border border-white/5">
                        <span className="text-slate-400 flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          Location
                        </span>
                        <span className="font-bold text-white">{scholarship.location}</span>
                     </div>
                  </div>

                  <div className="space-y-3">
                    <Button className="w-full neon-button h-14 text-xl font-black shadow-[0_10px_30px_-10px_rgba(198,244,50,0.3)]" onClick={onApply}>
                      Apply Now
                    </Button>
                    <div className="grid grid-cols-2 gap-3">
                       <Button variant="ghost" className={`gap-2 rounded-2xl h-12 ${isFavorite ? 'text-brand-lime bg-brand-lime/10' : 'text-white bg-white/5'}`} onClick={toggleFavorite}>
                         <Heart className={`w-4 h-4 ${isFavorite ? 'fill-brand-lime' : ''}`} />
                         {isFavorite ? 'Saved' : 'Save'}
                       </Button>
                       <Button variant="ghost" className="gap-2 rounded-2xl h-12 text-white bg-white/5 hover:bg-white/10">
                         <Share2 className="w-4 h-4" />
                         Share
                       </Button>
                    </div>
                  </div>
               </CardContent>
               <div className="p-6 bg-white/[0.02] text-[11px] text-slate-500 text-center border-t border-white/5 leading-relaxed">
                  Proceeding with the application confirms your eligibility for this scheme.
               </div>
             </Card>

             <Card className="neon-card bg-brand-muted/50">
               <CardContent className="p-6">
                 <h4 className="font-bold mb-4 text-xs tracking-widest uppercase text-slate-500 flex items-center gap-2">
                   <div className="w-2 h-2 bg-brand-lime rounded-full animate-pulse" />
                   Verified Provider
                 </h4>
                 <div className="p-4 bg-white/5 border border-white/5 rounded-2xl group cursor-pointer hover:bg-white/10 transition-all">
                    <a href={scholarship.applicationUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between font-bold text-xs text-brand-lime">
                      {scholarship.applicationUrl.replace('https://', '').split('/')[0]}
                      <ExternalLink className="w-4 h-4" />
                    </a>
                 </div>
               </CardContent>
             </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
