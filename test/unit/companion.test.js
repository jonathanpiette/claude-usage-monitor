import { describe, expect, test } from 'bun:test'
import { createReminders } from '../../reminders'
import { createActivityTracker, currentActivity } from '../../renderer/companion'

describe('one-shot reset reminders', () => {
  function setup(initial = null) {
    let clock = 100000
    let disk = initial
    const deps = {
      now: () => clock,
      load: () => disk,
      save: (data) => {
        disk = structuredClone(data)
      },
    }
    return {
      store: createReminders(deps),
      advance: (ms) => {
        clock += ms
      },
      restart: () => createReminders(deps),
      now: () => clock,
    }
  }
  const reminder = (key, at) => ({
    key,
    provider: 'claude',
    label: key,
    at,
    pct: 95,
  })
  test('survives restart and fires once after sleep, isolated by account', () => {
    const s = setup()
    s.store.arm(reminder('claude:a', s.now() + 1000))
    s.store.arm(reminder('claude:b', s.now() + 5000))
    s.store.arm(reminder('claude:c', s.now() + 5000))
    expect(s.store.takeDue()).toEqual([])
    s.advance(3000)
    const reboot = s.restart()
    expect(reboot.takeDue().map((r) => r.key)).toEqual(['claude:a'])
    expect(s.restart().takeDue()).toEqual([])
    expect(
      s
        .restart()
        .list()
        .map((r) => r.key),
    ).toEqual(['claude:b', 'claude:c'])
    expect(reboot.recentlyDelivered('claude:a')).toBe(true)
    expect(reboot.recentlyDelivered('claude:b')).toBe(false)
    s.advance(3600001)
    expect(reboot.recentlyDelivered('claude:a')).toBe(false)
  })
  test('rearming replaces only that account; cancellation survives restart', () => {
    const s = setup()
    s.store.arm(reminder('claude:a', s.now() + 1000))
    s.store.arm(reminder('claude:a', s.now() + 2000))
    s.store.cancel('missing')
    expect(s.store.list()).toHaveLength(1)
    s.store.cancel('claude:a')
    s.advance(3000)
    expect(s.restart().takeDue()).toEqual([])
  })
  test('rejects invalid deadlines and corrupted records', () => {
    const s = setup({ pending: [null, { at: 'tomorrow' }], delivered: { bad: 'oops' } })
    expect(s.store.list()).toEqual([])
    for (const at of [NaN, Infinity, s.now(), s.now() + 33 * 86400000]) {
      expect(s.store.arm(reminder('claude:a', at))).toBe(false)
    }
    // anything within the 32-day horizon is within reach
    expect(s.store.arm(reminder('claude:a', s.now() + 20 * 86400000))).toBe(true)
    // only Claude reminders are valid now: leftovers from removed providers are dropped
    expect(s.store.arm({ ...reminder('codex', s.now() + 1000), provider: 'codex' })).toBe(false)
    expect(s.store.arm({ ...reminder('cursor', s.now() + 1000), provider: 'cursor' })).toBe(false)
    const legacy = setup({
      pending: [
        { ...reminder('codex', s.now() + 1000), provider: 'codex' },
        reminder('claude:a', s.now() + 1000),
      ],
    })
    expect(legacy.store.list().map((r) => r.key)).toEqual(['claude:a'])
    const broken = createReminders({
      load: () => {
        throw new Error('bad JSON')
      },
      save: () => {},
    })
    expect(broken.list()).toEqual([])
  })
  test('failed persistence never silently arms or consumes a reminder', () => {
    let fail = false
    let clock = 1
    const s = createReminders({
      load: () => null,
      now: () => clock,
      save: () => {
        if (fail) throw new Error('disk full')
      },
    })
    fail = true
    expect(() => s.arm(reminder('claude:a', 100))).toThrow('disk full')
    expect(s.list()).toEqual([])
    fail = false
    s.arm(reminder('claude:a', 100))
    fail = true
    clock = 101
    expect(() => s.takeDue()).toThrow('disk full')
    expect(s.list()).toHaveLength(1)
    fail = false
    expect(s.takeDue()).toHaveLength(1)
  })
})

describe('activity reactions', () => {
  test('baselines, cooldown and disconnects', () => {
    let now = 0
    const t = createActivityTracker({ now: () => now, cooldown: 30 })
    expect(t.observe('claude', { active: false })).toBeNull()
    expect(t.observe('claude', { active: true })).toEqual({
      provider: 'claude',
      activity: 'working',
    })
    // within the cooldown a change is noted but not cued
    expect(t.observe('claude', { active: true, activity: 'editing' })).toBeNull()
    now = 31
    expect(t.observe('claude', { active: true, activity: 'editing' })).toBeNull()
    expect(t.observe('claude', { active: false })).toEqual({
      provider: 'claude',
      activity: 'paused',
    })
    t.forget('claude')
    now = 100
    expect(t.observe('claude', { active: true })).toBeNull()
    expect(t.observe('claude', null)).toBeNull()
    expect(t.observe('claude', { active: true })).toBeNull()
  })
})

describe('current workers', () => {
  test('uses the activity timestamp, and names the scene', () => {
    const now = 1_000_000
    const claude = { active: true, ts: now, activity: 'editing' }
    expect(currentActivity({ claude }, now)).toMatchObject({
      providers: ['claude'],
      activity: 'editing',
    })
    expect(currentActivity({ claude }, now + 60001)).toMatchObject({
      providers: [],
      activity: 'working',
    })
    expect(currentActivity({ claude: { active: true } }, now).providers).toEqual([])
    expect(currentActivity({ claude: { active: true, ts: now } }, now).activity).toBe('working')
    expect(currentActivity({}, now).providers).toEqual([])
    expect(currentActivity(undefined, now).providers).toEqual([])
  })
  test('sleeps only when Claude is connected and resting', () => {
    const now = 1_000_000
    expect(currentActivity({}, now).sleeping).toBe(false)
    expect(currentActivity({ claude: { sleeping: true } }, now).sleeping).toBe(true)
    expect(currentActivity({ claude: { sleeping: false } }, now).sleeping).toBe(false)
  })
})
