import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SlotsQueryDto } from './dto/slots-query.dto';
import { SlotsService } from './slots.service';

// Tout utilisateur connecté peut consulter les créneaux libres
@UseGuards(JwtAuthGuard)
@Controller('slots')
export class SlotsController {
  constructor(private readonly slotsService: SlotsService) {}

  // GET /slots?instructorId=...&date=2026-12-01
  @Get()
  async list(@Query() query: SlotsQueryDto) {
    const slots = await this.slotsService.getFreeSlots(
      query.instructorId,
      query.date,
    );
    return { timeZone: this.slotsService.timeZone, slots };
  }
}