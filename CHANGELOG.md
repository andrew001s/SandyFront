# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### [0.1.8](https://github.com/andrew001s/SandyFront/compare/v0.1.5...v0.1.8) (2026-08-28)


### Features

* ✨ actualizar metadatos de SEO en las páginas de política de privacidad y términos de servicio ([de6e2e3](https://github.com/andrew001s/SandyFront/commit/de6e2e323025211c7715cfb9a62e0ad60790a30f))
* ✨ agregar carga de variables de entorno y mejorar la gestión de permisos en las acciones del servidor ([b492ddb](https://github.com/andrew001s/SandyFront/commit/b492ddb4709415d19ce83aee6e78c2f7ca58f806))
* ✨ agregar Google Tag Manager para mejorar el seguimiento de eventos ([cc80d81](https://github.com/andrew001s/SandyFront/commit/cc80d815a518a80ddbea31126638a28c8dd7da65))
* ✨ agregar integración de Microsoft Clarity para seguimiento de eventos ([8f6df2e](https://github.com/andrew001s/SandyFront/commit/8f6df2e21cb9bae2463080763db8a57a8452a838))
* ✨ agregar soporte para configuración de IA local y mejorar la gestión de ajustes ([c16f5f5](https://github.com/andrew001s/SandyFront/commit/c16f5f56044bdf336a5f75ed6a5a6a23c9bce344))
* ✨ expand platform support in FAQ and features ([570a768](https://github.com/andrew001s/SandyFront/commit/570a768e4bf2411e8dce9495fa6542cac7a9c1b6))
* ✨ implementar soporte para modelo de IA local y mejorar la gestión de proveedores de IA ([1d42869](https://github.com/andrew001s/SandyFront/commit/1d4286931c41a664bd57162f9d49ba1b95ce48ab))
* ✨ implementar soporte para tokens efímeros en conexiones de stream y WebSocket ([535c69c](https://github.com/andrew001s/SandyFront/commit/535c69c3cf57525205aab7bc51777457e124f850))
* ✨ implementar streaming de respuestas de Gemini y manejar errores de IA ([6b241ac](https://github.com/andrew001s/SandyFront/commit/6b241ac181c23dc3cf72d8536728bad8a533b455))
* ✨ integrar Rollbar para el seguimiento de errores en el cliente y servidor ([2d79011](https://github.com/andrew001s/SandyFront/commit/2d790113043f222cb8ccd59be2f252e45cee92c5))
* ✨ mejorar manejo de búsqueda en FishVoiceDialog y optimizar imágenes en Support y AvatarModelListCard ([04c3d4c](https://github.com/andrew001s/SandyFront/commit/04c3d4c194accdea9e5d8a5b94e3acfb4239aeaa))
* ✨ mejorar manejo de perfil y estado en useKickAuth para manejar respuestas vacías ([4d512f9](https://github.com/andrew001s/SandyFront/commit/4d512f9d56f399661348ea5d4d109feff2eb1e1a))
* add PostHog analytics integration ([f02ea66](https://github.com/andrew001s/SandyFront/commit/f02ea66b0838641d731f2f75fe0d33feb7ef211e))
* **AiStep:** ✨ actualizar enlace para crear API key en OpenRouter ([c76ae7e](https://github.com/andrew001s/SandyFront/commit/c76ae7eec22c0dd18339285fb97ee99da7212cfd))
* **Dictaphone:** ✨ mejorar manejo del estado del micrófono y la intención de escucha ([c6c5a98](https://github.com/andrew001s/SandyFront/commit/c6c5a98c8fa84e854e316539fff9c311890ccce1))
* **onboarding:** ✨ add theme and speech recognition steps, enhance onboarding UI ([a543642](https://github.com/andrew001s/SandyFront/commit/a543642605858cf404636d71657b288498215b3e))
* **onboarding:** ✨ agregar componente SandyCoreStep y soporte para configuración de personalidad VTuber ([46909fc](https://github.com/andrew001s/SandyFront/commit/46909fcbea3a1f4e5a273809b0e4abf5c47f325c))
* **onboarding:** ✨ agregar soporte para configuración de Azure Speech en el flujo de onboarding ([8d2e4dd](https://github.com/andrew001s/SandyFront/commit/8d2e4dd3795437673e1b7e4333225adbf828d0db))
* **onboarding:** ✨ añadir documentación oficial en pasos de onboarding ([28a99a2](https://github.com/andrew001s/SandyFront/commit/28a99a29fef0abbe1a382412a8cb8bd816f06c5d))
* **onboarding:** ✨ implementar mejoras en el flujo de onboarding y gestión de estado ([03ee957](https://github.com/andrew001s/SandyFront/commit/03ee95773bff93f398124c9eb5233a0a8b665032))
* **onboarding:** implement onboarding flow and require onboarding component ([ece91a1](https://github.com/andrew001s/SandyFront/commit/ece91a177cde1ddfb6ef822d6558d380cfa2b909))
* **ServiceStartCard:** ✨ mejorar manejo de estado y autenticación de usuario ([222dc4a](https://github.com/andrew001s/SandyFront/commit/222dc4ad2cab3fbe55c36660bd13ab281c6ad458))
* **settings:** ✨ agregar soporte para tamaño de fragmento en la configuración ([6404930](https://github.com/andrew001s/SandyFront/commit/6404930d1ed1add95925ee7f2ef4c0cb6f191286))
* **settings:** ✨ normalizar proveedor TTS y agregar validaciones de configuración de voz ([9ff4ed3](https://github.com/andrew001s/SandyFront/commit/9ff4ed31838ff585ccb0c6187493ae3b1dd7edf4))
* **tour:** ✨ agregar funcionalidad de tour en el dashboard y componentes relacionados ([e054cb6](https://github.com/andrew001s/SandyFront/commit/e054cb6a97689ce81eaaf8243097849a41c687f9))
* **VTubeStudio:** ✨ implementar conexión compartida y manejo de estado para múltiples instancias ([656e48e](https://github.com/andrew001s/SandyFront/commit/656e48e1a180422fdf30d2b9c35b6ca18f995934))


### Bug Fixes

* **onboarding:** 🐛 eliminar tipo StepProps en CompletedStep ([0208c06](https://github.com/andrew001s/SandyFront/commit/0208c06c0fa688ae0f7a17c754b9164a7e2bad13))

### [0.1.7](https://github.com/andrew001s/SandyFront/compare/v0.1.5...v0.1.7) (2026-08-15)


### Features

* ✨ actualizar metadatos de SEO en las páginas de política de privacidad y términos de servicio ([de6e2e3](https://github.com/andrew001s/SandyFront/commit/de6e2e323025211c7715cfb9a62e0ad60790a30f))
* ✨ agregar carga de variables de entorno y mejorar la gestión de permisos en las acciones del servidor ([b492ddb](https://github.com/andrew001s/SandyFront/commit/b492ddb4709415d19ce83aee6e78c2f7ca58f806))
* ✨ agregar Google Tag Manager para mejorar el seguimiento de eventos ([cc80d81](https://github.com/andrew001s/SandyFront/commit/cc80d815a518a80ddbea31126638a28c8dd7da65))
* ✨ agregar integración de Microsoft Clarity para seguimiento de eventos ([8f6df2e](https://github.com/andrew001s/SandyFront/commit/8f6df2e21cb9bae2463080763db8a57a8452a838))
* ✨ expand platform support in FAQ and features ([570a768](https://github.com/andrew001s/SandyFront/commit/570a768e4bf2411e8dce9495fa6542cac7a9c1b6))
* ✨ implementar soporte para tokens efímeros en conexiones de stream y WebSocket ([535c69c](https://github.com/andrew001s/SandyFront/commit/535c69c3cf57525205aab7bc51777457e124f850))
* ✨ integrar Rollbar para el seguimiento de errores en el cliente y servidor ([2d79011](https://github.com/andrew001s/SandyFront/commit/2d790113043f222cb8ccd59be2f252e45cee92c5))
* ✨ mejorar manejo de búsqueda en FishVoiceDialog y optimizar imágenes en Support y AvatarModelListCard ([04c3d4c](https://github.com/andrew001s/SandyFront/commit/04c3d4c194accdea9e5d8a5b94e3acfb4239aeaa))
* ✨ mejorar manejo de perfil y estado en useKickAuth para manejar respuestas vacías ([4d512f9](https://github.com/andrew001s/SandyFront/commit/4d512f9d56f399661348ea5d4d109feff2eb1e1a))
* add PostHog analytics integration ([f02ea66](https://github.com/andrew001s/SandyFront/commit/f02ea66b0838641d731f2f75fe0d33feb7ef211e))
* **onboarding:** ✨ add theme and speech recognition steps, enhance onboarding UI ([a543642](https://github.com/andrew001s/SandyFront/commit/a543642605858cf404636d71657b288498215b3e))
* **onboarding:** ✨ agregar componente SandyCoreStep y soporte para configuración de personalidad VTuber ([46909fc](https://github.com/andrew001s/SandyFront/commit/46909fcbea3a1f4e5a273809b0e4abf5c47f325c))
* **onboarding:** ✨ añadir documentación oficial en pasos de onboarding ([28a99a2](https://github.com/andrew001s/SandyFront/commit/28a99a29fef0abbe1a382412a8cb8bd816f06c5d))
* **onboarding:** ✨ implementar mejoras en el flujo de onboarding y gestión de estado ([03ee957](https://github.com/andrew001s/SandyFront/commit/03ee95773bff93f398124c9eb5233a0a8b665032))
* **onboarding:** implement onboarding flow and require onboarding component ([ece91a1](https://github.com/andrew001s/SandyFront/commit/ece91a177cde1ddfb6ef822d6558d380cfa2b909))
* **tour:** ✨ agregar funcionalidad de tour en el dashboard y componentes relacionados ([e054cb6](https://github.com/andrew001s/SandyFront/commit/e054cb6a97689ce81eaaf8243097849a41c687f9))


### Bug Fixes

* **onboarding:** 🐛 eliminar tipo StepProps en CompletedStep ([0208c06](https://github.com/andrew001s/SandyFront/commit/0208c06c0fa688ae0f7a17c754b9164a7e2bad13))

### [0.1.6](https://github.com/andrew001s/SandyFront/compare/v0.1.5...v0.1.6) (2026-08-13)


### Features

* ✨ actualizar metadatos de SEO en las páginas de política de privacidad y términos de servicio ([de6e2e3](https://github.com/andrew001s/SandyFront/commit/de6e2e323025211c7715cfb9a62e0ad60790a30f))
* ✨ agregar carga de variables de entorno y mejorar la gestión de permisos en las acciones del servidor ([b492ddb](https://github.com/andrew001s/SandyFront/commit/b492ddb4709415d19ce83aee6e78c2f7ca58f806))
* ✨ agregar Google Tag Manager para mejorar el seguimiento de eventos ([cc80d81](https://github.com/andrew001s/SandyFront/commit/cc80d815a518a80ddbea31126638a28c8dd7da65))
* ✨ agregar integración de Microsoft Clarity para seguimiento de eventos ([8f6df2e](https://github.com/andrew001s/SandyFront/commit/8f6df2e21cb9bae2463080763db8a57a8452a838))
* ✨ expand platform support in FAQ and features ([570a768](https://github.com/andrew001s/SandyFront/commit/570a768e4bf2411e8dce9495fa6542cac7a9c1b6))
* ✨ implementar soporte para tokens efímeros en conexiones de stream y WebSocket ([535c69c](https://github.com/andrew001s/SandyFront/commit/535c69c3cf57525205aab7bc51777457e124f850))
* ✨ integrar Rollbar para el seguimiento de errores en el cliente y servidor ([2d79011](https://github.com/andrew001s/SandyFront/commit/2d790113043f222cb8ccd59be2f252e45cee92c5))
* ✨ mejorar manejo de perfil y estado en useKickAuth para manejar respuestas vacías ([4d512f9](https://github.com/andrew001s/SandyFront/commit/4d512f9d56f399661348ea5d4d109feff2eb1e1a))
* add PostHog analytics integration ([f02ea66](https://github.com/andrew001s/SandyFront/commit/f02ea66b0838641d731f2f75fe0d33feb7ef211e))
* **onboarding:** ✨ add theme and speech recognition steps, enhance onboarding UI ([a543642](https://github.com/andrew001s/SandyFront/commit/a543642605858cf404636d71657b288498215b3e))
* **onboarding:** ✨ añadir documentación oficial en pasos de onboarding ([28a99a2](https://github.com/andrew001s/SandyFront/commit/28a99a29fef0abbe1a382412a8cb8bd816f06c5d))
* **onboarding:** implement onboarding flow and require onboarding component ([ece91a1](https://github.com/andrew001s/SandyFront/commit/ece91a177cde1ddfb6ef822d6558d380cfa2b909))


### Bug Fixes

* **onboarding:** 🐛 eliminar tipo StepProps en CompletedStep ([0208c06](https://github.com/andrew001s/SandyFront/commit/0208c06c0fa688ae0f7a17c754b9164a7e2bad13))

### [0.1.5](https://github.com/andrew001s/SandyFront/compare/v0.1.4...v0.1.5) (2026-08-03)


### Features

* ✨Add Open Graph metadata and icons for improved SEO and social sharing ([e6f8ca9](https://github.com/andrew001s/SandyFront/commit/e6f8ca958d06b90c33314e50e4244a268b30f85e))
* ✨enhance AvatarContainer with new expression and hotkey management features ([32ff611](https://github.com/andrew001s/SandyFront/commit/32ff611b6a86e553df1b0a4d290619c82c493250))
* **conexiones:** 🔗 integra la conexión de YouTube con OAuth de Google ([df229f9](https://github.com/andrew001s/SandyFront/commit/df229f91140bb06f900b7191714fd7f6b0aa9c79))
* **icons:** ✨ agregar icono de Apple Touch y favicon en formato PNG ([ca46bac](https://github.com/andrew001s/SandyFront/commit/ca46bacff30fc79e2523d9adea8dfe1d01998d9f))
* **landing:** ✨ agregar nuevos íconos de navegación y optimizar la carga de componentes dinámicos ([e6503a7](https://github.com/andrew001s/SandyFront/commit/e6503a75c7f1fcc22d78edb53ab989b01322f4f6))
* **legal:** ✨ agregar páginas de Política de Privacidad y Términos del Servicio ([f270ad0](https://github.com/andrew001s/SandyFront/commit/f270ad0b092db5c30ae72b65ff791e23cc9daa88))
* **metadata:** ✨ actualizar el título en los metadatos para reflejar la funcionalidad de conversación con el chat ([56b1074](https://github.com/andrew001s/SandyFront/commit/56b1074cb90710a66036dfcf45a1735364bb1fcd))
* **metadata:** ✨ actualizar el título y el texto en el componente Hero para reflejar la marca Sandy Studio ([d66dc85](https://github.com/andrew001s/SandyFront/commit/d66dc85b1fc2d2946fcc622f9982a94f000b6e49))
* **páginas:** ✨ agregar nuevas páginas para VTuber con IA y Bot de chat para Twitch y Kick, incluyendo SEO y contenido relevante ([f19dc42](https://github.com/andrew001s/SandyFront/commit/f19dc427938280a0a2e46c07cb6f29428f6f1dcb))
* **support:** ✨ agregar botón de Ko-Fi y badge de Product Hunt para apoyo al proyecto ([970fa15](https://github.com/andrew001s/SandyFront/commit/970fa1599e040393091caa9fafbc580e519ff7cf))


### Bug Fixes

* **conexiones:** 🐛 muestra el avatar del canal de YouTube ([76ba819](https://github.com/andrew001s/SandyFront/commit/76ba819fb4f5720b0f91a89d4c1cc6f0a4ca29ef))
* **favicon:** 🐛 actualizar el archivo favicon.ico ([db06cf4](https://github.com/andrew001s/SandyFront/commit/db06cf4ec8457d6583359ecbb6720c086f2d51ed))
* **metadata:** 🐛 actualizar la ruta del ícono a favicon.ico ([b400fa3](https://github.com/andrew001s/SandyFront/commit/b400fa3bda49a362912c5314f4b13351e62065b1))
* **metadata:** 🐛 actualizar la verificación de Google en los metadatos ([72ff57b](https://github.com/andrew001s/SandyFront/commit/72ff57b257bddaa331bea4b7b4b94551c3b6d4d2))

### [0.1.4](https://github.com/andrew001s/SandyFront/compare/v0.1.2...v0.1.4) (2026-08-03)


### Features

* add kick integration ([15e551a](https://github.com/andrew001s/SandyFront/commit/15e551a4207b5087e421241ae58beb08e81bf07c))
* refine twitch service controls ([f6c6492](https://github.com/andrew001s/SandyFront/commit/f6c6492f5600d5e54355035c2efae6c9e6bf6385))
* **settings:** ✨ mejora la preview clicable de la voz ([fc2c4d0](https://github.com/andrew001s/SandyFront/commit/fc2c4d0e6545cc85f4b16ef1970dbe7a3dd03f32))

### [0.1.3](https://github.com/andrew001s/SandyFront/compare/v0.1.2...v0.1.3) (2026-08-02)


### Features

* add kick integration ([15e551a](https://github.com/andrew001s/SandyFront/commit/15e551a4207b5087e421241ae58beb08e81bf07c))
* refine twitch service controls ([f6c6492](https://github.com/andrew001s/SandyFront/commit/f6c6492f5600d5e54355035c2efae6c9e6bf6385))

### [0.1.2](https://github.com/andrew001s/SandyFront/compare/v0.1.1...v0.1.2) (2026-08-01)

### 0.1.1 (2026-08-01)


### Features

* :boom: Migration NextJS ([6e43f8c](https://github.com/andrew001s/SandyFront/commit/6e43f8caa99954dce5defb2d214cb7c3cdeaf7cd))
* :sparkles: Agregar configuración de Biome y actualizar scripts de lint y format en package.json ([a199f09](https://github.com/andrew001s/SandyFront/commit/a199f099646f8a75933864e09381272c14c9aeca))
* :sparkles: Agregar configuración de Lefthook, commitlint y actualizar .npmrc ([1a18e1f](https://github.com/andrew001s/SandyFront/commit/1a18e1fdd8b5db8071bec8e46139dcb138d0554f))
* :sparkles: Implement microphone control functions ([a76731a](https://github.com/andrew001s/SandyFront/commit/a76731a19b58a55d07032341974944c38b9bdc7f))
* :sparkles: Init Vite React ([7eaadb4](https://github.com/andrew001s/SandyFront/commit/7eaadb4281afae64a74a63771bd772fdb8eb4a4f))
* ✨ Actualizar plantilla .env para incluir configuraciones predeterminadas de API, Azure Speech y WebSocket ([92425e6](https://github.com/andrew001s/SandyFront/commit/92425e686d312d8851d386da77ac99f807d65a11))
* ✨ Actualizar plantilla .env y README para incluir configuración de WebSocket y Azure Speech Services ([eb110ea](https://github.com/andrew001s/SandyFront/commit/eb110ea62035d737b5d8363e431867e6966436ea))
* ✨ actualizar README.md con instrucciones de instalación y uso ([7b65f6c](https://github.com/andrew001s/SandyFront/commit/7b65f6cfb20ceb5894956ea42dc0983f1094bcbe))
* ✨ Actualizar variables de entorno en .env.template y README.md ([2b47e2e](https://github.com/andrew001s/SandyFront/commit/2b47e2e93c23b0d2037e316fa5c64314bbcb04ac))
* ✨ add shadcn UI components ([c6d64cb](https://github.com/andrew001s/SandyFront/commit/c6d64cb77efab28c033e30de6051aaf1d2977cef))
* ✨ agregar componentes de interfaz y lógica de conexión, incluyendo el manejo de estado y temas ([2ea7eec](https://github.com/andrew001s/SandyFront/commit/2ea7eecbd6a6fa186a2187a9d096461e28dcb109))
* ✨ Agregar configuración de Biome para mejorar el formateo y la linting del código ([418a294](https://github.com/andrew001s/SandyFront/commit/418a294a768fd71a5c1889c7fcadb70118d034f4))
* ✨ Agregar configuración de commitlint y lefthook para mejorar el flujo de trabajo ([ba56ed6](https://github.com/andrew001s/SandyFront/commit/ba56ed624d3fcf878a6822ff9f4d492358136b33))
* ✨ Agregar manejo de conexión y autenticación de Twitch en ConnectionCardBot ([c51547e](https://github.com/andrew001s/SandyFront/commit/c51547ed5e693c00f9e617525daf060add697ba3))
* ✨ Agregar manejo de tokens de autenticación y optimizar el contexto de autenticación de Twitch ([d36f42d](https://github.com/andrew001s/SandyFront/commit/d36f42d6b14488869bbdb5cb266122b84ed1bec3))
* ✨ agregar plantilla .env con variable VITE_API_URL para configuración de la API ([242580f](https://github.com/andrew001s/SandyFront/commit/242580f6270afdb82d38d9fa0f2358a51363e64e))
* ✨ Añadir funcionalidad de bot y contexto para el manejo de estado del bot ([fa8eeb0](https://github.com/andrew001s/SandyFront/commit/fa8eeb0e753d8cd1d5abee8b941905cad4f596fd))
* ✨ Añadir gestión de audio y chat en tiempo real mediante WebSocket ([94212b3](https://github.com/andrew001s/SandyFront/commit/94212b3df2d99f0672840bc073e794d705d65b8c))
* ✨ Añadir integración de reconocimiento de voz y funcionalidades de audio ([532d4ef](https://github.com/andrew001s/SandyFront/commit/532d4efcf5dd0d763a591eea52e8f27c61795ec9))
* ✨ Change UI components and styles for improved design and functionality ([9853e80](https://github.com/andrew001s/SandyFront/commit/9853e80c4c22c9ca6c4975518e5b7a2ac6543384))
* ✨ Integrar autenticación de Twitch y agregar rutas para el manejo de callbacks ([a21dd84](https://github.com/andrew001s/SandyFront/commit/a21dd84928b7dae56a942581d5ba619b7f398217))
* ✨ integrate Tailwind CSS and improve microphone controls ([2cba077](https://github.com/andrew001s/SandyFront/commit/2cba0775b5a1f0f143fbb35a00a3ef25feaf217c))
* ✨ Mejorar el manejo de autenticación de Twitch y agregar almacenamiento del código de autorización ([0ebd1f0](https://github.com/andrew001s/SandyFront/commit/0ebd1f0931d8d85fdd5feb66f6fc0cd175a2deee))
* ✨ Mejorar la autenticación de Twitch y optimizar el manejo de estado en los componentes ([e5731c9](https://github.com/andrew001s/SandyFront/commit/e5731c925e3cb2980169f39fa0a6129a24445b15))
* ✨ Mejorar la gestión de audio en la transcripción, añadiendo cola de reproducción ([cfdecdd](https://github.com/andrew001s/SandyFront/commit/cfdecddd494f76e8e0895930e34a11920fbaf64e))
* ✨ Refactor autenticación de Twitch y agregar contextos para manejo de estado ([bf2cdfc](https://github.com/andrew001s/SandyFront/commit/bf2cdfc8b47c8437f89e9c56731856450f63f2d7))
* ✨ Se añadió la funcionalidad de obtención de perfiles y la interfaz de perfiles. ([9c42b14](https://github.com/andrew001s/SandyFront/commit/9c42b146719ac6993f401b8a379ed9a6eb131e4a))
* add Claude skills for frontend design and react best practices ([d701d0f](https://github.com/andrew001s/SandyFront/commit/d701d0f5e4bb4be8e21843ba53185e0f624b1f8f))
* add Claude skills for frontend design and react best practices ([4d28fc6](https://github.com/andrew001s/SandyFront/commit/4d28fc6627a0689c49b2682ac93020ddcaca8d9e))
* **Dictaphone:** ✨ Añadir animación de escritura ([bb3b3db](https://github.com/andrew001s/SandyFront/commit/bb3b3dbf8781c6426055705e1eaa7e329279e9b1))
* **Dictaphone:** ✨ Formatear el contenido de la transcripción con un prefijo ([7e5580d](https://github.com/andrew001s/SandyFront/commit/7e5580dd0ef2a969d48deff3478022e7478579c8))
* **Footer:** ✨ Añadir componente Footer con enlaces a redes sociales y animaciones ([14a76f1](https://github.com/andrew001s/SandyFront/commit/14a76f19d3df51463307c4dc97233ccaeeeac2a9))
* **layout:** ✨ Actualizar título y descripción de la aplicación SandyIA ([50cce15](https://github.com/andrew001s/SandyFront/commit/50cce15ef67bd724c38c3cacb8a95f39b8fe26b9))
* **template:** ✨ Añadir plantilla para solicitudes de mejora y nuevas funcionalidades ([aec9887](https://github.com/andrew001s/SandyFront/commit/aec98878c35cfec21a8980f559ef5b99d112312b))
* **Terminal:** ✨ Añadir componente de terminal con funcionalidad de mosrtar mensajes ([c738778](https://github.com/andrew001s/SandyFront/commit/c7387785dfcb03488ffdc032152cf4eeeaaf2249))
* **Terminal:** ✨ Integrar framer-motion para animaciones en el componente de terminal ([85080d3](https://github.com/andrew001s/SandyFront/commit/85080d35f122de0c5216412717522e11e4d9985c))
* **TerminalSandy:** ✨ Añadir componente TerminalSandy para mostrar mensajes en tiempo real ([1355e10](https://github.com/andrew001s/SandyFront/commit/1355e10655ac05fcf4e7feefa632bdfa67cc15af))
* **TwitchCallback:** ✨ Añadir animaciones y mejorar la interfaz de usuario con framer-motion ([2512cc9](https://github.com/andrew001s/SandyFront/commit/2512cc92ac32a1cafff64252dc5e0138faa33570))


### Bug Fixes

* :bug: Cambiar importaciones de ProfileModel a tipo para mejorar la claridad ([afc9773](https://github.com/andrew001s/SandyFront/commit/afc977340b2666f81c5e048cae70b99fd2658ab9))
* 🐛 actualizar script de desarrollo para permitir acceso desde cualquier host ([efd303a](https://github.com/andrew001s/SandyFront/commit/efd303a2f16dd0fff2b0876696b983bbcf05354e))
* 🐛 corregir formato de bloques de código y mejorar instrucciones en README.md ([fee11dc](https://github.com/andrew001s/SandyFront/commit/fee11dcde8a2e815833a97351c7dd891eba5d0ca))
* 🐛 corregir instrucciones para iniciar el servidor de desarrollo en README.md ([731af15](https://github.com/andrew001s/SandyFront/commit/731af15dc0b23bec136e892b8b31422b5ece8669))
* 🐛 corregir la URL base del API a localhost:8000 ([07e618c](https://github.com/andrew001s/SandyFront/commit/07e618cd1e22fd65740fb28cce4b3d623bec82e6))
* ajusta paleta clara y botones morados en tarjetas de conexión ([8c9ace7](https://github.com/andrew001s/SandyFront/commit/8c9ace7e9172b5f7301f859dd63b2c21d7df10ac))
* **Chat:** 🐛 Cambiar la URL de WebSocket a la variable de entorno para mayor flexibilidad ([853a5da](https://github.com/andrew001s/SandyFront/commit/853a5dae19fba6a9421f2e1e44616779cf0a4a75))
* **layout:** 🐛 Ajustar el formato de la descripción en los metadatos ([5798cdf](https://github.com/andrew001s/SandyFront/commit/5798cdf4ac6f96df3c26c914a75d9de691bf7aa0))
* **Terminal:** 🐛 Corregir el texto de cierre del componente Terminal ([68a307a](https://github.com/andrew001s/SandyFront/commit/68a307a098be4747c45def739e8c7c83528c001f))
* **TwitchAuth:** 🐛 Corregir URI de redirección en twitchAuth.ts ([9492b08](https://github.com/andrew001s/SandyFront/commit/9492b0878af481390ea6f0e8c634a9bdd4b1c7f8))
* **TwitchAuth:** 🐛 Normalizar comillas en el archivo ([6002e84](https://github.com/andrew001s/SandyFront/commit/6002e848596e2420b3d2c9758d847303d867a877))
