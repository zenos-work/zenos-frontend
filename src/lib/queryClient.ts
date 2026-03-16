import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 1000 * 60 * 5,  // 5 min — don't refetch if fresh
            gcTime: 1000 * 60 * 10, // 10 min garbage collection
            retry: 1,
            refetchOnWindowFocus: false,
        },
        mutations: {
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
