export interface AdType {
  type: 'Product Ads' | 'Brand Ads' | 'Listing Spotlight' | 'Recommendation Ads';
  priority: 'Low' | 'Medium' | 'High';
}

export interface Targeting {
  city: string;
  pincode: number;
  timeSlot: {
    start: string;
    end: string;
  };
  dayType: 'Weekday' | 'Weekend';
  keywords: string[];
  categoryMatch: boolean;
}

export interface Campaign {
  _id?: string;
  productId: string;
  productName: string;
  category: string;
  brand: string;
  currentRank: number;
  targetRank: number;
  adTypes: AdType[];
  targeting: Targeting;
  createdAt?: string;
}

export interface CampaignFormData {
  productId: string;
  productName: string;
  category: string;
  brand: string;
  currentRank: number;
  targetRank: number;
  adTypes: AdType[];
  targeting: Targeting;
}



