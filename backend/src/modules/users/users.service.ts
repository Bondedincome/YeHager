import {
  ConflictException,
  Injectable,
  NotFoundException,
  OnModuleInit,
  Optional,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
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
        const passwordHash = await bcrypt.hash('YeHagere2026!', 12);
        const adminUser = this.repo.create({
          firstName: 'Daniot',
          lastName: 'Mihrete',
          name: 'Daniot Mihrete',
          email: 'daniot.mihrete-ug@aau.edu.et',
          password: passwordHash,
          passwordHash,
          role: Role.ADMIN,
          status: UserStatus.ACTIVE,
          isVerified: true,
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
    const user = this.repo.create({
      ...createUserDto,
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
    const user = this.repo.create({
      ...adminCreateUserDto,
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
    if (updateUserDto.password) user.password = await bcrypt.hash(updateUserDto.password, 12);
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
      select: includePassword ? undefined : { id: true, email: true, name: true, role: true, status: true },
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
      await this.repo.save(user);
    }
  }

  async validatePassword(email: string, password: string) {
    const user = await this.findByEmail(email, true);
    if (!user || user.status === UserStatus.SUSPENDED) return null;
    const ok = await bcrypt.compare(password, user.passwordHash ?? user.password);
    return ok ? this.sanitize(user) : null;
  }

  sanitize(user: User) {
    const { password, passwordHash, passwordSalt, ...safeUser } = user;
    return safeUser;
  }
}
