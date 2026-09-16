import { Controller, Post, Body, UnauthorizedException, Res, Req, Get } from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { Public } from './decorators/public.decorator';

type AuthenticatedRequest = Request & {
  user: { id: string };
};

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  async login(@Body() body: { email: string; password: string }, @Res({ passthrough: true }) response: Response) {
    const user = await this.authService.validateUser(
      body.email,
      body.password,
    );
    if (!user) throw new UnauthorizedException('Invalid credentials');
    return this.setToken(response, await this.authService.login(user));
  }

  @Public()
  @Post('register')
  async register(@Body() body: any, @Res({ passthrough: true }) response: Response) {
    return this.setToken(response, await this.authService.register(body));
  }

  @Public()
  @Post('logout')
  logout(@Res({ passthrough: true }) response: Response) {
    response.clearCookie('yehagere_auth_token', { httpOnly: true, sameSite: 'lax' });
    return { loggedOut: true };
  }

  @Get('me')
  me(@Req() request: AuthenticatedRequest) {
    return request.user;
  }

  @Post('change-password')
  changePassword(@Req() request: AuthenticatedRequest, @Body() body: { currentPassword: string; newPassword: string }) {
    return this.authService.changePassword(request.user.id, body.currentPassword, body.newPassword);
  }

  private setToken(response: Response, result: { access_token: string; user: unknown }) {
    response.cookie('yehagere_auth_token', result.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 1000,
    });
    return result;
  }
}
