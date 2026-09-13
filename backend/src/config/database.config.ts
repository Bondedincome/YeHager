import { registerAs } from '@nestjs/config';

export interface DatabaseConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  name: string;
  synchronize: boolean;
}

export const databaseConfig = registerAs<DatabaseConfig>('database', () => ({
  host: process.env.DB_HOST ?? '',
  port: Number(process.env.DB_PORT ?? 5432),
  username: process.env.DB_USERNAME ?? '',
  password: process.env.DB_PASSWORD ?? '',
  name: process.env.DB_NAME ?? '',
  synchronize: process.env.NODE_ENV !== 'production',
}));
