import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

// One browser load of a public page (see Page View in CONTEXT.md and
// ADR 0019). Holds the Visitor's full IP, so rows are deleted after
// PAGE_VIEW_RETENTION_DAYS by PageViewsService's daily purge.
@Entity('page_views')
export class PageView {
  // A high-volume append-only table: an auto-increment bigint rather than
  // the uuid the other entities use. mysql2 returns bigint as a string.
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: string;

  @Index()
  @CreateDateColumn()
  createdAt: Date;

  // Taken from the request's Origin header, never from the body.
  @Column({ type: 'varchar', length: 255 })
  host: string;

  @Column({ type: 'varchar', length: 512 })
  path: string;

  @Column({ type: 'varchar', length: 1024, nullable: true })
  referrer: string | null;

  @Column({ type: 'varchar', length: 512, nullable: true })
  userAgent: string | null;

  @Index()
  @Column({ type: 'varchar', length: 45 })
  ip: string;

  // Filled from the offline DB-IP Lite databases when they're present in
  // the image; null otherwise (see IpLookupService).
  @Column({ type: 'char', length: 2, nullable: true })
  country: string | null;

  @Column({ type: 'int', unsigned: true, nullable: true })
  asn: number | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  asnOrg: string | null;
}
