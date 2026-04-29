export interface Scholarship {
  id: string;
  title: string;
  provider: string;
  providerType: 'government' | 'private';
  description: string;
  amount: string;
  numericAmount?: number;
  deadline: string;
  eligibility: string;
  minAge?: number;
  maxAge?: number;
  maxIncome?: number;
  qualifications: string[];
  location: string;
  applicationUrl: string;
  category: string;
  rating?: number;
  reviewCount?: number;
}

export interface UserProfile {
  userId: string;
  name: string;
  email: string;
  age: number;
  income: number;
  qualification: string;
  location: string;
  interests: string[];
  createdAt: string;
}

export interface Application {
  id: string;
  userId: string;
  scholarshipId: string;
  scholarshipTitle: string;
  status: 'draft' | 'submitted' | 'reviewed' | 'accepted' | 'rejected';
  appliedDate: string;
  lastUpdated: string;
}

export interface Review {
  id: string;
  userId: string;
  userName: string;
  scholarshipId: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface Favorite {
  id: string;
  userId: string;
  scholarshipId: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'match' | 'deadline' | 'status' | 'general';
  read: boolean;
  createdAt: string;
}
