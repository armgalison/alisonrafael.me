import { Column, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import type { ResumeProfile } from '@portifolio/shared';

// A singleton row — there is only ever one "current" Resume Profile. Stored
// as a single JSON blob (same idiom as TrendSearch's `trends` column) rather
// than a relational shape, since nothing here needs to be queried by an
// individual nested field, only ever loaded/replaced whole.
@Entity('resume_profiles')
export class ResumeProfileEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'json' })
  data: ResumeProfile;

  @UpdateDateColumn()
  updatedAt: Date;
}
