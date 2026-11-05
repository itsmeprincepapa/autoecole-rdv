import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Validation automatique de toutes les requêtes entrantes
  app.useGlobalPipes(
    new ValidationPipe({
      // Supprime les champs non déclarés dans le DTO (ex : un "role" glissé par un pirate)
      whitelist: true,
      // Refuse la requête (erreur 400) si un champ inconnu est envoyé
      forbidNonWhitelisted: true,
      // Convertit les données reçues vers les types du DTO
      transform: true,
    }),
  );

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();