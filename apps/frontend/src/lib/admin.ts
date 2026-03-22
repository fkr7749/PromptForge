export function getUserRoleFromRequest(request: Request): { userId: string; role: string } | null {
  const auth = request.headers.get('authorization')
  if (!auth?.startsWith('Bearer ')) return null
  const token = auth.slice(7)
  try {
    const parts = token.split('.')
    const payload = JSON.parse(Buffer.from(parts[1] ?? '', 'base64url').toString('utf-8'))
    if (!payload.sub) return null
    return { userId: payload.sub as string, role: (payload.role as string) ?? 'USER' }
  } catch {
    return null
  }
}

export function isAdmin(role: string): boolean {
  return role === 'ADMIN'
}

export function isModerator(role: string): boolean {
  return role === 'ADMIN' || role === 'MODERATOR'
}

export function requireAdmin(request: Request): { userId: string; role: string } | Response {
  const info = getUserRoleFromRequest(request)
  if (!info)
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  if (!isAdmin(info.role))
    return new Response(JSON.stringify({ error: 'Forbidden' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    })
  return info
}
