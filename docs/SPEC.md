# Directorio Telefónico ITSON

## 1. Objetivo

Desarrollar una aplicación web para la consulta y administración de las extensiones telefónicas del Instituto Tecnológico de Sonora (ITSON).

El sistema debe permitir:

- Consultar extensiones telefónicas de forma rápida.
- Buscar por extensión, persona, área, puesto o ubicación.
- Administrar extensiones.
- Administrar personas y áreas.
- Administrar ubicaciones físicas.
- Asignar una o varias personas a una extensión.
- Registrar extensiones sin persona asignada.
- Mantener historial de cambios.
- Importar y actualizar información mediante Excel/CSV.
- Generar posteriormente directorios imprimibles y códigos QR.

La aplicación debe diseñarse para poder crecer posteriormente a otros campus del ITSON.

---

# 2. Stack tecnológico

Utilizar preferentemente:

- Frontend: React + Vite
- Lenguaje frontend: TypeScript
- Backend: ASP.NET Core Web API
- Framework: .NET 8
- Base de datos: SQL Server
- API: REST
- Autenticación: JWT o mecanismo institucional equivalente
- ORM: Entity Framework Core
- Validación: FluentValidation o equivalente
- Documentación API: Swagger/OpenAPI

El código debe ser modular, mantenible y preparado para producción.

---

# 3. Arquitectura

Usar una arquitectura desacoplada:

```text
React + Vite
     |
     | HTTP/REST
     v
ASP.NET Core Web API
     |
     v
Entity Framework Core
     |
     v
SQL Server
```

Se recomienda organizar el backend por capas:

```text
API
Application
Domain
Infrastructure
```

El frontend debe separar:

```text
pages
components
services
hooks
types
layouts
utils
```

---

# 4. Conceptos principales

No almacenar toda la información en una sola tabla.

El sistema debe distinguir entre:

- Campus
- Edificio
- Ubicación
- Área
- Puesto
- Persona
- Extensión
- Asignación de extensión
- Usuario
- Historial de cambios

Una extensión no necesariamente pertenece a una sola persona.

Ejemplos:

```text
Extensión 5413
 ├── Ana Lucia Félix Rochin
 ├── Olivia María Pineda S.
 ├── Área: Tutorías y Becas
 └── Ubicación: Cubículo 9
```

También deben existir extensiones sin persona:

```text
Extensión 5215
 └── SITE
```

---

# 5. Modelo de datos

## 5.1 Campus

```text
Campus
-------------------------
Id
Nombre
Clave
Activo
CreatedAt
UpdatedAt
```

Ejemplos:

- Navojoa
- Obregón
- Guaymas

La implementación inicial puede contener solamente el campus correspondiente a los datos proporcionados, pero debe quedar preparada para múltiples campus.

---

## 5.2 Edificio

```text
Edificio
-------------------------
Id
CampusId
Nombre
Clave
Descripcion
Activo
CreatedAt
UpdatedAt
```

Relación:

```text
Campus 1 ─── N Edificios
```

---

## 5.3 Ubicación

```text
Ubicacion
-------------------------
Id
EdificioId
Tipo
Nombre
Numero
Piso
Descripcion
Activo
CreatedAt
UpdatedAt
```

Tipos sugeridos:

```text
Oficina
Cubículo
Aula
Ventanilla
Laboratorio
SITE
Área
Otro
```

La combinación de edificio + ubicación debe permitir diferenciar casos como:

```text
Cubículo 1
Cubículo 1
```

cuando pertenecen a diferentes espacios físicos.

---

## 5.4 Área

```text
Area
-------------------------
Id
Nombre
Descripcion
AreaPadreId
Activo
CreatedAt
UpdatedAt
```

`AreaPadreId` es opcional y permite jerarquías:

```text
Informática y Comunicaciones
 ├── Soporte Técnico
 ├── Sistemas de Información
 ├── SITE
 └── CETIN
```

---

## 5.5 Puesto

```text
Puesto
-------------------------
Id
Nombre
Descripcion
Activo
CreatedAt
UpdatedAt
```

Ejemplos:

- Director
- Asistente
- Coordinador
- Administrador
- Analista de Sistemas
- Supervisor
- Responsable

---

## 5.6 Persona

```text
Persona
-------------------------
Id
Nombre
ApellidoPaterno
ApellidoMaterno
NombreCompleto
Correo
PuestoId
AreaId
Activo
CreatedAt
UpdatedAt
```

No depender exclusivamente de `NombreCompleto` para búsquedas.

El campo puede almacenarse o generarse, pero los componentes del nombre deben mantenerse separados.

---

## 5.7 Extensión

```text
Extension
-------------------------
Id
Numero
Tipo
Estado
Observaciones
Activo
CreatedAt
UpdatedAt
```

Estados sugeridos:

```text
Activa
Inactiva
SinAsignar
Mantenimiento
Reservada
```

`Numero` debe ser único.

Ejemplo:

```text
5125
```

Debe existir una restricción única para evitar duplicados.

---

## 5.8 AsignacionExtension

Esta es una tabla fundamental.

```text
AsignacionExtension
-------------------------
Id
ExtensionId
PersonaId
AreaId
UbicacionId
FechaInicio
FechaFin
EsPrincipal
Activo
Observaciones
CreatedAt
UpdatedAt
```

Permite:

- Una extensión sin persona.
- Una extensión asignada a una persona.
- Una extensión compartida por varias personas.
- Registrar cambios históricos.
- Asociar una extensión con área y ubicación.

Ejemplo:

```text
5413
 ├── Ana Lucia Félix Rochin
 ├── Olivia María Pineda S.
 ├── Tutorías y Becas
 └── Cubículo 9
```

---

## 5.9 Usuario

```text
Usuario
-------------------------
Id
Nombre
Correo
PasswordHash
Rol
Activo
CreatedAt
UpdatedAt
```

Roles iniciales:

```text
Administrador
Capturista
Consulta
```

Preferir integración con autenticación institucional si posteriormente se dispone de ella.

---

## 5.10 HistorialCambios

```text
HistorialCambios
-------------------------
Id
Entidad
EntidadId
Accion
ValoresAnteriores
ValoresNuevos
UsuarioId
Fecha
```

Acciones:

```text
CREAR
ACTUALIZAR
DESACTIVAR
ASIGNAR
DESASIGNAR
IMPORTAR
```

Los valores anteriores y nuevos pueden almacenarse como JSON.

---

# 6. Reglas de negocio

## Extensiones

1. Una extensión debe ser única.
2. Una extensión puede existir sin persona.
3. Una extensión puede tener múltiples personas.
4. Una persona puede tener más de una extensión si el negocio lo requiere.
5. No eliminar físicamente una extensión que tenga historial.
6. Preferir desactivación lógica.
7. Toda modificación relevante debe quedar registrada en historial.

## Personas

1. Una persona puede estar asociada a un área.
2. Una persona puede no tener extensión.
3. Una persona puede compartir extensión con otra persona.
4. Una persona inactiva no debe aparecer como resultado principal salvo que se solicite incluir inactivos.

## Ubicaciones

1. Una ubicación debe pertenecer a un edificio cuando sea aplicable.
2. El nombre "Cubículo 1" no debe considerarse globalmente único.
3. Debe poder existir una ubicación sin extensión.

---

# 7. Búsqueda

El buscador principal debe aceptar texto libre.

Endpoint:

```http
GET /api/directorio/search?q={texto}
```

Debe buscar en:

- Número de extensión
- Nombre de persona
- Apellido paterno
- Apellido materno
- Nombre completo
- Área
- Puesto
- Ubicación
- Edificio
- Campus
- Observaciones

Ejemplos:

```text
calidad
```

Debe encontrar las extensiones relacionadas con Calidad Académica.

```text
5125
```

Debe encontrar:

```text
Dulce Guadalupe Corral Leyva
Calidad Académica
Extensión 5125
```

```text
Deportes
```

Debe encontrar las extensiones relacionadas con Deportes.

---

# 8. Resultados de búsqueda

Cada resultado debe mostrar como mínimo:

```text
Extensión
Persona(s)
Área
Puesto
Ubicación
Estado
```

Ejemplo:

```text
┌─────────────────────────────────────────────┐
│ Calidad Académica                           │
│                                             │
│ Dulce Guadalupe Corral Leyva                │
│                                             │
│ Extensión: 5125                             │
│                                             │
│ ● Activa                                    │
└─────────────────────────────────────────────┘
```

Cuando existan varias personas:

```text
Extensión 5413

Personas:
- Ana Lucia Félix Rochin
- Olivia María Pineda S.

Área:
Tutorías y Becas

Ubicación:
Cubículo 9
```

---

# 9. Frontend

## 9.1 Pantalla pública/principal

Ruta:

```text
/
```

Debe contener:

- Logotipo/nombre institucional.
- Buscador grande.
- Resultados.
- Filtros.
- Acceso al panel administrativo si el usuario está autenticado.

Filtros:

```text
Campus
Área
Edificio
Ubicación
Estado
```

---

## 9.2 Detalle de extensión

Ruta:

```text
/extensions/{id}
```

Mostrar:

- Número.
- Estado.
- Personas.
- Área.
- Puesto.
- Ubicación.
- Edificio.
- Campus.
- Observaciones.

Acciones administrativas:

```text
Editar
Asignar persona
Cambiar ubicación
Desactivar
Ver historial
```

---

# 10. Panel administrativo

Ruta:

```text
/admin
```

Dashboard con indicadores:

```text
Total de extensiones
Extensiones activas
Extensiones sin asignar
Extensiones inactivas
Total de personas
Total de áreas
```

También:

```text
Cambios recientes
```

---

# 11. Módulo de extensiones

Ruta:

```text
/admin/extensions
```

Tabla:

```text
Extensión
Área
Persona
Ubicación
Estado
Acciones
```

Acciones:

```text
Ver
Editar
Asignar
Desactivar
Historial
```

Debe existir paginación, ordenamiento y búsqueda.

---

# 12. Módulo de personas

Ruta:

```text
/admin/personas
```

CRUD:

```text
Crear
Consultar
Editar
Desactivar
```

Campos:

```text
Nombre
Apellido paterno
Apellido materno
Correo
Puesto
Área
Activo
```

---

# 13. Módulo de áreas

Ruta:

```text
/admin/areas
```

CRUD de áreas y subáreas.

Debe soportar:

```text
Área principal
 └── Subárea
```

---

# 14. Módulo de ubicaciones

Ruta:

```text
/admin/ubicaciones
```

CRUD de:

- Campus
- Edificios
- Ubicaciones

---

# 15. Importación masiva

Debe existir:

```text
/admin/importar
```

Formatos:

```text
.xlsx
.csv
```

Flujo:

```text
Seleccionar archivo
       ↓
Analizar
       ↓
Validar
       ↓
Mostrar vista previa
       ↓
Detectar duplicados/problemas
       ↓
Confirmar importación
       ↓
Guardar
       ↓
Registrar historial
```

No importar directamente sin mostrar una vista previa.

---

# 16. Formato de importación

Proponer como formato normalizado:

```text
Campus
Edificio
Area
Subarea
TipoUbicacion
Ubicacion
PersonaNombre
PersonaApellidoPaterno
PersonaApellidoMaterno
Puesto
Extension
Estado
Observaciones
```

Ejemplo:

```text
Navojoa | Edificio A | Calidad Académica | | Cubículo | 5 |
Dulce Guadalupe | Corral | Leyva | | 5125 | Activa |
```

El importador debe detectar:

- Extensiones duplicadas.
- Personas posiblemente duplicadas.
- Campos obligatorios faltantes.
- Extensiones con múltiples personas.
- Ubicaciones ambiguas.
- Registros que actualizarán información existente.

---

# 17. API REST

## Extensiones

```http
GET    /api/extensions
GET    /api/extensions/{id}
POST   /api/extensions
PUT    /api/extensions/{id}
DELETE /api/extensions/{id}
```

## Directorio

```http
GET /api/directorio/search?q={query}
```

## Personas

```http
GET    /api/personas
GET    /api/personas/{id}
POST   /api/personas
PUT    /api/personas/{id}
DELETE /api/personas/{id}
```

## Áreas

```http
GET    /api/areas
GET    /api/areas/{id}
POST   /api/areas
PUT    /api/areas/{id}
DELETE /api/areas/{id}
```

## Ubicaciones

```http
GET    /api/ubicaciones
POST   /api/ubicaciones
PUT    /api/ubicaciones/{id}
DELETE /api/ubicaciones/{id}
```

## Asignaciones

```http
POST   /api/extensions/{id}/asignaciones
DELETE /api/extensions/{id}/asignaciones/{asignacionId}
```

## Historial

```http
GET /api/{entidad}/{id}/historial
```

## Importación

```http
POST /api/importaciones
GET  /api/importaciones/{id}
```

---

# 18. Respuesta estándar de API

Usar una estructura consistente.

Éxito:

```json
{
  "success": true,
  "data": {},
  "message": null
}
```

Error:

```json
{
  "success": false,
  "data": null,
  "message": "La extensión ya existe.",
  "errors": []
}
```

Los endpoints deben seguir principios RESTful.

---

# 19. Seguridad

Implementar:

- Autenticación.
- Autorización por roles.
- Validación de entrada.
- Protección contra inyección SQL mediante EF Core.
- Logs.
- Auditoría de cambios.
- No almacenar contraseñas en texto plano.
- Desactivación lógica.
- CORS configurado explícitamente.

---

# 20. UX/UI

El diseño debe ser:

- Moderno.
- Institucional.
- Limpio.
- Responsive.
- Fácil de utilizar desde computadora, tablet y teléfono.

La pantalla pública debe priorizar la búsqueda.

La extensión debe tener alta visibilidad:

```text
EXTENSIÓN

5125
```

Utilizar componentes reutilizables.

---

# 21. Datos iniciales

Los siguientes registros representan la información inicial proporcionada y deben utilizarse para crear el seed/importador inicial.

```text
Titulaciones (Dennise Yolanda Hernández Valenzuela) | 5135
Tesorería (Ventanilla) | 5040
Contabilidad (Armida Flores Chávez) | 5041
Calidad Académica (Asistente de Procesos) (Silvia Higuera) | 5140
Calidad Académica (Dulce Guadalupe Corral Leyva) | 5125
Calidad Académica (Ana Karina Barreras Rodríguez) | 5141
Recursos Humanos (Rosa Laura Borbon Lopez) | 5080
Coordinación Administrativa (Claudia Lizeth Sortillon Cotri) | 5133
Jefatura de Departamento Académico (Asistente) (Domingo Enrique Ibarra M.) | 5180
Jefatura de Departamento Académico (John Sosa Covarrubias) | 5181
Dirección (Asistente) (Beatriz Bocanegra Mendoza) | 5010
Dirección (Mtro. Mauricio López Acosta) | 5011
Servicio para Docentes (Ventanilla 1) (Janeth Alejandra Partida A.) | 5100
Servicio para Docentes (Ventanilla 2) (Sandra) | 5102
Responsable de Servicios Escolares y Docentes (María Elena Valdez Ceballos) | 5101
Registro Escolar (Rosy – Elvia) | 5130
Titulaciones (Registro Escolar) (Roberto Carlos) | 5300
Alyenka Valencia – Fidel Estrada (RH y Nóminas) | 5145
Calidad Administrativa (Maygló Montoya Castro) | 5185
Cubículo 1 (Marco Antonio Hernández Aguirre) | 5110
Cubículo 2 (Irasema Armenta Álvarez) | 5116
Cubículo 3 (Ana Patricia González Quiñonez) | 5124
Cubículo 5 (Brigit Arlette Escobar Fuentes) | 5402
Cubículo 6 (Martha Elena Reyes Valdez) | 5407
Cubículo 7 (Lucia Fernanda Villavicencio C.) | 5128
Cubículo 8 (Allan Chacara Montes) | 5117
Cubículo 9 (Francisco N. Velazco Bórquez) | 5123
Cubículo 10 (Arturo de la Mora Yocupicio) | 5120
Cubículo 11 (Alejandra Vazquez Osnaya) | 5137
Cubículo 12 (Carlos Jesus Hinojosa Rodríguez) | 5227
Cubículo 13 (Guadalupe Idalia Soto Sánchez) | 5196
Cubículo 14 (Francisco Gregorio Galindo Talamantes) | 5112
Cubículo 15 (José Manuel Velarde Cantú) | 5225
Cubículo 16 (Gaspar Leal Duarte) | 5222
Cubículo 17 (Lizeth Armenta Zazueta) | 5118
Cubículo 18 (Rocío Lizeth Yocupicio Yocupicio) | 5095
Cubículo 19 (Alberto Galván Corral) | 5127
Coordinación de Servicios Generales, Mtto. y Audiovisuales (Edgar Morales A.) | 5195
Cubículo 1 (Luis Fernando Erro Salcido) | 5409
Cubículo 2 (Gilberto Manuel Córdova Cárdenas) | 5410
Cubículo 4 (Cecilia Murillo Félix) | 5406
Cubículo 5 (Celia Yaneth Quiroz Campas) | 5412
Cubículo 6 (Cecilia Ivonne Bojórquez Diaz) | 5403
Cubículo 8 (Vanessa Aránzazu Rascón G.) | 5090
Cubículo 9 (Ana Lucia Félix Rochin – Olivia María Pineda S.) (Tutorías y Becas) | 5413
Cubículo 10 (Rubén Varela Campos) | 5115
Cubículo 11 (Teineric Micheli Castro Urias) | 5404
Cubículo 12 (Jorge Guadalupe Mendoza León) | 5408
Cubículo 13 (Lizette Marcela Moncayo Rodríguez) | 5414
Cubículo 14 (Ramón René Palacio Cinco) | 5405
Aula 5 (ACTII) (Manuel Alejandro Quintana Garcia) | 5228
Supervisora de Protección y Seguridad Universitaria (Lina C. Castillo Bórquez) | 5700
Cubículo 1 (Lydia Guadalupe Miranda García) | 5092
Cubículo 2 (Héctor Omar Corral García) (Servicio Social) | 5223
Cubículo 4 (Admisiones – Promoción de Oferta Académica) (Paulina Verdugo) | 5113
Cubículo 5 (Practicas Profesionales) (Febe Nahara Moreno de la Cruz) | 5220
Cubículo 6 (Incubadora) (Carmen Alberto Diaz Alamea) | 5158
Cubículo 2 (Aniela Guadalupe Valdez Sandoval) | 5226
Cubículo 4 (Marisol Galaviz Zamora) | 5122
Cubículo 6 (Martín Humberto Córdova Cárdenas) | 5194
Cubículo 9 (Idiomas) (Fernanda G. Urquídez – Yolanda López A.) | 5085
Cubículo 10 (Daniela Olmos V.) | 5121
Cubículo 11 (Karla Lorena Molina Domínguez) | 5126
Cubículo 14 (Dulce Karely Alcantar Eribes) | 5114
Cubículo 15 (Marysol Báez Portillo) | 5411
Cubículo 17 (Karla Janeth Arévalo Sainz) | 5229
(CAICH) (Karina Imay Jacobo) | 5450
Bárbara Machado Borrell | 5470
(Administrador de Biblioteca) (Dalila Rosario Suarez Almada) | 5050
Prestamos (Planta Baja) | 5051
Inspector de Seguridad y Salud Ocupacional (Jairo Acuña Villegas) | 5146
Asistentes de P. E. (Erika – Jesús – Ana Gabriela – Alma – Hanna – Simón) | 5482
CETIN (Marlene Félix Montiel) | 5471
Administrador de Informática y Comunicaciones (German Zazueta Molinares) | 5305
Barra de Control Interna (David – Homero) | 5301
Analista de Sistemas de Información (Soporte Técnico) (Rafael Silva Gutierrez) | 5310
Aula de Servicios Especiales (Laboratorio de Móviles – ISW) (José de Jesús Soto) | 5119
Aula 1 (AM – 711) | 5311
Aula 2 (AM – 712) | 5312
Aula 3 (AM – 713) | 5313
SITE | 5215
Supervisor de Mantenimiento (José Luis Mendivil Nolazco) | 5193
Oscar Fernando Valenzuela Chávez | 5415
Cafetería | 5290
Librería | 5060
Enfermería (Elizabeth del Carmen Lagarda Lagarda) | 5020
Sorteos | 5430
Ventanilla para Préstamo de Equipo Deportivo (German Yael Zazueta) | 5475
Joel Alejandro Oloño Meza | 5476
Carlos Artemio Favela Ramírez | 5477
Daniel Antonio Rendon Chaidez | 5478
Asistente de Extensión de la Cultura | 5480
Metodología y Actividades Internas | 5483
Coordinación de Extensión y Difusión Cultural (Ramon Fco. Alegría Lopez) | 5155
Asistente de Extensión y Difusión Cultural (Dora Delia Yocupicio García) | 5150
Asistente de Difusión Cultural (Arturo Parra Crespo) | 5156
Coordinación Deportes (Selene Azucena Elenes Baltazar) | 5160
Asistente de la Coordinación Deportes (Blanca Flor Yocupicio) | 5161
```

---

# 22. Tratamiento de datos ambiguos

No inventar información que no esté en los datos originales.

Ejemplos:

```text
Cafetería () | 5290
Librería () | 5060
Sorteos () | 5430
```

Deben registrarse como áreas/servicios sin persona.

Igualmente:

```text
SITE | 5215
```

debe poder existir sin persona.

Los datos como:

```text
Cubículo 1
Cubículo 2
```

no deben asignarse automáticamente a un edificio si éste no está identificado.

Si una relación no puede determinarse con seguridad, dejarla pendiente para administración.

---

# 23. Normalización de nombres

Durante la importación no modificar silenciosamente los nombres.

Conservar exactamente los datos originales inicialmente.

Posteriormente el administrador podrá corregir:

- Acentos.
- Mayúsculas/minúsculas.
- Abreviaturas.
- Errores ortográficos.

Toda corrección debe quedar registrada en historial.

---

# 24. Datos compartidos

El sistema debe soportar grupos:

```text
Rosy – Elvia
```

```text
David – Homero
```

```text
Erika – Jesús – Ana Gabriela – Alma – Hanna – Simón
```

No asumir automáticamente que cada nombre representa una persona institucional independiente cuando el dato original solamente identifica un grupo de usuarios de una misma extensión.

Se recomienda permitir:

```text
Tipo de asignación:
Individual
Compartida
Área/Servicio
Sin persona
```

---

# 25. Generación de QR

Preparar la arquitectura para una futura función:

```text
/extensiones/{numero}
```

Cada extensión podrá generar un QR que apunte a su ficha pública.

No es obligatorio implementar QR en el MVP, pero el diseño debe permitirlo.

---

# 26. Directorio imprimible

Preparar una futura función para generar:

- PDF.
- Directorio por área.
- Directorio por edificio.
- Directorio general.
- Listado de extensiones.

No es obligatorio para el MVP.

---

# 27. Pruebas

Crear pruebas para:

## Backend

- Crear extensión.
- Evitar extensión duplicada.
- Crear persona.
- Crear asignación.
- Permitir extensión sin persona.
- Permitir extensión compartida.
- Desactivar extensión.
- Buscar por número.
- Buscar por nombre.
- Buscar por área.
- Registrar historial.
- Importar registros.

## Frontend

- Búsqueda.
- Filtros.
- Detalle.
- CRUD.
- Validaciones.
- Manejo de errores.
- Responsive.

---

# 28. Criterios de aceptación del MVP

El sistema se considera funcional cuando:

1. Un usuario puede buscar una extensión por número.
2. Un usuario puede buscar por nombre.
3. Un usuario puede buscar por área.
4. Se muestran correctamente persona, extensión, área y ubicación.
5. Un administrador puede crear extensiones.
6. Un administrador puede editar extensiones.
7. Un administrador puede desactivar extensiones.
8. Se pueden registrar extensiones sin persona.
9. Se pueden registrar extensiones compartidas.
10. Se pueden administrar personas.
11. Se pueden administrar áreas.
12. Se pueden administrar ubicaciones.
13. Las extensiones no se pueden duplicar.
14. Los cambios quedan auditados.
15. Se puede importar información mediante CSV/XLSX.
16. La importación muestra errores antes de guardar.
17. La interfaz funciona correctamente en desktop y móvil.
18. La API está documentada mediante Swagger.

---

# 29. Orden recomendado de desarrollo

Implementar en este orden:

## Fase 1

1. Crear solución backend.
2. Configurar SQL Server.
3. Crear entidades.
4. Crear migraciones.
5. Crear seed inicial.
6. Crear CRUD de extensiones.
7. Crear CRUD de personas.
8. Crear CRUD de áreas.
9. Crear CRUD de ubicaciones.

## Fase 2

10. Crear API de búsqueda.
11. Crear frontend.
12. Crear buscador principal.
13. Crear resultados.
14. Crear detalle de extensión.

## Fase 3

15. Crear autenticación.
16. Crear roles.
17. Crear panel administrativo.
18. Crear historial.

## Fase 4

19. Crear importador CSV/XLSX.
20. Validación.
21. Vista previa.
22. Detección de duplicados.
23. Importación transaccional.

## Fase 5

24. Pruebas.
25. Optimización.
26. Seguridad.
27. Documentación.
28. Preparación para despliegue.

---

# 30. Requisitos de calidad del código

El agente de desarrollo debe:

- Evitar código duplicado.
- Utilizar componentes reutilizables.
- Utilizar DTOs en la API.
- No exponer entidades de EF Core directamente.
- Validar entradas.
- Manejar errores de forma consistente.
- Utilizar async/await.
- Utilizar cancellation tokens cuando sea apropiado.
- Crear índices para búsquedas frecuentes.
- Documentar decisiones importantes.
- Mantener separación de responsabilidades.
- No introducir dependencias innecesarias.
- No inventar información institucional.

---

# 31. Requisito importante para el agente

Antes de comenzar a implementar funcionalidades, analizar el repositorio existente.

Si el repositorio ya contiene:

- componentes,
- librerías,
- autenticación,
- estilos,
- configuración,
- infraestructura,
- base de datos,

reutilizar lo existente en lugar de reemplazarlo.

No modificar tecnologías principales sin justificación.

Primero crear un plan de implementación y después comenzar a modificar archivos.

---

# 32. Entregables esperados

El agente debe entregar:

```text
/backend
/frontend
/database
/docs
```

Documentación mínima:

```text
README.md
ARCHITECTURE.md
DATABASE.md
API.md
DEPLOYMENT.md
```

Además:

- Migraciones.
- Seed inicial.
- Pruebas.
- Swagger.
- Archivo `.env.example`.
- Instrucciones de instalación.
- Instrucciones de ejecución.
- Instrucciones de despliegue.

---

# 33. Resultado esperado

El producto final debe ser un **Directorio Telefónico ITSON** que permita localizar rápidamente cualquier extensión telefónica y, al mismo tiempo, funcionar como sistema administrativo para mantener actualizada la información.

La aplicación debe estar diseñada desde el inicio para evolucionar posteriormente hacia:

- Múltiples campus.
- Integración con directorios institucionales.
- QR.
- PDF.
- Reportes.
- Integración con sistemas de identidad.
- Importaciones periódicas.
- Historial completo de asignaciones.
- Directorios públicos por campus, edificio y área.
