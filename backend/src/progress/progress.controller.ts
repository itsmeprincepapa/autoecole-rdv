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
import { EvaluateDto } from './dto/evaluate.dto';
import { ProgressService } from './progress.service';

type AuthRequest = { user: { id: string; role: UserRole } };

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller()
export class ProgressController {
  constructor(private readonly progressService: ProgressService) {}

  // GET /skills : liste des compétences (tout utilisateur connecté)
  @Get('skills')
  skills() {
    return this.progressService.listSkills();
  }

  // GET /me/logbook : l'élève voit SON carnet
  @Roles(UserRole.STUDENT)
  @Get('me/logbook')
  myLogbook(@Req() req: AuthRequest) {
    return this.progressService.getLogbook(req.user.id);
  }

  // GET /students/:studentId/logbook : le gérant consulte un carnet
  @Roles(UserRole.ADMIN)
  @Get('students/:studentId/logbook')
  studentLogbook(@Param('studentId', ParseUUIDPipe) studentId: string) {
    return this.progressService.getLogbook(studentId);
  }

  // POST /appointments/:id/evaluations : le moniteur de la leçon (ou le gérant)
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN)
  @Post('appointments/:id/evaluations')
  @HttpCode(200)
  evaluate(
    @Req() req: AuthRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: EvaluateDto,
  ) {
    return this.progressService.evaluate(req.user, id, dto);
  }
}