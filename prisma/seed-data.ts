import type { ImportRow } from "../src/server/domain/importacion";

/**
 * Datos iniciales (spec sección 21), transcritos a mano al formato
 * normalizado de importación (spec sección 16) en lugar de "adivinarlos"
 * con un parser genérico: el texto de origen mezcla área/puesto/persona de
 * forma inconsistente línea por línea (paréntesis en distinto orden, guiones
 * que a veces separan personas y a veces son parte del nombre de un área),
 * y un heurístico automático se equivocaría en varios casos sin que nadie
 * lo note. Transcribir cada línea a mano, una sola vez, con el mismo
 * criterio con el que lo haría un capturista, es más seguro para un
 * dataset finito y conocido — la importación real desde /admin/importar sí
 * usa el parser genérico (src/lib/import-parsing.ts) para archivos futuros.
 *
 * Reglas seguidas (spec 22-24):
 * - Nunca se inventa Campus/Edificio: los datos de origen no los mencionan,
 *   así que se dejan en blanco (pendiente para administración).
 * - El nombre de cada persona se conserva literal en `personaNombre` sin
 *   partirlo en apellidos (spec 23: no modificar silenciosamente).
 * - Los grupos de personas unidos por "–" (p. ej. "Rosy – Elvia") generan
 *   una fila por persona sobre la misma extensión, para que el importador
 *   las reclasifique como asignación Compartida.
 */

type FilaBase = Omit<ImportRow, "campus" | "edificio" | "estado">;

function base(over: Partial<FilaBase> & { extension: string }): ImportRow {
  return {
    campus: "",
    edificio: "",
    area: "",
    subarea: "",
    tipoUbicacion: "",
    ubicacion: "",
    personaNombre: "",
    personaApellidoPaterno: "",
    personaApellidoMaterno: "",
    puesto: "",
    estado: "",
    observaciones: "",
    ...over,
  };
}

/** Genera una fila por cada nombre en `personas`, compartiendo el resto de campos. */
function conPersonas(over: Partial<FilaBase> & { extension: string }, personas: string[]): ImportRow[] {
  if (personas.length === 0) return [base(over)];
  return personas.map((nombre) => base({ ...over, personaNombre: nombre }));
}

export const FILAS_SEED: ImportRow[] = [
  base({ area: "Titulaciones", personaNombre: "Dennise Yolanda Hernández Valenzuela", extension: "5135" }),
  base({ area: "Tesorería", tipoUbicacion: "VENTANILLA", ubicacion: "Ventanilla", extension: "5040" }),
  base({ area: "Contabilidad", personaNombre: "Armida Flores Chávez", extension: "5041" }),
  base({ area: "Calidad Académica", puesto: "Asistente de Procesos", personaNombre: "Silvia Higuera", extension: "5140" }),
  base({ area: "Calidad Académica", personaNombre: "Dulce Guadalupe Corral Leyva", extension: "5125" }),
  base({ area: "Calidad Académica", personaNombre: "Ana Karina Barreras Rodríguez", extension: "5141" }),
  base({ area: "Recursos Humanos", personaNombre: "Rosa Laura Borbon Lopez", extension: "5080" }),
  base({ area: "Coordinación Administrativa", personaNombre: "Claudia Lizeth Sortillon Cotri", extension: "5133" }),
  base({ area: "Jefatura de Departamento Académico", puesto: "Asistente", personaNombre: "Domingo Enrique Ibarra M.", extension: "5180" }),
  base({ area: "Jefatura de Departamento Académico", personaNombre: "John Sosa Covarrubias", extension: "5181" }),
  base({ area: "Dirección", puesto: "Asistente", personaNombre: "Beatriz Bocanegra Mendoza", extension: "5010" }),
  base({ area: "Dirección", personaNombre: "Mtro. Mauricio López Acosta", extension: "5011" }),
  base({ area: "Servicio para Docentes", tipoUbicacion: "VENTANILLA", ubicacion: "Ventanilla 1", personaNombre: "Janeth Alejandra Partida A.", extension: "5100" }),
  base({ area: "Servicio para Docentes", tipoUbicacion: "VENTANILLA", ubicacion: "Ventanilla 2", personaNombre: "Sandra", extension: "5102" }),
  base({ area: "Responsable de Servicios Escolares y Docentes", personaNombre: "María Elena Valdez Ceballos", extension: "5101" }),
  ...conPersonas({ area: "Registro Escolar", extension: "5130" }, ["Rosy", "Elvia"]),
  base({ area: "Titulaciones", subarea: "Registro Escolar", personaNombre: "Roberto Carlos", extension: "5300" }),
  ...conPersonas({ area: "RH y Nóminas", extension: "5145" }, ["Alyenka Valencia", "Fidel Estrada"]),
  base({ area: "Calidad Administrativa", personaNombre: "Maygló Montoya Castro", extension: "5185" }),

  base({ tipoUbicacion: "CUBICULO", ubicacion: "1", personaNombre: "Marco Antonio Hernández Aguirre", extension: "5110" }),
  base({ tipoUbicacion: "CUBICULO", ubicacion: "2", personaNombre: "Irasema Armenta Álvarez", extension: "5116" }),
  base({ tipoUbicacion: "CUBICULO", ubicacion: "3", personaNombre: "Ana Patricia González Quiñonez", extension: "5124" }),
  base({ tipoUbicacion: "CUBICULO", ubicacion: "5", personaNombre: "Brigit Arlette Escobar Fuentes", extension: "5402" }),
  base({ tipoUbicacion: "CUBICULO", ubicacion: "6", personaNombre: "Martha Elena Reyes Valdez", extension: "5407" }),
  base({ tipoUbicacion: "CUBICULO", ubicacion: "7", personaNombre: "Lucia Fernanda Villavicencio C.", extension: "5128" }),
  base({ tipoUbicacion: "CUBICULO", ubicacion: "8", personaNombre: "Allan Chacara Montes", extension: "5117" }),
  base({ tipoUbicacion: "CUBICULO", ubicacion: "9", personaNombre: "Francisco N. Velazco Bórquez", extension: "5123" }),
  base({ tipoUbicacion: "CUBICULO", ubicacion: "10", personaNombre: "Arturo de la Mora Yocupicio", extension: "5120" }),
  base({ tipoUbicacion: "CUBICULO", ubicacion: "11", personaNombre: "Alejandra Vazquez Osnaya", extension: "5137" }),
  base({ tipoUbicacion: "CUBICULO", ubicacion: "12", personaNombre: "Carlos Jesus Hinojosa Rodríguez", extension: "5227" }),
  base({ tipoUbicacion: "CUBICULO", ubicacion: "13", personaNombre: "Guadalupe Idalia Soto Sánchez", extension: "5196" }),
  base({ tipoUbicacion: "CUBICULO", ubicacion: "14", personaNombre: "Francisco Gregorio Galindo Talamantes", extension: "5112" }),
  base({ tipoUbicacion: "CUBICULO", ubicacion: "15", personaNombre: "José Manuel Velarde Cantú", extension: "5225" }),
  base({ tipoUbicacion: "CUBICULO", ubicacion: "16", personaNombre: "Gaspar Leal Duarte", extension: "5222" }),
  base({ tipoUbicacion: "CUBICULO", ubicacion: "17", personaNombre: "Lizeth Armenta Zazueta", extension: "5118" }),
  base({ tipoUbicacion: "CUBICULO", ubicacion: "18", personaNombre: "Rocío Lizeth Yocupicio Yocupicio", extension: "5095" }),
  base({ tipoUbicacion: "CUBICULO", ubicacion: "19", personaNombre: "Alberto Galván Corral", extension: "5127" }),

  base({ area: "Coordinación de Servicios Generales, Mtto. y Audiovisuales", personaNombre: "Edgar Morales A.", extension: "5195" }),

  base({ tipoUbicacion: "CUBICULO", ubicacion: "1", personaNombre: "Luis Fernando Erro Salcido", extension: "5409" }),
  base({ tipoUbicacion: "CUBICULO", ubicacion: "2", personaNombre: "Gilberto Manuel Córdova Cárdenas", extension: "5410" }),
  base({ tipoUbicacion: "CUBICULO", ubicacion: "4", personaNombre: "Cecilia Murillo Félix", extension: "5406" }),
  base({ tipoUbicacion: "CUBICULO", ubicacion: "5", personaNombre: "Celia Yaneth Quiroz Campas", extension: "5412" }),
  base({ tipoUbicacion: "CUBICULO", ubicacion: "6", personaNombre: "Cecilia Ivonne Bojórquez Diaz", extension: "5403" }),
  base({ tipoUbicacion: "CUBICULO", ubicacion: "8", personaNombre: "Vanessa Aránzazu Rascón G.", extension: "5090" }),
  ...conPersonas(
    { tipoUbicacion: "CUBICULO", ubicacion: "9", area: "Tutorías y Becas", extension: "5413" },
    ["Ana Lucia Félix Rochin", "Olivia María Pineda S."],
  ),
  base({ tipoUbicacion: "CUBICULO", ubicacion: "10", personaNombre: "Rubén Varela Campos", extension: "5115" }),
  base({ tipoUbicacion: "CUBICULO", ubicacion: "11", personaNombre: "Teineric Micheli Castro Urias", extension: "5404" }),
  base({ tipoUbicacion: "CUBICULO", ubicacion: "12", personaNombre: "Jorge Guadalupe Mendoza León", extension: "5408" }),
  base({ tipoUbicacion: "CUBICULO", ubicacion: "13", personaNombre: "Lizette Marcela Moncayo Rodríguez", extension: "5414" }),
  base({ tipoUbicacion: "CUBICULO", ubicacion: "14", personaNombre: "Ramón René Palacio Cinco", extension: "5405" }),

  base({ tipoUbicacion: "AULA", ubicacion: "5", area: "ACTII", personaNombre: "Manuel Alejandro Quintana Garcia", extension: "5228" }),
  base({ area: "Supervisora de Protección y Seguridad Universitaria", personaNombre: "Lina C. Castillo Bórquez", extension: "5700" }),

  base({ tipoUbicacion: "CUBICULO", ubicacion: "1", personaNombre: "Lydia Guadalupe Miranda García", extension: "5092" }),
  base({ tipoUbicacion: "CUBICULO", ubicacion: "2", area: "Servicio Social", personaNombre: "Héctor Omar Corral García", extension: "5223" }),
  base({ tipoUbicacion: "CUBICULO", ubicacion: "4", area: "Admisiones – Promoción de Oferta Académica", personaNombre: "Paulina Verdugo", extension: "5113" }),
  base({ tipoUbicacion: "CUBICULO", ubicacion: "5", area: "Practicas Profesionales", personaNombre: "Febe Nahara Moreno de la Cruz", extension: "5220" }),
  base({ tipoUbicacion: "CUBICULO", ubicacion: "6", area: "Incubadora", personaNombre: "Carmen Alberto Diaz Alamea", extension: "5158" }),

  base({ tipoUbicacion: "CUBICULO", ubicacion: "2", personaNombre: "Aniela Guadalupe Valdez Sandoval", extension: "5226" }),
  base({ tipoUbicacion: "CUBICULO", ubicacion: "4", personaNombre: "Marisol Galaviz Zamora", extension: "5122" }),
  base({ tipoUbicacion: "CUBICULO", ubicacion: "6", personaNombre: "Martín Humberto Córdova Cárdenas", extension: "5194" }),
  ...conPersonas(
    { tipoUbicacion: "CUBICULO", ubicacion: "9", area: "Idiomas", extension: "5085" },
    ["Fernanda G. Urquídez", "Yolanda López A."],
  ),
  base({ tipoUbicacion: "CUBICULO", ubicacion: "10", personaNombre: "Daniela Olmos V.", extension: "5121" }),
  base({ tipoUbicacion: "CUBICULO", ubicacion: "11", personaNombre: "Karla Lorena Molina Domínguez", extension: "5126" }),
  base({ tipoUbicacion: "CUBICULO", ubicacion: "14", personaNombre: "Dulce Karely Alcantar Eribes", extension: "5114" }),
  base({ tipoUbicacion: "CUBICULO", ubicacion: "15", personaNombre: "Marysol Báez Portillo", extension: "5411" }),
  base({ tipoUbicacion: "CUBICULO", ubicacion: "17", personaNombre: "Karla Janeth Arévalo Sainz", extension: "5229" }),

  base({ area: "CAICH", personaNombre: "Karina Imay Jacobo", extension: "5450" }),
  base({ personaNombre: "Bárbara Machado Borrell", extension: "5470" }),
  base({ puesto: "Administrador de Biblioteca", personaNombre: "Dalila Rosario Suarez Almada", extension: "5050" }),
  base({ area: "Prestamos", observaciones: "Planta Baja", extension: "5051" }),
  base({ area: "Inspector de Seguridad y Salud Ocupacional", personaNombre: "Jairo Acuña Villegas", extension: "5146" }),
  ...conPersonas(
    { area: "Asistentes de P. E.", extension: "5482" },
    ["Erika", "Jesús", "Ana Gabriela", "Alma", "Hanna", "Simón"],
  ),
  base({ area: "CETIN", personaNombre: "Marlene Félix Montiel", extension: "5471" }),
  base({ area: "Administrador de Informática y Comunicaciones", personaNombre: "German Zazueta Molinares", extension: "5305" }),
  ...conPersonas({ area: "Barra de Control Interna", extension: "5301" }, ["David", "Homero"]),
  base({ area: "Analista de Sistemas de Información", subarea: "Soporte Técnico", personaNombre: "Rafael Silva Gutierrez", extension: "5310" }),
  base({ area: "Aula de Servicios Especiales", subarea: "Laboratorio de Móviles – ISW", personaNombre: "José de Jesús Soto", extension: "5119" }),
  base({ tipoUbicacion: "AULA", ubicacion: "1", observaciones: "AM – 711", extension: "5311" }),
  base({ tipoUbicacion: "AULA", ubicacion: "2", observaciones: "AM – 712", extension: "5312" }),
  base({ tipoUbicacion: "AULA", ubicacion: "3", observaciones: "AM – 713", extension: "5313" }),
  base({ tipoUbicacion: "SITE", ubicacion: "SITE", extension: "5215" }),
  base({ area: "Supervisor de Mantenimiento", personaNombre: "José Luis Mendivil Nolazco", extension: "5193" }),
  base({ personaNombre: "Oscar Fernando Valenzuela Chávez", extension: "5415" }),
  base({ area: "Cafetería", extension: "5290" }),
  base({ area: "Librería", extension: "5060" }),
  base({ area: "Enfermería", personaNombre: "Elizabeth del Carmen Lagarda Lagarda", extension: "5020" }),
  base({ area: "Sorteos", extension: "5430" }),
  base({ tipoUbicacion: "VENTANILLA", ubicacion: "Ventanilla para Préstamo de Equipo Deportivo", personaNombre: "German Yael Zazueta", extension: "5475" }),
  base({ personaNombre: "Joel Alejandro Oloño Meza", extension: "5476" }),
  base({ personaNombre: "Carlos Artemio Favela Ramírez", extension: "5477" }),
  base({ personaNombre: "Daniel Antonio Rendon Chaidez", extension: "5478" }),
  base({ area: "Asistente de Extensión de la Cultura", extension: "5480" }),
  base({ area: "Metodología y Actividades Internas", extension: "5483" }),
  base({ area: "Coordinación de Extensión y Difusión Cultural", personaNombre: "Ramon Fco. Alegría Lopez", extension: "5155" }),
  base({ area: "Asistente de Extensión y Difusión Cultural", personaNombre: "Dora Delia Yocupicio García", extension: "5150" }),
  base({ area: "Asistente de Difusión Cultural", personaNombre: "Arturo Parra Crespo", extension: "5156" }),
  base({ area: "Coordinación Deportes", personaNombre: "Selene Azucena Elenes Baltazar", extension: "5160" }),
  base({ area: "Asistente de la Coordinación Deportes", personaNombre: "Blanca Flor Yocupicio", extension: "5161" }),
];
