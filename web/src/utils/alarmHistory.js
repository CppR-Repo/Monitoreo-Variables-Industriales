/* ==========================================
    UTILITY: ALARM HISTORY

    Historial acumulado de episodios de alarmas industriales.

    Responsabilidades:
    1. Detectar nuevos episodios.
    2. Identificar cambios de severidad.
    3. Mantener episodios activos.
    4. Registrar episodios finalizados.
    5. Calcular duración observada.
    6. Consultar reconocimientos.
    7. Generar el resumen histórico.
=========================================== */

import { evaluateReading } from "./thresholds.js";

import {
    createAlarmEpisodeId,
    isAlarmAcknowledged,
} from "./acknowledgements.js";


/* --------------------------------------
    01. CONFIGURACIÓN
--------------------------------------- */

const VARIABLES = [
    "pressure",
    "temperature",
];

const ALARM_STATUSES = new Set([
    "warning",
    "critical",
]);

// Intervalo de respaldo para mediciones sin marca temporal elapsedMinutes válida.
const DEFAULT_INTERVAL_MINUTES = 15;

/* ----------------------------------------------
    02. CALCULAR DURACIÓN OBSERVADA
---------------------------------------------- */
/*
    Calcula los minutos transcurridos entre la primera y 
    la última lectura observada que permanecen al episodio.

    Prioriza elapsedMinutes cuando está disponible en ambas mediciones.

    En las pruebas con datos simplificados, utiliza intervalos de 15 minutos.

    No agrega tiempo posterior a la última lectura observada del episodio.
*/
function calculateDuration(
    readings,
    startIndex,
    lastObservedIndex
) {
    const startTime = readings[startIndex]?.elapsedMinutes;

    const lastTime = readings[lastObservedIndex]?.elapsedMinutes;

    if (
        Number.isFinite(startTime) &&
        Number.isFinite(lastTime) &&
        lastTime >= startTime
    ) {
        return lastTime - startTime;
    }

    return (
        lastObservedIndex - startIndex
    ) * DEFAULT_INTERVAL_MINUTES;
}


/* --------------------------------------
    03. GENERAR HISTORIAL
--------------------------------------- */
export function generateAlarmHistory({
    readings,
    currentIndex,
    scenario,
    acknowledgements = {},
} = {}) {

    // Validamos los parámetros principales.
    if (
        !Array.isArray(readings) ||
        readings.length === 0 ||
        !Number.isInteger(currentIndex) ||
        currentIndex < 0 ||
        typeof scenario !== "string" ||
        scenario.length === 0
    ) {
        return [];
    }

    // No permitimos superar la última lectura.
    const lastIndex = Math.min(
        currentIndex,
        readings.length - 1
    );

    const history = [];

    // Conservamos el estado anterior de cada variable.
    const previousStatuses = {
        pressure: "normal",
        temperature: "normal",
    };

    /*
        Conservamos el episodio abierto de cada variable.

        Cada variable puede tener un episodio activo de manera independiente.
    */
    const openEpisodes = {
        pressure: null,
        temperature: null,
};

    /* ----------------------------------
        RECORRER LAS MEDICIONES
    ----------------------------------- */

    for (let index = 0; index <= lastIndex; index++) {

        const statuses = evaluateReading(
            readings[index]
        );

        for (const variable of VARIABLES) {

            const currentStatus = statuses[variable];

            const previousStatus = previousStatuses[variable];

            const openEpisode = openEpisodes[variable];


            /* ------------------------------
                MISMO ESTADO
            ------------------------------- */
            /*
                Si continúa el mismo estado, actualizamos la última lectura observada del episodio abierto.
            */
            if (currentStatus === previousStatus) {
                
                if (openEpisode) {

                    openEpisode.lastObservedIndex = index;

                    openEpisode.durationMinutes = calculateDuration(
                        readings,
                        openEpisode.startIndex,
                        index
                    );
                }
                continue;
            }

            /* --------------------------------------
                CERRAR EPISODIO ANTERIOR
            -------------------------------------- */
            /*
                Cualquier cambio de estado finaliza el episodio anterior:
                warning -> critical
                critical -> warning
                warning -> normal
                critical -> normal
            */
            if (openEpisode) {
                
                openEpisode.isActive = false;
                openEpisode.endIndex = index - 1;
                openEpisode.lastObservedIndex = index - 1;

                openEpisode.durationMinutes = calculateDuration (
                    readings,
                    openEpisode.startIndex,
                    index -1
                );
                openEpisodes[variable] = null;
            }


            /* ----------------------------------
                INICIAR NUEVO EPISODIO
            ----------------------------------- */
            /*
                Registramos únicamente las entradas a advertencia o estado crítico.

                Un cambio warning -> critical
                genera un episodio nuevo.
            */
            if (ALARM_STATUSES.has(currentStatus)) {

                const id = createAlarmEpisodeId({
                    scenario,
                    variable,
                    startIndex: index,
                    status: currentStatus,
                });

                const episode = {
                    id,
                    variable,
                    status: currentStatus,

                    // Inicio del episodio.
                    startIndex: index,
                    // Null mientras permanezca activo.
                    endIndex: null,
                    // Última lectura observada.
                    lastObservedIndex: index,

                    // Estado operativo del episodio.
                    isActive: true,
                    // Al inicio todavía no transcurrió tiempo entre mediciones.
                    durationMinutes: 0,

                    // Reconocimiento del operador.
                    acknowledged: isAlarmAcknowledged(
                        acknowledgements,
                        id
                    ),
                };

                history.push(episode);

                // Guardamos el nuevo episodio activo.
                openEpisodes[variable] = episode;
            }

            // Actualizamos el estado anterior.
            previousStatuses[variable] = currentStatus;
        }
    }

    return history;
}


/* --------------------------------------
    04. RESUMEN ACUMULADO
--------------------------------------- */
export function summarizeAlarmHistory(history) {

    if (!Array.isArray(history)) {

        return {
            total: 0,
            warningCount: 0,
            criticalCount: 0,
            acknowledgedCount: 0,
            pendingCount: 0,
        };
    }

    const warningCount = history.filter(
        (episode) => episode.status === "warning"
    ).length;

    const criticalCount = history.filter(
        (episode) => episode.status === "critical"
    ).length;

    const acknowledgedCount = history.filter(
        (episode) => episode.acknowledged === true
    ).length;

    return {
        total: history.length,
        warningCount,
        criticalCount,
        acknowledgedCount,
        pendingCount:
            history.length - acknowledgedCount,
    };
}
