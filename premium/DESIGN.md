# Clover: DESIGN.md

Documento de diseño para agentes (formato DESIGN.md). Fuente de verdad: `src/styles/tokens.css` y `src/config/motion.ts`; si cambian, se actualiza aquí.

## Identidad
Tienda venezolana de joyería, relojes, lentes y camisas. Pedidos por WhatsApp. Sensación: boutique tranquila, verde de marca y dorado champán sobre marfil. Sin ornamento: cada borde, etiqueta o animación tiene que decir algo.

## Color
| Token | Valor | Uso |
|---|---|---|
| `--color-ivory` | #faf9f4 | fondo de página (`bg-surface`) |
| `--color-porcelain` | #fffefa | superficies elevadas |
| `--color-bone` | #edf4ef | superficie hundida (`bg-surface-sunken`) |
| `--color-ink` | #141a16 | texto principal (`text-fg`) |
| `--color-graphite` / `--color-smoke` | #4b524c / #5a625b | texto secundario / terciario |
| `--color-forest` | #0b3f2b | acento, botón principal, cabecera, fondos oscuros |
| `--color-gold` / `--color-gold-soft` | #b7985e / #d6c397 | detalles decorativos, trébol, iconos sobre verde |
| `--color-danger` / `--color-success` | #a33131 / #176b43 | errores / confirmación |
Bordes: `--line` (14 % de ink) y `--line-strong` (32 %). El tono oscuro se activa con `data-tone="evergreen"` o `ink`.

## Tipografía
- **Cormorant Garamond** (`font-display`): titulares, peso 400, `text-display-m|l|xl`.
- **Manrope** (`font-sans`): texto, interfaz y precios (`tabular`).
- **Bodoni Moda** (`font-brand`): solo el logotipo «CLOVER», en mayúsculas.
- Etiquetas pequeñas: `label-micro` (0,75 rem, tracking 0,22 em, mayúsculas, peso 600). Entradillas: `text-lead`.

## Forma y profundidad
Esquinas casi rectas (`--radius-xs` 2 px, `--radius-sm` 4 px); botones rectangulares. Sombras suaves (`--shadow-soft`, `--shadow-lift`) solo en superficies flotantes.

## Layout
Contenedor `container-x` (ancho 80 rem, gutter fluido). Breakpoints: sm 40, md 48, lg 64, xl 80 rem. Fotos de producto siempre en 4:5. Cabecera de 4,75 rem; objetivos táctiles de 44 px como mínimo.

## Movimiento
Curvas: `--ease-out` (interfaz), `--ease-luxe` y `--ease-expo` (revelados), `--ease-drawer` (paneles). Duraciones: 120 / 240 / 420 / 700 / 1100 ms. Los botones se hunden al pulsar (`scale 0.97`). Se respeta «reducir movimiento».

## Componentes
Base en `src/components/ui` (Button, ButtonLink, Dialog, Icon, Price, Section, PageShell, WhatsAppLink) y `brand/Logo`. Los precios usan siempre `Price` (céntimos enteros, USD). Los iconos son de trazo fino a 24 px y heredan `currentColor`.

## Contenido
Español primero (también en inglés). Frases cortas y concretas, en minúscula salvo nombres propios. Los textos de producto describen solo lo que se ve en las fotos.

## A evitar
Etiquetas en mayúsculas sobre cada titular, números de sección decorativos, tarjetas idénticas con sombra, degradados decorativos, marcas ajenas visibles en las fotos de producto.
