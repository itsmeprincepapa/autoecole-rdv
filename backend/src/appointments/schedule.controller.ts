import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { UserRole } from '../users/user-role.enum';
import { ScheduleQueryDto } from './dto/schedule-query.dto';
import { ScheduleService } from './schedule.service';

type AuthRequest = { user: { id: string; role: UserRole } };

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.INSTRUCTOR, UserRole.ADMIN)
@Controller('instructors/:instructorId/schedule')
export class ScheduleController {
  constructor(private readonly scheduleService: ScheduleService) {}

  // GET /instructors/:instructorId/schedule?from=2026-12-14&to=2026-12-20
  @Get()
  get(
    @Req() req: AuthRequest,
    @Param('instructorId', ParseUUIDPipe) instructorId: string,
    @Query() query: ScheduleQueryDto,
  ) {
    return this.scheduleService.getSchedule(
      req.user,
      instructorId,
      query.from,
      query.to,
    );
  }
}
