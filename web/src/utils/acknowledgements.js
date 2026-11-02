
/* ==========================================
    UTILITY: ALARM ACKNOWLEDGEMENTS

    Identificación y reconocimiento de
    episodios de alarmas industriales.

    Funciones puras, independientes de React.
=========================================== */

/* --------------------------------------
    01. ESTADOS RECONOCIBLES
--------------------------------------- */
const ALARM_STATUSES = new Set([
    "warning",
    "critical",
]);


/* --------------------------------------
    02. IDENTIFICACIÓN DE EPISODIOS
--------------------------------------- */
/*
    Genera un identificador para un episodio.

    Cada episodio queda asociado a:
    - Escenario
    - Variable
    - Índice de inicio
    - Severidad

    @returns {string|null}
*/
export function createAlarmEpisodeId({
    scenario,
    variable,
    startIndex,
    status,
} = {}) {

    if (
        typeof scenario !== "string" ||
        scenario.length === 0 ||
        typeof variable !== "string" ||
        variable.length === 0 ||
        !Number.isInteger(startIndex) ||
        startIndex < 0 ||
        !ALARM_STATUSES.has(status)
    ) {
        return null;
    }

    return JSON.stringify([
        scenario,
        variable,
        startIndex,
        status,
    ]);
}


/* ---------------------------------------
    03. RECONOCER UNA ALARMA
---------------------------------------- */
/*
    Registra el reconocimiento de un episodio.

    Devuelve un nuevo objeto para evitar
    mutaciones directas del estado de React.
*/
export function acknowledgeAlarm(
    acknowledgements,
    episodeId
) {

    const current =
        acknowledgements &&
        typeof acknowledgements === "object" &&
        !Array.isArray(acknowledgements)
            ? acknowledgements
            : {};

    if (
        typeof episodeId !== "string" ||
        episodeId.length === 0
    ) {
        return current;
    }

    if (current[episodeId] === true) {
        return current;
    }

    return {
        ...current,
        [episodeId]: true,
    };
}


/* ------------------------------------------
    04. CONSULTAR RECONOCIMIENTO
------------------------------------------ */ 
/*
    Comprueba si un episodio fue reconocido.
*/
export function isAlarmAcknowledged(
    acknowledgements,
    episodeId
) {

    if (
        !acknowledgements ||
        typeof acknowledgements !== "object" ||
        Array.isArray(acknowledgements) ||
        typeof episodeId !== "string"
    ) {
        return false;
    }

    return acknowledgements[episodeId] === true;
}


/* ----------------------------------------
    05. REINICIAR RECONOCIMIENTOS
---------------------------------------- */
/*
    Genera un estado vacío.

    Se utilizará cuando se reinicie
    completamente la simulación.
*/
export function resetAcknowledgements() {
    return {};
}
