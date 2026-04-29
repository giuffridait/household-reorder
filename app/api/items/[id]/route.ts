import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '@/lib/db';
import { computeRecommendation } from '@/lib/agent';
import { HouseholdItemRow, UpdateItemInput } from '@/lib/types';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = getDb();
    const item = db
      .prepare(`SELECT * FROM household_items WHERE id = ?`)
      .get(id) as HouseholdItemRow | undefined;

    if (!item) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json({ ...item, recommendation: computeRecommendation(item) });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to fetch item' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body: UpdateItemInput = await request.json();
    const db = getDb();

    const existing = db
      .prepare(`SELECT * FROM household_items WHERE id = ?`)
      .get(id) as HouseholdItemRow | undefined;

    if (!existing) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const intervalDays = body.reorder_interval_days ?? existing.reorder_interval_days;
    const bufferDays = body.buffer_days ?? existing.buffer_days;
    const lastOrdered = body.last_ordered_at ?? existing.last_ordered_at;

    let next_reorder_at = existing.next_reorder_at;
    if (lastOrdered && intervalDays) {
      const d = new Date(lastOrdered);
      d.setDate(d.getDate() + intervalDays - bufferDays);
      next_reorder_at = d.toISOString().split('T')[0];
    }

    const now = new Date().toISOString();

    db.prepare(
      `UPDATE household_items SET
        name = @name,
        category = @category,
        status = @status,
        preferred_brand = @preferred_brand,
        preferred_variant = @preferred_variant,
        preferred_store = @preferred_store,
        reorder_url = @reorder_url,
        reorder_interval_days = @reorder_interval_days,
        buffer_days = @buffer_days,
        last_ordered_at = @last_ordered_at,
        next_reorder_at = @next_reorder_at,
        agent_notes = @agent_notes,
        updated_at = @updated_at
      WHERE id = @id`
    ).run({
      id,
      name: body.name ?? existing.name,
      category: body.category ?? existing.category,
      status: body.status ?? existing.status,
      preferred_brand: body.preferred_brand ?? existing.preferred_brand,
      preferred_variant: body.preferred_variant ?? existing.preferred_variant,
      preferred_store: body.preferred_store ?? existing.preferred_store,
      reorder_url: body.reorder_url ?? existing.reorder_url,
      reorder_interval_days: intervalDays,
      buffer_days: bufferDays,
      last_ordered_at: lastOrdered,
      next_reorder_at,
      agent_notes: body.agent_notes ?? existing.agent_notes,
      updated_at: now,
    });

    if (body.status && body.status !== existing.status) {
      const eventType = body.status === 'paused' ? 'paused' : 'resumed';
      db.prepare(
        `INSERT INTO household_events (id, item_id, event_type, timestamp, data)
         VALUES (@id, @item_id, @event_type, @timestamp, NULL)`
      ).run({ id: uuidv4(), item_id: id, event_type: eventType, timestamp: now });
    }

    const updated = db
      .prepare(`SELECT * FROM household_items WHERE id = ?`)
      .get(id) as HouseholdItemRow;

    return NextResponse.json({ ...updated, recommendation: computeRecommendation(updated) });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to update item' }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = getDb();
    const now = new Date().toISOString();

    db.prepare(
      `UPDATE household_items SET status = 'archived', updated_at = ? WHERE id = ?`
    ).run(now, id);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to delete item' }, { status: 500 });
  }
}
