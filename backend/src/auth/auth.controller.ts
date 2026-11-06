import {
  Body,
  Controller,
  Get,
  HttpCode,
  NotFoundException,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ResendCodeDto } from './dto/resend-code.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { JwtAuthGuard } from './jwt-auth.guard';

// Toutes les routes de ce contrôleur commencent par /auth
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  // POST /auth/register
  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  // POST /auth/login
  @Post('login')
  @HttpCode(200)
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  // POST /auth/verify-email
  @Post('verify-email')
  @HttpCode(200)
  verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.authService.verifyEmail(dto);
  }

  // POST /auth/resend-code
  @Post('resend-code')
  @HttpCode(200)
  resendCode(@Body() dto: ResendCodeDto) {
    return this.authService.resendCode(dto);
  }

  // GET /auth/me : route PROTÉGÉE, il faut un token valide
  @UseGuards(JwtAuthGuard)
  @Get('me')
  async me(@Req() req: { user: { id: string } }) {
    const user = await this.usersService.findById(req.user.id);
    if (!user) throw new NotFoundException('Utilisateur introuvable');
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
    };
  }
}