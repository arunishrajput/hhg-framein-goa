'use client'

import { DropZone } from './DropZone'
import { BuilderIdResult } from './BuilderIdResult'
import { useBuilderIdGenerator } from '@/lib/generator/useBuilderIdGenerator'

export function BuilderIdFlow() {
  const generator = useBuilderIdGenerator()

  return (
    <DropZone status={generator.photoStatus} onFile={generator.loadFile}>
      <BuilderIdResult generator={generator} />
    </DropZone>
  )
}
