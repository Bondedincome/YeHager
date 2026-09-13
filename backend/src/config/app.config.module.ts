import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { configuration } from '@config/configuration';
// import { validationSchema } from '@config/validation';

const configModule = ConfigModule.forRoot({
  isGlobal: true,
  envFilePath: './.env',
  load: [configuration],
  // validationSchema,
});

@Module({
  imports: [configModule],
})
export class AppConfigModule {}
