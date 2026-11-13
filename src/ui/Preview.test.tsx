import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { Preview } from './Preview'

describe('Preview', () => {
  let container: HTMLDivElement
  let root: Root

  beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
  })

  afterEach(() => {
    act(() => {
      root.unmount()
    })
    container.remove()
  })

  function playButton(): HTMLButtonElement {
    return container.querySelector('button') as HTMLButtonElement
  }

  it('defaults initialT to 0, matching the original behavior', () => {
    act(() => {
      root.render(<Preview config={null} size={100} />)
    })
    expect(playButton().textContent).toBe('Play')
  })

  it('does not jump on mount even when showEndKey is provided', () => {
    act(() => {
      root.render(<Preview config={null} size={100} showEndKey="a" />)
    })
    expect(playButton().textContent).toBe('Play')
  })

  it('renders the settled frame immediately when initialT is 1', () => {
    act(() => {
      root.render(<Preview config={null} size={100} initialT={1} />)
    })
    expect(playButton().textContent).toBe('Replay')
  })

  it('snaps to the settled frame when showEndKey changes while idle', () => {
    act(() => {
      root.render(<Preview config={null} size={100} initialT={0} showEndKey="a" />)
    })
    expect(playButton().textContent).toBe('Play')

    act(() => {
      root.render(<Preview config={null} size={100} initialT={0} showEndKey="b" />)
    })
    expect(playButton().textContent).toBe('Replay')
  })

  it('does not snap to the settled frame while playing', () => {
    act(() => {
      root.render(<Preview config={null} size={100} initialT={0} showEndKey="a" />)
    })

    act(() => {
      playButton().click()
    })
    expect(playButton().disabled).toBe(true)
    expect(playButton().textContent).toBe('Play')

    act(() => {
      root.render(<Preview config={null} size={100} initialT={0} showEndKey="b" />)
    })
    expect(playButton().disabled).toBe(true)
    expect(playButton().textContent).toBe('Play')
  })
})
