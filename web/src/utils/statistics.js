/* ==========================================
    UTILITY: STATISTICS
    Estadísticas del monitoreo industrial
=========================================== */


/* --------------------------------------
    01. CÁLCULO DE ESTADÍSTICAS
--------------------------------------- */

/*
    Calcula estadísticas de las mediciones
    visibles hasta el índice actual.

    @param {Array} readings
    Mediciones generadas por la simulación.

    @param {number} currentIndex
    Índice de la última medición visible.

    @param {Array} events
    Eventos detectados hasta el índice actual.

    @returns {Object}
    Resumen estadístico del monitoreo.
*/
export function calculateStatistics(
    readings,
    currentIndex,
    events = []
) {

    /* ----------------------------------
        VALIDACIÓN INICIAL
    ----------------------------------- */

    if (
        !Array.isArray(readings) ||
        readings.length === 0 ||
        !Number.isInteger(currentIndex) ||
        currentIndex < 0
    ) {
        return {
            maxPressure: null,
            maxTemperature: null,
            criticalEvents: 0,
            elapsedMinutes: 0,
        };
    }


    /* ----------------------------------
        MEDICIONES VISIBLES
    ----------------------------------- */

    // Limitamos el índice al último disponible.
    const lastIndex = Math.min(
        currentIndex,
        readings.length - 1
    );

    // Nunca analizamos mediciones futuras.
    const visibleReadings = readings.slice(
        0,
        lastIndex + 1
    );


    /* ----------------------------------
        VALORES MÁXIMOS
    ----------------------------------- */

    let maxPressure = -Infinity;
    let maxTemperature = -Infinity;

    for (const reading of visibleReadings) {

        if (reading.pressure > maxPressure) {
            maxPressure = reading.pressure;
        }

        if (reading.temperature > maxTemperature) {
            maxTemperature = reading.temperature;
        }
    }


    /* ----------------------------------
        EVENTOS CRÍTICOS
    ------------------------------------ */

    /**
     * Contamos solamente las transiciones
     * cuyo nuevo estado sea "critical".
     *
     * No contamos cada medición que
     * permanece en estado crítico.
     */
    const criticalEvents = events.filter(
        (event) =>
            event.status === "critical" &&
            event.index <= lastIndex
    ).length;


    /* ----------------------------------
        TIEMPO TRANSCURRIDO
    ----------------------------------- */

    const elapsedMinutes =
        visibleReadings[visibleReadings.length - 1]
            .elapsedMinutes;


    /* ----------------------------------
        RESULTADO
    ----------------------------------- */

    return {
        maxPressure,
        maxTemperature,
        criticalEvents,
        elapsedMinutes,
    };
}
