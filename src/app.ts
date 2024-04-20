import express, { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
require('dotenv').config();

export const app = express();
app.use(express.json());

interface User {
    id: number;
    username: string;
    password: string;
}

interface Item {
    id: number;
    name: string;
    owner: string;
}

interface CustomRequest extends Request {
    user?: { username: string };
}

let items: Item[] = [];
let users: User[] = [];

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

app.get('/items', authenticateToken, (req: CustomRequest, res: Response) => {
    const userItems = items.filter(item => item.owner === req.user!.username);
    res.json(userItems);
});

app.post('/items', authenticateToken, (req: CustomRequest, res: Response) => {
    const { name } = req.body;
    if (!name) {
        return res.status(400).json({ error: 'Name is required' });
    }
    const newItem: Item = { id: items.length + 1, name, owner: req.user!.username };
    items.push(newItem);
    res.status(201).json(newItem);
});

app.put('/items/:id', authenticateToken, (req: CustomRequest, res: Response) => {
    const itemId = parseInt(req.params.id);
    const { name } = req.body;
    if (!name) {
        return res.status(400).json({ error: 'Name is required' });
    }
    const index = items.findIndex(item => item.id === itemId);
    if (index === -1) {
        return res.status(404).json({ error: 'Item not found' });
    }
    if (items[index].owner !== req.user!.username) {
        return res.status(401).json({ error: 'You are not authorized to update this item' });
    }
    items[index].name = name;
    res.json(items[index]);
});

app.delete('/items/:id', authenticateToken, (req: CustomRequest, res: Response) => {
    const itemId = parseInt(req.params.id);
    const index = items.findIndex(item => item.id === itemId);
    if (index === -1) {
        return res.status(404).json({ error: 'Item not found' });
    }
    if (items[index].owner !== req.user!.username) {
        return res.status(401).json({ error: 'You are not authorized to delete this item' });
    }
    items.splice(index, 1);
    res.sendStatus(204);
});

// Authentication endpoints
app.post('/register', async (req: CustomRequest, res: Response) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
    }
    if (users.some(user => user.username === username)) {
        return res.status(400).json({ error: 'Username already exists' });
    }
    const hashedPassword = await hashPassword(password);
    const newUser: User = { id: users.length + 1, username, password: hashedPassword };
    users.push(newUser);
    res.sendStatus(201);
});

app.post('/login', async (req: CustomRequest, res: Response) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
    }
    const user = users.find(user => user.username === username);
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
