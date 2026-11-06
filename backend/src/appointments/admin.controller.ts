import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { UserRole } from '../users/user-role.enum';
import { AdminService } from './admin.service';
import { AdminListQueryDto } from './dto/admin-list-query.dto';
import { StatsQueryDto } from './dto/stats-query.dto';

// Réservé au gérant
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // GET /admin/appointments?from=2026-12-01&to=2026-12-31&status=confirmed
  @Get('appointments')
  list(@Query() query: AdminListQueryDto) {
    return this.adminService.list(query);
  }

  // GET /admin/stats?from=2026-12-01&to=2026-12-31
  @Get('stats')
  stats(@Query() query: StatsQueryDto) {
    return this.adminService.stats(query.from, query.to);
  }
}