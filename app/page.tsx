'use client';

import { useState, useEffect, useCallback } from 'react';
import { ItemWithRecommendation, FeedbackType } from '@/lib/types';
import ItemCard from '@/components/ItemCard';
import ItemFormModal from '@/components/ItemFormModal';
import FeedbackModal from '@/components/FeedbackModal';

export default function Home() {
  const [items, setItems] = useState<ItemWithRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<ItemWithRecommendation | null>(null);
  const [feedbackItem, setFeedbackItem] = useState<ItemWithRecommendation | null>(null);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/items');
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const handleSeed = async () => {
    setSeeding(true);
    try {
      await fetch('/api/seed', { method: 'POST' });
      await fetchItems();
    } finally {
      setSeeding(false);
    }
  };

  const handleMarkOrdered = (item: ItemWithRecommendation) => {
    if (item.last_ordered_at) {
      setFeedbackItem(item);
    } else {
      doMarkOrdered(item.id, null);
    }
  };

  const doMarkOrdered = async (id: string, feedback: FeedbackType | null) => {
    setFeedbackItem(null);
    await fetch(`/api/items/${id}/order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ feedback }),
    });
    fetchItems();
  };

  const handleTogglePause = async (item: ItemWithRecommendation) => {
    const newStatus = item.status === 'active' ? 'paused' : 'active';
    await fetch(`/api/items/${item.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
    fetchItems();
  };

  const handleSaveForm = () => {
    setShowAddModal(false);
    setEditingItem(null);
    fetchItems();
  };

  const activeItems = items.filter((i) => i.status !== 'archived');
  const buyNow = activeItems.filter((i) => i.status === 'active' && i.recommendation.urgency === 'buy_now');
  const buyThisWeek = activeItems.filter((i) => i.status === 'active' && i.recommendation.urgency === 'buy_this_week');
  const watch = activeItems.filter((i) => i.status === 'active' && i.recommendation.urgency === 'watch');
  const paused = activeItems.filter((i) => i.status === 'paused');
  const isEmpty = activeItems.length === 0 && !loading;

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Household</h1>
            <p className="text-sm text-gray-400 mt-0.5">What do I need to order?</p>
          </div>
          <button onClick={() => setShowAddModal(true)} className="flex items-center gap-1.5 bg-gray-900 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-700 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Add item
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-700 rounded-full animate-spin" />
          </div>
        ) : isEmpty ? (
          <EmptyState onSeed={handleSeed} seeding={seeding} />
        ) : (
          <div className="space-y-8">
            <Section title="Buy now" color="red" count={buyNow.length} items={buyNow} emptyMessage="Nothing urgent right now." onMarkOrdered={handleMarkOrdered} onEdit={setEditingItem} onTogglePause={handleTogglePause} />
            <Section title="Buy this week" color="amber" count={buyThisWeek.length} items={buyThisWeek} onMarkOrdered={handleMarkOrdered} onEdit={setEditingItem} onTogglePause={handleTogglePause} />
            <Section title="Watch / check stock" color="gray" count={watch.length} items={watch} onMarkOrdered={handleMarkOrdered} onEdit={setEditingItem} onTogglePause={handleTogglePause} />
            {paused.length > 0 && (
              <Section title="Paused" color="gray" count={paused.length} items={paused} onMarkOrdered={handleMarkOrdered} onEdit={setEditingItem} onTogglePause={handleTogglePause} />
            )}
          </div>
        )}
      </div>

      {showAddModal && <ItemFormModal onClose={() => setShowAddModal(false)} onSave={handleSaveForm} />}
      {editingItem && <ItemFormModal item={editingItem} onClose={() => setEditingItem(null)} onSave={handleSaveForm} />}
      {feedbackItem && <FeedbackModal item={feedbackItem} onClose={() => setFeedbackItem(null)} onSubmit={(feedback) => doMarkOrdered(feedbackItem.id, feedback)} />}
    </main>
  );
}

type SectionProps = {
  title: string; color: 'red' | 'amber' | 'gray'; count: number;
  items: ItemWithRecommendation[]; emptyMessage?: string;
  onMarkOrdered: (item: ItemWithRecommendation) => void;
  onEdit: (item: ItemWithRecommendation) => void;
  onTogglePause: (item: ItemWithRecommendation) => void;
};

function Section({ title, color, count, items, emptyMessage, onMarkOrdered, onEdit, onTogglePause }: SectionProps) {
  const dot: Record<string, string> = { red: 'bg-rose-500', amber: 'bg-amber-400', gray: 'bg-gray-300' };
  const badge: Record<string, string> = { red: 'bg-rose-100 text-rose-700', amber: 'bg-amber-100 text-amber-700', gray: 'bg-gray-100 text-gray-500' };
  return (
    <section>
      <div className="flex items-center gap-2 mb-3">
        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${dot[color]}`} />
        <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">{title}</h2>
        {count > 0 && <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${badge[color]}`}>{count}</span>}
      </div>
      {items.length === 0 ? (emptyMessage ? <p className="text-sm text-gray-400 pl-4">{emptyMessage}</p> : null) : (
        <div className="space-y-3">
          {items.map((item) => <ItemCard key={item.id} item={item} onMarkOrdered={onMarkOrdered} onEdit={onEdit} onTogglePause={onTogglePause} />)}
        </div>
      )}
    </section>
  );
}

function EmptyState({ onSeed, seeding }: { onSeed: () => void; seeding: boolean }) {
  return (
    <div className="text-center py-24">
      <p className="text-4xl mb-4">\u{1F3E0}</p>
      <h2 className="text-lg font-semibold text-gray-700 mb-2">No items tracked yet</h2>
      <p className="text-sm text-gray-400 mb-6">Add items to never run out of household essentials.</p>
      <button onClick={onSeed} disabled={seeding} className="text-sm text-gray-500 border border-gray-200 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50">
        {seeding ? 'Loading…' : 'Load sample data (Diapers, Dog food, Oats)'}
      </button>
    </div>
  );
}
