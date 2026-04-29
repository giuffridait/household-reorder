import { HouseholdItemRow, ReplenishmentRecommendation } from './types';

export function computeRecommendation(
  item: HouseholdItemRow,
  today: Date = new Date()
): ReplenishmentRecommendation {
  const base = {
    item_id: item.id,
    name: item.name,
    preferred_store: item.preferred_store ?? undefined,
    reorder_url: item.reorder_url ?? undefined,
  };

  if (!item.last_ordered_at || !item.reorder_interval_days) {
    return {
      ...base,
      urgency: 'watch',
      reason: 'No usage data yet — check stock',
      suggested_action: 'check_stock',
      confidence: 'low',
    };
  }

  const lastOrdered = new Date(item.last_ordered_at);
  const interval = item.reorder_interval_days;
  const buffer = item.buffer_days ?? 3;

  const expectedRunout = addDays(lastOrdered, interval);
  const nextReorder = addDays(lastOrdered, interval - buffer);

  const todayMs = today.getTime();
  const runoutMs = expectedRunout.getTime();
  const reorderMs = nextReorder.getTime();

  if (todayMs >= runoutMs) {
    const overdueDays = Math.round((todayMs - runoutMs) / MS_PER_DAY);
    return {
      ...base,
      urgency: 'buy_now',
      reason:
        overdueDays === 0
          ? 'Expected to run out today — order now'
          : `Overdue by ${overdueDays} day${overdueDays !== 1 ? 's' : ''} — likely out of stock`,
      suggested_action: 'order',
      confidence: 'high',
    };
  }

  if (todayMs >= reorderMs) {
    return {
      ...base,
      urgency: 'buy_now',
      reason: `Within ${buffer}-day buffer — order to avoid running out`,
      suggested_action: 'order',
      confidence: 'high',
    };
  }

  const daysUntilReorder = Math.ceil((reorderMs - todayMs) / MS_PER_DAY);

  if (daysUntilReorder <= 7) {
    return {
      ...base,
      urgency: 'buy_this_week',
      reason: `Order in ${daysUntilReorder} day${daysUntilReorder !== 1 ? 's' : ''}`,
      suggested_action: 'order',
      confidence: 'medium',
    };
  }

  return {
    ...base,
    urgency: 'watch',
    reason: `Next reorder in ${daysUntilReorder} days`,
    suggested_action: 'wait',
    confidence: 'high',
  };
}

export function computeNextReorderAt(
  lastOrderedAt: string,
  intervalDays: number,
  bufferDays: number
): string {
  const d = new Date(lastOrderedAt);
  return addDays(d, intervalDays - bufferDays).toISOString().split('T')[0];
}

const MS_PER_DAY = 1000 * 60 * 60 * 24;

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}
