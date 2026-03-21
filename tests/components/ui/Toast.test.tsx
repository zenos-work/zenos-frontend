import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ToastContainer from '../../../src/components/ui/Toast'

const useUiStoreMock = vi.fn()
const removeToastMock = vi.fn()

vi.mock('../../../src/stores/uiStore', () => ({
  useUiStore: (selector: (state: { toasts: Array<{ id: string; type: string; message: string }>; removeToast: (id: string) => void }) => unknown) =>
    selector(useUiStoreMock()),
}))

describe('ToastContainer', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders toasts and removes one when close is clicked', () => {
    useUiStoreMock.mockReturnValue({
      toasts: [{ id: 't1', type: 'success', message: 'Saved!' }],
      removeToast: removeToastMock,
    })

    render(<ToastContainer />)

    expect(screen.getByText('Saved!')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button'))
    expect(removeToastMock).toHaveBeenCalledWith('t1')
  })

  it('auto-removes toast after timeout', () => {
    vi.useFakeTimers()

    useUiStoreMock.mockReturnValue({
      toasts: [{ id: 't2', type: 'info', message: 'Info note' }],
      removeToast: removeToastMock,
    })

    render(<ToastContainer />)

    vi.advanceTimersByTime(4000)
    expect(removeToastMock).toHaveBeenCalledWith('t2')

    vi.useRealTimers()
  })
})
