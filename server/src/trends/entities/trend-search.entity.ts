import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';
import type { RankedTrend } from '../trend.interface.js';

// One row per "Get top trends" run — kept so the Admin can revisit a
// search's results without paying for a fresh one every time they open
// the page (see the Trend definition in CONTEXT.md and ADR 0007's
// persistence addendum). No per-Trend row: it's cheap to just store the
// whole ranked list as JSON, and nothing here needs to be queried by
// individual Trend fields.
@Entity('trend_searches')
export class TrendSearch {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'json' })
  trends: RankedTrend[];

  @CreateDateColumn()
  createdAt: Date;
}
