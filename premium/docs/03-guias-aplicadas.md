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

### Pedido sin toque extra

- Al tocar «Hacer pedido», el servidor registra el pedido y devuelve **ya el enlace de WhatsApp** con el mensaje armado con el pedido valorado. El navegador lo abre **en ese mismo momento**, sin pasar antes por otra página: el celular solo abre la app de WhatsApp mientras el toque del cliente sigue «activo» (`navigator.userActivation`, unos 5 s), y una página intermedia lo hacía llegar tarde.
- Mientras tanto la dirección pasa a la de confirmación (`/checkout/success?order=…`) y, al volver a la pestaña, queda la confirmación con el botón «Enviar pedido por WhatsApp» como respaldo. Si no hay toque activo (o el navegador no lo expone), se va a la página de confirmación como antes.
- Prueba: la de compra comprueba la petición a wa.me con el mensaje y que al volver atrás queda la confirmación con el botón. La del panel cancela el pedido al terminar para reponer el inventario y poder repetirse.

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

## Cuarta pasada: marca, tamaño de los fotogramas y estructura de la tienda
- **Marca**: «CLOVER» en Bodoni Moda 600 (serif de alto contraste, licencia OFL, autoalojada en `src/assets/fonts`) con el trébol dorado; subtítulo a plena opacidad. Sobre vídeo o foto, la cabecera lleva un velo oscuro y sombra de texto; con la cabecera sólida, verde de marca sobre marfil.
- **Fotogramas**: en escritorio ningún bloque ocupa la pantalla entera. Hero ≈ 76 % de la altura (`clamp(34rem, 76svh, 44rem)`), vídeo de la sección de joyería ≈ 70 %, colecciones y editorial con altura propia. Móvil sin cambios.
- **Tienda** (estructura tomada de una tienda de joyería de referencia): migas de pan, título con descripción corta y atajos redondos (tipos de pieza, o tonos/colores en cada categoría); barra con botón «Filtros» + recuento + búsqueda + orden; filtros en panel lateral (escritorio) u hoja inferior (móvil), de modo que la cuadrícula usa todo el ancho; tarjeta con punto del acabado, etiqueta («Más vendido», «Nuevo») en la misma línea y segunda foto al pasar el cursor.

## Quinta pasada: cabecera en dos filas, avisos al pie y scroll
- **Cabecera**: sin barra de avisos arriba. Fila 1: marca «CLOVER · Accesorios y Prendas» centrada y grande, con búsqueda, favoritos y bolsa a la derecha. Fila 2 (escritorio): Menú, Joyería, Relojes, Camisas, Colecciones y Regalos, centrados bajo la marca. En móvil se mantiene la fila única con el icono de menú. `--header-h` = fila de la marca + fila del menú (`--header-row-h`, `--header-nav-h`); `--announcement-h` queda en 0.
- **Avisos** (pedidos por WhatsApp, entregas en Maracay, formas de pago): ahora son tres líneas fijas con icono sobre las columnas del pie, sin rotar.
- **Inicio**: se quita la marquesina de palabras que se movía sola; hero ≈ 62 % de la altura (titular más pequeño) y vídeo de joyería ≈ 56 %.
- **Scroll**: el carril de novedades (y la galería de producto) llevaban `data-lenis-prevent-wheel`; con el cursor encima la rueda no movía la página y parecía atascada. Se quita el atributo: la rueda vertical mueve la página y el gesto horizontal desplaza el carril.
- Las barras pegajosas (filtros de la tienda) suben al borde cuando la cabecera se oculta al bajar (`--sticky-top`).
- **Cabecera en verde de marca** (`--color-forest`, #0b3f2b) en las dos filas, siempre sólida: nombre en marfil, trébol en dorado suave (`--color-gold-soft`), filete dorado tenue entre filas. El hero arranca justo debajo de la cabecera (`mt-[var(--header-h)]`), de modo que el vídeo se ve completo. Se elimina la lógica de contraste claro/oscuro de la cabecera, que ya no hace falta.
- **Categorías de la portada** («Seis mundos, un solo estilo»): en escritorio pasan de seis tiles iguales a una cuadrícula asimétrica de 12 columnas en dos filas (5·4·3 y 3·4·5) con altura fija de 20 rem; cada tile es un enlace completo con nombre, recuento de piezas y un botón circular con flecha que se rellena al pasar el cursor. Degradado inferior reforzado para que el texto se lea sobre fotos claras. Móvil: carril con snap, sin cambios. Idea tomada del componente «Condition Grid» de 21st.dev, adaptada a la paleta y a fotos propias (sin imágenes externas ni dependencias nuevas).
- **Transición entre productos** (y categorías/lookbook): se mantiene el barrido verde con su forma (círculo desde el clic en `clip`, rombo en `mask`), pero más lento y con curva suave: cubrir 620 ms con `inOut`, pausa de 160 ms con el logo visible y revelar en 800 ms. Antes llenaba la pantalla en ~100 ms con la curva `curtain`, que se sentía como un golpe. Las cortinas de la portada (`curtain`, `ivory`, `direction`) no cambian. Medido con grabación de vídeo antes y después.

## Niveles de movimiento (sexta pasada)

La web parecía «estática» y sin el scroll horizontal de «Cinco historias» cuando el sistema pedía reducir movimiento (p. ej. «Mostrar animaciones» desactivado en Windows): se apagaba todo a la vez. Ahora hay tres niveles (`useMotionLevel`):

- **Completo:** revelados, scroll fijado de «Cinco historias», transiciones verdes de página.
- **Suave (el sistema pide menos movimiento):** fundidos de opacidad (revelados, titulares, entrada del hero y un fundido breve entre páginas); sin parallax, recorte animado del vídeo ni vídeos automáticos. Las escenas que mueve la propia rueda (la fijada de «Cinco historias» y la de «Seis mundos») se mantienen.
- **Apagado (interruptor «Reducir movimiento» del pie):** todo estático; «Cinco historias» pasa a una fila nativa con flechas.

### Scroll fluido y escenas (séptima pasada)
- «Cinco historias»: escena fijada con desplazamiento horizontal de las cinco colecciones y barra de progreso. «Seis mundos»: entrada ligada al scroll (cada tarjeta llega desde un lado, girada, y se asienta) sin fijar la pantalla; dos efectos distintos.
- Tirones: `scrub: true` en lugar de `0.8` (Lenis ya suaviza; el doble suavizado se sentía pastoso), `ScrollTrigger.config({ ignoreMobileResize: true })` (la barra de direcciones del móvil ya no recalcula todo), y parallax / recorte animado del vídeo solo en escritorio con movimiento completo.
- Mosaico «Las joyas que más lucen»: estaba vacío (la imagen medía 0 de alto); ahora muestra la joya de mayor valor y la mejor de cada tipo.
- Colección destacada: texto a la izquierda e imagen contenida (máx. 28 rem) a la derecha.

### Fotos reales de pulseras y portadas de categoría (octava pasada)
- 10 pulseras (pu03, pu05–pu13) pasan a 4 fotos reales cada una, en este orden: en ángulo (principal), con mano modelo, de frente y close-up; la foto anterior queda al final de la galería. Se conserva el fondo crema original de las fotos (`npm run media:bracelets`, originales en `../assets-src/bracelets/`, nombres `<id>-a|h|f|c`; luego `npm run seed`). Las fotos no cuadradas (flores, estrellas, turquesa) se ajustan ampliando el fondo con degradado, sin deformar. pu01, pu02 y pu04 conservan sus fotos.
- Portadas de categoría elegidas por representatividad: Joyería → pu10 (estrellas), Relojes → rw03 (frontal, limpio), Camisas → cm03 (prenda completa), Novedades → pu08; el resto se mantiene (Collares co11, Aretes ar06, Anillos an04, Pulseras pu06).

### Primer plano, nitidez y menú (novena pasada)
- «Detalle en primer plano» ocupaba todo el ancho (21:9 con parallax) y ampliaba la foto hasta no distinguir la pieza: ahora es una foto cuadrada contenida (máx. 34 rem) junto a un texto breve. Los recortes automáticos de joyería (cortados o vacíos) se quitaron de galerías y del efecto hover; quedan los de relojes y sets y los close-ups reales de las pulseras. Zoom de la galería 1,9× → 1,5×.
- Fotos de pulseras (con mano modelo incluidas) a hasta 1600 px, calidad 90 y nitidez suave; las imágenes de la galería se sirven a calidad 80.
- Menú: cada categoría (Joyería, Relojes, Camisas, Colecciones, Regalos para ella) es de nuevo un enlace propio con su icono y su propio desplegable (tipos de joya, tonos de reloj, colores de camisa, las colecciones, regalos).

### Scroll más ágil y calidad de imagen (décima pasada)
- Lenis: de `duration: 1.05` a `lerp: 0.2` y `wheelMultiplier: 1.1`. Medido con una muesca de rueda (100 px): 90 % del recorrido en 203 ms (antes 368 ms) y 99 % en 370 ms (antes 651 ms). Con `lerp` el trackpad no reinicia la curva en cada evento. Sin fotogramas largos durante el scroll (Long Animation Frames, CPU ×4).
- Imágenes: `qualities` pasa a [72, 80, 90]; fichas y lightbox a 90, tarjetas a 80 (antes todo se servía a 72). Las fotos subidas por la tienda se conservan sin tocar en `../assets-src/bracelets/`; el archivo del sitio mantiene ~40 dB de PSNR frente al original.

### Scroll con inercia solo para ratón y trackpad (undécima pasada)
- Lenis (ya integrado con ScrollTrigger mediante un único ticker de GSAP) se crea solo con puntero preciso (`(hover: hover) and (pointer: fine)`); en pantallas táctiles el scroll es el nativo. Ajustes en `smoothScroll` (src/config/motion.ts): `lerp: 0.2`, `wheelMultiplier: 1.1`.
- Se apaga con «Reducir movimiento» (pie) y Lenis respeta prefers-reduced-motion del sistema. Los paneles modales lo detienen (`lenis.stop()`). Comprobado en 9 rutas.

### Imágenes más compactas en móvil (duodécima pasada)
En 360×800 varias imágenes ocupaban 50–60 % de la pantalla. Solo en móvil (el escritorio no cambia): colección destacada 51 % → 32 % (cuadrada, máx. 16 rem); «Elegimos cada pieza» 51 % → 31 % (4:3); editorial «Puestas» 51 % → 35 % (máx. 14 rem); mosaico «Las joyas que más lucen» a 2 columnas iguales (54 % → 26 %); carril de colecciones 44 % → 36 %; vídeo de joyería 80 % → 60 % de alto; visor del reloj máx. 18 rem; Journal en filas compactas con miniatura de 6,5 rem.

### Originales sin comprimir (decimotercera pasada)
- Las tiendas suben los originales a `fotos/pulseras-originales/` (PNG sin pérdida) y se copian a `../assets-src/bracelets/` con el nombre `<id>-<a|h|f|c>.png`. Con PNG de origen: JPG calidad 93 sin nitidez añadida (PSNR 43–45 dB frente al original; antes ~39 dB) y hasta 2400 px sin ampliar. Los archivos llevan una huella del contenido en el nombre (`pu06-ang-3e3518a.jpg`) para esquivar la caché de 30 días de Vercel.
- Pulsera de corazones (pu06): sus fotos son las de corazones alargados (la subida «Pulsera 11 (corazones alargados)», que coincide con su foto original); las de corazones abultados se retiraron de su galería (la foto antigua de pu06 se descarta por repetida).

## Aretes flor (ar11): originales + giro 360°
- Fotos reales sin comprimir (par, individual, puestos) en `../assets-src/aretes/`; `scripts/build-aretes.mjs` las lleva a 4:5 sin deformar (fondo liso con degradado largo; la de la oreja se recorta) y descompone `ar11-360.mp4` en fotogramas webp (`public/media/spin/ar11/`). Necesita ffmpeg (`FFMPEG=/ruta/ffmpeg`).
- `spin` en el esquema de producto: diapositiva «360°» al final de la galería (`Spin360`): arrastrar o flechas, inercia, giro lento inicial (solo movimiento completo) y mezcla corta entre fotogramas. Los fotogramas solo se cargan al abrirla.
- El 360 es el vídeo original de 12 fotogramas (`ar11-360.mp4`), elegido tras probar las versiones de 24 y 36 (5 s): con más fotogramas el giro no mejoraba porque el encuadre y el tamaño varían entre fotogramas. Todos los fotogramas del vídeo se usan.

## Ahorro en Vercel
- `assets-src/` (fotos originales sin comprimir, ~21 MB) vive ahora en la raíz del repositorio, fuera de `premium/`, para que no viaje con cada despliegue. Los scripts `build-*.mjs` lo leen en `../assets-src/`.
- `premium/vercel.json` desactiva los despliegues de las ramas `claude/*`: solo `main` compila.
- `ignoreCommand` en `vercel.json`: si el último commit no toca nada dentro de `premium/` (por ejemplo, subidas de fotos a `fotos/`), Vercel se salta la compilación.

## Aretes (22 productos) con fotos reales y 360°
- `scripts/build-aretes.mjs` lee `../fotos/aretes-originales/` y rehace las fotos de los 22 aretes del catálogo (tabla MAP: producto → diseño): base/par/individual a 4:5 sin deformar; macro y foto con modelo sin recorte (el punto focal decide qué se ve en 4:5); vídeo 360 → fotogramas webp (máx. 24, a 1080 px).
- Galería: base, con modelo, macro y 360° (los diseños de par/individual: par, individual, con modelo y 360°). Los otros 32 diseños de la carpeta aún no tienen producto.

## Aretes nuevos (32 diseños)
- 30 de los 32 diseños son aretes que el catálogo original ya tenía (ar01–ar53, antes excluidos por foto con empaque): se publican con su nombre, precio (18,50 USD) y unidades (10) reales. Cinco textos se corrigieron porque la foto nueva muestra otra forma o tono (`scripts/data/source-extra.json`: ar18, ar19, ar20, ar21, ar53).
- ar54 (concha con borde dentado) y ar55 (rosa pequeña con perla) son piezas nuevas: mismo precio y unidades que el resto de los aretes y sin material declarado.
- ar46 (flor con perla) sigue sin publicar: es prácticamente la misma pieza que ar11.
- Traducciones al inglés en `scripts/data/en.earrings-new.json`; fotos y 360° con `scripts/build-aretes.mjs` (tabla MAP).

## Botón 360° en la foto principal
- El giro se activa con un botón «360°» arriba a la izquierda de la foto (como en Swarovski): un clic abre el visor sobre la misma foto, otro clic o Escape vuelven a las fotos. En móvil ya no es una diapositiva del carrusel, así que arrastrar solo gira la pieza mientras el modo está activo. Los fotogramas se cargan al acercarse o enfocar el botón.
- `scripts/lib/spin.mjs` y `scripts/build-spin.mjs <id> <vídeo>` generan el 360° de cualquier producto (pulseras incluidas) desde un vídeo de la pieza girando. Corregido el orden de los fotogramas en vídeos de más de 99 (ar08).

## 360°: zoom e inercia
- `Spin360`: doble clic / doble toque / pellizco amplían (hasta 4x); con zoom, arrastrar mueve la foto; Escape quita el zoom y luego sale del giro; teclas + y -.
- Inercia por tiempo (no por fotogramas por segundo) con lanzamiento suavizado, y el giro se asienta en el fotograma más cercano, así que nunca queda «mezclado».

## Fotos con fondo blanco y 360° nuevos (aretes)
- Los 54 diseños se regeneran desde `fotos/aretes-originales/` con las fotos en blanco (#F9F9F9) y los vídeos 360 nuevos (960×960, 5 s a 24 fps = 120 fotogramas): se guardan 24 por pieza, repartidos por igual (`SPIN_MAX_FRAMES` para cambiarlo; con 36 cada giro pesa ~1,1 MB frente a ~0,7 MB).
- El color de las bandas del visor 360° sale del fondo real del fotograma (centro arriba y abajo), no de una esquina.
- Pulsera pu05: se quita la aclaración «según etiqueta visible» de la descripción, la historia y los detalles (es/en); el material queda como «Acero».
