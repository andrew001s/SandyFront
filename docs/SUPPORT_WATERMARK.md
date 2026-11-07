# Aviso de apoyo de Sandy Studio

El aviso aparece solo dentro de los visores PNG, Live2D y VRM y sus fuentes de OBS.
No forma parte del HUD: ocultar los controles mantiene el aviso. No se incluye en
el panel de control de VTube Studio de escritorio, donde el renderizado es externo.

La primera visita comienza a los 30 segundos de montar el visor. Dura 10 segundos
y vuelve cada 3 minutos, contados entre apariciones. Los tiempos están en
`SUPPORT_WATERMARK_TIMING` dentro de `SupportWatermark.tsx`; la duración de la
animación CSS debe mantenerse igual a `visibleMs`. El enlace abre el Ko-fi actual
del proyecto. No hay sonido, botón de cierre ni ajuste gratuito para ocultarlo.

El GIF tiene 16 fotogramas de 150 ms y transparencia. Solo se monta mientras
aparece el aviso para que no siga decodificándose entre visitas. La preferencia
de movimiento reducido selecciona un PNG del primer fotograma y elimina el
desplazamiento de entrada y salida. El enlace no se retira mientras tenga foco.

## Generación del recurso

`assets/support/sandy-coffee-spritesheet.png` contiene los 16 fotogramas generados
con la herramienta de imágenes usando como referencia la Sandy del banner de
novedades, seguida de una ilustración de Sandy con taza. La secuencia sigue una
cuadrícula de 4 × 4: saludo de muñeca, parpadeo y pequeño movimiento de la taza,
con cámara fija y cuerpo completo. No contiene texto ni globo: estos se dibujan
en HTML para conservar la legibilidad.

Para reconstruir el GIF y el fotograma accesible:

```sh
node scripts/build-support-gif.mjs
```

El script recorta las celdas, alinea los pies, exporta el GIF transparente y
comprueba que haya varios fotogramas y que todos duren 150 ms. Usa la instalación
de Sharp incluida por Next.js. Los originales generados permanecen intactos.

## Propuesta: cuenta de apoyo sin aviso

La retirada de pago aún no está implementada. La opción inicial más acotada sería
una compra única, asociada a la cuenta de Sandy Studio. Requiere trabajo de backend,
persistencia y validación de pagos; no se resuelve con un interruptor en el navegador.

1. Definir el producto y el importe. Separar este beneficio de los aportes
   voluntarios existentes para no prometerlo a quienes hagan cualquier donación.
2. Vincular la compra a la cuenta autenticada mediante una reclamación verificable
   emitida por el servidor. No confiar solo en el nombre público del donante.
3. Recibir y validar el webhook del proveedor, registrar cada evento una sola vez
   y conceder un permiso de solo lectura para el cliente, como `watermark_free`.
4. Consultar ese permiso en el estudio. Las fuentes de OBS necesitarían un enlace
   firmado por el servidor que identifique el permiso sin exponer la sesión del usuario.
5. Resolver compras duplicadas, soporte, devoluciones y revocación del beneficio.

Ko-fi ya permite notificar pagos mediante webhooks. Una membresía recurrente
necesitaría controlar vencimientos: su documentación indica que los webhooks
notifican pagos, pero no la terminación de una membresía. Por eso la compra única
es una primera implementación más pequeña.

Fuente consultada: [API y webhooks de Ko-fi](https://help.ko-fi.com/hc/en-us/articles/360004162298-Does-Ko-fi-have-an-API-or-webhook).

El control de pago impediría desactivar el aviso mediante opciones oficiales.
Al ser contenido de una fuente de navegador, un usuario todavía puede recortar
o modificar su captura de OBS; no debe anunciarse como una protección inviolable.
