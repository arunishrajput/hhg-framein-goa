import { RingMark } from './RingMark'

export function DropZone() {
  return (
    <div>
      <label
        className="group flex min-h-[240px] cursor-pointer flex-col items-center justify-center gap-4 rounded-[20px] border-2 border-dashed border-hhg-rule bg-hhg-cream px-8 py-10 text-center transition-colors hover:border-hhg-pink hover:bg-hhg-cream-2 focus-within:border-hhg-pink focus-within:bg-hhg-cream-2"
      >
        <input type="file" accept="image/*,.heic,.heif" className="sr-only" />
        <RingMark className="h-28 w-28 shrink-0" />
        <div className="flex flex-col gap-1">
          <p className="font-mono text-[15px] leading-[1.55] text-hhg-ink">
            Drop a photo. Any size, any crop.
          </p>
          <p className="font-mono text-xs tracking-[0.04em] text-hhg-ink-soft">
            JPG, PNG, WebP or HEIC
          </p>
        </div>
      </label>
      <p className="mt-4 text-center font-mono text-xs leading-[1.4] tracking-[0.04em] text-hhg-ink-soft">
        Your photo stays in your browser. Nothing is uploaded until you post.
      </p>
    </div>
  )
}
