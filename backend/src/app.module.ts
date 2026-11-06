import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { MailModule } from './mail/mail.module';
import { TokensModule } from './tokens/tokens.module';
import { VehiclesModule } from './vehicles/vehicles.module';
import { AvailabilityModule } from './availability/availability.module';
import { AppointmentsModule } from './appointments/appointments.module';

@Module({
  imports: [
    // Charge le fichier .env et rend les variables disponibles partout
    ConfigModule.forRoot({
      isGlobal: true,
    }),

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

    // Notre module des utilisateurs
    UsersModule,

    TokensModule,

    VehiclesModule,

    AvailabilityModule,

    AppointmentsModule,

    AuthModule,

    MailModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}