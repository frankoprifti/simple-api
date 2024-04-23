import request from 'supertest';
import { app, server } from '../src/app';
let token: string;

afterAll((done) => {
    server.close(done);
});

beforeAll(async () => {
    await request(app)
        .post('/register')
        .send({ username: 'testuser', password: 'testpassword' });
    const loginResponse = await request(app)
        .post('/login')
        .send({ username: 'testuser', password: 'testpassword' });

    token = loginResponse.body.accessToken;
})

describe('GET /items', () => {
    it('should return 401 if no token is provided', async () => {
        const response = await request(app).get('/items');
        expect(response.status).toBe(401);
    });

    it('should return items for authenticated user', async () => {
        const response = await request(app)
            .get('/items')
            .set('Authorization', `Bearer ${token}`);

        expect(response.status).toBe(200);
        expect(response.body).toEqual([]);
    });
    it('should return 403 for error token', async () => {
        const response = await request(app)
            .get('/items')
            .set('Authorization', `Bearer errortoken`);

        expect(response.status).toBe(403);
        expect(response.body).toEqual({ error: 'Forbidden' });
    });
});

describe('POST /items', () => {
    it('should return 401 if no token is provided', async () => {
        const response = await request(app).post('/items').send({ name: 'Test Item' });
        expect(response.status).toBe(401);
    });

    it('should create a new item for authenticated user', async () => {
        const response = await request(app)
            .post('/items')
            .set('Authorization', `Bearer ${token}`)
            .send({ name: 'Test Item' });

        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('id');
        expect(response.body).toHaveProperty('name', 'Test Item');
        expect(response.body).toHaveProperty('ownerId', 1);
    });
    it('should return 400 if name is missing in POST /items', async () => {
        const response = await request(app)
            .post('/items')
            .set('Authorization', `Bearer ${token}`)
            .send({});
        expect(response.status).toBe(400);
    });

});

describe('PUT /items/:id', () => {
    it('should return 401 if no token is provided', async () => {
        const response = await request(app).put('/items/1').send({ name: 'Updated Item' });
        expect(response.status).toBe(401);
    });

    it('should update an existing item for authenticated user', async () => {
        const createItemResponse = await request(app)
            .post('/items')
            .set('Authorization', `Bearer ${token}`)
            .send({ name: 'Test Item' });

        const itemId = createItemResponse.body.id;

        const response = await request(app)
            .put(`/items/${itemId}`)
            .set('Authorization', `Bearer ${token}`)
            .send({ name: 'Updated Item' });

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('id', itemId);
        expect(response.body).toHaveProperty('name', 'Updated Item');
        expect(response.body).toHaveProperty('ownerId', 1);
    });
    it('should return 404 if item does not exist in PUT /items/:id', async () => {

        const response = await request(app)
            .put('/items/999') // Assuming 999 does not exist
            .set('Authorization', `Bearer ${token}`)
            .send({ name: 'Updated Item' });
        expect(response.status).toBe(404);
    });
    it('should return 400 if name is missing in PUT /items/:id', async () => {
        const response = await request(app)
            .put('/items/1')
            .set('Authorization', `Bearer ${token}`)
            .send({});
        expect(response.status).toBe(400);
    });
    it('should return 403 if user is not authorized to update the item in PUT /items/:id', async () => {
        const userOneRegisterResponse = await request(app)
            .post('/register')
            .send({ username: 'userone', password: 'password1' });

        expect(userOneRegisterResponse.status).toBe(201);

        const userTwoRegisterResponse = await request(app)
            .post('/register')
            .send({ username: 'usertwo', password: 'password2' });

        expect(userTwoRegisterResponse.status).toBe(201);

        const userOneLoginResponse = await request(app)
            .post('/login')
            .send({ username: 'userone', password: 'password1' });

        const userOneToken = userOneLoginResponse.body.accessToken;

        const createItemResponse = await request(app)
            .post('/items')
            .set('Authorization', `Bearer ${userOneToken}`)
            .send({ name: 'Test Item' });

        const itemId = createItemResponse.body.id;

        const userTwoLoginResponse = await request(app)
            .post('/login')
            .send({ username: 'usertwo', password: 'password2' });

        const userTwoToken = userTwoLoginResponse.body.accessToken;

        const response = await request(app)
            .put(`/items/${itemId}`)
            .set('Authorization', `Bearer ${userTwoToken}`)
            .send({ name: 'Updated Item' });

        expect(response.status).toBe(403);
        expect(response.body).toEqual({ error: 'You are not authorized to update this item' });
    });


});

describe('DELETE /items/:id', () => {
    it('should return 401 if no token is provided', async () => {
        const response = await request(app).delete('/items/1');
        expect(response.status).toBe(401);
    });

    it('should delete an existing item for authenticated user', async () => {
        const createItemResponse = await request(app)
            .post('/items')
            .set('Authorization', `Bearer ${token}`)
            .send({ name: 'Test Item' });

        const itemId = createItemResponse.body.id;

        const response = await request(app)
            .delete(`/items/${itemId}`)
            .set('Authorization', `Bearer ${token}`);

        expect(response.status).toBe(204);

        // Verify that the item is no longer in the items list
        const getItemsResponse = await request(app)
            .get('/items')
            .set('Authorization', `Bearer ${token}`);

        expect(getItemsResponse.body).not.toContainEqual(expect.objectContaining({ id: itemId }));
    });
    it('should return 404 when trying to delete an item that does not exist', async () => {
        const response = await request(app)
            .delete('/items/999')
            .set('Authorization', `Bearer ${token}`);
        expect(response.status).toBe(404);
    });
    it('should return 403 if user is not authorized to delete the item in DELETE /items/:id', async () => {
        const userOneLoginResponse = await request(app)
            .post('/login')
            .send({ username: 'userone', password: 'password1' });

        const userOneToken = userOneLoginResponse.body.accessToken;

        const createItemResponse = await request(app)
            .post('/items')
            .set('Authorization', `Bearer ${userOneToken}`)
            .send({ name: 'Test Item' });

        const itemId = createItemResponse.body.id;

        const userTwoLoginResponse = await request(app)
            .post('/login')
            .send({ username: 'usertwo', password: 'password2' });

        const userTwoToken = userTwoLoginResponse.body.accessToken;

        const response = await request(app)
            .delete(`/items/${itemId}`)
            .set('Authorization', `Bearer ${userTwoToken}`)

        expect(response.status).toBe(403);
        expect(response.body).toEqual({ error: 'You are not authorized to delete this item' });
    });
});
