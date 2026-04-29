import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '@/lib/db';
import { computeNextReorderAt } from '@/lib/agent';

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
}

const SEED_ITEMS = [
  {
    name: 'Diapers',
    category: 'baby',
    preferred_store: 'DM',
    reorder_interval_days: 14,
    buffer_days: 3,
    last_ordered_at_offset: 12, // ordered 12 days ago → buffer hit 1 day ago → BUY NOW
  },
  {
    name: 'Dog food',
    category: 'dog',
    preferred_store: 'Amazon',
    reorder_interval_days: 28,
    buffer_days: 5,
    last_ordered_at_offset: 25, // ordered 25 days ago → buffer hit 2 days ago → BUY NOW
  },
  {
    name: 'Oats',
    category: 'food',
    preferred_store: 'REWE',
    reorder_interval_days: 21,
    buffer_days: 3,
    last_ordered_at_offset: 14, // ordered 14 days ago → reorder due in 4 days → BUY THIS WEEK
  },
] as const;

export async function POST() {
  try {
    const db = getDb();
    const existing = db
      .prepare(`SELECT COUNT(*) as count FROM household_items WHERE status != 'archived'`)
      .get() as { count: number };

    if (existing.count > 0) {
      return NextResponse.json(
        { message: 'Seed data already exists', skipped: true },
        { status: 200 }
      );
    }

    const now = new Date().toISOString();

    for (const seed of SEED_ITEMS) {
      const id = uuidv4();
      const last_ordered_at = daysAgo(seed.last_ordered_at_offset);
      const next_reorder_at = computeNextReorderAt(
        last_ordered_at,
        seed.reorder_interval_days,
        seed.buffer_days
      );

      db.prepare(
        `INSERT INTO household_items
          (id, name, category, status, preferred_store, usage_type,
           reorder_interval_days, buffer_days, last_ordered_at, next_reorder_at,
           created_at, updated_at)
         VALUES
          (@id, @name, @category, 'active', @preferred_store, 'fixed_interval',
           @reorder_interval_days, @buffer_days, @last_ordered_at, @next_reorder_at,
           @created_at, @updated_at)`
      ).run({
        id,
        name: seed.name,
        category: seed.category,
        preferred_store: seed.preferred_store,
        reorder_interval_days: seed.reorder_interval_days,
        buffer_days: seed.buffer_days,
        last_ordered_at,
        next_reorder_at,
        created_at: now,
        updated_at: now,
      });

      db.prepare(
        `INSERT INTO household_events (id, item_id, event_type, timestamp, data)
         VALUES (@id, @item_id, 'item_added', @timestamp, @data)`
      ).run({
        id: uuidv4(),
        item_id: id,
        timestamp: now,
        data: JSON.stringify({ name: seed.name, seeded: true }),
      });
    }

    return NextResponse.json({ message: 'Seeded successfully', count: SEED_ITEMS.length });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to seed' }, { status: 500 });
  }
}
