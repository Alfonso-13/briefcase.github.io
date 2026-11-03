# Briefcase · Portfolio & My Universe

Portafolio web configurable y proyecto de presentación técnica que reúne experiencia, formación y conocimientos profesionales en tres secciones detalladas: Presentation, Education y Knowledge. Una experiencia 3D independiente, **My Universe**, transforma ese contenido en un sistema solar profesional: Presentation vive en el núcleo solar, Education es un cinturón continuo y Knowledge se distribuye como una red exterior de dominios, clusters y nodos tecnológicos.

El proyecto está construido como una aplicación estática para GitHub Pages. El contenido se mantiene en archivos JSON, sin recompilar componentes para actualizar textos o evidencias.

## Qué demuestra

- Angular 22 e Ionic 9 sobre Node.js 26 LTS.
- Un sistema orbital WebGL independiente con Three.js, rotación manual, órbitas 3D, cinturón educativo, hover luminoso y niveles semánticos.
- Ambientación desacoplada del mapa con asteroides, cometas y estrellas fugaces de trayectorias diagonales aleatorias, además de un púlsar de aparición única.
- Navegación adaptable para escritorio, móvil, rueda y gestos táctiles.
- Navegación directa entre Presentation, Education y Knowledge, con estado visible y controles accesibles.
- Identidad configurable en presentación, encabezado y watermark permanente del footer.
- Tema claro/oscuro, metadatos configurables y contenido desacoplado del código.
- Interfaz bilingüe EN/ES con inglés predeterminado y preferencia persistida en `localStorage`.
- Build estático reproducible para GitHub Pages.
- Scripts de NVM y configuración de depuración para VS Code.

## My Universe

El icono de mundo-red que gira en el header abre My Universe sobre el portafolio sin convertirlo en una cuarta sección. Presentation, Education y Knowledge continúan disponibles en la navegación principal; cerrar la experiencia regresa exactamente a la sección activa.

La visualización usa cuatro niveles:

1. **System**: muestra núcleo, órbita Education y red exterior Knowledge.
2. **Orbit**: permite seleccionar Education o un dominio profesional.
3. **Cluster**: revela stacks y áreas de práctica alrededor de cada dominio.
4. **Node**: cada tecnología presenta experiencia y, cuando están configurados, proyectos y repositorios.

El núcleo y la órbita Education permiten volver a sus secciones con una transición fade. Education se representa sólo mediante el anillo completo y luminoso, sin satélites propios; su etiqueta viaja con el cinturón. Cada dominio de Knowledge usa su propia órbita 3D, color y brillo aditivo. Los sistemas ocupan capas radiales separadas para evitar colisiones; sus clusters orbitan localmente al dominio y las tecnologías orbitan al cluster. Todos los nodos permanecen visibles desde la vista general.

El núcleo usa una superficie solar procedural con glow, pulsos y pequeñas llamaradas. Los eventos ambientales viven en una capa de fondo fija a cámara: no rotan con el mapa, no aparecen dentro de las vistas enfocadas y sólo se eliminan después de abandonar completamente el encuadre. El púlsar es un easter egg de ocho segundos que aparece una sola vez, en un momento aleatorio entre los minutos 15 y 30 de permanencia en la vista general.

El control Pause/Resume detiene o reanuda el sistema. Seleccionar un dominio pausa automáticamente, centra el elemento y conserva el panel abierto con sus clusters, tecnologías y experiencia completa. El zoom libre de rueda está deshabilitado para mantener estable la composición; la profundidad cambia únicamente mediante la navegación semántica entre niveles.

## Navegación e identidad

Las pestañas superiores cambian directamente entre las tres secciones y las flechas laterales permiten recorrerlas en orden. En Education y Knowledge, la rueda, el gesto vertical, `↑/↓` y el indicador de puntos recorren las tarjetas internas sin mezclar esos controles con la navegación principal. Knowledge divide automáticamente los dominios extensos en tarjetas de hasta seis tecnologías para evitar contenido cortado o scroll interno excesivo.

El activo principal de marca se define en `site.json` y puede reutilizarse en header y presentación. El footer obtiene su firma y enlace desde la misma configuración, sin identidades codificadas en los componentes.

El selector `EN/ES` del header cambia toda la interfaz y los textos principales. La selección se guarda con la clave `briefcase-language`; cuando no existe una preferencia previa, inicia en inglés.

## Ejecutar localmente

Requiere NVM para Windows. El proyecto fija Node.js **26.13.0** en `.nvmrc`.

```powershell
git clone https://github.com/Alfonso-13/briefcase.github.io.git
cd briefcase.github.io
nvm list
nvm install 26.13.0 64   # sólo si no aparece instalada
.\run-local.ps1
```

El script selecciona la versión indicada por `.nvmrc`, fuerza el ejecutable correcto aunque el `PATH` conserve otra versión, instala dependencias cuando faltan y levanta la aplicación en [http://localhost:8100](http://localhost:8100).

Modos adicionales:

```powershell
.\run-local.ps1 -Production # servidor local con configuración de producción
.\run-local.ps1 -Verify     # lint, pruebas y build
.\run-local.ps1 -Network    # acceso desde otros dispositivos de la red
```

## Configurar contenido

El repositorio incluye configuración ficticia y reutilizable en `src/assets/config.example/`. En la primera ejecución, `npm run prepare:config` la copia a `src/assets/config/` sólo cuando todavía no existe una configuración local. Esa carpeta queda ignorada por Git para evitar publicar identidad o datos profesionales por accidente.

Los archivos editables locales son:

- `site.json`: identidad, contacto, perfiles públicos y pie de página.
- `navigation.json`: secciones visibles y orden.
- `theme.json`: paletas y modo predeterminado.
- `seo.json`: título, descripción, canonical y Open Graph.
- `sections/`: presentación, formación y mundo de conocimiento.

La formación enlaza únicamente perfiles públicos configurados (LinkedIn Certifications, Skillsoft, HackerRank, Udemy y Codewars). Los datos profesionales de presentación y experiencia se mantienen en los JSON; los PDF de CV/résumé no se publican como assets del sitio.

Los iconos originales de Knowledge permanecen en `src/assets/img/Skills/`. Las copias transparentes y recortadas usadas por el tema viven en `src/assets/img/SkillsTransparent/`; se regeneran con `scripts/remove-image-background.ps1` y su fondo visual se aplica desde CSS mediante los tokens de la paleta activa. Los logos, retratos y archivos de marca personales deben mantenerse fuera de Git.

La guía de arquitectura, contrato JSON, comandos, depuración, build y publicación está en [DEV.md](DEV.md).

## Modelo de ramas

| Rama | Contenido | Regla |
| --- | --- | --- |
| `main` | Código fuente, documentación, pruebas, scripts y configuración ficticia de `src/assets/config.example/` | No contiene configuración personal ni identidad privada. |
| `gh-pages` | Resultado generado de `www/`, incluida la configuración local publicada como `assets/config/` | No se edita a mano ni funciona como fuente del proyecto. |

El flujo esperado es cambiar y validar en `main`, generar `www/` y publicar ese resultado en `gh-pages`. La publicación no ocurre automáticamente al compilar y debe ejecutarse sólo después de revisar el diff y autorizar el cambio remoto:

```powershell
npm run verify
npm run deploy:pages
```

`deploy:pages` crea el build y publica el contenido navegable de `www/browser/` antes de invocar `angular-cli-ghpages`; por ello no debe usarse para una validación local ordinaria.

## Alcance

Briefcase es un portafolio estático. No incluye backend, autenticación ni persistencia remota. Los proyectos y repositorios sólo se muestran cuando existen en la configuración; la aplicación no inventa evidencias ausentes.

## Licencia

El código fuente se distribuye bajo [licencia MIT](LICENSE). La identidad personal, biografías, CV, fotografías, logotipos y registros profesionales quedan fuera de ese permiso reutilizable y deben reemplazarse en cualquier fork. Consulta [ASSETS-LICENSE.md](ASSETS-LICENSE.md) para el alcance de contenido y recursos.
