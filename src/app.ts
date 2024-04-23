import express, { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';
require('dotenv').config();

const prisma = new PrismaClient();

export const app = express();
app.use(express.json());

interface CustomRequest extends Request {
    user?: { username: string };
}

function authenticateToken(req: CustomRequest, res: Response, next: () => void) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token == null) return res.status(401).json({ error: 'Unauthorized' });

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET as string, (err, user) => {
        if (err) return res.status(403).json({ error: 'Forbidden' });
        req.user = user as { username: string };
        next();
    });
}

async function hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, 10);
}

app.get('/items', authenticateToken, async (req: CustomRequest, res: Response) => {
    const username = req.user!.username;
    const userItems = await prisma.item.findMany({
        where: { owner: { username } },
    });
    res.json(userItems);
});

app.post('/items', authenticateToken, async (req: CustomRequest, res: Response) => {
    const { name } = req.body;
    if (!name) {
        return res.status(400).json({ error: 'Name is required' });
    }
    const username = req.user!.username;
    const newItem = await prisma.item.create({
        data: { name, owner: { connect: { username } } },
    });
    res.status(201).json(newItem);
});

app.get('/items/:id', authenticateToken, async (req: CustomRequest, res: Response) => {
    const itemId = parseInt(req.params.id);

    const item = await prisma.item.findUnique({
        where: { id: itemId },
        include: { owner: true },
    });

    if (!item) {
        return res.status(404).json({ error: 'Item not found' });
    }

    if (item.owner.username !== req.user!.username) {
        return res.status(403).json({ error: 'You are not authorized to view this item' });
    }

    res.json(item);
});

app.put('/items/:id', authenticateToken, async (req: CustomRequest, res: Response) => {
    const itemId = parseInt(req.params.id);
    const { name } = req.body;
    if (!name) {
        return res.status(400).json({ error: 'Name is required' });
    }

    const item = await prisma.item.findUnique({ where: { id: itemId }, include: { owner: true } });

    if (!item) {
        return res.status(404).json({ error: 'Item not found' });
    }

    if (item.owner.username !== req.user!.username) {
        return res.status(403).json({ error: 'You are not authorized to update this item' });
    }

    const updatedItem = await prisma.item.update({
        where: { id: itemId },
        data: { name },
    });
    res.json(updatedItem);
});

app.delete('/items/:id', authenticateToken, async (req: CustomRequest, res: Response) => {
    const itemId = parseInt(req.params.id);

    const item = await prisma.item.findUnique({ where: { id: itemId }, include: { owner: true } });

    if (!item) {
        return res.status(404).json({ error: 'Item not found' });
    }

    if (item.owner.username !== req.user!.username) {
        return res.status(403).json({ error: 'You are not authorized to delete this item' });
    }

    await prisma.item.delete({
        where: { id: itemId },
    });

    res.sendStatus(204);
});

// Authentication endpoints
app.post('/register', async (req: CustomRequest, res: Response) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
    }
    const existingUser = await prisma.user.findUnique({ where: { username } });

    if (existingUser) {
        return res.status(400).json({ error: 'Username already exists' });
    }

    const hashedPassword = await hashPassword(password);

    const newUser = await prisma.user.create({
        data: { username, password: hashedPassword },
    });

    res.sendStatus(201);
});

app.post('/login', async (req: CustomRequest, res: Response) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
    }

    const user = await prisma.user.findUnique({ where: { username } });

    if (!user) {
        return res.status(401).json({ error: 'Invalid username or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
        return res.status(401).json({ error: 'Invalid username or password' });
    }

    const accessToken = jwt.sign({ username: user.username }, process.env.ACCESS_TOKEN_SECRET as string);

    res.json({ accessToken });
});

const port = process.env.PORT || 3000;
export const server = app.listen(port, () => console.log(`Server is running on port ${port}`));
