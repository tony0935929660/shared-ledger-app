export type GuardMeta = {
  requiresAuth?: boolean
  guestOnly?: boolean
}

export function resolveAuthGuard(meta: GuardMeta, isAuthenticated: boolean): true | { name: 'login' | 'home' } {
  if (meta.requiresAuth && !isAuthenticated) {
    return { name: 'login' }
  }

  if (meta.guestOnly && isAuthenticated) {
    return { name: 'home' }
  }

  return true
}
