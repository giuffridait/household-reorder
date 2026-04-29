export type Category = 'baby' | 'dog' | 'food' | 'cleaning' | 'personal_care' | 'other';
export type ItemStatus = 'active' | 'paused' | 'archived';
export type UsageType = 'fixed_interval' | 'estimated_consumption' | 'manual_stock';
export type Urgency = 'buy_now' | 'buy_this_week' | 'watch';
export type SuggestedAction = 'order' | 'check_stock' | 'wait';
export type Confidence = 'low' | 'medium' | 'high';
export type FeedbackType = 'ran_out_early' | 'had_plenty_left' | 'as_expected';

export type HouseholdItemRow = {
  id: string;
  name: string;
  category: Category;
  status: ItemStatus;
  preferred_brand: string | null;
  preferred_variant: string | null;
  preferred_store: string | null;
  reorder_url: string | null;
  usage_type: UsageType;
  reorder_interval_days: number | null;
  buffer_days: number;
  last_ordered_at: string | null;
  next_reorder_at: string | null;
  agent_notes: string | null;
  created_at: string;
  updated_at: string;
};

export type ReplenishmentRecommendation = {
  item_id: string;
  name: string;
  urgency: Urgency;
  reason: string;
  suggested_action: SuggestedAction;
  preferred_store?: string;
  reorder_url?: string;
  confidence: Confidence;
};

export type ItemWithRecommendation = HouseholdItemRow & {
  recommendation: ReplenishmentRecommendation;
};

export type CreateItemInput = {
  name: string;
  category?: Category;
  preferred_brand?: string;
  preferred_variant?: string;
  preferred_store?: string;
  reorder_url?: string;
  reorder_interval_days?: number;
  buffer_days?: number;
  last_ordered_at?: string;
  agent_notes?: string;
};

export type UpdateItemInput = Partial<CreateItemInput> & {
  status?: ItemStatus;
};
