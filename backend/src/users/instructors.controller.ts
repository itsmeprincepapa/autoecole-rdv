import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { UserRole } from './user-role.enum';
import { UsersService } from './users.service';

// Liste des moniteurs, pour que l'élève choisisse avec qui réserver
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.STUDENT, UserRole.ADMIN)
@Controller('instructors')
export class InstructorsController {
  constructor(private readonly usersService: UsersService) {}

  // GET /instructors : id, prénom et nom uniquement (jamais l'email)
  @Get()
  list() {
    return this.usersService.listInstructors();
  }
}