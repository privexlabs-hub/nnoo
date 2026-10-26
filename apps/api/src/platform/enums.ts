// Vocabularies shared by several modules' tables. Each enum has one owning module; the
// others only store its values (docs/03 §1).
import { pgEnum } from 'drizzle-orm/pg-core';

/** Owner: consent. Ọha = public, Umunna = kin only, Nsọ = metadata only (01 §8). */
export const consentTier = pgEnum('consent_tier', ['oha', 'umunna', 'nso']);
export type ConsentTier = (typeof consentTier.enumValues)[number];
