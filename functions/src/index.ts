/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import cors from 'cors';
import express, { type NextFunction, type Request, type Response } from 'express';
import * as functions from 'firebase-functions/v1';
import jwt from 'jsonwebtoken';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';

type AuthPayload = {
  sub: string;
  tenant_id: number;
  role: string;
};

type AuthedRequest = Request & { user?: AuthPayload };

const app = express();
const router = express.Router();

const config = (() => {
  try {
    return functions.config().app ?? {};
  } catch {
    return {};
  }
})();

const env = {
  dbHost: process.env.DB_HOST ?? config.db_host ?? "",
  dbPort: process.env.DB_PORT ?? config.db_port ?? "",
  dbName: process.env.DB_NAME ?? config.db_name ?? "",
  dbUser: process.env.DB_USER ?? config.db_user ?? "",
  dbPassword: process.env.DB_PASSWORD ?? config.db_password ?? "",
  dbSslMode: process.env.DB_SSLMODE ?? config.db_sslmode ?? "require",
  dbSchema: process.env.DB_SCHEMA ?? config.db_schema ?? "public",
  jwtSecret: process.env.JWT_SECRET ?? config.jwt_secret ?? "",
  accessTokenExpireMinutes:
    process.env.ACCESS_TOKEN_EXPIRE_MINUTES ?? config.access_token_expire_minutes ?? "60",
  frontendOrigin: process.env.FRONTEND_ORIGIN ?? config.frontend_origin ?? "*",
};

app.use(cors({ origin: env.frontendOrigin, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const pool = new Pool({
  host: env.dbHost,
  port: env.dbPort ? Number(env.dbPort) : undefined,
  database: env.dbName,
  user: env.dbUser,
  password: env.dbPassword,
  ssl: env.dbSslMode === "require" ? { rejectUnauthorized: false } : undefined,
  options: `-c search_path=${env.dbSchema}`,
});

const jwtSecret = env.jwtSecret;
const jwtExpiryMinutes = Number(env.accessTokenExpireMinutes);

const requireAuth = (req: AuthedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization ?? '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  if (!token) {
    return res.status(401).json({ detail: 'Missing token' });
  }
  try {
    const payload = jwt.verify(token, jwtSecret) as AuthPayload;
    req.user = payload;
    return next();
  } catch {
    return res.status(401).json({ detail: 'Invalid token' });
  }
};

router.get('/health', (_req, res) => res.json({ ok: true }));

router.post('/auth/login', async (req, res) => {
  const username = String(req.body.username ?? req.body.email ?? '').toLowerCase();
  const password = String(req.body.password ?? '');
  if (!username || !password) {
    return res.status(400).json({ detail: 'Missing credentials' });
  }
  const { rows } = await pool.query('SELECT * FROM users WHERE email = $1 LIMIT 1', [username]);
  const user = rows[0];
  if (!user) {
    return res.status(401).json({ detail: 'Invalid login' });
  }
  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    return res.status(401).json({ detail: 'Invalid login' });
  }
  const token = jwt.sign(
    { sub: String(user.id), tenant_id: user.tenant_id, role: user.role },
    jwtSecret,
    { expiresIn: `${jwtExpiryMinutes}m` }
  );
  await pool.query('UPDATE users SET last_active = NOW() WHERE id = $1', [user.id]);
  return res.json({ access_token: token, token_type: 'bearer' });
});

router.get('/users', requireAuth, async (req: AuthedRequest, res) => {
  const { rows } = await pool.query(
    'SELECT id, email, first_name, last_name, phone, department, role, status, last_active, created_at FROM users WHERE tenant_id = $1 ORDER BY created_at DESC',
    [req.user?.tenant_id]
  );
  return res.json(rows);
});

router.post('/users', requireAuth, async (req: AuthedRequest, res) => {
  const payload = req.body ?? {};
  const passwordHash = await bcrypt.hash(String(payload.password ?? ''), 10);
  const { rows } = await pool.query(
    `INSERT INTO users (tenant_id, email, password_hash, first_name, last_name, phone, department, role, status, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
     RETURNING id, email, first_name, last_name, phone, department, role, status, last_active, created_at`,
    [
      req.user?.tenant_id,
      String(payload.email ?? '').toLowerCase(),
      passwordHash,
      payload.first_name ?? null,
      payload.last_name ?? null,
      payload.phone ?? null,
      payload.department ?? null,
      payload.role ?? null,
      payload.status ?? null,
    ]
  );
  return res.status(201).json(rows[0]);
});

router.put('/users/:userId', requireAuth, async (req: AuthedRequest, res) => {
  const userId = Number(req.params.userId);
  const payload = req.body ?? {};
  const fields = [
    ['first_name', payload.first_name],
    ['last_name', payload.last_name],
    ['phone', payload.phone],
    ['department', payload.department],
    ['role', payload.role],
    ['status', payload.status],
  ].filter(([, value]) => value !== undefined);
  if (!fields.length) {
    return res.status(400).json({ detail: 'No updates provided' });
  }
  const setClause = fields.map(([field], index) => `${field} = $${index + 2}`).join(', ');
  const values = fields.map(([, value]) => value);
  const { rows } = await pool.query(
    `UPDATE users SET ${setClause}
     WHERE id = $1 AND tenant_id = $${fields.length + 2}
     RETURNING id, email, first_name, last_name, phone, department, role, status, last_active, created_at`,
    [userId, ...values, req.user?.tenant_id]
  );
  if (!rows[0]) {
    return res.status(404).json({ detail: 'User not found' });
  }
  return res.json(rows[0]);
});

router.post('/users/:userId/reset-password', requireAuth, async (req: AuthedRequest, res) => {
  const userId = Number(req.params.userId);
  const newPassword = String(req.body.new_password ?? '');
  if (!newPassword) {
    return res.status(400).json({ detail: 'Missing new password' });
  }
  const passwordHash = await bcrypt.hash(newPassword, 10);
  const { rows } = await pool.query(
    `UPDATE users SET password_hash = $1
     WHERE id = $2 AND tenant_id = $3
     RETURNING id, email, first_name, last_name, phone, department, role, status, last_active, created_at`,
    [passwordHash, userId, req.user?.tenant_id]
  );
  if (!rows[0]) {
    return res.status(404).json({ detail: 'User not found' });
  }
  return res.json(rows[0]);
});

const simpleListCreateDelete = (table: string, column = 'name') => {
  router.get(`/${table}`, requireAuth, async (req: AuthedRequest, res) => {
    const { rows } = await pool.query(
      `SELECT id, ${column}, created_at FROM ${table} WHERE tenant_id = $1 ORDER BY created_at DESC`,
      [req.user?.tenant_id]
    );
    return res.json(rows);
  });

  router.post(`/${table}`, requireAuth, async (req: AuthedRequest, res) => {
    const value = String(req.body?.[column] ?? req.body?.name ?? '');
    const { rows } = await pool.query(
      `INSERT INTO ${table} (tenant_id, ${column}, created_at) VALUES ($1, $2, NOW()) RETURNING id, ${column}, created_at`,
      [req.user?.tenant_id, value]
    );
    return res.status(201).json(rows[0]);
  });

  router.delete(`/${table}/:id`, requireAuth, async (req: AuthedRequest, res) => {
    const id = Number(req.params.id);
    await pool.query(`DELETE FROM ${table} WHERE id = $1 AND tenant_id = $2`, [
      id,
      req.user?.tenant_id,
    ]);
    return res.status(204).send();
  });
};

simpleListCreateDelete('departments');
simpleListCreateDelete('sites');
simpleListCreateDelete('regions');

router.get('/response-types', requireAuth, async (req: AuthedRequest, res) => {
  const { rows } = await pool.query(
    'SELECT id, name, types, created_at FROM response_types WHERE tenant_id = $1 ORDER BY created_at DESC',
    [req.user?.tenant_id]
  );
  return res.json(rows);
});

router.post('/response-types', requireAuth, async (req: AuthedRequest, res) => {
  const { name, types } = req.body ?? {};
  const { rows } = await pool.query(
    'INSERT INTO response_types (tenant_id, name, types, created_at) VALUES ($1, $2, $3, NOW()) RETURNING id, name, types, created_at',
    [req.user?.tenant_id, name, JSON.stringify(types ?? [])]
  );
  return res.status(201).json(rows[0]);
});

router.delete('/response-types/:id', requireAuth, async (req: AuthedRequest, res) => {
  await pool.query('DELETE FROM response_types WHERE id = $1 AND tenant_id = $2', [
    Number(req.params.id),
    req.user?.tenant_id,
  ]);
  return res.status(204).send();
});

router.get('/templates', requireAuth, async (req: AuthedRequest, res) => {
  const { rows } = await pool.query(
    'SELECT id, name, note, tags, questions, created_at FROM audit_templates WHERE tenant_id = $1 ORDER BY created_at DESC',
    [req.user?.tenant_id]
  );
  return res.json(rows);
});

router.post('/templates', requireAuth, async (req: AuthedRequest, res) => {
  const { name, note, tags, questions } = req.body ?? {};
  const { rows } = await pool.query(
    `INSERT INTO audit_templates (tenant_id, name, note, tags, questions, created_at)
     VALUES ($1, $2, $3, $4, $5, NOW())
     RETURNING id, name, note, tags, questions, created_at`,
    [req.user?.tenant_id, name, note ?? null, JSON.stringify(tags ?? []), JSON.stringify(questions ?? [])]
  );
  return res.status(201).json(rows[0]);
});

router.delete('/templates/:id', requireAuth, async (req: AuthedRequest, res) => {
  await pool.query('DELETE FROM audit_templates WHERE id = $1 AND tenant_id = $2', [
    Number(req.params.id),
    req.user?.tenant_id,
  ]);
  return res.status(204).send();
});

router.get('/audit-plans', requireAuth, async (req: AuthedRequest, res) => {
  const { rows } = await pool.query(
    `SELECT id, code, start_date, end_date, audit_type, audit_subtype, auditor_name, department, location_city, site, country, region, audit_note, response_type, created_at, updated_at
     FROM audit_plans WHERE tenant_id = $1 ORDER BY created_at DESC`,
    [req.user?.tenant_id]
  );
  return res.json(rows);
});

const generateCode = () => {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 6 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join('');
};

router.post('/audit-plans', requireAuth, async (req: AuthedRequest, res) => {
  const payload = req.body ?? {};
  const code = generateCode();
  const { rows } = await pool.query(
    `INSERT INTO audit_plans (tenant_id, code, start_date, end_date, audit_type, audit_subtype, auditor_name, department, location_city, site, country, region, audit_note, response_type, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW(), NOW())
     RETURNING id, code, start_date, end_date, audit_type, audit_subtype, auditor_name, department, location_city, site, country, region, audit_note, response_type, created_at, updated_at`,
    [
      req.user?.tenant_id,
      code,
      payload.start_date,
      payload.end_date,
      payload.audit_type,
      payload.audit_subtype ?? null,
      payload.auditor_name ?? null,
      payload.department ?? null,
      payload.location_city ?? null,
      payload.site ?? null,
      payload.country ?? null,
      payload.region ?? null,
      payload.audit_note ?? null,
      payload.response_type ?? null,
    ]
  );
  return res.status(201).json(rows[0]);
});

router.put('/audit-plans/:id', requireAuth, async (req: AuthedRequest, res) => {
  const planId = Number(req.params.id);
  const payload = req.body ?? {};
  const fields = [
    ['start_date', payload.start_date],
    ['end_date', payload.end_date],
    ['auditor_name', payload.auditor_name],
    ['department', payload.department],
    ['location_city', payload.location_city],
    ['site', payload.site],
    ['country', payload.country],
    ['region', payload.region],
    ['audit_note', payload.audit_note],
    ['response_type', payload.response_type],
  ].filter(([, value]) => value !== undefined);
  if (!fields.length) {
    return res.status(400).json({ detail: 'No updates provided' });
  }
  const setClause = fields.map(([field], index) => `${field} = $${index + 2}`).join(', ');
  const values = fields.map(([, value]) => value);
  const { rows } = await pool.query(
    `UPDATE audit_plans SET ${setClause}, updated_at = NOW()
     WHERE id = $1 AND tenant_id = $${fields.length + 2}
     RETURNING id, code, start_date, end_date, audit_type, audit_subtype, auditor_name, department, location_city, site, country, region, audit_note, response_type, created_at, updated_at`,
    [planId, ...values, req.user?.tenant_id]
  );
  if (!rows[0]) {
    return res.status(404).json({ detail: 'Audit plan not found' });
  }
  return res.json(rows[0]);
});

router.delete('/audit-plans/:id', requireAuth, async (req: AuthedRequest, res) => {
  await pool.query('DELETE FROM audit_plans WHERE id = $1 AND tenant_id = $2', [
    Number(req.params.id),
    req.user?.tenant_id,
  ]);
  return res.status(204).send();
});

app.use('/', router);

export const api = functions.region('asia-south1').https.onRequest(app);
