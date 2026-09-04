import { AxiosError } from 'axios'

/**
 * Turn a thrown request error into something worth showing a user.
 *
 * Prefers the API's own message (Laravel sends `message`, plus per-field
 * `errors` for a 422), falls back to the caller's wording. Swallowing these
 * silently is what makes a failed order look like a successful one.
 */
export function errorMessage(error: unknown, fallback: string): string {
  if (error instanceof AxiosError) {
    const data = error.response?.data as
      | { message?: string; errors?: Record<string, string[]> }
      | undefined

    const firstFieldError = data?.errors ? Object.values(data.errors)[0]?.[0] : undefined
    if (firstFieldError) return firstFieldError
    if (data?.message) return data.message

    // No response at all means the request never landed.
    if (!error.response) return fallback
  }

  return fallback
}
