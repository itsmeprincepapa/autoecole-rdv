import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

// Gardien à poser sur une route : @UseGuards(JwtAuthGuard)
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}