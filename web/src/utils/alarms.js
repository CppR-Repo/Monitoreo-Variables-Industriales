/* ==========================================
    UTILITY: ACTIVE ALARMS
    Evaluación de alarmas industriales activas
=========================================== */


/* ------------------------------------------
    01. CONFIGURACIÓN DE VARIABLES
------------------------------------------ */

/*
    Información descriptiva de las
    variables monitoreadas.

    Los estados y sus umbrales ya fueron
    calculados por thresholds.js.
*/
const VARIABLES = [
    {
        key: "pressure",
        label: "Presión",
        unit: "psi",
        warningThreshold: 480,
        criticalThreshold: 500,
    },
    {
        key: "temperature",
        label: "Temperatura",
        unit: "°C",
        warningThreshold: 65,
        criticalThreshold: 70,
    },
];


/* --------------------------------------
    02. PRIORIDAD DE LAS ALARMAS
--------------------------------------- */

/*
    Una condición crítica tiene prioridad
    sobre una advertencia.
*/
const SEVERITY = {
    critical: 2,
    warning: 1,
    normal: 0,
};


/* -----------------------------------------------
    03. GENERACIÓN DE ALARMAS ACTIVAS
----------------------------------------------- */

/*
    Genera una lista de alarmas a partir
    de la lectura y los estados actuales.

    No registra eventos históricos:
    solamente describe el instante actual.

    @param {Object} reading
    @param {Object} statuses

    @returns {Array}
*/
export function getActiveAlarms(reading, statuses) {

    if (
        !reading ||
        !statuses ||
        typeof reading !== "object" ||
        typeof statuses !== "object"
    ) {
        return [];
    }

    const alarms = [];

    for (const variable of VARIABLES) {

        const status = statuses[variable.key];
        const value = reading[variable.key];

        // No generamos alarmas para estados
        // normales o datos desconocidos.
        if (
            status !== "warning" &&
            status !== "critical"
        ) {
            continue;
        }

        // Descartamos mediciones inválidas.
        if (
            typeof value !== "number" ||
            !Number.isFinite(value)
        ) {
            continue;
        }

        const threshold = status === "critical"
            ? variable.criticalThreshold
            : variable.warningThreshold;

        alarms.push({
            id: `${variable.key}-${status}`,
            variable: variable.key,
            label: variable.label,
            value,
            unit: variable.unit,
            status,
            threshold,
            severity: SEVERITY[status],
        });
    }

    // Las condiciones críticas aparecen primero.
    return alarms.sort(
        (a, b) => b.severity - a.severity
    );
}


/* -------------------------------------------
    04. RESUMEN DEL ESTADO GENERAL
------------------------------------------- */

/*
    Calcula el estado global del proceso
    y la cantidad de alarmas activas.

    @param {Array} alarms

    @returns {Object}
*/
export function summarizeAlarms(alarms) {

    const activeAlarms = Array.isArray(alarms)
        ? alarms
        : [];

    const criticalCount = activeAlarms.filter(
        (alarm) => alarm.status === "critical"
    ).length;

    const warningCount = activeAlarms.filter(
        (alarm) => alarm.status === "warning"
    ).length;

    let overallStatus = "normal";

    if (criticalCount > 0) {
        overallStatus = "critical";
    } else if (warningCount > 0) {
        overallStatus = "warning";
    }

    return {
        total: criticalCount + warningCount,
        criticalCount,
        warningCount,
        overallStatus,
    };
}
