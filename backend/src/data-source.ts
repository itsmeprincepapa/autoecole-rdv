import 'dotenv/config';
import { DataSource } from 'typeorm';

// Configuration utilisée par la ligne de commande TypeORM (migrations).
// L'application NestJS a sa propre configuration dans app.module.ts :
// les deux doivent pointer vers la même base.
export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,

  // Où TypeORM trouve les entités et les migrations
  entities: [__dirname + '/**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/migrations/*{.ts,.js}'],
});