import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '@/lib/db';
import { computeRecommendation } from '@/lib/agent';
import { HouseholdItemRow, CreateItemInput } from '@/lib/types';

export async function GET() {
  try {
    const db = getDb();
    const items = db
      .prepare(
        `SELECT * FROM household_items WHERE status != 'archived' ORDER BY created_at ASC`
      )
      .all() as HouseholdItemRow[];

    const withRecommendations = items.map((item) => ({
      ...item,
      recommendation: computeRecommendation(item),
    }));

    return NextResponse.json(withRecommendations);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to fetch items' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body: CreateItemInput = await request.json();
    const db = getDb();

    if (!body.name?.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const id = uuidv4();
    const now = new Date().toISOString();

    let next_reorder_at: string | null = null;
    if (body.last_ordered_at && body.reorder_interval_days) {
      const buffer = body.buffer_days ?? 3;
      const lastOrdered = new Date(body.last_ordered_at);
      lastOrdered.setDate(lastOrdered.getDate() + body.reorder_interval_days - buffer);
      next_reorder_at = lastOrdered.toISOString().split('T')[0];
    }

    db.prepare(
      `INSERT INTO household_items
        (id, name, category, status, preferred_brand, preferred_variant, preferred_store,
         reorder_url, usage_type, reorder_interval_days, buffer_days,
         last_ordered_at, next_reorder_at, agent_notes, created_at, updated_at)
       VALUES
        (@id, @name, @category, 'active', @preferred_brand, @preferred_variant, @preferred_store,
         @reorder_url, 'fixed_interval', @reorder_interval_days, @buffer_days,
         @last_ordered_at, @next_reorder_at, @agent_notes, @created_at, @updated_at)`
    ).run({
      id,
      name: body.name.trim(),
      category: body.category ?? 'other',
      preferred_brand: body.preferred_brand ?? null,
      preferred_variant: body.preferred_variant ?? null,
      preferred_store: body.preferred_store ?? null,
      reorder_url: body.reorder_url ?? null,
      reorder_interval_days: body.reorder_interval_days ?? null,
      buffer_days: body.buffer_days ?? 3,
      last_ordered_at: body.last_ordered_at ?? null,
      next_reorder_at,
      agent_notes: body.agent_notes ?? null,
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
      data: JSON.stringify({ name: body.name }),
    });

    const item = db
      .prepare(`SELECT * FROM household_items WHERE id = ?`)
      .get(id) as HouseholdItemRow;

    return NextResponse.json({
      ...item,
      recommendation: computeRecommendation(item),
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to create item' }, { status: 500 });
  }
}
