'use client'

/**
 * Format C state: 2-4 member photo slots (docs/10 D8 — opens on 3), a team name field, and the
 * Crew Class chip, assembled into a CrewSpec once every active slot has a photo. Slot count is
 * fixed at 4 usePhotoPipeline() calls always (React's rules of hooks don't allow a variable
 * count) — `order` is a permutation of which of those 4 slots are active and in what sequence,
 * so add/remove/reorder never has to move photo state between hook instances.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { render, type CrewSpec, type CrewMember } from '@/lib/render'
import { usePhotoPipeline } from './usePhotoPipeline'
import { builderClass, classFromSeed, reroll } from '@/lib/identity/builderClass'
import { crewId } from '@/lib/identity/builderId'

export const MIN_MEMBERS = 2
export const MAX_MEMBERS = 4
const DEFAULT_ACTIVE = 3 // docs/10 D8: teams of 1-3 are the modal case

const PLACEHOLDER_TEAM = 'Your Crew'
const DEBOUNCE_MS = 120

function slugify(s: string): string {
  return (
    s
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'crew'
  )
}

export function useCrewGenerator() {
  // Always exactly 4 — see file header.
  const slots = [usePhotoPipeline(), usePhotoPipeline(), usePhotoPipeline(), usePhotoPipeline()]

  const [order, setOrder] = useState<number[]>([0, 1, 2].slice(0, DEFAULT_ACTIVE))
  const [memberNames, setMemberNames] = useState<Record<number, string>>({})
  const [teamName, setTeamName] = useState('')
  const [classSeed, setClassSeed] = useState(() => builderClass('', '').seed)

  const [dataUrl, setDataUrl] = useState<string | null>(null)
  const [renderError, setRenderError] = useState<string | null>(null)

  const dataUrlRef = useRef<string | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const renderSeqRef = useRef(0)
  const hasRenderedOnceRef = useRef(false)

  const setMemberName = useCallback((slotIndex: number, name: string) => {
    setMemberNames((prev) => ({ ...prev, [slotIndex]: name }))
  }, [])

  const addMember = useCallback(() => {
    setOrder((prev) => {
      if (prev.length >= MAX_MEMBERS) return prev
      const unused = [0, 1, 2, 3].find((i) => !prev.includes(i))
      return unused === undefined ? prev : [...prev, unused]
    })
  }, [])

  // Escape hatch for the "array of hook results" pattern: `slots` is 4 fresh usePhotoPipeline()
  // results every render, so a memoized callback can't safely close over it directly (the
  // closure would keep whichever `slots` existed when the callback was *created*, and only
  // .reset/.loadFile/.adjustFocal happen to be stable across renders — .state is not). Routing
  // through a ref that's reassigned every render sidesteps that without recreating every
  // callback on every render just because `slots` is a new array wrapper each time.
  const slotsRef = useRef(slots)
  slotsRef.current = slots

  const removeMember = useCallback((position: number) => {
    setOrder((prev) => {
      if (prev.length <= MIN_MEMBERS) return prev
      const slotIndex = prev[position]
      slotsRef.current[slotIndex]?.reset()
      return prev.filter((_, i) => i !== position)
    })
  }, [])

  const moveMember = useCallback((position: number, direction: -1 | 1) => {
    setOrder((prev) => {
      const target = position + direction
      if (target < 0 || target >= prev.length) return prev
      const next = [...prev]
      ;[next[position], next[target]] = [next[target], next[position]]
      return next
    })
  }, [])

  const activeNames = order.map((i) => memberNames[i]?.trim() || `Member ${order.indexOf(i) + 1}`)
  const activeNamesKey = activeNames.join('::')

  // Deterministic from team name + every member's name (docs/06 P3 pattern, docs/04 §1).
  useEffect(() => {
    setClassSeed(builderClass(teamName, activeNamesKey).seed)
  }, [teamName, activeNamesKey])

  const classLabel = useMemo(() => classFromSeed(classSeed).label, [classSeed])
  const rerollClass = useCallback(() => setClassSeed((seed) => reroll(seed).seed), [])

  const allReady = order.every((i) => slots[i].state.bitmap && slots[i].state.focal)

  // Changes exactly when something a re-render actually needs to react to changes: a slot
  // finishing decode, or a pan/zoom adjust moving its focal point. `allReady` alone would miss
  // the latter (it stays true the whole time an already-ready photo gets adjusted).
  const photoVersionKey = order
    .map((i) => {
      const { bitmap, focal } = slots[i].state
      if (!bitmap || !focal) return 'pending'
      return `${focal.x.toFixed(4)},${focal.y.toFixed(4)},${focal.zoom ?? 1}`
    })
    .join('|')
  const orderKey = order.join(',')

  const latestRef = useRef({ order, teamName, memberNames })
  latestRef.current = { order, teamName, memberNames }

  useEffect(() => {
    if (!allReady) return

    function doRender() {
      const { order, teamName, memberNames } = latestRef.current
      const seq = ++renderSeqRef.current
      const members: CrewMember[] = order.map((i, pos) => ({
        photo: slotsRef.current[i].state.bitmap!,
        focal: slotsRef.current[i].state.focal!,
        name: memberNames[i]?.trim() || `Member ${pos + 1}`,
      }))
      const spec: CrewSpec = {
        format: 'crew',
        teamName: teamName.trim() || PLACEHOLDER_TEAM,
        crewClass: classFromSeed(classSeed).label,
        crewId: crewId(teamName || PLACEHOLDER_TEAM, members.map((m) => m.name)),
        members,
      }
      render(spec).then(
        (result) => {
          if (seq !== renderSeqRef.current) {
            URL.revokeObjectURL(result.dataUrl)
            return
          }
          if (dataUrlRef.current) URL.revokeObjectURL(dataUrlRef.current)
          dataUrlRef.current = result.dataUrl
          setDataUrl(result.dataUrl)
          setRenderError(null)
        },
        () => setRenderError("That card didn't render. Try again."),
      )
    }

    if (!hasRenderedOnceRef.current) {
      hasRenderedOnceRef.current = true
      doRender()
      return
    }

    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(doRender, DEBOUNCE_MS)
  }, [allReady, orderKey, photoVersionKey, activeNamesKey, classSeed])

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      if (dataUrlRef.current) URL.revokeObjectURL(dataUrlRef.current)
    }
  }, [])

  const download = useCallback(() => {
    if (!dataUrl) return
    const a = document.createElement('a')
    a.href = dataUrl
    a.download = `hhgoa-2026-crew-${slugify(teamName)}.png`
    a.click()
  }, [dataUrl, teamName])

  return {
    members: order.map((slotIndex, position) => ({
      slotIndex,
      position,
      name: memberNames[slotIndex] ?? '',
      setName: (name: string) => setMemberName(slotIndex, name),
      photoStatus: slots[slotIndex].state.status,
      photoDetail: slots[slotIndex].state.detail,
      photoError: slots[slotIndex].state.error,
      focal: slots[slotIndex].state.focal,
      loadFile: slots[slotIndex].loadFile,
      adjustFocal: slots[slotIndex].adjustFocal,
    })),
    canAdd: order.length < MAX_MEMBERS,
    canRemove: order.length > MIN_MEMBERS,
    addMember,
    removeMember,
    moveMember,
    teamName,
    setTeamName,
    classLabel,
    rerollClass,
    allReady,
    dataUrl,
    renderError,
    download,
  }
}
