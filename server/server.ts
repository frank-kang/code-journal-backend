/* eslint-disable @typescript-eslint/no-unused-vars -- Remove me */
import 'dotenv/config';
import pg from 'pg';
import express from 'express';
import { ClientError, errorMiddleware } from './lib/index.js';

const db = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

const app = express();
app.use(express.json());

// make a POST to the notes
// event handlers
app.post('/api/entries', async (req, res, next) => {
  try {
    const { title, notes, photoUrl } = req.body;
    if (!title || !notes || !photoUrl) {
      throw new ClientError(
        400,
        'Invalid input: title, notes, photoUrl are required'
      );
    }
    const sql = `
    insert into "entries" ("title", "notes", "photoUrl")
    values ($1, $2, $3)
    returning *;
    `;
    const result = await db.query(sql, [title, notes, photoUrl]);
    const entry = result.rows[0];
    res.status(201).json(entry);
  } catch (err) {
    next(err);
  }
});

// make GET through to an id
// create a useEffect for all the notes (API calls)
app.get('/api/entries', async (req, res, next) => {
  try {
    const sql = `
    select * from "entries"
    `;
    const result = await db.query(sql);
    const entries = result.rows;
    res.json(entries);
  } catch (err) {
    next(err);
  }
});

// make a GET to the notes
// create a useEffect function (API calls)
app.get('/api/entries/:entryId', async (req, res, next) => {
  try {
    const { entryId } = req.params;
    if (!Number(entryId)) {
      throw new ClientError(400, 'entryId must be a positive integer');
    }
    const sql = `
    select * from "entries"
    where "entryId" = $1
    `;
    const result = await db.query(sql, [entryId]);
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

// double check to see if this endpoint is working correctly with errors and connecting
app.put('/api/entries/:entryId', async (req, res, next) => {
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
    returning *;
    `;
    const result = await db.query(sql, [title, notes, photoUrl, entryId]);
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
app.delete('/api/entries/:entryId', async (req, res, next) => {
  try {
    const { entryId } = req.params;
    if (!Number(entryId)) {
      throw new ClientError(400, 'entryId must be a positive integer');
    }
    const sql = `
    delete from "entries"
    where "entryId" = $1
    returning *;
    `;
    const result = await db.query(sql, [entryId]);
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
