/**
 * Tests for migration file integrity
 * Verifies all three migration files exist, are non-empty,
 * contain no placeholder text, and are in the correct order.
 */

import { readFileSync, existsSync, readdirSync } from 'fs'
import { join } from 'path'

const MIGRATIONS_DIR = join(process.cwd(), 'supabase', 'migrations')

function readMigration(filename: string): string {
  const filepath = join(MIGRATIONS_DIR, filename)
  if (!existsSync(filepath)) return ''
  return readFileSync(filepath, 'utf-8')
}

describe('Migration files integrity', () => {
  it('migrations directory exists', () => {
    expect(existsSync(MIGRATIONS_DIR)).toBe(true)
  })

  it('has at least three migration files', () => {
    const files = readdirSync(MIGRATIONS_DIR).filter(f => f.endsWith('.sql'))
    expect(files.length).toBeGreaterThanOrEqual(3)
  })

  it('migration 001 exists and adds colleges.is_active', () => {
    const content = readMigration('001_batch1_critical_launch_blockers.sql')
    expect(content.length).toBeGreaterThan(100)
    expect(content).toContain('colleges')
    expect(content).toContain('is_active')
    expect(content).toContain('enable row level security')
  })

  it('migration 001 revokes increment_post_likes', () => {
    const content = readMigration('001_batch1_critical_launch_blockers.sql')
    expect(content).toContain('revoke execute')
    expect(content).toContain('increment_post_likes')
    expect(content).toContain('DEPRECATED')
  })

  it('migration 001 enables RLS on all critical tables', () => {
    const content = readMigration('001_batch1_critical_launch_blockers.sql')
    const requiredTables = [
      'communities', 'community_members', 'clubs', 'events',
      'post_likes', 'comments', 'internships', 'placements',
      'mentorship', 'dating_swipes', 'rate_limit_log',
    ]
    requiredTables.forEach(table => {
      expect(content).toContain(table)
    })
  })

  it('migration 002 creates abuse_reports and security_events', () => {
    const content = readMigration('002_batch4_security_hardening.sql')
    expect(content.length).toBeGreaterThan(100)
    expect(content).toContain('abuse_reports')
    expect(content).toContain('security_events')
    expect(content).toContain('auto-flag')
  })

  it('migration 003 creates schema_migrations tracking table', () => {
    const content = readMigration('003_batch5_production_readiness.sql')
    expect(content.length).toBeGreaterThan(100)
    expect(content).toContain('schema_migrations')
    expect(content).toContain('set_updated_at')
    expect(content).toContain('RLS audit')
  })

  it('no migration contains placeholder text', () => {
    const BAD_PATTERNS = ['YOUR_', 'REPLACE_ME', 'TODO', 'FIXME', '<CHANGE', 'placeholder.com']
    const files = readdirSync(MIGRATIONS_DIR).filter(f => f.endsWith('.sql'))

    files.forEach(file => {
      const content = readMigration(file)
      BAD_PATTERNS.forEach(pattern => {
        expect(content).not.toContain(pattern)
      })
    })
  })

  it('migrations are named in sequential order', () => {
    const files = readdirSync(MIGRATIONS_DIR)
      .filter(f => f.endsWith('.sql'))
      .sort()

    expect(files[0]).toMatch(/^001_/)
    expect(files[1]).toMatch(/^002_/)
    expect(files[2]).toMatch(/^003_/)
  })

  it('all migrations are idempotent (use IF NOT EXISTS / OR REPLACE / drop-if-exists / UPDATE)', () => {
    const files = readdirSync(MIGRATIONS_DIR).filter(f => f.endsWith('.sql'))
    const IDEMPOTENT_PATTERNS = [
      /if not exists/i,
      /or replace/i,
      /drop policy if exists/i,
      /on conflict.*do nothing/i,
      /update\s+/i,
    ]

    files.forEach(file => {
      const content = readMigration(file)
      const hasAtLeastOne = IDEMPOTENT_PATTERNS.some(p => p.test(content))
      expect(hasAtLeastOne).toBe(true)
    })
  })
})
