// Direcciones de las páginas propias (NoExpertise). Mismo fichero en todas las plantillas: no lo cambies en una sola.
// La plataforma calcula los mismos slugs (App\Plantillas\Fichas::slug) para comprobar el build: si cambias la
// regla aquí, cámbiala también allí.

/** «Limpieza dental» → «limpieza-dental»: minúsculas, sin tildes, guiones, como mucho 60 caracteres. */
export function slugify(t: unknown): string {
  return String(t ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
    .replace(/-+$/g, '');
}

/** Slug escrito a mano en site.yaml (`slug:`): solo si cumple el patrón de la plataforma. */
export const SLUG_VALIDO = /^[a-z0-9][a-z0-9-]{0,60}$/;

/**
 * Slugs únicos dentro de una lista, en su orden: el `slug` propio si vale o el derivado del nombre;
 * si choca con uno anterior, «-2», «-3»… Un nombre sin letras ni números da «elemento».
 */
export function slugsUnicos(nombres: { slug?: unknown; nombre: unknown }[]): string[] {
  const usados = new Set<string>();
  return nombres.map(({ slug, nombre }) => {
    const propio = typeof slug === 'string' && SLUG_VALIDO.test(slug.trim()) ? slug.trim() : '';
    const base = propio || slugify(nombre) || 'elemento';
    let s = base;
    for (let n = 2; usados.has(s); n++) s = `${base}-${n}`;
    usados.add(s);
    return s;
  });
}

/** Texto largo (`detalle`) en párrafos: separados por una línea en blanco; los saltos sueltos, espacios. */
export function detalleAParrafos(t: unknown): string[] {
  return String(t ?? '')
    .replace(/\r\n?/g, '\n')
    .split(/\n\s*\n/)
    .map((p) => p.replace(/\s+/g, ' ').trim())
    .filter(Boolean);
}

/** «a.jpg; b.jpg» (o una lista) → rutas de foto limpias, como mucho 12. */
export function listaDeFotos(v: unknown): string[] {
  const partes = Array.isArray(v) ? v : String(v ?? '').split(/\s*;\s*/);
  return partes.map((x) => String(x ?? '').trim()).filter(Boolean).slice(0, 12);
}
