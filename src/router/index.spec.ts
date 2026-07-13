import { describe, expect, it } from 'vitest'
import { resolveAuthGuard } from './guard'

describe('resolveAuthGuard', () => {
  it('redirects unauthenticated user from protected route to login', () => {
    const result = resolveAuthGuard({ requiresAuth: true }, false)
    expect(result).toEqual({ name: 'login' })
  })

  it('redirects authenticated user away from guest-only route', () => {
    const result = resolveAuthGuard({ guestOnly: true }, true)
    expect(result).toEqual({ name: 'home' })
  })

  it('allows normal navigation when rule does not block', () => {
    expect(resolveAuthGuard({ requiresAuth: true }, true)).toBe(true)
    expect(resolveAuthGuard({ guestOnly: true }, false)).toBe(true)
    expect(resolveAuthGuard({}, false)).toBe(true)
  })
})
