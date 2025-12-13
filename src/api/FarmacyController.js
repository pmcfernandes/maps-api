import { runQuery } from '../helpers/db.js';
import fetch from 'node-fetch';
import { load } from 'cheerio';

class FarmacyController {
  static init(app) {
    const api = app.basePath('/api');
    api.get('/farmacias/:dtmnfr', this.getFarmacies);
  }

  static async getFarmacies(c) {
    const { dtmnfr } = await c.req.param();
    if (!dtmnfr || dtmnfr.length !== 4) {
      return c.json({ error: 'DTMNF must be 4 characters long' }, 400);
    }

    const sql = `
      SELECT mn.fid, dtmn as dtmnfr, municipio, d.distrito
      FROM cont_municipios mn
        INNER JOIN cont_distritos d ON d.dt = LEFT(dtmn, 2)
      WHERE dtmn = $1
    `;
    const data = await runQuery(sql, [dtmnfr]);
    const rows = data.rows;
    if (rows.length === 0) {
      return c.json({ error: 'Municipality not found' }, 404);
    }

    const m = rows[0];
    const municipality = {
      dtmnfr: m.dtmnfr,
      municipio: String(m.municipio).toLowerCase(),
      distrito: String(m.distrito).toLowerCase(),
    };

    const slug = String(municipality.distrito).toLowerCase().replace(/\s+/g, '_') + '/' + String(municipality.municipio).toLowerCase().replace(/\s+/g, '_');
    const url = `https://www.farmaciasdeservico.net/localidade/${slug}`;

    const response = await fetch(url);
    if (!response.ok) {
      return c.json({ error: 'Failed to fetch farmacies data' }, 500);
    }

    const html = await response.text();
    const $ = load(html);
    const farmacies = [];

    $('.dados').each((index, element) => {
      let tipo = $(element).parent().parent().find('h2.separadorTipo > strong').text().trim();

      switch (tipo.toLowerCase()) {
        case 'disponibilidade':
          tipo = 'atendimento por chamada';
          break;
        case 'horário alargado':
          tipo = 'funcionamento em horário alargado';
          break;
        case 'permanente':
          tipo = 'aberto 24 horas';
          break;
        default:
          tipo = 'normal';
          break;
      }

      const name = $(element).find('h3 a').text().trim();
      const address = $(element).find('.morada').html().replace(/<br>/g, ', ').trim();
      const phone = $(element).find('.telefone > span').text().trim();
      const time = $(element).find('.horario > .linha').text().trim();
      farmacies.push({
        tipo,
        nome: name,
        morada: address,
        telefone: phone,
        horario: time
      });
    });

    return c.json(farmacies, 200);
  }
}

export default FarmacyController;
