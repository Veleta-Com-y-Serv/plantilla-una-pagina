// Configuración de Astro. No hace falta tocarla para cambiar contenido: todo está en site.yaml.
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import yaml from 'js-yaml';

// Permite `import datos from '../../site.yaml'` (con recarga en `npm run dev`).
function yamlPlugin() {
  return {
    name: 'noexpertise-yaml',
    transform(codigo, id) {
      if (!/\.ya?ml$/.test(id)) return null;
      return { code: 'export default ' + JSON.stringify(yaml.load(codigo) ?? {}) + ';', map: null };
    },
  };
}

export default defineConfig({
  site: process.env.SITE_URL || undefined,
  compressHTML: true,
  build: { inlineStylesheets: 'always' },
  devToolbar: { enabled: false },
  vite: { plugins: [tailwindcss(), yamlPlugin()] },
});
