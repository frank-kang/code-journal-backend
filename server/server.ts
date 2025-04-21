/* eslint-disable @typescript-eslint/no-unused-vars -- Remove me */
import 'dotenv/config';
import pg from 'pg';
import express from 'express';
import { authMiddleware, ClientError, errorMiddleware } from './lib/index.js';
import argon2 from 'argon2';
import jwt from 'jsonwebtoken';

type Auth = {
  username: string;
  password: string;
};

type User = {
  userId: number;
  username: string;
  hashedPassword: string;
};

// for all put , post , get add auth middleware

const hashKey = process.env.TOKEN_SECRET;
if (!hashKey) throw new Error('TOKEN_SECRET not found in .env');

const db = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

const app = express();
app.use(express.json());

// this api is for user-management
// create an auth type
app.post('/api/auth/sign-up', async (req, res, next) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      throw new ClientError(
        400,
        'Invalid input: username and password required'
      );
    }
    const hashedPassword = await argon2.hash(password);
    const sql = `
    insert into "users" ("username", "hashedPassword")
    values ($1, $2)
    returning "userId", "username", "createdAt";
    `;
    const result = await db.query(sql, [username, hashedPassword]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

// this POST is for the sign-in
app.post('/api/auth/sign-in', async (req, res, next) => {
  try {
    const { username, password } = req.body as Partial<Auth>;
    if (!username || !password) {
      throw new ClientError(401, 'Invalid log-in');
    }
    const sql = `
    select *
    from "users"
    where "username" = $1;
    `;
    const result = await db.query<User>(sql, [username]);
    const user = result.rows[0];
    if (!user) throw new ClientError(401, 'not authorized');
    if (!(await argon2.verify(user.hashedPassword, password))) {
      throw new ClientError(401, 'not authorized');
    }
    const payload = { username: user.username, userId: user.userId };
    const token = jwt.sign(payload, hashKey);
    res.json({ user: payload, token });
  } catch (err) {
    next(err);
  }
});

// make a POST to the notes
// event handlers
app.post('/api/entries', authMiddleware, async (req, res, next) => {
  try {
    const { title, notes, photoUrl } = req.body;
    if (!title || !notes || !photoUrl) {
      throw new ClientError(
        400,
        'Invalid input: title, notes, photoUrl are required'
      );
    }
    const sql = `
    insert into "entries" ("userId","title", "notes", "photoUrl")
    values ($1, $2, $3, $4)
    returning *;
    `;
    const result = await db.query(sql, [
      req.user?.userId,
      title,
      notes,
      photoUrl,
    ]);
    const entry = result.rows[0];
    res.status(201).json(entry);
  } catch (err) {
    next(err);
  }
});

// make GET through to an id
// create a useEffect for all the notes (API calls)
app.get('/api/entries', authMiddleware, async (req, res, next) => {
  try {
    const sql = `
    select * from "entries"
    where "userId" = $1;
    `;
    const result = await db.query(sql, [req.user?.userId]);
    const entries = result.rows;
    res.json(entries);
  } catch (err) {
    next(err);
  }
});

// make a GET to the notes
// create a useEffect function (API calls)
app.get('/api/entries/:entryId', authMiddleware, async (req, res, next) => {
  try {
    const { entryId } = req.params;
    if (!Number(entryId)) {
      throw new ClientError(400, 'entryId must be a positive integer');
    }
    const sql = `
    select * from "entries"
    where "entryId" = $1
    and "userId" = $2;
    `;
    const result = await db.query(sql, [entryId, req.user?.userId]);
    const entry = result.rows[0];
    if (!entry) {
      throw new ClientError(404, `entry ${entryId} does not exist`);
    }
    res.json(entry);
  } catch (err) {
    next(err);
  }
});

// make a PUT to an noteId
// event handlers

app.put('/api/entries/:entryId', authMiddleware, async (req, res, next) => {
  try {
    const { entryId } = req.params;
    if (!Number(entryId)) {
      throw new ClientError(400, 'entryId must be a positive integer');
    }
    const { title, notes, photoUrl } = req.body;
    if (!title || !notes || !photoUrl) {
      throw new ClientError(
        400,
        'Invalid input: title, notes, photoUrl are required'
      );
    }
    const sql = `
    update "entries"
    set "title" = $1,
        "notes" = $2,
        "photoUrl" = $3
    where "entryId" = $4
    and "userId" = $5
    returning *;
    `;
    const result = await db.query(sql, [
      title,
      notes,
      photoUrl,
      entryId,
      req.user?.userId,
    ]);
    const entry = result.rows[0];
    if (!entry) {
      throw new ClientError(404, `entry ${entryId} does not exist`);
    }
    res.json(entry);
  } catch (err) {
    next(err);
  }
});

// make a DELETE to a noteId
// event handlers
app.delete('/api/entries/:entryId', authMiddleware, async (req, res, next) => {
  try {
    const { entryId } = req.params;
    if (!Number(entryId)) {
      throw new ClientError(400, 'entryId must be a positive integer');
    }
    const sql = `
    delete from "entries"
    where "entryId" = $1
    and "userId" = $2
    returning *;
    `;
    const result = await db.query(sql, [entryId, req.user?.userId]);
    const entry = result.rows[0];
    if (!entry) {
      throw new ClientError(404, `entry ${entryId} does not exist`);
    }
    res.sendStatus(204);
  } catch (err) {
    next(err);
  }
});

app.listen(process.env.PORT, () => {
  console.log(`express server listening on port ${process.env.PORT}`);
});
