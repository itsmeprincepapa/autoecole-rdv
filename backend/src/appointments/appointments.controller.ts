import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { UserRole } from '../users/user-role.enum';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';

// Seul un élève réserve ; l'id vient du token, jamais du corps de la requête
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.STUDENT)
@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  // POST /appointments
  @Post()
  book(
    @Req() req: { user: { id: string } },
    @Body() dto: CreateAppointmentDto,
  ) {
    return this.appointmentsService.book(req.user.id, dto);
  }
}