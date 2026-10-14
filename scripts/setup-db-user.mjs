#!/usr/bin/env node
import { readFileSync } from 'fs';
import mysql from 'mysql2/promise';
import { URL } from 'url';

function loadEnvLocal() {
  const text = readFileSync(new URL('../.env.local', import.meta.url), 'utf-8');
  for (const line of text.split('\n')) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2];
  }
}

function parseMysqlUrl(mysqlUrl) {
  // mysql://user:pass@host:port/dbname
  const u = new URL(mysqlUrl);
  return {
    user: decodeURIComponent(u.username),
    password: decodeURIComponent(u.password),
    host: u.hostname,
    port: u.port || '3306',
    database: u.pathname.replace(/^\//, ''),
  };
}

async function main() {
  loadEnvLocal();

  const appUrl = process.env.DATABASE_URL;
  const rootUrl = process.env.ROOT_DATABASE_URL;

  if (!appUrl) {
    console.error('ERROR: DATABASE_URL not found in .env.local');
    process.exit(1);
  }
  if (!rootUrl) {
    console.error('ERROR: set ROOT_DATABASE_URL to a root/admin connect string before running.');
    console.error('Example:');
    console.error("  export ROOT_DATABASE_URL='mysql://root:rootpass@127.0.0.1:3306'\n  node scripts/setup-db-user.mjs");
    process.exit(1);
  }

  const app = parseMysqlUrl(appUrl);
  const root = parseMysqlUrl(rootUrl);

  console.log('Connecting as admin to', root.host + ':' + root.port);
  const conn = await mysql.createConnection(rootUrl);

  try {
    console.log(`Creating database if missing: ${app.database}`);
    await conn.query(`CREATE DATABASE IF NOT EXISTS \`${app.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci`);

    const username = app.user;
    const password = app.password;
    const hosts = ['localhost', '127.0.0.1', '%'];

    for (const h of hosts) {
      console.log(`Creating/altering user '${username}'@'${h}'`);
      await conn.query(`CREATE USER IF NOT EXISTS \`${username}\`@\'${h}\' IDENTIFIED BY ?`, [password]);
      await conn.query(`ALTER USER \`${username}\`@\'${h}\' IDENTIFIED BY ?`, [password]).catch(() => {});
      await conn.query(`GRANT ALL PRIVILEGES ON \`${app.database}\`.* TO \`${username}\`@\'${h}\'`);
    }

    await conn.query('FLUSH PRIVILEGES');
    console.log('Done. User created and privileges granted.');
    console.log(`You can now run: mysql -u ${username} -p -h ${app.host} ${app.database}  (enter password from .env.local)`);
  } finally {
    await conn.end();
  }
}

main().catch((err) => {
  console.error('Error:', err && err.message ? err.message : err);
  process.exit(1);
});
