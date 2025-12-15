import dotenv from 'dotenv';
import { runQuery } from '../helpers/db.js';

dotenv.config({
  path: process.cwd() + '/.env'
});

class DangerController {
  static init(app) {
    const api = app.basePath('/api');
    api.get('/perigos/incendios', DangerController.getFireDanger);
    api.get('/perigos/inundacoes', DangerController.getInundationDanger);
  }

  static async getFireDanger(c) {
    const { lat, lng } = await c.req.query();
    if (!lat || !lng) {
      return c.json({ error: 'Latitude and Longitude are required' }, 400);
    }

    const sql = `
      SELECT ir.gridcode, g.description
      FROM perigosidade_incendio_rural ir
        INNER JOIN incendio_gridcode g ON g.id = ir.gridcode
      WHERE ST_Contains(geom, ST_Transform(ST_SetSRID(ST_MakePoint($2, $1), 4326), 3763))
    `;

    const data = await runQuery(sql, [lat, lng]);
    const rows = data.rows;
    if (rows.length === 0) {
      return c.json({
        risco: 0,
        descricao: 'Sem Informação'
      }, 200);
    }

    return c.json({
      risco: parseInt(rows[0].gridcode),
      descricao: rows[0].description
    }, 200);
  }

  static async getInundationDanger(c) {
    const { lat, lng } = await c.req.query();
    if (!lat || !lng) {
      return c.json({ error: 'Latitude and Longitude are required' }, 400);
    }

    const sql = `
      SELECT perigo as gridcode, st_area_sh
      FROM perigosidade_inundacoes
      WHERE ST_Contains(geom, ST_Transform(ST_SetSRID(ST_MakePoint($2, $1), 4326), 3763))
    `;
    const data = await runQuery(sql, [lat, lng]);
    const rows = data.rows;
    if (rows.length === 0) {
      return c.json({
        risco: 0,
        area_sh: 0
      }, 200);
    }

    return c.json({
      risco: rows[0].gridcode,
      area_sh: rows[0].st_area_sh
    }, 200);
  }
}

export default DangerController;

