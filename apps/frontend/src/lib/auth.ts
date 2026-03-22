/**
 * Extracts and decodes a JWT payload from an Authorization header.
 * Does NOT verify the signature — use only for trusted internal calls.
 * For production, replace with jose or jsonwebtoken verification.
 */
export function getUserIdFromRequest(request: Request): string | null {
  const auth = request.headers.get('authorization')
  if (!auth?.startsWith('Bearer ')) return null
  const token = auth.slice(7)
  try {
    const parts = token.split('.')
    const payload = JSON.parse(
      Buffer.from(parts[1] ?? '', 'base64url').toString('utf-8')
    )
    return (payload.sub as string) ?? null
  } catch {
    return null
  }
}

export function decodeToken(token: string): { sub?: string; email?: string; username?: string } | null {
  try {
    const parts = token.split('.')
    return JSON.parse(Buffer.from(parts[1] ?? '', 'base64url').toString('utf-8'))
  } catch {
    return null
  }
}
