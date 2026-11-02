// sitemap.xml (SEO de base, src/lib/seo.ts): la portada, las páginas de src/pages (menos la 404), las fichas de
// cada elemento con `detalle` y las páginas por zona (src/lib/paginas.ts), con la dirección pública de la web.
// Vacío si la web no es indexable. Mismo fichero en todas las plantillas.
import type { APIRoute } from 'astro';
import { rutasDeFichas, rutasDePaginas, rutasDeZonas, sitemapXml, urlBase } from '../lib/seo';

const paginas = Object.keys(import.meta.glob('./*.astro'));

export const GET: APIRoute = ({ site }) =>
  new Response(sitemapXml(urlBase(site), [...rutasDePaginas(paginas), ...rutasDeFichas(), ...rutasDeZonas()]), {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
