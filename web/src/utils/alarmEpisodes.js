/* ==========================================
    UTILITY: ALARM EPISODES

    Identificación del inicio de cada episodio
    de alarma durante la simulación.
=========================================== */

import { evaluateReading } from "./thresholds.js";

import {
    createAlarmEpisodeId,
} from "./acknowledgements.js";


/* --------------------------------------
    01. VARIABLES SUPERVISADAS
--------------------------------------- */

const VARIABLES = [
    "pressure",
    "temperature",
];

const ALARM_STATUSES = new Set([
    "warning",
    "critical",
]);


/* ----------------------------------------
    02. OBTENER EPISODIOS ACTIVOS
---------------------------------------- */

/*
    Determina qué episodio corresponde
    a cada variable en el índice solicitado.

    Un episodio comienza cuando:
    - La variable ingresa en advertencia.
    - La variable ingresa en estado crítico.
    - Cambia entre crítico y advertencia.

    @returns {Array}
*/
export function getCurrentAlarmEpisodes({
    readings,
    currentIndex,
    scenario,
} = {}) {

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

    const lastIndex = Math.min(
        currentIndex,
        readings.length - 1
    );

    const activeEpisodes = [];

    for (const variable of VARIABLES) {

        let previousStatus = "normal";
        let startIndex = null;

        for (let index = 0; index <= lastIndex; index++) {

            const statuses = evaluateReading(
                readings[index]
            );

            const currentStatus = statuses[variable];

            if (currentStatus !== previousStatus) {

                startIndex = ALARM_STATUSES.has(
                    currentStatus
                )
                    ? index
                    : null;
            }

            previousStatus = currentStatus;
        }

        if (
            ALARM_STATUSES.has(previousStatus) &&
            startIndex !== null
        ) {

            activeEpisodes.push({
                variable,
                status: previousStatus,
                startIndex,

                id: createAlarmEpisodeId({
                    scenario,
                    variable,
                    startIndex,
                    status: previousStatus,
                }),
            });
        }
    }

    return activeEpisodes;
}