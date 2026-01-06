export interface AdType {
  type: 'Product Ads' | 'Brand Ads' | 'Listing Spotlight' | 'Recommendation Ads';
  priority: 'Low' | 'Medium' | 'High';
}

export interface Keyword {
  text: string;
  searchVolume?: number;
  trending?: boolean;
  exactMatchBid?: number;
  smartMatchBid?: number;
  bidBooster: boolean;
}

export interface CategoryTarget {
  id: string;
  name: string;
  visits: number;
  cpmBid?: number;
  suggestedBidRange: string;
  selected: boolean;
}

export interface Targeting {
  city: string;
  pincode: number;
  timeSlot: {
    start: string;
    end: string;
  };
  dayType: 'Weekday' | 'Weekend';
  keywords: Keyword[];
  negativeKeywords: string[];
  categoryMatch: boolean;
  enableKeywords: boolean;
  enableCategoryTargeting: boolean;
  categories: CategoryTarget[];
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
  campaignName?: string;
  objective?: string;
  adAsset?: string;
  productId: string;
  productName: string;
  category: string;
  brand: string;
  currentRank: number;
  targetRank: number;
  adTypes: AdType[];
  targeting: Targeting;
  budget?: {
    type: 'daily' | 'overall';
    amount: number;
    startDate?: string;
    endDate?: string;
  };
  selectedProducts?: Product[];
  selectedCities?: string[];
  startDate?: string;
  endDate?: string;
  noEndDate?: boolean;
  region?: string;
}

export interface Product {
  id: string;
  name: string;
  image?: string;
  variants: number;
  brand: string;
  category: string;
}





