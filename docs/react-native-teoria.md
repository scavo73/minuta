# React Native - Teoría técnica Minuta

## 1. Fundamentos de React Native

React Native permite construir aplicaciones móviles usando React y JavaScript/TypeScript, pero no renderiza HTML dentro de un WebView. No es una web incrustada: los componentes de React Native se convierten en elementos nativos de la plataforma.

Componentes como `View`, `Text` o `Pressable` se traducen a vistas nativas de iOS y Android. Por ejemplo, `View` funciona como un contenedor visual, `Text` como un elemento de texto nativo y `Pressable` como una superficie interactiva que responde a pulsaciones.

La diferencia principal frente a una app nativa pura es que, en una app nativa tradicional, la interfaz y la lógica suelen escribirse directamente con Swift/Objective-C en iOS o Kotlin/Java en Android. En React Native, gran parte de la lógica y de la UI se escribe una sola vez con TypeScript y React, y luego se ejecuta sobre vistas nativas.

La ventaja principal es poder compartir lógica, estructura de interfaz y comportamiento entre plataformas usando JavaScript/TypeScript. Esto acelera el desarrollo y facilita mantener una base de código común.

La limitación principal aparece cuando una app necesita comportamiento muy específico de una plataforma, acceso avanzado a APIs nativas o integraciones que no están cubiertas por librerías existentes. En esos casos puede hacer falta escribir código nativo.

## 2. Arquitectura: JS thread y UI thread

En React Native existe un hilo de JavaScript, conocido como JavaScript thread o JS thread. Ahí se ejecuta la lógica escrita en JavaScript/TypeScript: estado, render de React, handlers de eventos, llamadas de negocio y coordinación general de la app.

También existe el hilo de UI nativo, gestionado por iOS o Android. Este hilo se encarga de pintar la interfaz, procesar animaciones nativas, responder al sistema operativo y mantener la experiencia visual fluida.

Si el JS thread se bloquea con una tarea pesada, la app puede seguir mostrando parte de la UI, pero la interacción que depende de JavaScript se retrasa. Por ejemplo, una pulsación puede tardar en responder, una lista puede sentirse lenta o una actualización de pantalla puede llegar tarde.

Esto afecta al rendimiento percibido porque el usuario no mide solo si la app funciona, sino si responde con rapidez. Una app puede no estar rota técnicamente y aun así sentirse pesada si el JS thread está ocupado demasiado tiempo.

Debemos evitar bloquear JavaScript con tareas largas, cálculos intensivos, bucles grandes, parsing pesado, transformaciones masivas de datos o trabajo síncrono innecesario durante interacciones. Ese tipo de tareas conviene dividirlas, diferirlas, optimizarlas o moverlas a mecanismos más adecuados si el proyecto lo requiere.

## 3. Metro Bundler

Metro es el empaquetador de JavaScript usado por React Native. Su trabajo es leer el código fuente del proyecto, resolver imports, transformar TypeScript/JSX y generar el bundle que la app puede ejecutar.

En React Native, Metro cumple un papel parecido al que otros bundlers tienen en aplicaciones web, pero adaptado al entorno móvil. Se encarga de servir el código durante desarrollo y de preparar el JavaScript que se carga en la app.

Cuando escribimos componentes, pantallas o utilidades, Metro analiza esas dependencias y las agrupa en un paquete JavaScript. También aplica transformaciones necesarias para que el código moderno pueda ejecutarse correctamente en el entorno de React Native.

Metro aparece cuando ejecutamos `npx expo start` porque Expo lo usa como servidor de desarrollo. Desde ahí se sirven los bundles a Expo Go, a un emulador, a un simulador o a un dispositivo físico.

## 4. Expo Go vs Development Build

Expo Go es una aplicación ya instalada en el dispositivo que permite abrir proyectos Expo rápidamente durante desarrollo. Sirve para probar cambios sin compilar una app nativa propia en cada iteración.

Su ventaja principal es la velocidad: se ejecuta `npx expo start`, se escanea un QR o se abre el proyecto en el emulador, y se puede empezar a desarrollar con muy poca fricción.

La limitación de Expo Go es que solo incluye un conjunto predefinido de módulos nativos. Si el proyecto necesita una librería con código nativo personalizado que no está incluida en Expo Go, esa librería no funcionará ahí directamente.

Un Development Build es una versión propia de la app creada para desarrollo. Tiene el runtime de Expo, pero también incluye los módulos nativos específicos que el proyecto necesita.

En proyectos reales se acaba usando Development Build cuando aparecen módulos nativos personalizados, integraciones avanzadas o configuración nativa propia. Permite mantener una experiencia de desarrollo cómoda, pero con una app adaptada al proyecto.

## 5. Expo Router y navegación

Expo Router es el sistema de navegación de Expo basado en archivos. Permite definir rutas y pantallas usando la estructura de carpetas del proyecto.

Que use file-based routing significa que los archivos dentro de `app/` representan rutas de navegación. En lugar de declarar manualmente todas las pantallas en un único navegador, la estructura del filesystem describe parte de la navegación.

La carpeta `app/` representa la raíz de navegación de la aplicación. Cada archivo o carpeta dentro de ella puede convertirse en una ruta o agrupar rutas relacionadas.

La carpeta `app/(tabs)/` representa un grupo de rutas. Los paréntesis indican un route group: sirve para organizar pantallas sin añadir ese segmento al path visible. En Minuta se usa para agrupar las pantallas principales que viven dentro de las pestañas.

Los archivos `_layout.tsx` definen la estructura de navegación para un nivel concreto. Por ejemplo, `app/_layout.tsx` puede definir un `Stack` principal, mientras que `app/(tabs)/_layout.tsx` define las pestañas internas.

## 6. Navegación en Minuta

Minuta usa navegación principal por pestañas:

- Home: dashboard que mezcla notas, tareas e ideas.
- Notas: listado de notas de texto.
- Tareas: listado de tareas simples.
- Ideas: listado de ideas rápidas.

Las tabs son la navegación principal entre secciones estables de la app. Permiten cambiar rápidamente entre áreas importantes sin perder el contexto general.

El stack sirve para navegación jerárquica entre pantallas. Por ejemplo, desde un listado se puede abrir el detalle de una nota o tarea, y después volver atrás.

Un modal es una pantalla temporal que aparece encima del flujo principal. Encaja bien para crear contenido, editar algo puntual o lanzar acciones rápidas sin convertirlo en una sección permanente.

En Minuta usamos tabs para las secciones principales porque Home, Notas, Tareas e Ideas son áreas de uso frecuente. Usaremos stack para pantallas de detalle, como una nota o una tarea concreta. Usaremos modales para crear nuevo contenido cuando convenga mantener al usuario dentro de su contexto actual.

## 7. Sistemas de diseño

### Gluestack UI

Gluestack UI tiene una filosofía más flexible y personalizable. Permite construir una identidad visual propia sin quedar tan atado a una estética predeterminada.

Encaja mejor con una interfaz basada en tarjetas, colores suaves, bordes grandes y un diseño más libre. Para Minuta, esto es importante porque la app busca sentirse como un espacio personal de captura y organización, no como una interfaz genérica.

### React Native Paper

React Native Paper está basado en Material Design. Es muy rápido para construir interfaces estándar y ofrece componentes listos para casos comunes.

Es una buena opción cuando se quiere una estética Android/Material más convencional, consistente y reconocible desde el inicio.

Decisión: elegimos Gluestack UI para Minuta porque la app necesita una identidad visual propia: tarjetas grandes, colores suaves, bordes redondeados, dashboard mezclado y una estética menos genérica que Material Design.

## 8. Estado actual del proyecto

El setup base ya está creado.

Expo Router ya está configurado.

La navegación inicial tiene Home, Notas, Tareas e Ideas.

La librería UI elegida para la siguiente fase será Gluestack UI.

## Sistema de tema en Minuta

Los tokens visuales de Minuta están definidos en `constants/theme.ts`. Ahí viven los colores de modo claro, modo oscuro, tarjetas por tipo de contenido, escala tipográfica, espaciados y radios de borde.

El hook `useMinutaTheme` usa `useColorScheme` de React Native para detectar si el sistema está en modo claro u oscuro, y devuelve el tema activo junto con `colorScheme` e `isDark`.

Esto evita duplicar estilos base en cada pantalla, porque las pantallas pueden leer los mismos tokens y aplicar colores, tamaños y espaciados de forma consistente.

Gluestack UI queda preparado como base para crear componentes reutilizables en las siguientes fases del proyecto.

## Modelado de datos con TypeScript

`BaseNote` contiene los campos comunes a todos los contenidos de Minuta: `id`, `title`, `createdAt` y `updatedAt`.

`Note` e `IdeaNote` extienden `BaseNote` para añadir los campos propios de cada tipo de contenido. Una nota de texto usa `content` y una idea usa `tags` y `color`. Las tareas usan el modelo `Task`, más simple, porque no necesitan título ni heredar de `BaseNote`.

`AnyNote` es una unión de los tres tipos principales. Esto permite trabajar con colecciones mixtas, como el dashboard Home, manteniendo seguridad de tipos.

Los type guards permiten saber qué tipo concreto tenemos en tiempo de ejecución. Por ejemplo, `'isCompleted' in item && 'text' in item` identifica una `Task`, porque las tareas simples tienen texto y estado done/undone.

Con estos guards, TypeScript puede estrechar el tipo dentro de cada rama y permitir acceso seguro a los campos específicos de notas, tareas o ideas.

## Gestión de estado

`useState` sirve para manejar estado local dentro de un componente. Es útil para valores pequeños y cercanos a la UI, como un campo temporal o un toggle interno.

Context API permite compartir estado entre componentes sin pasarlo por props en cada nivel, pero puede generar re-renders amplios si se usa para datos que cambian con frecuencia. También puede llevar a providers anidados cuando la app crece.

Zustand permite crear estado global simple sin providers manuales. El store se define como una función reutilizable y los componentes pueden suscribirse solo a las partes del estado que necesitan.

En Minuta usamos Zustand para centralizar notas, tareas e ideas. En este paso el estado vive solo en memoria; la persistencia con AsyncStorage se añadirá más adelante.

El store ya se conecta con las pantallas principales: Home mezcla todos los contenidos, mientras Notas, Tareas e Ideas leen solo su parte del estado. Los datos demo son temporales y se usan solo para validar navegación y renderizado. La persistencia llegará después con AsyncStorage.

Las tarjetas se separan en componentes reutilizables dentro de `components/items`. Esto evita duplicar UI entre Home y las pantallas específicas. Cada tipo de contenido tiene una representación visual propia: notas de texto, tareas simples e ideas con etiquetas.

## Rendimiento en listas

`FlatList` funciona bien para listas normales y es una opción estándar en React Native. En listas largas, especialmente si los elementos son complejos, puede aparecer pérdida de rendimiento por el coste de medir, renderizar y reciclar vistas.

FlashList mejora el reciclaje de elementos y trabaja con una estimación de tamaño para calcular el layout antes de renderizar toda la lista. La propiedad `estimatedItemSize` ayuda a anticipar cuánto espacio ocupará cada item y reduce trabajo innecesario durante el scroll.

En Minuta usamos FlashList porque Home mezcla varios tipos de tarjetas y puede crecer mucho con notas, tareas e ideas. Las pantallas específicas también usan FlashList para mantener un patrón de listas consistente desde el inicio.

## Formularios y validación

Zod valida los datos antes de guardarlos en el store. Cada tipo de contenido tiene un schema propio para comprobar campos obligatorios, mínimos de texto y estructura de datos.

El formulario cambia según el tipo de contenido seleccionado: una nota pide título y contenido, una tarea pide solo el texto de la tarea, y una idea pide título, etiquetas y color.

`KeyboardAvoidingView` evita que el teclado tape los campos mientras se escribe, ajustando el comportamiento entre iOS y Android.

Los errores de validación se muestran cerca del campo afectado para que el usuario pueda corregirlos sin perder contexto.

Minuta usa tareas simples tipo todo. Una tarea no es una checklist con título ni contiene items internos: solo tiene texto, estado `done/undone`, `createdAt` y `updatedAt`. El modelo `Task` permite marcar una tarea como hecha o pendiente directamente, lo que simplifica la creación rápida desde el modal.

Home usa un widget fijo de tareas arriba del contenido principal. Las tareas son acciones rápidas que pueden marcarse como `done/undone` directamente desde ese widget. Notas e ideas se muestran debajo como contenido informativo, sin mezclar las tareas como tarjetas normales en la lista inferior.

## Imágenes en notas

Las notas pueden tener `imageUri` opcional. La imagen se selecciona desde la galería con `expo-image-picker` y, en esta fase, se guarda solo la URI local que devuelve el dispositivo.

No se sube la imagen a servidor, no se copia a otra carpeta y no hay backend asociado todavía. `NoteCard` muestra la imagen cuando `imageUri` existe, por eso aparece tanto en la pantalla Notas como en Home.

En Home las cards tienen una variante visual propia. Las notas sin imagen no muestran placeholder ni reservan espacio vacío. Las imágenes de notas en Home usan formato cuadrado mediante `aspectRatio: 1`.

Home usa un masonry grid simple de dos columnas para notas e ideas. Las tareas quedan fuera del masonry porque tienen su propio widget superior. Las notas con imagen pesan más al repartir los elementos para equilibrar columnas, mientras que en las pantallas específicas se mantiene FlashList.

## Persistencia local con AsyncStorage

Minuta guarda datos solo en el dispositivo. En esta fase no usamos backend, Firebase ni sincronización externa.

AsyncStorage guarda texto serializado, por lo que Zustand `persist` se encarga de guardar y recuperar automáticamente el store local. El almacenamiento usa la clave `minuta-storage`.

Las fechas necesitan una rehidratación especial: al guardarse pasan de `Date` a string, así que al recuperar notas, tareas e ideas se convierten de nuevo con `new Date(...)`. Esto permite que ordenaciones y formatos como `updatedAt.getTime()` sigan funcionando.

`imageUri` se guarda como una referencia local a la imagen seleccionada. No se sube a servidor y no se copia a otra carpeta en esta fase.

Limitaciones: no hay sincronización entre dispositivos, no hay cifrado fuerte y si se borra la app se pueden perder los datos locales.

## Pantalla de detalle y acciones destructivas

Se usa una ruta genérica `app/item/[id].tsx` porque Home mezcla notas, tareas e ideas. Así evitamos duplicar una pantalla de detalle por cada tipo de contenido.

El detalle detecta el tipo concreto con type guards: `isTextNote`, `isTask` e `isIdeaNote`. Cada tipo muestra la información que le corresponde.

`Alert.alert` evita borrar contenido por accidente antes de ejecutar una acción destructiva. `expo-haptics` aporta feedback táctil en acciones importantes, como eliminar un elemento o alternar una tarea desde el detalle.

`deleteItem` simplifica borrar cualquier tipo desde una sola pantalla, buscando el id en notas, tareas e ideas.

## Búsqueda local

La búsqueda se hace en memoria sobre el estado de Zustand. No hay backend, Firebase ni consultas remotas.

Cada pestaña filtra por los campos relevantes: Notas busca por `title` y `content`, Tareas busca por `text`, e Ideas busca por `title` y `tags`.

Home busca solo en notas e ideas porque las tareas tienen su widget propio arriba. El filtrado se actualiza en tiempo real con estado local mientras el usuario escribe.

## Navegación sin headers nativos

Minuta oculta los headers nativos del Stack y de los Tabs para evitar saltos visuales verticales entre pantallas. Cada pantalla controla su propio espacio seguro con `SafeAreaView`, dejando solo el margen necesario para notch, status bar y navegación inferior.

La acción de creación ya no vive en el header superior. El botón `+` se coloca como acción central en la navegación inferior, entre Notas y Tareas, y abre el modal `nueva-nota` sin cambiar a una pestaña vacía.
