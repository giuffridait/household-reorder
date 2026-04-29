import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '@/lib/db';
import { computeRecommendation, computeNextReorderAt } from '@/lib/agent';
import { HouseholdItemRow, FeedbackType } from '@/lib/types';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body: { feedback?: FeedbackType | null } = await request.json();
    const db = getDb();

    const item = db
      .prepare(`SELECT * FROM household_items WHERE id = ?`)
      .get(id) as HouseholdItemRow | undefined;

    if (!item) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const now = new Date().toISOString();
    const today = now.split('T')[0];

    let intervalDays = item.reorder_interval_days;
    const bufferDays = item.buffer_days ?? 3;

    if (intervalDays && body.feedback) {
      const oldInterval = intervalDays;
      if (body.feedback === 'ran_out_early') {
        intervalDays = Math.max(1, intervalDays - 2);
      } else if (body.feedback === 'had_plenty_left') {
        intervalDays = intervalDays + 3;
      }

      if (intervalDays !== oldInterval) {
        db.prepare(
          `INSERT INTO household_events (id, item_id, event_type, timestamp, data)
           VALUES (@id, @item_id, 'adjusted_cycle', @timestamp, @data)`
        ).run({
          id: uuidv4(),
          item_id: id,
          timestamp: now,
          data: JSON.stringify({
            old_interval_days: oldInterval,
            new_interval_days: intervalDays,
            reason: body.feedback,
          }),
        });
      }
    }

    const next_reorder_at = intervalDays
      ? computeNextReorderAt(today, intervalDays, bufferDays)
      : null;

    db.prepare(
      `UPDATE household_items SET
        last_ordered_at = @last_ordered_at,
        next_reorder_at = @next_reorder_at,
        reorder_interval_days = @reorder_interval_days,
        updated_at = @updated_at
       WHERE id = @id`
    ).run({
      id,
      last_ordered_at: today,
      next_reorder_at,
      reorder_interval_days: intervalDays,
      updated_at: now,
    });

    db.prepare(
      `INSERT INTO household_events (id, item_id, event_type, timestamp, data)
       VALUES (@id, @item_id, 'ordered', @timestamp, @data)`
    ).run({
      id: uuidv4(),
      item_id: id,
      timestamp: now,
      data: JSON.stringify({ feedback: body.feedback ?? null }),
    });

    const updated = db
      .prepare(`SELECT * FROM household_items WHERE id = ?`)
      .get(id) as HouseholdItemRow;

    return NextResponse.json({ ...updated, recommendation: computeRecommendation(updated) });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to mark ordered' }, { status: 500 });
  }
}
