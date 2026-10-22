---
name: Sandy Studio
description: Sistema de diseño Bitácora Nocturna para streamers y VTubers con IA en vivo
colors:
  primary: "#8C7CFF"
  primary-glow: "#A594FF"
  secondary: "#F28BD8"
  accent-amber: "#F2B45A"
  accent-rose: "#FF8A96"
  neutral-bg: "#0E1022"
  neutral-surface: "#141733"
  neutral-sidebar: "#0A0C1B"
  neutral-seam: "#262A4D"
  neutral-subtle: "#1B1E3D"
  text-primary: "#E9E6F5"
  text-muted: "#9A98B8"
  text-dim: "#6E6C90"
  light-bg: "#F4F3FA"
  light-surface: "#FFFFFF"
  light-sidebar: "#EAE7F6"
  light-seam: "#D8D4EC"
  light-text-primary: "#16182E"
  light-text-muted: "#5A5778"
typography:
  display:
    fontFamily: "Bricolage Grotesque, system-ui, sans-serif"
    fontSize: "clamp(1.75rem, 3.5vw, 2.5rem)"
    fontWeight: 800
    lineHeight: 1.15
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Bricolage Grotesque, system-ui, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: "-0.01em"
  title:
    fontFamily: "Atkinson Hyperlegible Next, system-ui, sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 700
    lineHeight: 1.4
    letterSpacing: "normal"
  body:
    fontFamily: "Atkinson Hyperlegible Next, system-ui, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  label:
    fontFamily: "Atkinson Hyperlegible Mono, monospace"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "0.06em"
rounded:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.neutral-bg}"
    rounded: "{rounded.sm}"
    padding: "10px 18px"
  button-primary-hover:
    backgroundColor: "{colors.primary-glow}"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.sm}"
    padding: "10px 18px"
  button-destructive:
    backgroundColor: "transparent"
    textColor: "{colors.accent-rose}"
    rounded: "{rounded.sm}"
    padding: "10px 18px"
  card-panel:
    backgroundColor: "{colors.neutral-surface}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.md}"
    padding: "18px 20px"
---

# Design System: Sandy Studio

## Overview

**Creative North Star: "La Bitácora del Observatorio Nocturno"**

Sandy Studio no es un dashboard administrativo genérico ni una consola de servidores. Es el cuaderno de vuelo y observación para un streamer o VTuber durante una transmisión en vivo. El creador opera en una habitación con poca luz, con el directo en pantalla principal y este panel en un monitor secundario que solo mira de reojo entre jugadas y conversaciones con el chat.

La estética evoca un observatorio astronómico bajo un cielo índigo profundo (`#0E1022`). La identidad estelar heredada (el logo de estrella facetada con play, las constelaciones y el cielo nocturno) abandona la decoración gratuita de brillos aleatorios y emojis para convertirse en una herramienta funcional: la **Constelación de Servicios**. Cada eslabón del pipeline (`Chat → Escucha → IA → Voz → Avatar`) es una estrella cuyo estado (llena, pulsante en discontinuo, hueca o tachada) se lee al instante sin forzar la vista.

Los paneles no flotan con sombras difusas ni recurren al glassmorphism masivo en cada rincón. Se organizan como placas técnicas unidas por costuras limpias de 1 píxel (`#262A4D`), dejando que la jerarquía la marquen el contraste de caja, la tipografía hiperlegible y un uso comedido y quirúrgico del color.

**Key Characteristics:**
- **Lectura periférica (Glanceable):** Estados críticos identificables en menos de 200 milisegundos mediante forma y contraste antes que por lectura de párrafo.
- **Estrellas con propósito:** El motivo astronómico codifica el estado real de la transmisión, no sirve de relleno decorativo.
- **Costuras limpias en lugar de sombras:** Paneles divididos por líneas de 1px con elevación tonal pura, asegurando nitidez en pantallas secundarias.
- **Protección de acciones en directo:** Los controles destructivos ("Detener todo", "Desconectar") están físicamente aislados para evitar clics accidentales en pleno stream.

## Colors

La paleta se inspira en el cielo nocturno sobre un observatorio y en los colores característicos del logo de Sandy Studio (violeta profundo y nebulosa magenta), regulados bajo estrictas dosis de jerarquía.

### Primary
- **Violeta Estelar** (`#8C7CFF` en dark / `#6B5CE7` en light): Color maestro de foco, acción primaria confirmada y estrellas en estado activo.
- **Brillo Estelar** (`#A594FF`): Estado de foco y hover en superficies interactivas primarias.

### Secondary
- **Nebulosa Magenta** (`#F28BD8` en dark / `#D84EB5` en light): Acento reservado para el control de audio/micrófono y momentos de respuesta generada en tiempo real.

### Functional Accents
- **Ámbar de Advertencia** (`#F2B45A`): Reintentos de API (ej. Fish Audio reconectando), latencia alta o servicios en espera.
- **Rosa de Ruptura** (`#FF8A96`): Desconexión, servicio caído, error de síntesis o acción destructiva aislada.
- **Cian de Datos** (`#4F8BFF`): Cifras tabulares de telemetría y mensajes entrantes de plataformas externas.

### Neutral
- **Cielo Profundo / Fondo Dark** (`#0E1022`): Suelo de la interfaz en modo oscuro.
- **Placa de Panel** (`#141733`): Fondo de tarjetas y paneles de trabajo.
- **Bisel Lateral** (`#0A0C1B`): Fondo de la barra de navegación lateral.
- **Costura 1px** (`#262A4D`): Frontera estructural entre paneles y módulos.
- **Niebla Estelar / Texto Primario** (`#E9E6F5`): Lectura principal con ratio de contraste > 10:1.
- **Polvo Estelar / Texto Secundario** (`#9A98B8`): Subtítulos, metadatos y etiquetas.
- **Neutro Tenue** (`#6E6C90`): Servicios inactivos o bordes secundarios.
- **Lienzo Claro / Modo Light** (`#F4F3FA`): Fondo limpio para modo día, con paneles en `#FFFFFF`, costuras en `#D8D4EC` y texto en `#16182E`.

### Named Rules
**The Constellation State Rule.** El estado de un servicio o conexión nunca se comunica únicamente por color. Toda indicación de estado combina forma geométrica (círculo lleno, contorno punteado, círculo vacío, icono tachado) con etiqueta textual y código de color.
**The 10% Accent Rule.** El violeta estelar y la nebulosa magenta ocupan como máximo el 10% del área visual de cualquier pantalla. Si todo brilla, nada es prioritario.

## Typography

La tipografía equilibra carácter streamer con legibilidad extrema para pantallas situadas a más de un metro del usuario.

**Display Font:** `Bricolage Grotesque` (fallback: `system-ui, sans-serif`)
**Body Font:** `Atkinson Hyperlegible Next` (fallback: `system-ui, sans-serif`)
**Label / Mono Font:** `Atkinson Hyperlegible Mono` (fallback: `ui-monospace, monospace`)

**Character:** Titulares enérgicos y precisos con personalidad propia sin caer en clichés de terminal hacker; cuerpo de texto optimizado para máxima diferenciación de glifos en monitores secundarios.

### Hierarchy
- **Display** (800, `clamp(1.75rem, 3.5vw, 2.5rem)`, 1.15): Título de secciones principales y pantallas de bienvenida.
- **Headline** (700, `1.25rem` / 20px, 1.3): Encabezado de tarjetas de servicio y paneles modales.
- **Title** (700, `1.0625rem` / 17px, 1.4): Nombres de servicios individuales y métricas clave.
- **Body** (400 / 500, `0.9375rem` / 15px, 1.5, max 68ch): Instrucciones, mensajes de chat y explicaciones de configuración.
- **Label / Tabular** (500, `0.75rem` / 12px, tracking `0.06em`, tabular-nums): Marcas de tiempo en bitácora (`23:41:07`), latencias en milisegundos (`812 ms`) e indicadores de estado.

### Named Rules
**The Glancing Read Rule.** Todo texto que represente el estado de un servicio o un valor crítico de audio debe leerse con un golpe de vista de 0.2 segundos. Las cifras que cambian en vivo usan siempre glifos tabulares monospaced (`font-variant-numeric: tabular-nums`).

## Layout

El layout responde a las necesidades reales de una sesión de streaming en vivo y su preparación previa:

- **Estructura fija:** Barra lateral colapsable (`232px` expandida / `64px` colapsada) a la izquierda, con navegación a Dashboard, Conexiones, Recompensas, Moderación, Avatar, Configuración y Cuenta.
- **Cabecera técnica (56px):** Título de ruta actual, interruptor de tema claro/oscuro y estado rápido del perfil.
- **La Franja de la Constelación (Dashboard):** Módulo superior dedicado al mapa del flujo de señal (`Chat → Escucha → IA → Voz → Avatar`). Conecta visualmente el pipeline completo mediante nodos estelares unidos por trazos vectoriales sutiles.
- **Cuadrícula de operación (Dashboard):** Dos columnas de control activo (Servicios y Micrófono) junto a una columna amplia de Bitácora / Chat en vivo.
- **Escala de espaciado:** 4px (micro), 8px (componentes compactos), 16px (espacio entre campos y filas), 24px (separación entre secciones), 32px (márgenes de página).
- **Responsive:** En pantallas de tablet o móviles, la constelación se comprime horizontalmente en tarjetas secuenciales y la cuadrícula colapsa a una sola columna ordenada por prioridad (Servicios primero, Micrófono segundo, Bitácora después).

## Elevation & Depth

Sandy Studio rechaza las sombras difusas acumuladas que hacen que cada tarjeta parezca flotar sin orden. La profundidad se consigue mediante estratificación tonal limpia:

- **Fondo base (`#0E1022`):** El nivel cero, mate y sereno.
- **Superficie de trabajo (`#141733`):** Nivel 1, delimitado por costuras perimetrales de 1px (`border: 1px solid #262A4D`).
- **Superficie activa / elevada (`#1B1E3D`):** Nivel 2, utilizado para estados seleccionados, menús desplegables y modales.
- **Resplandor de foco (Focus Accent):** Halo sutil de 2px en color Violeta Estelar (`box-shadow: 0 0 0 2px #8C7CFF`) aplicado exclusivamente sobre el elemento activo por teclado o botón enfocado.

### Named Rules
**The Hairline Seam Rule.** La separación entre paneles contiguos se resuelve con costuras de 1 píxel en color de contraste neutro (`#262A4D`). Las sombras exteriores se reservan únicamente para modales emergentes y menús flotantes desplegados.

## Shapes

- **Bordes de tarjetas y paneles:** Radio constante de 12px a 14px (`rounded-md`), evitando el redondeo excesivo en forma de píldora para contenedores de datos.
- **Botones y campos de entrada:** Radio de 8px a 10px (`rounded-sm`), tacto claro de botón accionable.
- **Indicadores y badges:** Esquinas suaves de 6px (`rounded-xs`) o píldora completa (`rounded-full`) solo cuando albergan un estado numérico breve o un chip de plataforma.
- **Nodos de la constelación:** Círculos vectoriales precisos de 14px con anillo exterior concéntrico de 32px al 18% de opacidad cuando el nodo está activo.

## Components

### Buttons
- **Primary:** Fondo violeta estelar (`#8C7CFF`), texto oscuro de alto contraste (`#0E1022`), tipografía peso 700, padding 10px 18px, radio 8px. Al hover: transición rápida a `#A594FF`.
- **Secondary / Action:** Fondo magenta nebulosa (`#F28BD8`), texto oscuro (`#0E1022`), reservado para control de voz y micrófono.
- **Ghost:** Fondo transparente, texto claro (`#E9E6F5`), borde 1px en `#262A4D`. Al hover: fondo `#1B1E3D`.
- **Destructive (Aislado):** Fondo transparente con texto rosa de ruptura (`#FF8A96`) y borde tenue en `#4A2A3E`. Separado intencionalmente por margen superior generoso de las acciones cotidianas.

### Service Cards
- Encabezado con título del servicio, estado en forma de nodo estelar con etiqueta y descripción de una línea.
- Filas de sub-servicios con línea divisoria de 1px, estado con glifo (● activo, ◌ conectando, ○ inactivo) y valor actual.
- Botón de acción principal al fondo de la tarjeta.

### Microphone & Audio Meter
- Barra de nivel estéreo integrada por agujas verticales de 6px de ancho, separadas por 3px, con color magenta nebulosa y altura vinculada a la señal de entrada real.
- Datos de dispositivo y palabra clave en Atkinson Hyperlegible Mono.

### Constellation Strip
- Lienzo SVG con gradiente radial central sutil. Nodos conectados por líneas de 1.5px: trazo continuo si la conexión previa está activa, trazo discontinuo (dashed) si está en proceso de reconexión.
- Etiquetas inferiores con nombre de servicio y detalle técnico (ej. "Gemini 2.5 Flash", "Twitch · 312 msg").

### Event Log / Bitácora
- Filas estructuradas en cuadrícula de dos columnas: marca de tiempo en mono (`00:00:00`) a la izquierda y chip de categoría (`chat`, `voz`, `IA`, `mod`) junto al evento a la derecha.
- Errores y reintentos destacados con tinte ámbar en la fila completa y borde izquierdo de 2px en `#F2B45A`.

## Do's and Don'ts

### Do:
- **Do** asegurar que cualquier cambio de estado se reconozca a distancia en un monitor secundario mediante forma y contraste.
- **Do** usar la tipografía Atkinson Hyperlegible Mono para toda cifra, código de token, hora y métrica técnica.
- **Do** mantener las acciones de parada ("Detener todo", "Desconectar") aisladas con espacio en blanco protector.
- **Do** soportar tanto el tema oscuro (cielo índigo profundo) como el tema claro (lienzo blanco y lila suave) con contraste WCAG AA validado.
- **Do** mantener la constelación como elemento de verdad técnica que refleja fielmente las conexiones reales de SandyCore.

### Don't:
- **Don't** llenar el fondo de estrellas o partículas que parpadeen sin cesar y distraigan al streamer en directo.
- **Don't** usar degradados de morado a azul genéricos de IA en botones o textos para "aparentar modernidad".
- **Don't** aplicar sombras difusas grandes ni efecto glassmorphism en todos los paneles a la vez.
- **Don't** inventar testimonios, números de usuarios falsos ni métricas ficticias en ninguna pantalla.
- **Don't** colocar enlaces o botones interactivos que no lleven a ninguna parte o queden muertos.
