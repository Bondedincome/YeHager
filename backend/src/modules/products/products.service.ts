import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateProductDto } from './dto/create-product.dto';
import { GENDER, Product, STATUS } from './entities/product.entity';

@Injectable()
export class ProductsService implements OnModuleInit {
  constructor(
    @InjectRepository(Product) private readonly repo: Repository<Product>,
  ) {}

  async onModuleInit() {
    try {
      const count = await this.repo.count();
      if (count === 0) {
        await this.seedCatalog();
      }
    } catch {
      // Database might not be initialized yet during early boot
    }
  }

  async seedCatalog(): Promise<{ count: number }> {
    const initialCatalog: Partial<Product>[] = [
      {
        title: 'The micro cable polo',
        name: 'The micro cable polo',
        subtitle: 'Merino Wool Knit',
        description:
          'The micro cable-knit polo. An easy silhouette with a classic collar, button-front placket and textured knit. Made from soft, lightweight merino wool.',
        price: 210.0,
        priceETB: 26100.0,
        formattedPriceETB: 'Br26,100.00 ETB',
        imageUrl:
          'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=1000&auto=format&fit=crop&q=80',
        galleryImages: [
          'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=1000&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=1000&auto=format&fit=crop&q=80',
        ],
        categoryName: 'knitwear',
        isNew: true,
        tag: 'New',
        colors: [
          { name: 'Cream', hex: '#FDFBF7', active: true },
          { name: 'Charcoal', hex: '#262626', active: true },
        ],
        activeColorIndex: 0,
        activeColorName: 'Cream',
        sizes: ['XS', 'S', 'M', 'L', 'XL'],
        stock: 14,
        slug: 'the-micro-cable-polo',
        status: STATUS.ACTIVE,
        gender: GENDER.MEN,
        brand: 'YeHagere',
        details: {
          overview:
            'A tactile fine-gauge polo sweater spun from sustainably sourced Ethiopian and Italian merino wool yarns.',
          measurements: ['Model is 6’1” wearing size Medium', 'Length: 27”'],
          fabric: '100% Superfine Extra-Spun Merino Wool',
          care: 'Hand wash cold or environmentally safe dry clean',
        },
      },
      {
        title: 'Bespoke Habesha Kemis Gown',
        name: 'Bespoke Habesha Kemis Gown',
        subtitle: 'Hand-Woven Shemma Silk & Gold Tilet',
        description:
          'A royal floor-length habesha kemis masterpiece woven on traditional pit looms in Chencha, accented with ornate hand-embroidered gold bullion tilet along the cuffs and neckline.',
        price: 480.0,
        priceETB: 60000.0,
        formattedPriceETB: 'Br60,000.00 ETB',
        imageUrl:
          'https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=1000&auto=format&fit=crop&q=80',
        galleryImages: [
          'https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=1000&auto=format&fit=crop&q=80',
        ],
        categoryName: 'heritage',
        isNew: true,
        tag: 'Atelier Signature',
        colors: [
          { name: 'Pure White & Gold', hex: '#FAF9F6', active: true },
        ],
        activeColorIndex: 0,
        activeColorName: 'Pure White & Gold',
        sizes: ['S', 'M', 'L', 'Custom Bespoke'],
        stock: 6,
        slug: 'bespoke-habesha-kemis-gown',
        status: STATUS.ACTIVE,
        gender: GENDER.WOMEN,
        brand: 'YeHagere',
        details: {
          overview:
            'Heritage gala attire crafted by master weavers over 80 hours using raw spun organic cotton and gold thread.',
          measurements: ['Floor-length sweeping skirt', 'Tailored bustier bodice'],
          fabric: 'Pure Ethiopian Cotton Shemma with Gold Tilet Weave',
          care: 'Specialist heritage garment dry clean only',
        },
      },
      {
        title: 'Addis Tailored Double-Breasted Blazer',
        name: 'Addis Tailored Double-Breasted Blazer',
        subtitle: 'Raw Silk & Fine Wool Blend',
        description:
          'Sharp structured tailoring paired with soft Ethiopian woven silk accents on peak lapels. A distinguished jacket designed for modern galas and executive wear.',
        price: 385.0,
        priceETB: 48125.0,
        formattedPriceETB: 'Br48,125.00 ETB',
        imageUrl:
          'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=1000&auto=format&fit=crop&q=80',
        galleryImages: [
          'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=1000&auto=format&fit=crop&q=80',
        ],
        categoryName: 'outerwear',
        isNew: false,
        tag: 'Best Seller',
        colors: [
          { name: 'Deep Midnight Navy', hex: '#1C2833', active: true },
          { name: 'Onyx Black', hex: '#111111', active: true },
        ],
        activeColorIndex: 0,
        activeColorName: 'Deep Midnight Navy',
        sizes: ['38R', '40R', '42R', '44R'],
        stock: 9,
        slug: 'addis-tailored-double-breasted-blazer',
        status: STATUS.ACTIVE,
        gender: GENDER.MEN,
        brand: 'YeHagere',
        details: {
          overview: 'Half-canvas construction featuring horn buttons and interior silk pockets.',
          measurements: ['Tailored slim-athletic fit'],
          fabric: '80% Virgin Wool, 20% Ethiopian Raw Silk',
          care: 'Dry clean only',
        },
      },
    ];

    for (const item of initialCatalog) {
      const existing = await this.repo.findOne({ where: { slug: item.slug } });
      if (!existing) {
        const prod = this.repo.create(item as Product);
        await this.repo.save(prod);
      }
    }

    return { count: initialCatalog.length };
  }

  findAll(): Promise<Product[]> {
    return this.repo.find({
      order: { createdAt: 'DESC' },
      relations: { category: true, productVariants: true },
    });
  }

  async findOne(id: string): Promise<Product> {
    const product = await this.repo.findOne({
      where: [{ id }, { slug: id }],
      relations: { category: true, productVariants: true },
    });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  create(dto: CreateProductDto | any): Promise<Product> {
    const title = dto.title || dto.name || 'Untitled';
    const slug =
      dto.slug ||
      title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');

    const product = this.repo.create({
      ...dto,
      title,
      name: title,
      slug,
      gender: dto.gender ?? GENDER.UNISEX,
      status: dto.status ?? STATUS.ACTIVE,
      brand: dto.brand ?? 'YeHagere',
    } as Product);

    return this.repo.save(product);
  }

  async update(id: string, dto: Partial<CreateProductDto> | any): Promise<Product> {
    const product = await this.findOne(id);
    Object.assign(product, dto);
    if (dto.title && !dto.name) {
      product.name = dto.title;
    }
    return this.repo.save(product);
  }

  async remove(id: string): Promise<{ success: boolean; message: string }> {
    const product = await this.findOne(id);
    await this.repo.softRemove(product);
    return { success: true, message: `Product ${id} removed successfully` };
  }
}
