import GisController from './GisController.js';

class CountryController {
  static init (app) {
    const api = app.basePath('/api');
    api.get('/gis/pais/portugal', CountryController.getCountryInfo);
  }

  static async getCountryInfo (c) {
    const districts = await GisController.getDistricts(c);
    const districtsData = await districts.json();

    return c.json({
      codigo: 'PT',
      cca3: 'PRT',
      codigos_telefone: ['351'],
      nome: 'Portugal',
      capital: 'Lisbon',
      populacao: 10276617,
      area_km2: 92212,
      emoji: '🇵🇹',
      moeda: {
        codigo: 'EUR',
        nome: 'Euro',
        simbolo: '€'
      },
      idiomas: [{
        iso639_1: 'pt',
        iso639_2: 'por',
        nome: 'Portuguese',
        nome_nativo: 'Português'
      }],
      subdivisoes: districtsData
    }, 200);
  }
}

export default CountryController;
