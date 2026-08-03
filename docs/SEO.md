# Guía SEO para Sandy Studio

Plan realista para pasar de "solo aparece con `sandy studio vtuber`" a posicionar en
keywords de cola larga relacionadas con VTubers con IA.

**Expectativa honesta:** un dominio joven sin autoridad no rankea para keywords
competitivas como "vtuber IA" en semanas. El SEO aquí es una carrera de varios meses;
esta guía prioriza las acciones que más impacto tienen primero.

## 1. Verificar el estado actual (Search Console)

1. Entra en [Google Search Console](https://search.google.com/search-console) con el
   dominio verificado (ya tienes la meta de verificación).
2. **Sitemaps** → envía `https://www.sandystudio.net/sitemap.xml`.
3. **Inspección de URL** → pega `https://www.sandystudio.net/` y pulsa
   *Solicitar indexación*. Haz lo mismo con `/vtuber-ia`, `/chat-bot-twitch-ia` y
   `/vtuber-kick`.
4. Revisa el informe **Cobertura** cada 2 semanas: si hay páginas "No indexadas",
   corrígelas.
5. En **Rendimiento**, activa la pestaña de *Páginas* y *Consultas* para ver qué
   queries ya te devuelven clics/impresiones y en cuáles estás cerca del top 20.

## 2. Contenido: el motor del crecimiento

El landing solo no basta. La estrategia es publicar páginas que respondan a búsquedas
específicas de tu nicho (ya creadas: `/vtuber-ia`, `/chat-bot-twitch-ia`,
`/vtuber-kick`).

Ideas de siguientes páginas/guías (una por keyword de cola larga):

- `¿Cómo hacer lip sync de un VTuber con IA?` (VTube Studio + IA)
- `Mejores voces de IA para VTubers` / `Cómo clonar tu voz para tu VTuber`
- `Bot de IA para Kick: cómo configurarlo`
- `VTuber sin cámara: qué necesitas para empezar`
- `Moderación de chat de Twitch con IA`
- Comparativa: `Sandy Studio vs Nightbot / Moobot` (buscan comparativas → gran CTR)

Reglas para cada página:

- 1 H1, H2 con la keyword, 300–800 palabras, listas y una FAQ.
- Enlace interno hacia el landing (CTA de registro) y hacia las otras guías.
- Añadir la URL al `sitemap.ts` (formato que ya usas) y su FAQPage JSON-LD.

## 3. Backlinks: lo que realmente mueve la aguja

Un dominio nuevo necesita enlaces externos. No necesitas cientos; necesitas unos pocos
de calidad y relevantes.

- **Perfiles y directorios de herramientas para streamers:**
  - Product Hunt (lanzamiento)
  - alternativeto.net (lista de alternativas a bots de Twitch)
  - Awesome Twitch / Awesome VTuber (listas de GitHub)
  - Listas tipo "herramientas para streamers" en blogs de nicho
- **Comunidad (los enlaces más realistas):**
  - Foros de VTube Studio, r/VirtualYoutubers, r/Twitch (sin spam: aporta valor)
  - Discord de VTubers: menciona la herramienta donde encaje
  - Comparte tu propio canal de Twitch/YouTube con "Sandy Studio" en el perfil
- **Tus propias redes** (ya las tienes en el footer): el perfil de GitHub con el repo,
  un video de demo en YouTube con enlace a la web.
- Si puedes, escribe un guest post en un blog de tecnología/streaming en español.

Regla de oro: un enlace de un sitio relevante vale más que diez de sitios genéricos.

## 4. Autoridad de marca

Google confía más cuando la marca es reconocible:

- Mantén nombre, logo y descripción consistentes en todos los perfiles (Twitch, Kick,
  GitHub, Discord, redes).
- El `sameAs` del schema ya asocia esas URLs a tu `Organization`.
- Aparecer citado en otros sitios (aunque sea en una lista) refuerza la marca.

## 5. Checklist técnico (ya implementado en código)

- [x] Favicon válido y cuadrado (256×256) en `/favicon.ico`
- [x] `robots.ts` permite el crawl de la landing y las guías
- [x] `sitemap.xml` con las 6 URLs públicas
- [x] Metadata única por página (title/description/canonical/OG)
- [x] JSON-LD: Organization + sameAs, WebSite, SoftwareApplication, FAQPage, Article
- [x] Imagen OG en 1200×630 (`/icons/og.png`)
- [ ] (pendiente, tú) Solicitar indexación en Search Console de las URLs nuevas

## 6. Medición mensual

- Impresiones y CTR por query en Search Console (Rendimiento).
- Posiciones en las 10 keywords objetivo (tracker manual o gratuito).
- Nº de páginas indexadas (Cobertura).

## Plazos orientativos

| Meses | Qué esperar |
|------|-------------|
| 0–1 | Indexación de todas las URLs, primeras impresiones |
| 1–3 | Top 30–50 para keywords de cola larga, primeros clics |
| 3–6 | Top 10–20 para cola larga con 10+ páginas de contenido y unos pocos backlinks |
| 6–12 | Keywords competitivas si la autoridad crece |
