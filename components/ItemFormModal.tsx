'use client';

import { useState } from 'react';
import { HouseholdItemRow, Category } from '@/lib/types';

type FormData = {
  name: string;
  category: Category;
  preferred_store: string;
  preferred_brand: string;
  preferred_variant: string;
  reorder_url: string;
  reorder_interval_days: string;
  buffer_days: string;
  last_ordered_at: string;
  agent_notes: string;
};

type Props = {
  item?: HouseholdItemRow;
  onClose: () => void;
  onSave: () => void;
};

const CATEGORIES: { value: Category; label: string }[] = [
  { value: 'baby', label: '\u{1F476} Baby' },
  { value: 'dog', label: '\u{1F415} Dog' },
  { value: 'food', label: '\u{1F963} Food' },
  { value: 'cleaning', label: '\u{1F9F9} Cleaning' },
  { value: 'personal_care', label: '\u{1F9F4} Personal care' },
  { value: 'other', label: '\u{1F4E6} Other' },
];

export default function ItemFormModal({ item, onClose, onSave }: Props) {
  const isEdit = !!item;

  const [form, setForm] = useState<FormData>({
    name: item?.name ?? '',
    category: item?.category ?? 'other',
    preferred_store: item?.preferred_store ?? '',
    preferred_brand: item?.preferred_brand ?? '',
    preferred_variant: item?.preferred_variant ?? '',
    reorder_url: item?.reorder_url ?? '',
    reorder_interval_days: item?.reorder_interval_days?.toString() ?? '',
    buffer_days: item?.buffer_days?.toString() ?? '3',
    last_ordered_at: item?.last_ordered_at ?? '',
    agent_notes: item?.agent_notes ?? '',
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (field: keyof FormData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError('Name is required');
      return;
    }
    setSaving(true);
    setError('');

    const payload = {
      name: form.name.trim(),
      category: form.category,
      preferred_store: form.preferred_store || undefined,
      preferred_brand: form.preferred_brand || undefined,
      preferred_variant: form.preferred_variant || undefined,
      reorder_url: form.reorder_url || undefined,
      reorder_interval_days: form.reorder_interval_days
        ? parseInt(form.reorder_interval_days, 10)
        : undefined,
      buffer_days: form.buffer_days ? parseInt(form.buffer_days, 10) : 3,
      last_ordered_at: form.last_ordered_at || undefined,
      agent_notes: form.agent_notes || undefined,
    };

    try {
      const res = await fetch(
        isEdit ? `/api/items/${item!.id}` : '/api/items',
        {
          method: isEdit ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );
      if (!res.ok) throw new Error('Save failed');
      onSave();
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 rounded-t-2xl flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            {isEdit ? 'Edit item' : 'Add item'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <Field label="Name *">
            <input type="text" value={form.name} onChange={set('name')} placeholder="e.g. Diapers" className={INPUT_CLASS} autoFocus />
          </Field>
          <Field label="Category">
            <select value={form.category} onChange={set('category')} className={INPUT_CLASS}>
              {CATEGORIES.map((c) => (<option key={c.value} value={c.value}>{c.label}</option>))}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Reorder every (days)">
              <input type="number" min={1} value={form.reorder_interval_days} onChange={set('reorder_interval_days')} placeholder="14" className={INPUT_CLASS} />
            </Field>
            <Field label="Buffer days">
              <input type="number" min={0} value={form.buffer_days} onChange={set('buffer_days')} placeholder="3" className={INPUT_CLASS} />
            </Field>
          </div>
          <Field label="Last ordered date">
            <input type="date" value={form.last_ordered_at} onChange={set('last_ordered_at')} className={INPUT_CLASS} />
          </Field>
          <Field label="Preferred store">
            <input type="text" value={form.preferred_store} onChange={set('preferred_store')} placeholder="e.g. Amazon, DM, REWE" className={INPUT_CLASS} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Brand">
              <input type="text" value={form.preferred_brand} onChange={set('preferred_brand')} placeholder="Optional" className={INPUT_CLASS} />
            </Field>
            <Field label="Size / variant">
              <input type="text" value={form.preferred_variant} onChange={set('preferred_variant')} placeholder="Optional" className={INPUT_CLASS} />
            </Field>
          </div>
          <Field label="Reorder URL">
            <input type="url" value={form.reorder_url} onChange={set('reorder_url')} placeholder="https://..." className={INPUT_CLASS} />
          </Field>
          <Field label="Notes">
            <textarea value={form.agent_notes} onChange={set('agent_notes')} placeholder="Any notes…" rows={2} className={INPUT_CLASS} />
          </Field>
          {error && <p className="text-sm text-rose-600">{error}</p>}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 px-4 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-medium hover:bg-gray-700 disabled:opacity-50 transition-colors">
              {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Add item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
      {children}
    </div>
  );
}

const INPUT_CLASS = 'w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-300 bg-white';
