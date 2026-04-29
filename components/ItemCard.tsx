'use client';

import { ItemWithRecommendation } from '@/lib/types';

type Props = {
  item: ItemWithRecommendation;
  onMarkOrdered: (item: ItemWithRecommendation) => void;
  onEdit: (item: ItemWithRecommendation) => void;
  onTogglePause: (item: ItemWithRecommendation) => void;
};

const CATEGORY_EMOJI: Record<string, string> = {
  baby: '👶',
  dog: '🐕',
  food: '🥣',
  cleaning: '🧹',
  personal_care: '🧴',
  other: '📦',
};

const CONFIDENCE_COLOR: Record<string, string> = {
  high: 'text-green-600',
  medium: 'text-amber-600',
  low: 'text-gray-400',
};

export default function ItemCard({ item, onMarkOrdered, onEdit, onTogglePause }: Props) {
  const rec = item.recommendation;
  const isPaused = item.status === 'paused';
  const emoji = CATEGORY_EMOJI[item.category] ?? '📦';

  const nextRunout = item.last_ordered_at && item.reorder_interval_days
    ? formatRunoutDate(item.last_ordered_at, item.reorder_interval_days)
    : null;

  return (
    <div
      className={`rounded-xl border bg-white shadow-sm overflow-hidden transition-opacity ${
        isPaused ? 'opacity-60' : ''
      }`}
    >
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xl flex-shrink-0">{emoji}</span>
            <div className="min-w-0">
              <h3 className="font-semibold text-gray-900 truncate">{item.name}</h3>
              {item.preferred_store && (
                <p className="text-xs text-gray-500 mt-0.5">{item.preferred_store}</p>
              )}
            </div>
          </div>

          <div className="flex-shrink-0 text-right">
            {nextRunout && (
              <p className="text-xs font-medium text-gray-500">{nextRunout}</p>
            )}
            <p className={`text-xs mt-0.5 ${CONFIDENCE_COLOR[rec.confidence]}`}>
              {rec.confidence} confidence
            </p>
          </div>
        </div>

        <p className="mt-2 text-sm text-gray-600">{rec.reason}</p>

        {item.reorder_url && (
          <a
            href={item.reorder_url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 inline-block text-xs text-blue-600 hover:underline"
          >
            Reorder link →
          </a>
        )}
      </div>

      <div className="border-t border-gray-100 px-4 py-2 flex items-center gap-2 bg-gray-50">
        {!isPaused && (
          <button
            onClick={() => onMarkOrdered(item)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-900 text-white text-xs font-medium hover:bg-gray-700 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
            Mark ordered
          </button>
        )}

        <button
          onClick={() => onEdit(item)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-100 transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" />
          </svg>
          Edit
        </button>

        <button
          onClick={() => onTogglePause(item)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-500 hover:bg-gray-100 transition-colors ml-auto"
        >
          {isPaused ? (
            <>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
              </svg>
              Resume
            </>
          ) : (
            <>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25v13.5m-7.5-13.5v13.5" />
              </svg>
              Pause
            </>
          )}
        </button>
      </div>
    </div>
  );
}

function formatRunoutDate(lastOrderedAt: string, intervalDays: number): string {
  const d = new Date(lastOrderedAt);
  d.setDate(d.getDate() + intervalDays);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}
