import request from 'supertest';
import { app, server } from '../src/app';


afterAll((done) => {
    server.close(done);
});
describe('POST /register', () => {
    it('should register a new user', async () => {
        const response = await request(app)
            .post('/register')
            .send({ username: 'newuser', password: 'testpassword' });
        expect(response.status).toBe(201);
    });

    it('should return 400 if username or password is missing', async () => {
        const response = await request(app)
            .post('/register')
            .send({ username: '', password: '' });
        expect(response.status).toBe(400);
    });
    it('should return 400 if username already exists', async () => {
        const response = await request(app)
            .post('/register')
            .send({ username: 'testuser', password: 'testpassword' });
        expect(response.status).toBe(400);
        expect(response.body).toEqual({ error: "Username already exists" })
    });
});

describe('POST /login', () => {
    it('should login and return JWT token', async () => {
        await request(app)
            .post('/register')
            .send({ username: 'testuser', password: 'testpassword' });

        const response = await request(app)
            .post('/login')
            .send({ username: 'testuser', password: 'testpassword' });

        expect(response.status).toBe(200);
        expect(response.body.accessToken).toBeDefined();
    });

    it('should return 400 if username or password is missing', async () => {
        const response = await request(app)
            .post('/login')
            .send({ username: '', password: '' });
        expect(response.status).toBe(400);
    });

    it('should return 401 if username is incorrect', async () => {
        const response = await request(app)
            .post('/login')
            .send({ username: 'incorrecttestuser', password: 'testpassword' });
        expect(response.status).toBe(401);
    });

    it('should return 401 if password is incorrect', async () => {
        const response = await request(app)
            .post('/login')
            .send({ username: 'testuser', password: 'incorrectpassword' });
        expect(response.status).toBe(401);
    });
});
