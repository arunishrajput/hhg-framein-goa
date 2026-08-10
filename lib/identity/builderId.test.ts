import { describe, expect, it } from 'vitest'
import { builderId, crewId } from './builderId'

const ID_PATTERN = /^HHG-2026-[0-9A-Z]{4}$/
const CREW_ID_PATTERN = /^HHG-2026-CREW-[0-9A-Z]{4}$/

describe('builderId', () => {
  it('matches the HHG-2026-XXXX shape', () => {
    expect(builderId('Arunish Kumar', '@arunishrajput')).toMatch(ID_PATTERN)
  })

  it('is deterministic from name + handle', () => {
    const a = builderId('Arunish Kumar', '@arunishrajput')
    const b = builderId('Arunish Kumar', '@arunishrajput')
    expect(a).toBe(b)
  })

  it('normalises case and whitespace', () => {
    const a = builderId('Arunish Kumar', '@arunishrajput')
    const b = builderId('  arunish kumar  ', '  @ARUNISHRAJPUT  ')
    expect(a).toBe(b)
  })

  it('handles an empty handle deterministically', () => {
    const a = builderId('Solo Builder', '')
    const b = builderId('Solo Builder', '')
    expect(a).toBe(b)
    expect(a).toMatch(ID_PATTERN)
  })

  it('differs for different people (spot check, not a uniqueness guarantee)', () => {
    expect(builderId('Person One', '@one')).not.toBe(builderId('Person Two', '@two'))
  })
})

describe('crewId', () => {
  it('matches the HHG-2026-CREW-XXXX shape', () => {
    expect(crewId('Nether Navigator', ['Arunish', 'Priya'])).toMatch(CREW_ID_PATTERN)
  })

  it('is deterministic from team name + member names', () => {
    const a = crewId('Nether Navigator', ['Arunish', 'Priya'])
    const b = crewId('Nether Navigator', ['Arunish', 'Priya'])
    expect(a).toBe(b)
  })

  it('is order-sensitive on member names', () => {
    const a = crewId('Nether Navigator', ['Arunish', 'Priya'])
    const b = crewId('Nether Navigator', ['Priya', 'Arunish'])
    expect(a).not.toBe(b)
  })

  it('changes when the team name changes', () => {
    const a = crewId('Nether Navigator', ['Arunish'])
    const b = crewId('Different Crew', ['Arunish'])
    expect(a).not.toBe(b)
  })
})
