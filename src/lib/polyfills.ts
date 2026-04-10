/**
 * Browser polyfills for Node.js globals required by @react-pdf/renderer.
 * This file MUST be imported before any @react-pdf/renderer usage.
 */
import { Buffer } from 'buffer'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
if (typeof window !== 'undefined' && !(window as any).Buffer) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(window as any).Buffer = Buffer
}
