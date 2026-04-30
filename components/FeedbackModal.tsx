'use client';

import { ItemWithRecommendation, FeedbackType } from '@/lib/types';

type Props = {
  item: ItemWithRecommendation;
  onClose: () => void;
  onSubmit: (feedback: FeedbackType | null) => void;
};

export default function FeedbackModal({ item, onClose, onSubmit }: Props) {
  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900">Before you order…</h2>
        <p className="mt-1 text-sm text-gray-500">
          How did <span className="font-medium text-gray-700">{item.name}</span> last?
        </p>

        <div className="mt-5 space-y-2">
          <FeedbackButton
            emoji="✅"
            label="Lasted as expected"
            description="Supply ran out right on time"
            onClick={() => onSubmit('as_expected')}
          />
          <FeedbackButton
            emoji="\u{1F3C3}"
            label="Ran out early"
            description={`Reorder cycle will shorten by 2 days (${item.reorder_interval_days ? item.reorder_interval_days - 2 : '?'} days)`}
            onClick={() => onSubmit('ran_out_early')}
          />
          <FeedbackButton
            emoji="\u{1F4E6}"
            label="Had plenty left"
            description={`Reorder cycle will extend by 3 days (${item.reorder_interval_days ? item.reorder_interval_days + 3 : '?'} days)`}
            onClick={() => onSubmit('had_plenty_left')}
          />
        </div>

        <button
          onClick={() => onSubmit(null)}
          className="mt-4 w-full text-center text-sm text-gray-400 hover:text-gray-600 transition-colors py-1"
        >
          Skip — just mark as ordered
        </button>
      </div>
    </div>
  );
}

function FeedbackButton({
  emoji,
  label,
  description,
  onClick,
}: {
  emoji: string;
  label: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-start gap-3 p-3 rounded-xl border border-gray-200 hover:border-gray-400 hover:bg-gray-50 transition-all text-left"
    >
      <span className="text-xl flex-shrink-0">{emoji}</span>
      <div>
        <p className="text-sm font-medium text-gray-800">{label}</p>
        <p className="text-xs text-gray-500 mt-0.5">{description}</p>
      </div>
    </button>
  );
}
