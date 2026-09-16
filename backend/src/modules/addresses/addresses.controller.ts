import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Req,
  Query,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AddressesService } from './addresses.service';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';

@ApiTags('Addresses')
@Controller('addresses')
export class AddressesController {
  constructor(private readonly addressesService: AddressesService) {}

  @Post()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  create(@Body() createAddressDto: CreateAddressDto, @Req() req: any) {
    const userId = req.user.id;
    return this.addressesService.create(userId, createAddressDto);
  }

  @Get()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  findAll(@Req() req: any, @Query('userId') queryUserId?: string) {
    const isAdmin = String(req.user?.role || '').toLowerCase() === 'admin';
    if (isAdmin) {
      if (queryUserId) {
        return this.addressesService.findAll(queryUserId);
      }
      return this.addressesService.findAll();
    }
    // Patrons can only list their own addresses
    return this.addressesService.findAll(req.user.id);
  }

  @Get(':id')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async findOne(@Param('id') id: string, @Req() req: any) {
    const address = await this.addressesService.findOne(id);
    if (!address) {
      throw new NotFoundException('Address not found');
    }

    const isAdmin = String(req.user?.role || '').toLowerCase() === 'admin';
    const ownerId = address.user?.id || address.userId;

    if (!isAdmin && ownerId !== req.user.id) {
      throw new ForbiddenException('Access denied: You do not have permission to view this address');
    }

    return address;
  }

  @Patch(':id')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async update(@Param('id') id: string, @Body() updateAddressDto: UpdateAddressDto, @Req() req: any) {
    const address = await this.addressesService.findOne(id);
    if (!address) {
      throw new NotFoundException('Address not found');
    }

    const isAdmin = String(req.user?.role || '').toLowerCase() === 'admin';
    const ownerId = address.user?.id || address.userId;

    if (!isAdmin && ownerId !== req.user.id) {
      throw new ForbiddenException('Access denied: You do not have permission to modify this address');
    }

    return this.addressesService.update(id, updateAddressDto);
  }

  @Delete(':id')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async remove(@Param('id') id: string, @Req() req: any) {
    const address = await this.addressesService.findOne(id);
    if (!address) {
      throw new NotFoundException('Address not found');
    }

    const isAdmin = String(req.user?.role || '').toLowerCase() === 'admin';
    const ownerId = address.user?.id || address.userId;

    if (!isAdmin && ownerId !== req.user.id) {
      throw new ForbiddenException('Access denied: You do not have permission to delete this address');
    }

    return this.addressesService.remove(id);
  }
}
