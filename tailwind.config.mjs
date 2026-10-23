// Tailwind 4 lee este fichero desde src/styles/global.css (@config). No tocar salvo orden de diseño.
// Colores: vienen de site.yaml como variables CSS (los pone src/layouts/Base.astro).
// Tipografías: variables --fuente-texto y --fuente-titulos de src/styles/global.css (fuentes del sistema, sin descargas).
export default {
  theme: {
    extend: {
      colors: {
        primario: 'var(--c-primario)',
        acento: 'var(--c-acento)',
        fondo: 'var(--c-fondo)',
        texto: 'var(--c-texto)',
      },
      fontFamily: {
        sans: 'var(--fuente-texto)',
        display: 'var(--fuente-titulos)',
      },
    },
  },
};
