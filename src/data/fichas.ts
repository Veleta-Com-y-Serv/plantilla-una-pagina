// Páginas propias de esta plantilla (NoExpertise): espejo de `fichas:` y `zonas:` de template.yaml.
// Cada lista de FICHAS da una página por elemento con `detalle` en /<ruta>/<slug>/ (src/pages/[coleccion]/[slug].astro);
// ZONAS, una página por zona con `texto` en /zonas/<slug>/ (src/pages/zonas/[slug].astro). Sin zonas: null.
import type { DefFicha, DefZonas } from '../lib/paginas';

export const FICHAS: DefFicha[] = [
  { lista: 'servicios', campo: 'items', ruta: 'servicios', nombre: 'Servicio', tipo: 'Service' },
];

export const ZONAS: DefZonas | null = null; // con zonas: { ruta: 'zonas' }
