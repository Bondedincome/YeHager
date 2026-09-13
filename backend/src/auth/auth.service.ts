import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../modules/users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) { }

  async validateUser(username: string, password: string) {
    return this.usersService.validatePassword(username, password);
  }

  async login(user: any) {
    const payload = { email: user.email, role: user.role, sub: user.id };
    return { access_token: this.jwtService.sign(payload), user: this.usersService.sanitize(user) };
  }

  register(input: any) {
    return this.usersService.create(input).then((user) => this.login(user));
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.usersService.findOneWithPassword(userId);
    if (!user || !(await this.usersService.verifyPassword(user, currentPassword))) {
      throw new UnauthorizedException('Current password is incorrect');
    }
    await this.usersService.updatePassword(userId, newPassword);
    return { changed: true };
  }
}
