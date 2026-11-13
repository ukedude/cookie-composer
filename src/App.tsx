import { useEffect, useState } from 'react'
import type { Config } from './scene'
import { Preview } from './ui'

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
  const paper = useSamplePaper()

  const config: Config | null = paper && {
    message: 'You are capable of wonderful things.',
    paper,
    slipColor: '#ffffff',
    inkColor: '#3a2e22',
    fontFamily: "Georgia, 'Times New Roman', serif",
    background: BACKGROUND,
  }

  return (
    <main>
      <h1>Cookie Composer</h1>
      <Preview config={config} size={CANVAS_SIZE} />
    </main>
  )
}

export default App
