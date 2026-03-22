import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { ConfigService } from '@nestjs/config'
import * as bcrypt from 'bcryptjs'
import { prisma } from '@promptforge/database/client'
import { RegisterDto, LoginDto } from './dto/auth.dto'

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly config: ConfigService
  ) {}

  async register(dto: RegisterDto) {
    // Check uniqueness
    const existing = await prisma.user.findFirst({
      where: { OR: [{ email: dto.email }, { username: dto.username }] },
    })
    if (existing) {
      throw new ConflictException(
        existing.email === dto.email ? 'Email already in use' : 'Username already taken'
      )
    }

    const passwordHash = await bcrypt.hash(dto.password, 12)

    const user = await prisma.user.create({
      data: {
        email: dto.email,
        username: dto.username,
        displayName: dto.displayName ?? dto.username,
        passwordHash,
      },
      select: { id: true, email: true, username: true, displayName: true, role: true },
    })

    const tokens = await this.generateTokens(user.id, user.email)
    await this.saveRefreshToken(user.id, tokens.refreshToken)

    return { user, ...tokens }
  }

  async login(dto: LoginDto) {
    const user = await prisma.user.findUnique({
      where: { email: dto.email },
      select: { id: true, email: true, username: true, displayName: true, role: true, passwordHash: true },
    })

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid credentials')
    }

    const valid = await bcrypt.compare(dto.password, user.passwordHash)
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials')
    }

    const { passwordHash: _, ...safeUser } = user
    const tokens = await this.generateTokens(user.id, user.email)
    await this.saveRefreshToken(user.id, tokens.refreshToken)

    return { user: safeUser, ...tokens }
  }

  async refresh(token: string) {
    const stored = await prisma.refreshToken.findUnique({
      where: { token },
      include: { user: { select: { id: true, email: true } } },
    })

    if (!stored || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired refresh token')
    }

    // Rotate token
    await prisma.refreshToken.delete({ where: { token } })
    const tokens = await this.generateTokens(stored.user.id, stored.user.email)
    await this.saveRefreshToken(stored.user.id, tokens.refreshToken)

    return tokens
  }

  async logout(refreshToken: string) {
    await prisma.refreshToken.deleteMany({ where: { token: refreshToken } })
  }

  async handleOAuthUser(profile: { id: string; email: string; name: string; provider: 'github' | 'google' }) {
    const field = profile.provider === 'github' ? 'githubId' : 'googleId'

    let user = await prisma.user.findFirst({
      where: { OR: [{ [field]: profile.id }, { email: profile.email }] },
    })

    if (!user) {
      const username = await this.generateUniqueUsername(profile.name)
      user = await prisma.user.create({
        data: {
          email: profile.email,
          username,
          displayName: profile.name,
          [field]: profile.id,
        },
      })
    } else if (!user[field as keyof typeof user]) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { [field]: profile.id },
      })
    }

    const tokens = await this.generateTokens(user.id, user.email)
    await this.saveRefreshToken(user.id, tokens.refreshToken)

    return { user, ...tokens }
  }

  private async generateTokens(userId: string, email: string) {
    const payload = { sub: userId, email }

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.config.get('JWT_SECRET'),
        expiresIn: '15m',
      }),
      this.jwtService.signAsync(payload, {
        secret: this.config.get('JWT_REFRESH_SECRET'),
        expiresIn: '30d',
      }),
    ])

    return { accessToken, refreshToken, expiresIn: 900 }
  }

  private async saveRefreshToken(userId: string, token: string) {
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    await prisma.refreshToken.create({ data: { token, userId, expiresAt } })
  }

  private async generateUniqueUsername(name: string): Promise<string> {
    const base = name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_')
      .replace(/__+/g, '_')
      .slice(0, 15)

    let username = base
    let attempt = 0
    while (await prisma.user.findUnique({ where: { username } })) {
      username = `${base}${Math.floor(Math.random() * 9999)}`
      if (attempt++ > 10) throw new BadRequestException('Could not generate unique username')
    }
    return username
  }
}
