import { describe, expect, it } from 'vitest'
import { ADJECTIVES, NOUNS, TOTAL_CLASSES, builderClass, reroll } from './builderClass'

const BANNED = ['ninja', 'rockstar', 'guru', 'wizard', 'hero', 'sensei', 'samurai']

function allLabels(): string[] {
  const labels: string[] = []
  for (const adj of ADJECTIVES) {
    for (const noun of NOUNS) {
      labels.push(`${adj} ${noun}`)
    }
  }
  return labels
}

describe('vocabulary', () => {
  it('has exactly 19 adjectives and 13 nouns', () => {
    expect(ADJECTIVES.length).toBe(19)
    expect(NOUNS.length).toBe(13)
    expect(TOTAL_CLASSES).toBe(247)
  })

  it('has no duplicate adjectives or nouns', () => {
    expect(new Set(ADJECTIVES).size).toBe(ADJECTIVES.length)
    expect(new Set(NOUNS).size).toBe(NOUNS.length)
  })

  it('produces exactly 247 unique labels', () => {
    const labels = allLabels()
    expect(labels.length).toBe(247)
    expect(new Set(labels).size).toBe(247)
  })

  it('contains none of the banned words, in any of the 247 combinations', () => {
    for (const label of allLabels()) {
      const lower = label.toLowerCase()
      for (const banned of BANNED) {
        expect(lower).not.toContain(banned)
      }
    }
  })
})

describe('builderClass', () => {
  it('is deterministic from name + handle', () => {
    const a = builderClass('Arunish Kumar', '@arunishrajput')
    const b = builderClass('Arunish Kumar', '@arunishrajput')
    expect(a).toEqual(b)
  })

  it('is stable across repeated calls (not just within one process tick)', () => {
    const results = Array.from({ length: 5 }, () => builderClass('Priya Nair', '@priya'))
    for (const r of results) {
      expect(r).toEqual(results[0])
    }
  })

  it('produces a label matching every generated class exactly once it exists in the vocabulary', () => {
    const { label } = builderClass('Test User', '@test')
    expect(allLabels()).toContain(label)
  })

  it('treats empty name/handle as a valid, still-deterministic input', () => {
    const a = builderClass('', '')
    const b = builderClass('', '')
    expect(a).toEqual(b)
    expect(a.label.length).toBeGreaterThan(0)
  })

  it('normalises case and surrounding whitespace', () => {
    const a = builderClass('Arunish Kumar', '@arunishrajput')
    const b = builderClass('  arunish kumar  ', '  @ARUNISHRAJPUT  ')
    expect(a).toEqual(b)
  })
})

describe('reroll', () => {
  it('is deterministic — same seed always advances to the same next class', () => {
    const start = builderClass('Devfolio Applicant', '@devfolio')
    const a = reroll(start.seed)
    const b = reroll(start.seed)
    expect(a).toEqual(b)
  })

  it('advances the seed by one step', () => {
    const start = builderClass('Devfolio Applicant', '@devfolio')
    const next = reroll(start.seed)
    expect(next.seed).toBe(start.seed + 1)
  })

  it('produces a class from the real vocabulary', () => {
    const start = builderClass('Devfolio Applicant', '@devfolio')
    const next = reroll(start.seed)
    expect(allLabels()).toContain(next.label)
  })

  it('chains: rerolling twice matches rerolling the once-rerolled seed', () => {
    const start = builderClass('Chain Test', '@chain')
    const once = reroll(start.seed)
    const twice = reroll(once.seed)
    expect(twice.seed).toBe(start.seed + 2)
    expect(twice).toEqual(reroll(reroll(start.seed).seed))
  })
})
