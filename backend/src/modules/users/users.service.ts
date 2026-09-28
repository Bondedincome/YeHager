import {
  ConflictException,
  Injectable,
  NotFoundException,
  OnModuleInit,
  Optional,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateUserDto, AdminCreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Role, User, UserStatus } from './entities/user.entity';

@Injectable()
export class UsersService implements OnModuleInit {
  constructor(
    @Optional() @InjectRepository(User)
    private readonly repo?: Repository<User>,
  ) { }

  async onModuleInit() {
    if (!this.repo) return;
    try {
      const count = await this.repo.count();
      if (count === 0) {
        const bootstrapPassword =
          process.env.ADMIN_BOOTSTRAP_PASSWORD ||
          process.env.ADMIN_DEFAULT_PASSWORD;

        let passwordToUse: string;
        if (bootstrapPassword) {
          passwordToUse = bootstrapPassword;
        } else {
          if (process.env.NODE_ENV === 'production') {
            console.warn(
              '⚠️ NOTICE: ADMIN_BOOTSTRAP_PASSWORD not configured. Generating a secure one-time bootstrap password.',
            );
          }
          passwordToUse = `Admin_${crypto.randomBytes(8).toString('hex')}!2026`;
          console.warn(
            `🔐 Generated initial administrator temporary password for daniot.mihrete-ug@aau.edu.et: ${passwordToUse}`,
          );
        }

        const passwordHash = await bcrypt.hash(passwordToUse, 12);
        const adminUser = this.repo.create({
          firstName: 'Daniot',
          lastName: 'Mihrete',
          name: 'Daniot Mihrete',
          email: 'daniot.mihrete-ug@aau.edu.et',
          username: 'daniot.mihrete-ug',
          password: passwordHash,
          passwordHash,
          role: Role.ADMIN,
          status: UserStatus.ACTIVE,
          isVerified: true,
          requiresPasswordChange: true,
          totalOrders: 0,
          totalSpentUSD: 0,
        });
        await this.repo.save(adminUser);
      }
    } catch {
      // Database may still be connecting during boot
    }
  }

  async create(createUserDto: CreateUserDto) {
    if (!this.repo) return undefined;
    const existing = await this.repo.findOne({ where: { email: createUserDto.email } });
    if (existing) throw new ConflictException('Email is already registered');
    const passwordHash = await bcrypt.hash(createUserDto.password, 12);
    const username = await this.resolveUsername(createUserDto.username || createUserDto.email.split('@')[0]);
    const user = this.repo.create({
      ...createUserDto,
      username,
      role: Role.CUSTOMER, // Always strictly assign customer for patron self-registration
      password: passwordHash,
      passwordHash,
      name: `${createUserDto.firstName} ${createUserDto.lastName}`,
      status: UserStatus.ACTIVE,
    });
    return this.sanitize(await this.repo.save(user));
  }

  async createAdmin(adminCreateUserDto: AdminCreateUserDto) {
    if (!this.repo) return undefined;
    const existing = await this.repo.findOne({ where: { email: adminCreateUserDto.email } });
    if (existing) throw new ConflictException('Email is already registered');
    const passwordHash = await bcrypt.hash(adminCreateUserDto.password, 12);
    const username = await this.resolveUsername(adminCreateUserDto.username || adminCreateUserDto.email.split('@')[0]);
    const user = this.repo.create({
      ...adminCreateUserDto,
      username,
      role: adminCreateUserDto.role || Role.CUSTOMER,
      password: passwordHash,
      passwordHash,
      name: `${adminCreateUserDto.firstName} ${adminCreateUserDto.lastName}`,
      status: UserStatus.ACTIVE,
    });
    return this.sanitize(await this.repo.save(user));
  }

  async findAll() {
    return this.repo ? (await this.repo.find()).map((user) => this.sanitize(user)) : [];
  }

  async findOne(id: string) {
    if (!this.repo) return undefined;
    const user = await this.repo.findOneBy({ id });
    if (!user) throw new NotFoundException('User not found');
    return this.sanitize(user);
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    if (!this.repo) return undefined;
    const user = await this.repo.findOneBy({ id });
    if (!user) throw new NotFoundException('User not found');
    Object.assign(user, updateUserDto);
    if (updateUserDto.password) {
      user.password = await bcrypt.hash(updateUserDto.password, 12);
      user.passwordHash = user.password;
      user.requiresPasswordChange = false;
    }
    return this.sanitize(await this.repo.save(user));
  }

  async remove(id: string) {
    if (!this.repo) return { deleted: false };
    const result = await this.repo.delete(id);
    return { deleted: (result.affected ?? 0) > 0 };
  }

  async findByEmail(email: string, includePassword = false) {
    if (!this.repo) return undefined;
    return this.repo.findOne({
      where: { email },
      select: includePassword
        ? undefined
        : {
          id: true,
          email: true,
          name: true,
          role: true,
          status: true,
          requiresPasswordChange: true,
        },
    });
  }

  async findByIdentifier(identifier: string) {
    if (!this.repo) return undefined;
    const normalized = identifier.trim().toLowerCase();
    return this.repo.findOne({
      where: [{ email: normalized }, { username: normalized }],
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        password: true,
        passwordHash: true,
        status: true,
        role: true,
        firstName: true,
        lastName: true,
        profileImage: true,
        memberSince: true,
        totalOrders: true,
        totalSpentUSD: true,
        phone: true,
        shippingAddress: true,
        requiresPasswordChange: true,
      },
    });
  }

  findOneWithPassword(id: string) {
    return this.repo
      ?.createQueryBuilder('user')
      .addSelect(['user.password', 'user.passwordHash'])
      .where('user.id = :id', { id })
      .getOne();
  }

  verifyPassword(user: User, password: string) {
    return bcrypt.compare(password, user.passwordHash ?? user.password);
  }

  async updatePassword(id: string, password: string) {
    if (!this.repo) return;
    const user = await this.repo.findOneBy({ id });
    if (user) {
      user.password = await bcrypt.hash(password, 12);
      user.passwordHash = user.password;
      user.requiresPasswordChange = false;
      await this.repo.save(user);
    }
  }

  async validatePassword(identifier: string, password: string) {
    const user = await this.findByIdentifier(identifier);
    if (!user || user.status === UserStatus.SUSPENDED) return null;
    const ok = await bcrypt.compare(password, user.passwordHash ?? user.password);
    return ok ? this.sanitize(user) : null;
  }

  sanitize(user: User) {
    const { password, passwordHash, passwordSalt, ...safeUser } = user;
    return safeUser;
  }

  private async resolveUsername(value: string): Promise<string> {
    const base = value.toLowerCase().replace(/[^a-z0-9._-]/g, '').slice(0, 40) || 'patron';
    let username = base;
    let suffix = 2;
    while (await this.repo?.findOneBy({ username })) {
      const suffixText = String(suffix++);
      username = `${base.slice(0, 50 - suffixText.length)}${suffixText}`;
    }
    return username;
  }
}
