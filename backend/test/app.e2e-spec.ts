import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as bcrypt from 'bcryptjs';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';
import { UserRole } from '../src/users/user-role.enum';
import { User } from '../src/users/user.entity';

describe('Plateforme auto-école (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  // Adresses uniques à chaque exécution : pas de conflit entre deux lancements
  const run = Date.now();
  const studentEmail = `eleve-${run}@test.com`;
  const password = 'Motdepasse1';

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
    dataSource = app.get(DataSource);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Authentification', () => {
    it("refuse un rôle glissé dans l'inscription", async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: `pirate-${run}@test.com`,
          firstName: 'X',
          lastName: 'Y',
          password,
          role: 'admin',
        })
        .expect(400);
    });

    it('inscrit un élève, puis refuse la connexion tant que email non vérifié', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: studentEmail,
          firstName: 'Awa',
          lastName: 'Diop',
          password,
        })
        .expect(201);

      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: studentEmail, password })
        .expect(403);
    });

    it('refuse un doublon (409)', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: studentEmail,
          firstName: 'Awa',
          lastName: 'Diop',
          password,
        })
        .expect(409);
    });

    it('connecte un élève vérifié et renvoie un token', async () => {
      await dataSource
        .getRepository(User)
        .update({ email: studentEmail }, { emailVerified: true });

      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: studentEmail, password })
        .expect(200);

      expect(res.body.accessToken).toBeDefined();
      expect(res.body.user.role).toBe('student');
    });
  });

  describe('Rôles', () => {
    it('refuse un élève sur une route du gérant (403)', async () => {
      const login = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: studentEmail, password })
        .expect(200);

      await request(app.getHttpServer())
        .get('/vehicles')
        .set('Authorization', `Bearer ${login.body.accessToken}`)
        .expect(403);
    });

    it('refuse une requête sans token (401)', async () => {
      await request(app.getHttpServer()).get('/vehicles').expect(401);
    });
  });

  describe('Réservation et conflit', () => {
    it('empêche deux élèves de réserver le même créneau', async () => {
      const users = dataSource.getRepository(User);
      const hash = await bcrypt.hash(password, 4);

      // Un moniteur et deux élèves avec des heures
      const instructor = await users.save(
        users.create({
          email: `moniteur-${run}@test.com`,
          firstName: 'Cheikh',
          lastName: 'Sow',
          passwordHash: hash,
          role: UserRole.INSTRUCTOR,
          emailVerified: true,
        }),
      );
      const second = await users.save(
        users.create({
          email: `eleve2-${run}@test.com`,
          firstName: 'Moussa',
          lastName: 'Fall',
          passwordHash: hash,
          role: UserRole.STUDENT,
          emailVerified: true,
          hoursBalance: 5,
        }),
      );
      await users.update({ email: studentEmail }, { hoursBalance: 5 });

      // Un véhicule disponible
      await dataSource.query(
        `INSERT INTO vehicles ("plateNumber","model") VALUES ($1,$2)`,
        [`T-${run}`.slice(0, 20), 'Voiture de test'],
      );

      // Disponibilité du moniteur : tous les jours, 08:00 à 12:00
      for (let day = 0; day < 7; day++) {
        await dataSource.query(
          `INSERT INTO availabilities ("instructorId","dayOfWeek","startTime","endTime")
           VALUES ($1,$2,'08:00','12:00')`,
          [instructor.id, day],
        );
      }

      const tokenOf = async (email: string) => {
        const res = await request(app.getHttpServer())
          .post('/auth/login')
          .send({ email, password })
          .expect(200);
        return res.body.accessToken as string;
      };
      const t1 = await tokenOf(studentEmail);
      const t2 = await tokenOf(second.email);

      // Premier créneau libre dans les jours qui viennent
      let startsAt: string | undefined;
      for (let i = 2; i < 10 && !startsAt; i++) {
        const d = new Date(Date.now() + i * 24 * 60 * 60 * 1000)
          .toISOString()
          .slice(0, 10);
        const slots = await request(app.getHttpServer())
          .get(`/slots?instructorId=${instructor.id}&date=${d}`)
          .set('Authorization', `Bearer ${t1}`)
          .expect(200);
        startsAt = slots.body.slots[0]?.startsAt;
      }
      expect(startsAt).toBeDefined();

      // Le premier élève réserve : OK
      await request(app.getHttpServer())
        .post('/appointments')
        .set('Authorization', `Bearer ${t1}`)
        .send({ instructorId: instructor.id, startsAt })
        .expect(201);

      // Le second tente le même créneau : refusé
      await request(app.getHttpServer())
        .post('/appointments')
        .set('Authorization', `Bearer ${t2}`)
        .send({ instructorId: instructor.id, startsAt })
        .expect(409);

      // Le premier élève a bien été débité d'une heure, le second non
      const balance = await dataSource
        .getRepository(User)
        .findOneByOrFail({ email: studentEmail });
      expect(balance.hoursBalance).toBe(4);
      const untouched = await dataSource
        .getRepository(User)
        .findOneByOrFail({ id: second.id });
      expect(untouched.hoursBalance).toBe(5);
    });
  });
});