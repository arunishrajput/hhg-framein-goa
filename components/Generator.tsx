'use client'

import { DropZone } from './DropZone'
import { FormatSwitch } from './FormatSwitch'
import { ResultPreview } from './ResultPreview'
import { useGenerator } from '@/lib/generator/useGenerator'

export function Generator() {
  const { state, loadFile, adjustFocal, download } = useGenerator()

  return (
    <div className="flex flex-col gap-8">
      <div className="flex justify-center">
        <FormatSwitch />
      </div>

      <DropZone status={state.status} onFile={loadFile}>
        <ResultPreview state={state} onDownload={download} adjustFocal={adjustFocal} />
      </DropZone>
    </div>
  )
}
