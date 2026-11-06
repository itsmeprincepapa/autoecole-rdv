import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AppointmentsModule } from './appointments/appointments.module';
import { AuthModule } from './auth/auth.module';
import { AvailabilityModule } from './availability/availability.module';
import { HoursModule } from './hours/hours.module';
import { MailModule } from './mail/mail.module';
import { ProgressModule } from './progress/progress.module';
import { TokensModule } from './tokens/tokens.module';
import { UsersModule } from './users/users.module';
import { VehiclesModule } from './vehicles/vehicles.module';

@Module({
  imports: [
    // Charge le fichier .env et rend les variables disponibles partout
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    // Limitation de débit globale : 100 requêtes par minute et par adresse IP
    ThrottlerModule.forRoot([{ name: 'default', ttl: 60_000, limit: 100 }]),

    // Connexion à PostgreSQL via TypeORM
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('DB_HOST'),
        port: config.get<number>('DB_PORT'),
        username: config.get<string>('DB_USER'),
        password: config.get<string>('DB_PASSWORD'),
        database: config.get<string>('DB_NAME'),
        autoLoadEntities: true,
        synchronize: false,
      }),
    }),

    UsersModule,
    TokensModule,
    VehiclesModule,
    AvailabilityModule,
    AppointmentsModule,
    HoursModule,
    ProgressModule,
    MailModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Applique la limitation à toutes les routes
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}