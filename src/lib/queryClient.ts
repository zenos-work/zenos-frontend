import { QueryClient } from '@tanstack/react-query'

function shouldRetry(failureCount: number, err: unknown) {
    const status = (
        err && typeof err === 'object' && 'response' in err
            ? (err as { response?: { status?: number } }).response?.status
            : undefined
    )

    if (status && status < 500) return false
    return failureCount < 2
}

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 1000 * 60 * 5,
            gcTime: 1000 * 60 * 15,
            retry: shouldRetry,
            refetchOnWindowFocus: false,
            refetchOnReconnect: true,
            refetchOnMount: false,
        },
        mutations: {
            retry: 0,
            onError: (err: unknown) => {
                if (err && typeof err === 'object' && 'response' in err && err.response && typeof err.response === 'object' && 'data' in err.response) {
                    console.error('[mutation]', err.response.data)
                } else {
                    console.error('[mutation]', err)
                }
            },
    },
    },
})
