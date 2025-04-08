import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { getModelToken } from '@nestjs/mongoose';
import { User } from '../src/users/schemas/user.schema';
import { Connection } from 'mongoose';
import { getConnectionToken } from '@nestjs/mongoose';

describe('Authentication (e2e)', () => {
  let app: INestApplication;
  let userModel: any;
  let mongoConnection: Connection;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    app.setGlobalPrefix('api');
    
    userModel = moduleFixture.get(getModelToken(User.name));
    mongoConnection = moduleFixture.get(getConnectionToken());
    
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    // Clean up the users collection before each test
    await userModel.deleteMany({});
  });

  describe('/api/auth/signup (POST)', () => {
    it('should create a new user and return access token', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/signup')
        .send({
          email: 'test@example.com',
          password: 'password123',
        })
        .expect(201);

      expect(response.body).toHaveProperty('access_token');
      
      // Verify user was created in the database
      const user = await userModel.findOne({ email: 'test@example.com' }).exec();
      expect(user).toBeDefined();
      expect(user.email).toBe('test@example.com');
    });

    it('should return 400 when email is invalid', async () => {
      return request(app.getHttpServer())
        .post('/api/auth/signup')
        .send({
          email: 'invalid-email',
          password: 'password123',
        })
        .expect(400)
        .expect(res => {
          expect(res.body.message).toContain('email must be an email');
        });
    });

    it('should return 400 when password is too short', async () => {
      return request(app.getHttpServer())
        .post('/api/auth/signup')
        .send({
          email: 'test@example.com',
          password: 'short',
        })
        .expect(400)
        .expect(res => {
          expect(res.body.message).toContain('password must be longer than or equal to 6 characters');
        });
    });

    it('should return 400 when required fields are missing', async () => {
      return request(app.getHttpServer())
        .post('/api/auth/signup')
        .send({})
        .expect(400)
        .expect(res => {
          expect(res.body.message).toContain('email should not be empty');
          expect(res.body.message).toContain('password should not be empty');
        });
    });

    it('should return 409 when email already exists', async () => {
      // First create a user
      await request(app.getHttpServer())
        .post('/api/auth/signup')
        .send({
          email: 'duplicate@example.com',
          password: 'password123',
        })
        .expect(201);

      // Try to create another user with the same email
      return request(app.getHttpServer())
        .post('/api/auth/signup')
        .send({
          email: 'duplicate@example.com',
          password: 'different_password',
        })
        .expect(409)
        .expect(res => {
          expect(res.body.message).toBe('Email already exists');
        });
    });
  });

  describe('/api/auth/login (POST)', () => {
    it('should return access token when credentials are valid', async () => {
      // First create a user
      await request(app.getHttpServer())
        .post('/api/auth/signup')
        .send({
          email: 'login-test@example.com',
          password: 'password123',
        })
        .expect(201);

      // Then try to login
      const response = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'login-test@example.com',
          password: 'password123',
        })
        .expect(201);

      expect(response.body).toHaveProperty('access_token');
    });

    it('should return 401 when password is incorrect', async () => {
      // First create a user
      await request(app.getHttpServer())
        .post('/api/auth/signup')
        .send({
          email: 'wrong-password@example.com',
          password: 'correct_password',
        })
        .expect(201);

      // Then try to login with wrong password
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'wrong-password@example.com',
          password: 'wrong_password',
        })
        .expect(401)
        .expect(res => {
          expect(res.body.message).toBe('Invalid credentials');
        });
    });

    it('should return 401 when user does not exist', async () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123',
        })
        .expect(401)
        .expect(res => {
          expect(res.body.message).toBe('Invalid credentials');
        });
    });

    it('should return 400 when email is invalid', async () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'invalid-email',
          password: 'password123',
        })
        .expect(400)
        .expect(res => {
          expect(res.body.message).toContain('email must be an email');
        });
    });

    it('should return 400 when required fields are missing', async () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({})
        .expect(400)
        .expect(res => {
          expect(res.body.message).toContain('email should not be empty');
          expect(res.body.message).toContain('password should not be empty');
        });
    });
  });
});