// Chargé avant chaque test : on pointe vers la base de test, jamais la vraie
import 'dotenv/config';

process.env.DB_NAME = 'autoecole_test';
process.env.NODE_ENV = 'test';