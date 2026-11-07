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

## Compra única sin marca: US$3

La integración de frontend y backend está preparada y deshabilitada hasta configurar
Ko-fi y aplicar las migraciones. El botón «Apoyar Sandy» prepara la compra y permite
comprobar su estado. Los aportes voluntarios son independientes. El pago puede hacerse
con cualquier correo verificado en la cuenta de Sandy; solo una confirmación válida del
servidor retira la marca. No se guarda una bandera de pago en las preferencias editables
ni en localStorage.

El proveedor `SupportPurchaseProvider` consulta el estado por cuenta y retira el GIF
en cuanto el servidor confirma el beneficio. Descarta respuestas de cuentas anteriores,
vuelve a comprobar permisos activos cada minuto y al recuperar foco o conexión.
Si no puede verificar la compra, muestra la marca hasta poder comprobarla de nuevo.
El usuario debe iniciar la compra desde Sandy antes de pagar; el backend vincula
automáticamente el pago a cualquiera de sus correos verificados dentro de esa ventana.
Ya no se solicita el identificador de transacción en la interfaz.

Las acciones «Overlay OBS» de PNG, 2D y VRM generan enlaces con un permiso de lectura
limitado en `#support=...`, sin exponer la sesión Clerk. Se genera también para cuentas
gratuitas, de modo que la misma fuente se actualice después de comprar.
`OverlaySupportProvider` limpia el fragmento y consulta el permiso cada minuto sin
cookies. Las fuentes anteriores a esta función deben copiarse una vez. Desde «Mi apoyo»
se pueden renovar los permisos, invalidando todos los enlaces previos de esa cuenta.

La configuración del servidor, el producto fijo, las pruebas de activación
y el comando de devolución están en [KO_FI_PAYMENTS.md](../../SandyCore/docs/KO_FI_PAYMENTS.md)
del backend. No se han configurado credenciales ni hecho cobros reales.

Ko-fi ofrece notificaciones de pagos; no se presupone un evento automático de devolución.

El operador debe verificar las devoluciones/disputas en el proveedor y registrar su
revocación con la herramienta del backend. La marca reaparece en la siguiente consulta.
Fuente: [webhooks de Ko-fi](https://help.ko-fi.com/hc/en-us/articles/360004162298-Does-Ko-fi-have-an-API-or-webhook).

El control impide desactivar el aviso mediante las opciones gratuitas del producto.
Una fuente de navegador puede modificarse o recortarse por el usuario: el beneficio
no se anuncia como una protección inviolable contra la manipulación local.
