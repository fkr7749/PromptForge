import { IsEmail, IsString, MinLength, MaxLength, IsOptional, Matches } from 'class-validator'

export class RegisterDto {
  @IsEmail()
  email: string

  @IsString()
  @MinLength(3)
  @MaxLength(20)
  @Matches(/^[a-zA-Z0-9_-]+$/, {
    message: 'Username can only contain letters, numbers, underscores and hyphens',
  })
  username: string

  @IsString()
  @MinLength(8)
  @MaxLength(100)
  password: string

  @IsString()
  @IsOptional()
  @MaxLength(50)
  displayName?: string
}

export class LoginDto {
  @IsEmail()
  email: string

  @IsString()
  password: string
}

export class RefreshTokenDto {
  @IsString()
  refreshToken: string
}
