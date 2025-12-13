import fs from 'fs/promises'
import path from 'path'

class DocsController {
  static init(app) {
    const api = app.basePath('/');
    app.get('/swagger.yaml', this.serveYaml);
    api.get('/docs', this.getDocs);
  }

  static async serveYaml(c) {
    try {
      const yamlPath = path.join(process.cwd(), 'swagger', 'swagger.yaml');
      const content = await fs.readFile(yamlPath, 'utf8');
      return c.text(content, 200, {
        'content-type': 'application/x-yaml'
      });
    } catch (err) {
      return c.text('Swagger file not found', 404);
    }
  }

  static async getDocs(c) {
    const html = `<!doctype html>
  <html>
  <head>
    <meta charset="utf-8" />
    <title>API Docs</title>
    <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist/swagger-ui.css" />
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist/swagger-ui-bundle.js"></script>
    <script>
      window.onload = function() {
        SwaggerUIBundle({
          url: '/swagger.yaml',
          dom_id: '#swagger-ui',
          presets: [SwaggerUIBundle.presets.apis],
          layout: 'BaseLayout'
        })
      }
    </script>
  </body>
  </html>`;

    return c.html(html);
  }
}

export default DocsController;
