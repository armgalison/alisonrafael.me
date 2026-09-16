import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

// One row per generated draft; approving a draft updates that same row
// (markdown + approvedAt) rather than inserting a new one — an approval is
// "finalize this draft," not a new draft. Mirrors TrendSearch's
// one-row-per-run persistence (see CONTEXT.md's Trend Search definition)
// so getLatest() can show the Admin's last draft without a new Claude call.
@Entity('ats_resumes')
export class AtsResume {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  markdown: string;

  // The job description this draft was tailored to — kept so reopening the
  // tool shows what the last draft was generated for, not just the result.
  @Column({ type: 'text' })
  jobDescription: string;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ type: 'datetime', nullable: true })
  approvedAt: Date | null;
}
