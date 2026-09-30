# Guías de diseño aplicadas (y lo que no)

Se revisaron cinco guías públicas y se cruzaron con el código del sitio. Se usaron como **criterio de revisión**, no se copió código ni texto de ellas.

| Guía | Qué se aplicó |
| --- | --- |
| **Anthropic · frontend-design** | Se quitaron las «marcas de plantilla»: etiquetas en mayúsculas sobre casi cada titular (quedan solo las que dan información: fecha, nº de pedido, 404), cadenas con punto medio (`A · B · C`), etiquetas de formulario en versales. Textos de interfaz en voz activa, errores que dicen cómo corregir (`Escribe un teléfono válido, por ejemplo 0412 555 1234.`), mismo verbo en todo el flujo de pedido. La paleta y el logotipo se mantienen porque son los de la marca. |
| **Emil Kowalski · diseño y animación** | Curvas fuertes de salida (`--ease-out`, `--ease-drawer`, sin `ease-in` en interfaz). Retroalimentación al pulsar (`:active` escala 0,97 en botones, 0,9 en iconos). Hover solo con ratón (`@media (hover: hover) and (pointer: fine)`). Cajones y hojas: entran en ~450 ms y salen en ~280 ms (asimetría). Escalonado de 70 ms y revelados más cortos (700 ms, 20 px). Nada de `transition: all`. Preferencia de movimiento reducido por sistema **y** por interruptor propio. |
| **Emil Kowalski · mobile-native** | `interactive-widget=resizes-content`, `theme-color` con el verde de marca, sin resaltado al tocar (`-webkit-tap-highlight-color`), `touch-action: manipulation`, campos ≥ 16 px (sin zoom al enfocar), `overscroll-behavior: contain` en paneles, `100svh` en el hero y `100dvh` en cajones. No se usó `viewport-fit=cover` a propósito: sin probar en un iPhone real arriesga solapar la barra de estado. |
| **Vercel · Web Interface Guidelines** | Formularios: `autocomplete`, `inputMode`, `enterKeyHint`, `spellCheck` desactivado en teléfono, placeholders con ejemplo y `…`, error junto al campo con `aria-invalid`/`aria-describedby` y foco en el primero que falla. Acciones destructivas reversibles (quitar de la bolsa → «Deshacer»). `translate="no"` en la marca. Sin bloqueo de zoom. Fuente italic no usada eliminada. |
| **Vercel · React best practices** | `React.cache` en el catálogo (una lectura del almacén por petición aunque layout, página y componentes lo pidan: importa con Redis). Three.js y el visor 3D siguen en carga diferida; listeners de scroll pasivos. |
| **UI UX Pro Max / Huashu** | Texto resistente (titulares con `text-wrap: balance`, párrafos con `pretty`), las insignias llevan texto (no dependen solo del color), nada de degradados morados ni iconos emoji decorativos; los activos de marca se tomaron de los originales de Clover (nunca de memoria). |

## Segunda pasada: Emil, UI UX Pro Max y frontend-design

### Emil: revisión de animaciones (`review-animations`) y búsqueda de oportunidades

| Antes | Después | Por qué |
| --- | --- | --- |
| Enlace activado con **Enter** → cortina de transición de ~0,9 s | `instant`: navegación inmediata + foco en `#main` (`TransitionLink.tsx`) | Lo iniciado con teclado nunca se anima: se repite cientos de veces |
| Subrayado de enlaces y de navegación: 500 ms | 250 ms `--ease-out` | Hover de uso diario: casi imperceptible y rápido |
| Zoom de imagen al pasar el ratón: 1,4–1,6 s | 500 ms | Idem; antes se sentía lento y restaba respuesta |
| Acciones de la tarjeta al hover: 450/600 ms | 220/280 ms | Bajo el presupuesto de 300 ms para UI |
| Cabecera al ocultarse/mostrarse: 550 ms | 320 ms | Ocurre decenas de veces al hacer scroll |
| Menú a pantalla completa: entrada 700 ms, enlaces 900 ms + 60 ms/enlace | entrada 500 ms, salida 300 ms; enlaces 550 ms + 40 ms/enlace | Entrada deliberada, salida ágil; escalonado de 30–80 ms |
| Vista rápida: 400/550 ms, `scale(0.985)` | entrada 260/320 ms, salida 180/220 ms, `scale(0.97)` | Modal ocasional: rápido y con origen físico |
| Insignia de la bolsa: 500 ms | 320 ms | Feedback inmediato |
| Botón «Añadir» sin cambio visible (solo vuelo + insignia) | Pasa a «✓ Añadido» 1,6 s con fundido y desenfoque de 2 px (`@starting-style`) | «Botón que se transforma»: muestra qué cambió sin toast |

Se **rechazaron** (puerta de Emil): animar la apertura de la búsqueda con teclado (ya cae en el caso anterior), animar los precios o las cifras del carrito (datos que se leen), cualquier efecto nuevo sobre la cuadrícula de productos (visto decenas de veces al día).

### UI UX Pro Max (`ux`, `gsap`, `product`)

- **Objetivos táctiles ≥ 44 × 44 px**, medidos con Playwright en móvil sobre home, tienda, hoja de filtros, ficha, bolsa y checkout: botón de menú (38 → 44), cantidades de la bolsa (36 → 44), «Quitar», idioma, «Reducir movimiento», enlaces del pie, filtros y resumen. Los enlaces de texto conservan su aspecto y amplían solo la zona pulsable (`hit-area`).
- **Bug de accesibilidad encontrado**: el botón de menú quedaba **sin nombre accesible en móvil** (su texto se oculta bajo 640 px). Ahora lleva `aria-label`; hay prueba axe en móvil.
- **Texto mínimo de 12 px** en etiquetas (antes 11 px) y subtítulo de marca más legible en móvil.
- **Búsqueda sin resultados**: ya no es un callejón sin salida; ofrece categorías para seguir. Se eliminó la «×» nativa azul que duplicaba el botón de cerrar.
- Transición de página: la guía recomienda ≤ 250 ms; el encargo original pedía 450–900 ms, así que se mantuvo el encargo pero con salida más rápida que entrada y nunca en teclado ni con movimiento reducido.
- Para joyería de lujo la base de datos propone Cormorant + una sans geométrica y «premium oscuro + acento dorado»: coincide con la identidad actual (Cormorant + Manrope, verde de marca + dorado). Su estilo «Liquid Glass» y el patrón «Feature-Rich Showcase» no se adoptaron: el primero es de plataforma Apple y choca con la sobriedad de la marca.

### frontend-design

- **Una sola marquesina** (se quitó la repetida del cierre; la decoración que no sirve se recorta). El cierre ahora es un mensaje y un botón de WhatsApp.
- El movimiento por scroll ya se limitaba a una firma (titulares por palabras + imágenes que se revelan), sin el «fade-and-slide-up» genérico en cada bloque; se mantiene.
- Sin acento de una sola palabra en titulares, sin numeración 01/02/03, sin flechas «→».

## Decisión consciente: vídeos sin botón de pausa

Se pidió quitar el botón sobre los vídeos. Las guías (y WCAG 2.2.2) piden un mecanismo para pausar el movimiento automático de más de 5 s, así que **el control pasó al pie de página**: «Reducir movimiento» detiene vídeos, scroll suave, revelados, marquesinas y transiciones, y se recuerda entre visitas. Los clips están en silencio, son bucles cortos y se detienen solos fuera de pantalla.

## Pendiente / no aplicado

- **Carga diferida de GSAP/Lenis** (~55 KB gzip): desplazaría la descarga detrás de la hidratación, pero exige reescribir siete componentes de animación ya verificados; riesgo mayor que el beneficio.
- **Probar en dispositivos reales** (iPhone/Android): las correcciones móviles se verificaron por CSS/emulación; Emil recomienda hardware real para darlas por cerradas.
- **Regla de «Title Case» de Vercel**: no aplica al español (se usa mayúscula inicial de frase).
