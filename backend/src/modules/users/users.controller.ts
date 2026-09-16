import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Req,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { AdminCreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Role } from './entities/user.entity';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles(Role.ADMIN)
  create(@Body() adminCreateUserDto: AdminCreateUserDto) {
    return this.usersService.createAdmin(adminCreateUserDto);
  }

  @Get()
  @Roles(Role.ADMIN)
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  findOne(@Param('id') id: string, @Req() req: any) {
    const userRole = String(req.user?.role || '').toLowerCase();
    const isOwner = req.user?.id === id;
    const isAdmin = userRole === 'admin';

    if (!isOwner && !isAdmin) {
      throw new ForbiddenException('Access denied: You may only view your own user profile');
    }
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto, @Req() req: any) {
    const userRole = String(req.user?.role || '').toLowerCase();
    const isOwner = req.user?.id === id;
    const isAdmin = userRole === 'admin';

    if (!isOwner && !isAdmin) {
      throw new ForbiddenException('Access denied: You may only modify your own user profile');
    }

    // Strip privilege escalation fields if the caller is not an administrator
    if (!isAdmin) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (updateUserDto as any).role;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (updateUserDto as any).status;
    }

    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
