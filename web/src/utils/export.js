/* ==========================================
    UTILITY: EXPORT
    Exportación de datos industriales a CSV
=========================================== */

import { evaluateReading } from "./thresholds.js";


/* ------------------------------------------
    01. CONFIGURACIÓN DEL FORMATO
------------------------------------------ */

/*
    Utilizamos punto y coma como separador
    para facilitar la importación en Excel
    con configuración regional argentina.
*/
const CSV_SEPARATOR = ";";

/*
    Traducción de los estados industriales.
*/
const STATUS_LABELS = {
    normal: "Normal",
    warning: "Advertencia",
    critical: "Crítico",
};


/* --------------------------------------
    02. FUNCIONES AUXILIARES
--------------------------------------- */

/*
    Convierte valores a texto compatible
    con nuestro formato CSV.

    Los números utilizan coma decimal.
    Los textos se protegen frente a
    separadores, comillas y saltos de línea.
*/
function formatCSVValue(value) {

    if (value === null || value === undefined) {
        return "";
    }

    const text = typeof value === "number"
        ? String(value).replace(".", ",")
        : String(value);

    if (
        text.includes(CSV_SEPARATOR) ||
        text.includes('"') ||
        text.includes("\n") ||
        text.includes("\r")
    ) {
        return `"${text.replaceAll('"', '""')}"`;
    }

    return text;
}


/*
    Convierte una matriz de filas en CSV.

    Cada fila representa un registro
    y cada elemento representa una columna.
*/
function createCSV(rows) {

    return rows
        .map((row) =>
            row.map(formatCSVValue).join(CSV_SEPARATOR)
        )
        .join("\r\n");
}


/* -----------------------------------------
    03. EXPORTACIÓN DE MEDICIONES
----------------------------------------- */

/*
    Genera un CSV con las mediciones
    visibles hasta el índice actual.

    @param {Array} readings
    @param {number} currentIndex

    @returns {string}
*/
export function exportReadingsToCSV(
    readings,
    currentIndex
) {

    const headers = [
        "Índice",
        "Tiempo (min)",
        "Presión (psi)",
        "Estado presión",
        "Temperatura (°C)",
        "Estado temperatura",
    ];

    // Evitamos acceder a índices inválidos.
    const hasValidReadings =
        Array.isArray(readings) &&
        readings.length > 0 &&
        Number.isInteger(currentIndex) &&
        currentIndex >= 0;

    if (!hasValidReadings) {
        return createCSV([headers]);
    }

    const lastIndex = Math.min(
        currentIndex,
        readings.length - 1
    );

    const visibleReadings = readings.slice(
        0,
        lastIndex + 1
    );

    const rows = visibleReadings.map((reading) => {

        const statuses = evaluateReading(reading);

        return [
            reading.index,
            reading.elapsedMinutes,
            reading.pressure,
            STATUS_LABELS[statuses.pressure],
            reading.temperature,
            STATUS_LABELS[statuses.temperature],
        ];
    });

    return createCSV([headers, ...rows]);
}


/* --------------------------------------
    04. EXPORTACIÓN DE EVENTOS
--------------------------------------- */

/*
    Genera un CSV con las transiciones
    registradas hasta el índice actual.

    @param {Array} events
    @param {number} currentIndex

    @returns {string}
*/
export function exportEventsToCSV(
    events,
    currentIndex
) {

    const headers = [
        "Índice",
        "Tiempo (min)",
        "Variable",
        "Medición",
        "Unidad",
        "Estado anterior",
        "Estado nuevo",
    ];

    const hasValidEvents =
        Array.isArray(events) &&
        Number.isInteger(currentIndex) &&
        currentIndex >= 0;

    if (!hasValidEvents) {
        return createCSV([headers]);
    }

    const visibleEvents = events.filter(
        (event) => event.index <= currentIndex
    );

    const rows = visibleEvents.map((event) => [
        event.index,
        event.elapsedMinutes,
        event.label,
        event.value,
        event.unit,
        STATUS_LABELS[event.previousStatus],
        STATUS_LABELS[event.status],
    ]);

    return createCSV([headers, ...rows]);
}
