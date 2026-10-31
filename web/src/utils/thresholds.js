/* ==========================================
    EVALUACIÓN DE VARIABLES INDUSTRIALES
    Umbrales didácticos de simulación
=========================================== */

export const THRESHOLDS = Object.freeze({
    pressure: {
        warning: 480,
        critical: 500,
        unit: "psi",
    },

    temperature: {
        warning: 65,
        critical: 70,
        unit: "°C",
    },
});

/*
    Evalúa una lectura frente a sus umbrales.

    Estados:
    - normal: valor inferior a advertencia
    - warning: advertencia alcanzada
    - critical: límite crítico alcanzado

    Los valores no válidos se identifican
    como "invalid", sin tratarlos como normales.
 */
export function evaluateStatus(value, thresholds) {
    if (
        typeof value !== "number" ||
        !Number.isFinite(value)
    ) {
        return "invalid";
    }

    if (value >= thresholds.critical) {
        return "critical";
    }

    if (value >= thresholds.warning) {
        return "warning";
    }

    return "normal";
}

/*
    Evalúa simultáneamente presión y temperatura.
 */
export function evaluateReading(reading) {
    return {
        pressure: evaluateStatus(
            reading.pressure,
            THRESHOLDS.pressure
        ),

        temperature: evaluateStatus(
            reading.temperature,
            THRESHOLDS.temperature
        ),
    };
}
