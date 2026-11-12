import { useEffect, useRef } from 'react'

const CANVAS_SIZE = 480
const BACKGROUND = '#faf6ee'

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!ctx) return

    ctx.fillStyle = BACKGROUND
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE)
  }, [])

  return (
    <main>
      <h1>Cookie Composer</h1>
      <canvas
        ref={canvasRef}
        width={CANVAS_SIZE}
        height={CANVAS_SIZE}
        aria-label="Cookie preview"
      />
    </main>
  )
}

export default App
