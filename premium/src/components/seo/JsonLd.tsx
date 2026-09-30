/** Datos estructurados. `<` se escapa para que el JSON nunca pueda cerrar la etiqueta <script>. */
export function JsonLd({ data }: { data: unknown }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }} />;
}
