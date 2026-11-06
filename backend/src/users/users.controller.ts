import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { ListUsersQueryDto } from './dto/list-users-query.dto';
import { SetActiveDto } from './dto/set-active.dto';
import { UserRole } from './user-role.enum';
import { UsersService } from './users.service';

// Toutes les routes /users sont réservées au gérant
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // GET /users?role=student&page=1&limit=20
  @Get()
  list(@Query() query: ListUsersQueryDto) {
    return this.usersService.list(query.role, query.page ?? 1, query.limit ?? 20);
  }

  // PATCH /users/:id/active  { "isActive": false }
  @Patch(':id/active')
  @HttpCode(200)
  async setActive(
    @Req() req: { user: { id: string } },
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SetActiveDto,
  ) {
    if (id === req.user.id && !dto.isActive) {
      throw new BadRequestException('Vous ne pouvez pas désactiver votre propre compte');
    }
    const user = await this.usersService.findById(id);
    if (!user) throw new NotFoundException('Utilisateur introuvable');

    await this.usersService.setActive(id, dto.isActive);
    return { id, isActive: dto.isActive };
  }
}