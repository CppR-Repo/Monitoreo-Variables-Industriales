
/* ==========================================
   MOTOR DE SIMULACIÓN INDUSTRIAL
   Modelo dinámico simplificado
   ========================================== */

/**
 * CONFIGURACIÓN GENERAL
 *
 * Define los parámetros del modelo.
 *
 * intervalMinutes:
 *   Tiempo simulado entre mediciones.
 *
 * totalReadings:
 *   Cantidad de mediciones generadas.
 *
 * nominal:
 *   Valor al que tiende a regresar la variable.
 *
 * recovery:
 *   Coeficiente de recuperación hacia el valor nominal.
 *
 * noise:
 *   Amplitud máxima de la variación aleatoria.
 *
 * min:
 *   Límite inferior permitido por el modelo.
 *
 * NOTA:
 * Los parámetros son didácticos y no están
 * calibrados con una instalación industrial real.
 */
export const SIMULATION_CONFIG = Object.freeze({
    intervalMinutes: 15,
    totalReadings: 96,

    pressure: {
        nominal: 450,
        recovery: 0.12,
        noise: 3,
        min: 0,
    },

    temperature: {
        nominal: 60,
        recovery: 0.08,
        noise: 0.8,
        min: -273.15,
    },
});


/* ==========================================
   ESCENARIOS DE SIMULACIÓN
   ========================================== */

/**
 * EVENTOS DE SOBREPRESIÓN
 *
 * Cada evento define:
 *
 * startIndex:
 *   Primera medición afectada.
 *
 * endIndex:
 *   Última medición afectada.
 *
 * pressureInput:
 *   Incremento adicional de presión por paso.
 *
 * Los extremos del intervalo son inclusivos.
 */
const PRESSURE_EVENTS = Object.freeze([
    Object.freeze({
        startIndex: 12,
        endIndex: 15,
        pressureInput: 22,
    }),

    Object.freeze({
        startIndex: 60,
        endIndex: 62,
        pressureInput: 25,
    }),
]);

/**
 * EVENTOS DE SOBRETEMPERATURA
 *
 * temperatureInput:
 *   Incremento adicional de temperatura por paso.
 *
 * Estos eventos son nuevos y didácticos.
 */
const TEMPERATURE_EVENTS = Object.freeze([
    Object.freeze({
        startIndex: 30,
        endIndex: 35,
        temperatureInput: 3.5,
    }),

    Object.freeze({
        startIndex: 72,
        endIndex: 76,
        temperatureInput: 4,
    }),
]);

/**
 * ESCENARIOS DISPONIBLES
 *
 * normal:
 *   No se aplican perturbaciones adicionales.
 *
 * overpressure:
 *   Solo se altera la presión.
 *
 * overtemperature:
 *   Solo se altera la temperatura.
 *
 * combined:
 *   Incluye los eventos de ambas variables.
 */
export const SIMULATION_SCENARIOS = Object.freeze({
    normal: Object.freeze([]),

    overpressure: PRESSURE_EVENTS,

    overtemperature: TEMPERATURE_EVENTS,

    combined: Object.freeze([
        ...PRESSURE_EVENTS,
        ...TEMPERATURE_EVENTS,
    ]),
});


/* ==========================================
   GENERADOR PSEUDOALEATORIO
   ========================================== */

/**
 * Crea un generador de números pseudoaleatorios.
 *
 * La semilla permite reproducir exactamente
 * la misma secuencia de valores.
 *
 * Esto es útil para:
 * - Comparar escenarios.
 * - Ejecutar pruebas automatizadas.
 * - Reproducir resultados.
 *
 * Devuelve números desde 0 (incluido)
 * hasta 1 (excluido).
 */
export function createRandomGenerator(seed = 42) {
    // La semilla debe ser un número entero.
    if (!Number.isInteger(seed)) {
        throw new TypeError(
            "La semilla debe ser un número entero."
        );
    }

    // Convertimos la semilla a entero sin signo.
    let state = seed >>> 0;

    return function random() {
        // Actualizamos el estado interno.
        state = (
            Math.imul(1664525, state) + 1013904223
        ) >>> 0;

        // Normalizamos el resultado entre 0 y 1.
        return state / 4294967296;
    };
}


/* ==========================================
   EVOLUCIÓN DINÁMICA
   ========================================== */

/**
 * Calcula el siguiente valor de una variable.
 *
 * El cálculo considera:
 *
 * 1. Valor actual.
 * 2. Tendencia de recuperación.
 * 3. Variación aleatoria.
 * 4. Límite mínimo permitido.
 *
 * Fórmula simplificada:
 *
 * siguiente = actual + tendencia + ruido
 */
export function calculateNextValue({
    current,
    nominal,
    recovery,
    noise,
    minimum,
    random,
}) {
    // Calcula la tendencia hacia el valor nominal.
    const tendency = recovery * (nominal - current);

    // Genera una variación aleatoria acotada.
    const disturbance = (random() * 2 - 1) * noise;

    // Evita que el resultado sea menor al mínimo.
    return Math.max(
        minimum,
        current + tendency + disturbance
    );
}


/* ==========================================
   PERTURBACIONES CONTROLADAS
   ========================================== */

/**
 * Obtiene la perturbación de PRESIÓN
 * correspondiente al índice actual.
 *
 * Si no existe un evento activo, devuelve 0.
 *
 * El operador ?? permite interpretar como 0
 * los eventos que no afectan a la presión.
 */
export function getPressureDisturbance(
    index,
    scenario = "normal"
) {
    // Buscamos los eventos del escenario.
    const events = SIMULATION_SCENARIOS[scenario];

    // Verificamos que el escenario exista.
    if (!events) {
        throw new RangeError(
            `Escenario desconocido: ${scenario}`
        );
    }

    // Sumamos los incrementos de los eventos activos.
    return events.reduce((total, event) => {
        const isActive =
            index >= event.startIndex &&
            index <= event.endIndex;

        return total + (
            isActive ? (event.pressureInput ?? 0) : 0
        );
    }, 0);
}

/**
 * Obtiene la perturbación de TEMPERATURA
 * correspondiente al índice actual.
 *
 * Funciona igual que la función de presión,
 * pero utiliza temperatureInput.
 *
 * Si no hay perturbaciones activas, devuelve 0.
 */
export function getTemperatureDisturbance(
    index,
    scenario = "normal"
) {
    // Buscamos los eventos del escenario.
    const events = SIMULATION_SCENARIOS[scenario];

    // Verificamos que el escenario exista.
    if (!events) {
        throw new RangeError(
            `Escenario desconocido: ${scenario}`
        );
    }

    // Sumamos los incrementos de temperatura activos.
    return events.reduce((total, event) => {
        const isActive =
            index >= event.startIndex &&
            index <= event.endIndex;

        return total + (
            isActive ? (event.temperatureInput ?? 0) : 0
        );
    }, 0);
}


/* ==========================================
   GENERACIÓN DE MEDICIONES
   ========================================== */

/**
 * Genera una serie de mediciones simuladas.
 *
 * Parámetros:
 *
 * seed:
 *   Semilla para reproducir los resultados.
 *
 * scenario:
 *   Escenario que se desea simular.
 *
 * config:
 *   Configuración de las variables.
 *
 * Cada medición contiene:
 * - index
 * - elapsedMinutes
 * - pressure
 * - temperature
 */
export function generateSimulation({
    seed = 42,
    scenario = "normal",
    config = SIMULATION_CONFIG,
} = {}) {
    // Validamos que el escenario solicitado exista.
    if (!Object.hasOwn(SIMULATION_SCENARIOS, scenario)) {
        throw new RangeError(
            `Escenario desconocido: ${scenario}`
        );
    }

    // Inicializamos el generador pseudoaleatorio.
    const random = createRandomGenerator(seed);

    // Array donde guardaremos las mediciones.
    const readings = [];

    // Valores iniciales de las variables.
    let pressure = config.pressure.nominal;
    let temperature = config.temperature.nominal;

    // Generamos la cantidad de lecturas configurada.
    for (
        let index = 0;
        index < config.totalReadings;
        index++
    ) {
        // El índice 0 representa el estado inicial.
        if (index > 0) {

            /* --------------------------------------
               ACTUALIZACIÓN DE PRESIÓN
               -------------------------------------- */

            // Calculamos la evolución natural de presión.
            pressure = calculateNextValue({
                current: pressure,
                nominal: config.pressure.nominal,
                recovery: config.pressure.recovery,
                noise: config.pressure.noise,
                minimum: config.pressure.min,
                random,
            });

            // Agregamos la perturbación del escenario.
            pressure += getPressureDisturbance(
                index,
                scenario
            );


            /* --------------------------------------
               ACTUALIZACIÓN DE TEMPERATURA
               -------------------------------------- */

            // Calculamos la evolución natural de temperatura.
            temperature = calculateNextValue({
                current: temperature,
                nominal: config.temperature.nominal,
                recovery: config.temperature.recovery,
                noise: config.temperature.noise,
                minimum: config.temperature.min,
                random,
            });

            // Agregamos la perturbación del escenario.
            temperature += getTemperatureDisturbance(
                index,
                scenario
            );
        }


        /* --------------------------------------
           REGISTRO DE MEDICIONES
           -------------------------------------- */

        // Guardamos la lectura correspondiente.
        readings.push({
            index,

            // Tiempo transcurrido desde el inicio.
            elapsedMinutes: index * config.intervalMinutes,

            // Redondeamos las variables a 2 decimales.
            pressure: Number(pressure.toFixed(2)),
            temperature: Number(temperature.toFixed(2)),
        });
    }

    // Entregamos todas las mediciones generadas.
    return readings;
}
