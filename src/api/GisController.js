import { runQuery } from '../helpers/db.js';
import WeatherController from './WeatherController.js';

class AuthController {
  static init(app) {
    const api = app.basePath('/api')
    api.get('/gis/distritos', this.getDistricts);
    api.get('/gis/distrito/:dtmnfr', this.getDistrict);
    api.get('/gis/distrito/:dtmnfr/limites', this.getLimits);
    api.get('/gis/distrito/:dtmnfr/municipios', this.getMunicipalitiesByDistrict);
    api.get('/gis/municipio/:dtmnfr', this.getMunicipality);
    api.get('/gis/municipio/:dtmnfr/freguesia', this.getParishFromMunicipality);
    api.get('/gis/municipio/:dtmnfr/limites', this.getLimits);
    api.get('/gis/freguesia/:dtmnfr', this.getParish);
    api.get('/gis/freguesia/:dtmnfr/limites', this.getLimits);
    api.get('/gis/gps', this.getLatLng);
  }

  /**
   * Get all districts
   * @param {Object} c - Context object
   */
  static async getDistricts(c) {
    const sql = `
      SELECT fid, dt as dtmnfr, distrito, nuts1, area_ha, perimetro_km, n_municipios
      FROM cont_distritos
    `;
    const data = await runQuery(sql);
    const rows = data.rows;

    const districts = rows.map(row => ({
      dtmnfr: row.dtmnfr,
      distrito: row.distrito,
      nuts1: row.nuts1,
      area_ha: row.area_ha,
      perimetro_km: row.perimetro_km,
      n_municipios: row.n_municipios
    }));

    return c.json(districts, 200);
  }

  static async getDistrict(c) {
    const { dtmnfr } = await c.req.param();

    if (!dtmnfr || dtmnfr.length !== 2) {
      return c.json({ error: 'District code (dtmnfr) is required' }, 400);
    }

    const sql = `
      SELECT fid, dt as dtmnfr, distrito, nuts1, area_ha, perimetro_km, n_municipios
      FROM cont_distritos
      WHERE dt = $1
    `;
    const data = await runQuery(sql, [dtmnfr]);
    const rows = data.rows;

    if (rows.length === 0) {
      return c.json({ error: 'District not found' }, 404);
    }

    const district = rows.map(row => ({
      dtmnfr: row.dtmnfr,
      distrito: row.distrito,
      nuts1: row.nuts1,
      area_ha: row.area_ha,
      perimetro_km: row.perimetro_km,
      n_municipios: row.n_municipios
    }));

    return c.json({
      ...district[0]
    }, 200);
  }

  /**
   * Get municipalities by district code (dtmnfr)
   * @param {Object} c - Context object
   */
  static async getMunicipalitiesByDistrict(c) {
    const { dtmnfr } = await c.req.param();

    if (!dtmnfr || dtmnfr.length !== 2) {
      return c.json({ error: 'District code (dtmnfr) is required' }, 400);
    }

    const sql = `
      SELECT fid, dtmn as dtmnfr, municipio, nuts1, nuts2, nuts3, area_ha, perimetro_km, n_freguesias
      FROM cont_municipios
      WHERE dtmn LIKE $1 || '%'
    `;
    const data = await runQuery(sql, [dtmnfr]);
    const rows = data.rows;

    if (rows.length === 0) {
      return c.json({ error: 'No municipalities found for the given district' }, 404);
    }

    const municipalities = rows.map(row => ({
      dtmnfr: row.dtmnfr,
      municipio: row.municipio,
      nuts1: row.nuts1,
      nuts2: row.nuts2,
      nuts3: row.nuts3,
      area_ha: row.area_ha,
      perimetro_km: row.perimetro_km,
      n_freguesias: row.n_freguesias
    }));

    return c.json(municipalities, 200);
  }

  /**
   * Get municipality information by dtmnfr
   * @param {Object} c - Context object
   */
  static async getMunicipality(c) {
    const { dtmnfr } = await c.req.param();

    if (!dtmnfr || dtmnfr.length !== 4) {
      return c.json({ error: 'Municipality code (dtmnfr) is required' }, 400);
    }
    const sql = `
      SELECT fid, dtmn as dtmnfr, municipio, nuts1, nuts2, nuts3, area_ha, perimetro_km, n_freguesias
      FROM cont_municipios
      WHERE dtmn = $1
    `;
    const data = await runQuery(sql, [dtmnfr]);
    const rows = data.rows;
    if (rows.length === 0) {
      return c.json({ error: 'Municipality not found' }, 404);
    }

    const municipality = rows.map(row => ({
      dtmnfr: row.dtmnfr,
      municipio: row.municipio,
      nuts1: row.nuts1,
      nuts2: row.nuts2,
      nuts3: row.nuts3,
      area_ha: row.area_ha,
      perimetro_km: row.perimetro_km,
      n_freguesias: row.n_freguesias
    }));

    return c.json({
      ...municipality[0]
    }, 200);
  }

  /**
   * Get parishes by municipality code (dtmnfr)
   * @param {Object} c - Context object
   */
  static async getParishFromMunicipality(c) {
    const { dtmnfr } = await c.req.param();

    if (!dtmnfr || dtmnfr.length !== 4) {
      return c.json({ error: 'Municipality code (dtmnfr) is required' }, 400);
    }

    const sql = `
      SELECT caa.fid, dtmnfr, freguesia, municipio, d.distrito, caa.area_ha, caa.perimetro_km
      FROM cont_areas_administrativas caa
	      INNER JOIN cont_distritos d ON d.dt = LEFT(caa.dtmnfr, 2)
      WHERE dtmnfr LIKE $1 || '%' AND perimetro_km > 0
    `;

    const data = await runQuery(sql, [dtmnfr]);
    const rows = data.rows;
    if (rows.length === 0) {
      return c.json({ error: 'No parishes found for the given municipality' }, 404);
    }

    const parishes = rows.map(row => ({
      dtmnfr: row.dtmnfr,
      freguesia: row.freguesia,
      municipio: row.municipio,
      distrito: row.distrito,
      area_ha: row.area_ha,
      perimetro_km: row.perimetro_km
    }));

    return c.json(parishes, 200);
  }

  /**
   * Get parish information by dtmnfr
   * @param {Object} c - Context object
   */
  static async getParish(c) {
    const { dtmnfr } = await c.req.param();
    if (!dtmnfr || dtmnfr.length !== 6) {
      return c.json({ error: 'Parish code (dtmnfr) is required' }, 400);
    }

    const sql = `
      SELECT caa.fid, dtmnfr, freguesia, municipio, d.distrito, caa.area_ha, caa.perimetro_km
      FROM cont_areas_administrativas caa
	      INNER JOIN cont_distritos d ON d.dt = LEFT(caa.dtmnfr, 2)
      WHERE dtmnfr = $1
    `;

    const data = await runQuery(sql, [dtmnfr]);
    const rows = data.rows;
    if (rows.length === 0) {
      return c.json({ error: 'Parish not found' }, 404);
    }

    const parish = rows.map(row => ({
      dtmnfr: row.dtmnfr,
      freguesia: row.freguesia,
      municipio: row.municipio,
      distrito: row.distrito,
      area_ha: row.area_ha,
      perimetro_km: row.perimetro_km
    }));

    return c.json({
      ...parish[0]
    }, 200);
  }

  /**
   * Get parish information from latitude and longitude
   * @param {Object} c - Context object
   */
  static async getLatLng(c) {
    const { lat, lng } = await c.req.query();
    if (!lat || !lng) {
      return c.json({ error: 'Latitude and Longitude are required' }, 400);
    }

    const sql = `
      SELECT caa.fid, dtmnfr, freguesia, municipio, d.distrito, caa.area_ha, caa.perimetro_km
      FROM cont_areas_administrativas caa
	      INNER JOIN cont_distritos d ON d.dt = LEFT(caa.dtmnfr, 2)
      WHERE ST_Contains(caa.geom, ST_Transform(ST_SetSRID(ST_MakePoint($2, $1), 4326), 3763))
    `;

    const data = await runQuery(sql, [lat, lng]);
    const rows = data.rows;
    if (rows.length === 0) {
      return c.json({ error: 'No parish found for the given coordinates' }, 404);
    }

    const { dtmnfr, freguesia, municipio, distrito, area_ha, perimetro_km } = rows[0];
    const perigoIncendio = await getPerigoIncendio(c);
    const weather = await WeatherController.getWeather(c);
    const weatherData = await weather.json();

    return c.json({
      lat,
      lng,
      dtmnfr,
      freguesia,
      municipio,
      distrito,
      area_ha,
      perimetro_km,
      risco_incendio: perigoIncendio,
      clima: weatherData
    }, 200);
  }

  /**
   * Get geographical limits of a parish by dtmnfr
   * @param {Object} c - Context object
   */
  static async getLimits(c) {
    const { dtmnfr } = await c.req.param();

    if (!dtmnfr) {
      return c.json({ error: 'Parish code (dtmnfr) is required' }, 400);
    }

    const sql = `
      SELECT ST_AsGeoJSON(ST_Union(geom)) AS geojson
      FROM cont_areas_administrativas
      WHERE dtmnfr LIKE $1 || '%';
    `;

    const limits = await runQuery(sql, [dtmnfr]);
    const geojson = limits.rows[0];

    return c.json({
      ...geojson
    }, 200);
  }
}

async function getPerigoIncendio(c) {
  const { lat, lng } = await c.req.query();

  const sql = `
    SELECT ir.gridcode, g.description
    FROM perigosidade_incendio_rural ir
	    INNER JOIN incendio_gridcode g ON g.id = ir.gridcode
    WHERE ST_Contains(geom, ST_Transform(ST_SetSRID(ST_MakePoint($2, $1), 4326), 3763))
  `;

  const data = await runQuery(sql, [lat, lng]);
  const rows = data.rows;
  if (rows.length === 0) {
    return null;
  }

  return {
    risco: parseInt(rows[0].gridcode),
    descricao: rows[0].description
  };
}

export default AuthController;
