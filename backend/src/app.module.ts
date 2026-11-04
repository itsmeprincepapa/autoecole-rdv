import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    // Charge le fichier .env et rend les variables disponibles partout
    // (isGlobal : pas besoin de ré-importer ConfigModule dans chaque module)
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    // Connexion à PostgreSQL via TypeORM
    // forRootAsync : on attend que le .env soit chargé avant de lire les valeurs
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('DB_HOST'),
        port: config.get<number>('DB_PORT'),
        username: config.get<string>('DB_USER'),
        password: config.get<string>('DB_PASSWORD'),
        database: config.get<string>('DB_NAME'),

        // Charge automatiquement les entités déclarées dans les modules
        autoLoadEntities: true,

        // DÉSACTIVÉ volontairement : on utilisera des migrations
        // (synchronize pourrait supprimer des colonnes ou des données)
        synchronize: false,
      }),
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}