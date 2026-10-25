# Clover: cómo construir con estos componentes

Clover es una tienda de joyería, relojes, lentes y camisas (verde de marca + dorado champán sobre marfil). Los componentes son React y el estilo es **Tailwind 4 con tokens propios**: usa clases de utilidad, no CSS a mano.

## Preparación
- No hay provider: cada componente se monta solo. `Price` y `Logo` usan idioma fijo (español).
- `styles.css` ya trae fuentes (Cormorant Garamond para titulares, Manrope para el texto, Bodoni Moda solo para el logotipo) y los tokens. Lee `_ds/<carpeta>/styles.css` antes de añadir estilos.

## Idioma de estilo (clases reales)
| Para | Clases |
|---|---|
| Color | `bg-surface`, `bg-surface-sunken`, `text-fg`, `text-fg-muted`, `text-fg-subtle`, `text-accent`, `bg-accent`, `text-gold`, `text-danger` |
| Bordes | `border border-line-strong` |
| Titulares | `font-display text-display-m` / `text-display-l` (serif, peso 400) |
| Texto | `text-lead` (entradilla), `text-caption`, `tabular` (cifras) |
| Etiquetas de botón | `label-micro` (mayúsculas con tracking; ya la usa `Button`) |
| Contenedor | `container-x` (ancho y márgenes de página) |
| Enlaces | `link-underline` |
Los colores base son variables: `var(--color-forest)`, `--color-gold`, `--color-gold-soft`, `--color-ivory`, `--color-ink`. Fondos oscuros: envuelve en `data-tone="evergreen"` o usa `Section tone="evergreen"`.

## Reglas
- Botones: `Button` (acción), `ButtonLink` (navegación interna), `ExternalButtonLink` (WhatsApp, abre pestaña nueva). Variantes `solid` (principal), `outline`, `ghost`, `link`; tamaños `sm`, `md`, `lg`.
- Titulares de sección con `SectionHeading`; bandas con `Section` (`tone`: `sunken` o `evergreen`); páginas internas con `PageShell`.
- Precios siempre con `Price` (céntimos enteros: `cents={4200}` = $42,00; `compareAt` tacha el precio anterior).
- Iconos: `<…Icon width={20} height={20} />` hereda `currentColor`; `CategoryIcon slug="jewelry|watches|sunglasses|shirts|collections|gifts"` elige el de cada categoría.

## Ejemplo
```jsx
<Section tone="sunken" className="!py-16">
  <div className="container-x">
    <SectionHeading size="m" title="Lentes de sol" text="Monturas doradas de líneas geométricas." />
    <p className="mt-6"><Price cents={1400} className="text-lead" /></p>
    <div className="mt-6"><ButtonLink href="/es/shop/sunglasses">Ver lentes</ButtonLink></div>
  </div>
</Section>
```
