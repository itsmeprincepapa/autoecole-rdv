import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { UserRole } from '../users/user-role.enum';
import { UsersService } from '../users/users.service';
import { AdjustHoursDto } from './dto/adjust-hours.dto';
import { HoursService } from './hours.service';

type AuthRequest = { user: { id: string; role: UserRole } };

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller()
export class HoursController {
  constructor(
    private readonly hoursService: HoursService,
    private readonly usersService: UsersService,
  ) {}

  // POST /students/:studentId/hours : le gérant ajoute/retire des heures
  @Roles(UserRole.ADMIN)
  @Post('students/:studentId/hours')
  adjust(
    @Req() req: AuthRequest,
    @Param('studentId', ParseUUIDPipe) studentId: string,
    @Body() dto: AdjustHoursDto,
  ) {
    return this.hoursService.adjust(req.user.id, studentId, dto);
  }

  // GET /students/:studentId/hours : historique (gérant) 
  @Roles(UserRole.ADMIN)
  @Get('students/:studentId/hours')
  history(@Param('studentId', ParseUUIDPipe) studentId: string) {
    return this.hoursService.history(studentId);
  }

  // GET /me/hours : l'élève voit SON solde et SON historique
  @Roles(UserRole.STUDENT)
  @Get('me/hours')
  async mine(@Req() req: AuthRequest) {
    const user = await this.usersService.findById(req.user.id);
    return {
      hoursBalance: user?.hoursBalance ?? 0,
      history: await this.hoursService.history(req.user.id),
    };
  }
}