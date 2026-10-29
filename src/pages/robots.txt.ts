// robots.txt (SEO de base, src/lib/seo.ts): abierto con el sitemap si la web es indexable; cerrado si es una vista previa.
import type { APIRoute } from 'astro';
import { robotsTxt, urlBase } from '../lib/seo';

export const GET: APIRoute = ({ site }) =>
  new Response(robotsTxt(urlBase(site)), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
