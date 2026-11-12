import { useEffect, useRef, useState } from 'react'
import { drawFrame, type Config } from './scene'

const CANVAS_SIZE = 480
const BACKGROUND = '#f2e8d4'

function useSamplePaper(): HTMLImageElement | null {
  const [image, setImage] = useState<HTMLImageElement | null>(null)

  useEffect(() => {
    const img = new Image()
    img.onload = () => setImage(img)
    img.src = `${import.meta.env.BASE_URL}papers/sample-1.png`
  }, [])

  return image
}

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const paper = useSamplePaper()
  const [t, setT] = useState(0)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!ctx || !paper) return

    const config: Config = {
      message: 'You are capable of wonderful things.',
      paper,
      slipColor: '#ffffff',
      inkColor: '#3a2e22',
      fontFamily: "Georgia, 'Times New Roman', serif",
      background: BACKGROUND,
    }
    drawFrame(ctx, t, config)
  }, [t, paper])

  return (
    <main>
      <h1>Cookie Composer</h1>
      <canvas
        ref={canvasRef}
        width={CANVAS_SIZE}
        height={CANVAS_SIZE}
        aria-label="Cookie preview"
      />
      {/* TEMPORARY Phase 1 debug control — remove when Phase 3 Composer UI lands */}
      <div>
        <label htmlFor="debug-t">Preview time (debug): {t.toFixed(3)}</label>
        <input
          id="debug-t"
          type="range"
          min={0}
          max={1}
          step={0.001}
          value={t}
          onChange={(e) => setT(Number(e.target.value))}
          aria-label="Preview time (debug)"
        />
      </div>
    </main>
  )
}

export default App
