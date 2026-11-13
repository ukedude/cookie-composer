import type { ChangeEvent } from 'react'
import { MESSAGE_MAX_LENGTH } from './composerState'
import styles from './MessageInput.module.css'

const EXAMPLE_MESSAGES = [
  'You are doing better than you think.',
  'You are capable of wonderful things.',
  'Your kindness makes the world softer.',
  'You matter more than you know.',
]

interface MessageInputProps {
  message: string
  onChange: (message: string) => void
  onFocus?: () => void
  onBlur?: () => void
}

export function MessageInput({ message, onChange, onFocus, onBlur }: MessageInputProps) {
  const handleChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    onChange(event.target.value)
  }

  return (
    <div className={styles.messageInput}>
      <label htmlFor="composer-message" className={styles.label}>
        Message
      </label>
      <textarea
        id="composer-message"
        className={styles.textarea}
        value={message}
        onChange={handleChange}
        onFocus={onFocus}
        onBlur={onBlur}
        maxLength={MESSAGE_MAX_LENGTH}
        rows={3}
        aria-describedby="composer-message-count"
      />
      <div id="composer-message-count" className={styles.count} aria-live="polite">
        {message.length}/{MESSAGE_MAX_LENGTH}
      </div>
      <div className={styles.examples} role="group" aria-label="Example messages">
        {EXAMPLE_MESSAGES.map((example) => (
          <button
            key={example}
            type="button"
            className={styles.exampleChip}
            onClick={() => onChange(example)}
          >
            {example}
          </button>
        ))}
      </div>
    </div>
  )
}
