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

## Tercera pasada: formas de pago y camisas

### Formas de pago (Emil + UI UX Pro Max)

- **Radios nativos** dentro de un `fieldset` con `legend`: teclado (flechas), lector de pantalla y foco visible sin JavaScript extra. Cada opción es una tarjeta de ≥ 68 px de alto con icono propio (teléfono, banco, billete) en trazo de 1,4 px como el resto de la iconografía.
- **Preselección**: pago móvil, la primera de la lista original de la tienda. Debajo del grupo, en texto, qué pasa con la elegida («Pagarás con… Te enviamos los datos por WhatsApp…»), anunciado con `aria-live`.
- **Resumen del pedido**: nueva fila «Forma de pago» con el icono y el nombre; se repite en la confirmación, en el mensaje de WhatsApp y en el panel.
- **Movimiento**: el cambio de selección es frecuente, así que es corto (160–180 ms, `ease-out`), sin rebote; el texto de la elegida y la fila del resumen cambian con el mismo fundido + desenfoque de 2 px del botón «Añadido» (`@starting-style`). `:active` a 0,985; hover solo con puntero fino.
- En móvil las tarjetas son filas (icono, nombre, marca de selección); desde 640 px, tres columnas.

### Camisas (frontend-design)

- **Fotos estandarizadas**: las cinco camisas se recortaron (modelo local de segmentación + GrabCut para telas parecidas al fondo, como el marrón y el blanco) y se compusieron sobre un **fondo salvia de estudio** derivado de la paleta, con sombra de contacto suave; ninguna conserva el fondo original. Mismo formato 4:5 y el mismo tono para todas.
- **Detalle del estampado** como segunda foto (también para el hover de la tarjeta), sin ampliar más de 1,5× para que no se vea blando.
- La variante se elige por **talla** (S, M, L, XL) con botones cuadrados de 56 px; la tarjeta dice «Elegir talla» y la bolsa, el pedido y WhatsApp dicen «Talla M».
- «Camisas» entra en la navegación principal y en la rejilla de categorías de la home (la línea «Prendas» de la marca); las camisas abren el carril de novedades.

### Contacto sin número visible

- El número de teléfono ya no se muestra en ningún texto: el pie, la banda de la home, la confirmación del pedido y los textos legales llevan un **icono de WhatsApp que enlaza** (`wa.me`). Se anuncia como «WhatsApp» a los lectores de pantalla y mide ≥ 44 px de alto. Los textos legales usan la marca `{{whatsapp}}`, que la página sustituye por el enlace con icono.
- La barra superior dice «Entregas en Venezuela, Maracay» y el pie «Pedidos por WhatsApp»: se retiró «precios en USD» de los textos fijos.

### Filtro de color y campos de ficha (investigación de catálogo)

- **Filtro «Color de la prenda»** en las camisas, con claves estables en la URL (`?color=coral`), de modo que el enlace no cambia al cambiar de idioma. La joyería no lo muestra (ya tiene «Tono»).
- **Tallas sin cambios** por decisión de la tienda: sin ventana nueva en la tarjeta, sin tallas deshabilitadas y sin «Avísame».
- **Campos de medidas, peso y cuidados** listos para llenar (`scripts/data/product-details.json`); se muestran solo cuando hay datos reales.
- **Aviso de color** en «Personalízala»: los colores pueden variar entre la pantalla y la prenda impresa.
- Descartado: poner las piezas de Clover sobre fotos de modelos ajenas. Probado con una foto; sobre fondo propio se nota lo falso y la escala sería inventada.

### Errores encontrados de paso

- La **rejilla de categorías de la home no se veía en escritorio** (altura 0): la regla `.snap-row { display: flex }` estaba fuera de capa y ganaba a `lg:grid`. Ahora vive en `@layer components`.
- Las **pestañas del panel** mostraban claves sin traducir (`admin.tabs./orders`). Corregido.
- En móvil, «Añadir a la bolsa» no cabía junto a cantidad y favoritos en la ficha: ahora dice «Añadir» bajo 640 px (la barra fija inferior conserva el texto completo).

## Decisión consciente: vídeos sin botón de pausa

Se pidió quitar el botón sobre los vídeos. Las guías (y WCAG 2.2.2) piden un mecanismo para pausar el movimiento automático de más de 5 s, así que **el control pasó al pie de página**: «Reducir movimiento» detiene vídeos, scroll suave, revelados, marquesinas y transiciones, y se recuerda entre visitas. Los clips están en silencio, son bucles cortos y se detienen solos fuera de pantalla.

## Pendiente / no aplicado

- **Carga diferida de GSAP/Lenis** (~55 KB gzip): desplazaría la descarga detrás de la hidratación, pero exige reescribir siete componentes de animación ya verificados; riesgo mayor que el beneficio.
- **Probar en dispositivos reales** (iPhone/Android): las correcciones móviles se verificaron por CSS/emulación; Emil recomienda hardware real para darlas por cerradas.
- **Regla de «Title Case» de Vercel**: no aplica al español (se usa mayúscula inicial de frase).
