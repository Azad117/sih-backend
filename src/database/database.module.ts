import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({	
      imports: [ConfigModule], 
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres', 
        host: config.get<string>('DB_HOST'),
        port: config.get<number>('DB_PORT'),
        username: config.get<string>('DB_USERNAME'),
        password: config.get<string>('DB_PASSWORD'),
        database: config.get<string>('DB_NAME'),
        autoLoadEntities: true, // automatically load entities
        synchronize: true, // ❗ true for dev only, false in prod (use migrations)
      }),
    }),
  ],
})
export class DatabaseModule {}