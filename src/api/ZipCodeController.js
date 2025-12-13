import { runQuery } from '../helpers/db.js';

class ZipCodeController {
  static init(app) {
    const api = app.basePath('/api')
    api.get('/codigo-postal/:code', this.getZipCodeInfo);
  }

  static async getZipCodeInfo(c) {
    const { code } = await c.req.param();

    if (!code || code.length !== 8) {
      return c.json({ error: 'Zip code must be 8 characters long' }, 400);
    }

    const sql = `
      SELECT d.distrito, m.municipio, cp.*
      FROM public.codigos_postais cp
        INNER JOIN cont_municipios m ON m.dtmn = cp.cod_distrito || cp.cod_concelho
        INNER JOIN cont_distritos d ON d.dt = cp.cod_distrito
      WHERE (num_cod_postal || '-' || ext_cod_postal) = $1
    `;
    const data = await runQuery(sql, [code]);
    const rows = data.rows;
    if (rows.length === 0) {
      return c.json({ error: 'Zip code not found' }, 404);
    }

    const morada = [
      rows[0].tipo_arteria || '',
      rows[0].prep1 || '',
      rows[0].titulo_arteria || '',
      rows[0].prep2 || '',
      rows[0].nome_arteria || ''
    ].join(' ').trim().replace(/\s+/g, ' ');

    const cpInfo= {
      dtmnfr: String(rows[0].cod_distrito).padStart('2', 0) +  String(rows[0].cod_concelho).padStart('2', 0),
      distrito: rows[0].distrito,
      municipio: rows[0].municipio,
      num_cod_postal: rows[0].num_cod_postal,
      ext_cod_postal: rows[0].ext_cod_postal,
      cod_postal: rows[0].num_cod_postal + '-' + rows[0].ext_cod_postal + ' ' + rows[0].desig_postal,
      morada,
      local_arteria: rows[0].local_arteria || '',
      porta_inicial: rows[0].porta || '',
    };

    return c.json(cpInfo, 200);
  }
}

export default ZipCodeController;

