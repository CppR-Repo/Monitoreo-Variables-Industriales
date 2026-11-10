/* ==========================================
    UTILITY: HISTORICAL ACKNOWLEDGEMENTS

    Reconocimiento de episodios históricos.

    Responsabilidades:
    1. Validar el identificador.
    2. Verificar que el episodio exista.
    3. Comprobar que esté finalizado.
    4. Evitar reconocimientos duplicados.
    5. Conservar la inmutabilidad.
=========================================== */

import {
    acknowledgeAlarm,
    isAlarmAcknowledged,
} from "./acknowledgements.js";


/* ----------------------------------------------------
    01. VALIDAR RECONOCIMIENTO HISTÓRICO
---------------------------------------------------- */

export function canAcknowledgeHistoricalAlarm(
    history,
    episodeId,
    acknowledgements = {}
) {

    // El identificador debe ser válido.
    if (
        typeof episodeId !== "string" ||
        episodeId.length === 0
    ) {
        return false;
    }

    // El historial debe ser un arreglo.
    if (!Array.isArray(history)) {
        return false;
    }

    // Buscamos el episodio correspondiente.
    const episode = history.find(
        (item) => item.id === episodeId
    );

    // El episodio debe existir y estar finalizado.
    if (!episode || episode.isActive !== false) {
        return false;
    }

    // No permitimos reconocerlo nuevamente.
    if (
        episode.acknowledged === true ||
        isAlarmAcknowledged(
            acknowledgements,
            episodeId
        )
    ) {
        return false;
    }

    return true;
}


/* ----------------------------------------------
    02. RECONOCER EPISODIO HISTÓRICO
---------------------------------------------- */

export function acknowledgeHistoricalEpisode({
    history,
    episodeId,
    acknowledgements = {},
}) {

    const canAcknowledge =
        canAcknowledgeHistoricalAlarm(
            history,
            episodeId,
            acknowledgements
        );

    // Si no cumple las condiciones,
    // conservamos el estado original.
    if (!canAcknowledge) {
        return acknowledgements;
    }

    // Registramos el reconocimiento
    // utilizando la utilidad existente.
    return acknowledgeAlarm(
        acknowledgements,
        episodeId
    );
}
