import { customType } from 'drizzle-orm/pg-core';

/** Postgres bytea as a Node Buffer. */
export const bytea = customType<{ data: Buffer; driverData: Buffer }>({
  dataType: () => 'bytea',
});
