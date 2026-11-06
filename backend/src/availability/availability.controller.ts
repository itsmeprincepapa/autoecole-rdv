import {
  Body,
  Controller,
  Delete,
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
import { AvailabilityService } from './availability.service';
import { CreateAvailabilityDto } from './dto/create-availability.dto';

type AuthRequest = { user: { id: string; role: UserRole } };

// Réservé aux moniteurs et au gérant. La propriété est revérifiée dans le service.
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.INSTRUCTOR, UserRole.ADMIN)
@Controller('instructors/:instructorId/availabilities')
export class AvailabilityController {
  constructor(private readonly service: AvailabilityService) {}

  @Get()
  list(
    @Req() req: AuthRequest,
    @Param('instructorId', ParseUUIDPipe) instructorId: string,
  ) {
    return this.service.list(req.user, instructorId);
  }

  @Post()
  create(
    @Req() req: AuthRequest,
    @Param('instructorId', ParseUUIDPipe) instructorId: string,
    @Body() dto: CreateAvailabilityDto,
  ) {
    return this.service.create(req.user, instructorId, dto);
  }

  @Delete(':id')
  remove(
    @Req() req: AuthRequest,
    @Param('instructorId', ParseUUIDPipe) instructorId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.service.remove(req.user, instructorId, id);
  }
}