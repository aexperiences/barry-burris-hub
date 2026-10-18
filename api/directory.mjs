// /api/directory — Barry Burris, NMD · the referral-network / leads directory, staff only.
// The rows used to ship as a public file (barry-directory-data.js). Since Oct 17 2026 they
// live in api/_directory-data.mjs (bundled into this function, never served as a file) and
// come out only to a signed-in staff session (api/_gate.mjs).
import { gate, cors } from './_gate.mjs';
import ROWS from './_directory-data.mjs';

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') { res.statusCode = 204; res.end(); return; }
  if (!(await gate(req, res))) return; // staff only
  res.statusCode = 200;
  res.setHeader('content-type', 'application/json; charset=utf-8');
  res.setHeader('cache-control', 'private, no-store');
  res.end(JSON.stringify({ ok: true, rows: ROWS }));
}
