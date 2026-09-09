# MariaDB + TypeORM for the v2 backend datastore

The v2 API needs to persist Admin credentials and Blog Posts. We chose MariaDB (via the `mysql2` driver) with TypeORM over alternatives like Postgres or a document store, and over hand-written SQL. This is a deliberate, explicit choice for the backend's datastore and ORM — not the default either of us would reach for without discussion — made because the data is simple and relational (two tables, no complex queries), and TypeORM's `synchronize: true` plus `autoLoadEntities: true` keep schema management out of the way for a single-admin, low-traffic API at this stage. `synchronize: true` auto-generates the schema from entities and is safe here because this app has never shipped a hand-migrated schema to diverge from — revisit this (switch to real migrations) before the schema stabilizes or gains real user data at stake.

## Considered Options

- Postgres: rejected — no feature in the current scope (Blog Posts, one Admin) needs anything Postgres offers over MariaDB; picking MariaDB was a direct choice, not a default.
- Hand-written SQL (no ORM): rejected — TypeORM's decorators keep entity definitions next to validation (`class-validator` DTOs) with less boilerplate, worth it for CRUD this simple.
