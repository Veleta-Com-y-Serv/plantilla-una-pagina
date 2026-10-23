// Carga ../../site.yaml en el build y lo expone tipado.
// Es la única fuente de contenido: textos, colores, contacto, menú y secciones.
import datos from '../../site.yaml';

export interface Enlace { texto: string; url: string }
export interface Item { titulo: string; texto?: string; icono?: string; imagen?: string }
export interface Persona { nombre: string; cargo?: string; foto?: string; texto?: string }
export interface Testimonio { texto: string; autor: string }
export interface Horario { dia: string; horas: string }
export interface Pregunta { pregunta: string; respuesta: string }
export interface Proyecto { titulo: string; texto?: string; imagen?: string; categoria?: string; anio?: string }
export interface Noticia { fecha: string; titulo: string; texto?: string; url?: string }

export interface Seccion {
  activa: boolean;
  titulo?: string;
  antetitulo?: string;
  texto?: string;
  imagen?: string;
  cta?: Enlace;
  cta_secundario?: Enlace;
  items: Item[];
  personas: Persona[];
  testimonios: Testimonio[];
  galeria: string[];
  horario: Horario[];
  preguntas: Pregunta[];
  proyectos: Proyecto[];
  noticias: Noticia[];
  [campo: string]: unknown;
}

export interface Site {
  nombre: string;
  eslogan: string;
  sector: string;
  logo: string;
  colores: { primario: string; acento: string; fondo: string; texto: string };
  contacto: { telefono: string; email: string; direccion: string; horario: string; whatsapp: string };
  redes: { instagram: string; facebook: string; linkedin: string };
  menu: Enlace[];
  seo: { titulo: string; descripcion: string; tipo: string };
  boton_cabecera: Enlace | null;
  marca_pie: boolean;
  secciones: Record<string, Seccion>;
}

type Crudo = Record<string, any>;
const d = (datos ?? {}) as Crudo;
function lista<T>(v: unknown): T[] {
  return Array.isArray(v) ? (v.filter(Boolean) as T[]) : [];
}
const texto = (v: unknown) => (v == null ? '' : String(v));

function normalizar(s: Crudo = {}): Seccion {
  return {
    ...s,
    activa: s.activa === true,
    items: lista<Item>(s.items),
    personas: lista<Persona>(s.personas),
    testimonios: lista<Testimonio>(s.testimonios),
    galeria: lista<string>(s.galeria),
    horario: lista<Horario>(s.horario),
    preguntas: lista<Pregunta>(s.preguntas),
    proyectos: lista<Proyecto>(s.proyectos),
    noticias: lista<Noticia>(s.noticias),
  } as Seccion;
}

const secciones: Record<string, Seccion> = {};
for (const [id, s] of Object.entries((d.secciones ?? {}) as Crudo)) secciones[id] = normalizar((s ?? {}) as Crudo);

export const site: Site = {
  nombre: texto(d.nombre) || 'Mi negocio',
  eslogan: texto(d.eslogan),
  sector: texto(d.sector),
  logo: texto(d.logo),
  colores: { primario: '#1f2937', acento: '#f59e0b', fondo: '#ffffff', texto: '#111827', ...(d.colores ?? {}) },
  contacto: { telefono: '', email: '', direccion: '', horario: '', whatsapp: '', ...(d.contacto ?? {}) },
  redes: { instagram: '', facebook: '', linkedin: '', ...(d.redes ?? {}) },
  menu: lista<Enlace>(d.menu),
  seo: {
    titulo: texto(d.seo?.titulo) || texto(d.nombre),
    descripcion: texto(d.seo?.descripcion) || texto(d.eslogan),
    tipo: texto(d.seo?.tipo) || 'LocalBusiness',
  },
  boton_cabecera: d.boton_cabecera?.url ? (d.boton_cabecera as Enlace) : null,
  marca_pie: d.marca_pie !== false,
  secciones,
};

/** Devuelve la sección si existe y tiene `activa: true`; si no, null. */
export function seccion(id: string): Seccion | null {
  const s = site.secciones[id];
  return s && s.activa ? s : null;
}

/** Ids de las secciones activas, en el orden en que aparecen en site.yaml. */
export function seccionesActivas(): string[] {
  return Object.keys(site.secciones).filter((id) => site.secciones[id].activa);
}

export const tel = (n?: string) => (n ? 'tel:' + n.replace(/[^\d+]/g, '') : '');
export const whatsapp = (n?: string, mensaje = '') =>
  n ? `https://wa.me/${n.replace(/\D/g, '')}${mensaje ? '?text=' + encodeURIComponent(mensaje) : ''}` : '';
export const mapa = (direccion?: string) =>
  direccion ? 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(direccion) : '';
/** Párrafos a partir de un texto con líneas en blanco entre párrafos. */
export const parrafos = (t?: string) => (t ? t.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean) : []);
