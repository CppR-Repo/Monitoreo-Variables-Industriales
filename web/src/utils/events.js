/* ==========================================
    UTILIDAD: EVENTS
    Detección de eventos y alarmas industriales
=========================================== */

import { evaluateReading } from "./thresholds.js";


/* -----------------------------------------
    01. CONFIGURACIÓN DE VARIABLES
----------------------------------------- */

/*
    * Variables industriales monitoreadas.
    * Usamos los mismos nombres de propiedades
    * que devuelve el motor de simulación.
 */
const VARIABLES = [
    {
        key: "pressure",
        label: "Presión",
        unit: "psi",
    },
    {
        key: "temperature",
        label: "Temperatura",
        unit: "°C",
    },
];


/* -----------------------------------------
    02. DETECCIÓN DE TRANSICIONES
----------------------------------------- */

/*
    Genera eventos cuando cambia el estado
    de una variable industrial.

    Parámetros:

    - readings: mediciones de la simulación.
    - currentIndex: última medición visible.

    Devuelve un arreglo de eventos ordenados
    cronológicamente.

    Cada evento contiene:
    - id: identificador estable.
    - index: índice de la medición.
    - elapsedMinutes: tiempo simulado.
    - variable: identificador de la variable.
    - label: nombre de la variable.
    - value: valor de la medición.
    - unit: unidad de medida.
    - previousStatus: estado anterior.
    - status: estado nuevo.
 */
export function generateEvents(readings, currentIndex) {

    // No hay eventos si no existen mediciones.
    if (!readings.length || currentIndex < 1) {
        return [];
    }

    // Evitamos recorrer índices fuera del arreglo.
    const lastIndex = Math.min(
        currentIndex,
        readings.length - 1
    );

    const events = [];

    /* --------------------------------------
        RECORRIDO DE MEDICIONES
    --------------------------------------- */

    for (let index = 1; index <= lastIndex; index++) {

        const previousReading = readings[index - 1];
        const currentReading = readings[index];

        // Clasificamos ambas mediciones.
        const previousStatuses = evaluateReading(previousReading);
        const currentStatuses = evaluateReading(currentReading);

        /* ----------------------------------
            COMPARACIÓN POR VARIABLE
        ----------------------------------- */

        for (const variable of VARIABLES) {

            const previousStatus = previousStatuses[variable.key];
            const status = currentStatuses[variable.key];

            // Si el estado no cambió, no hay evento.
            if (previousStatus === status) {
                continue;
            }

            // Registramos únicamente la transición.
            events.push({
                id: `${index}-${variable.key}`,
                index,
                elapsedMinutes: currentReading.elapsedMinutes,
                variable: variable.key,
                label: variable.label,
                value: currentReading[variable.key],
                unit: variable.unit,
                previousStatus,
                status,
            });
        }
    }

    return events;
}
