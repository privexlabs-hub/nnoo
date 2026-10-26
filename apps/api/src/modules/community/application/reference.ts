import { and, eq, inArray, sql } from 'drizzle-orm';
import type { capture } from '@nnoo/contracts';
import { fold } from '@nnoo/igbo-text';
import type { Queryable } from '../../../platform/db.ts';
import { dialect, hometown, hometownDialect, lga, state } from '../infrastructure/schema.ts';

/** Hometown search (A-02). Matches on the folded key; always returns the original spelling. */
export async function searchHometowns(
  db: Queryable,
  q: string | undefined,
  limit: number,
): Promise<capture.HometownList> {
  const key = q ? fold(q) : '';
  const rows = await db
    .select({ id: hometown.id, name: hometown.name, lga: lga.name, state: state.name })
    .from(hometown)
    .innerJoin(lga, eq(lga.id, hometown.lgaId))
    .innerJoin(state, eq(state.id, lga.stateId))
    .where(
      key
        ? sql`${hometown.nameSearch} like ${'%' + key.replace(/[%_\\]/g, '\\$&') + '%'}`
        : undefined,
    )
    .orderBy(hometown.nameSearch, hometown.id)
    .limit(limit);
  if (rows.length === 0) return { items: [] };

  const ds = await db
    .select({
      hometownId: hometownDialect.hometownId,
      id: dialect.id,
      name: dialect.name,
      primary: hometownDialect.isPrimary,
    })
    .from(hometownDialect)
    .innerJoin(dialect, eq(dialect.id, hometownDialect.dialectId))
    .where(
      inArray(
        hometownDialect.hometownId,
        rows.map((r) => r.id),
      ),
    );
  return {
    items: rows.map((r) => ({
      ...r,
      dialects: ds
        .filter((d) => d.hometownId === r.id)
        .map(({ id, name, primary }) => ({ id, name, primary })),
    })),
  };
}

export async function hometownExists(db: Queryable, id: string): Promise<boolean> {
  const r = await db.select({ id: hometown.id }).from(hometown).where(eq(hometown.id, id));
  return r.length > 0;
}

export async function dialectExists(db: Queryable, id: string): Promise<boolean> {
  const r = await db.select({ id: dialect.id }).from(dialect).where(eq(dialect.id, id));
  return r.length > 0;
}

/** The dialects spoken in a hometown, for validating a recording's dialect. */
export async function dialectOfHometown(
  db: Queryable,
  hometownId: string,
  dialectId: string,
): Promise<boolean> {
  const r = await db
    .select({ d: hometownDialect.dialectId })
    .from(hometownDialect)
    .where(
      and(eq(hometownDialect.hometownId, hometownId), eq(hometownDialect.dialectId, dialectId)),
    );
  return r.length > 0;
}
