import {
  Body,
  Controller,
  Get,
  HttpCode,
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
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';

type AuthRequest = { user: { id: string; role: UserRole } };

// L'identité vient toujours du token, jamais du corps de la requête
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  // POST /appointments : seul un élève réserve
  @Roles(UserRole.STUDENT)
  @Post()
  book(@Req() req: AuthRequest, @Body() dto: CreateAppointmentDto) {
    return this.appointmentsService.book(req.user.id, dto);
  }

  // GET /appointments/mine : les rendez-vous de l'élève connecté
  @Roles(UserRole.STUDENT)
  @Get('mine')
  mine(@Req() req: AuthRequest) {
    return this.appointmentsService.mine(req.user.id);
  }

  // POST /appointments/:id/cancel : l'élève (les siens) ou le gérant
  @Roles(UserRole.STUDENT, UserRole.ADMIN)
  @Post(':id/cancel')
  @HttpCode(200)
  cancel(
    @Req() req: AuthRequest,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.appointmentsService.cancel(req.user, id);
  }
}