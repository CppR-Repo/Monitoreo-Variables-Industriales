/* ==========================================
    UTILITY: ALARM HISTORY FILTERS

    Filtrado combinado de episodios históricos.

    Responsabilidades:
    1. Filtrar por variable.
    2. Filtrar por severidad.
    3. Filtrar por estado operativo.
    4. Filtrar por reconocimiento.
    5. Conservar los datos originales.
=========================================== */

/* --------------------------------------
    01. CONFIGURACIÓN
--------------------------------------- */

export const DEFAULT_ALARM_FILTERS = {
    variable: "all",
    severity: "all",
    state: "all",
    acknowledgement: "all",
};


/* --------------------------------------
    02. FILTRAR EPISODIOS
--------------------------------------- */

export function filterAlarmHistory(
    history,
    filters = DEFAULT_ALARM_FILTERS
) {

    // Protección ante entradas inválidas.
    if (!Array.isArray(history)) {
        return [];
    }

    const selectedFilters = {
        ...DEFAULT_ALARM_FILTERS,
        ...(filters ?? {}),
    };

    return history.filter((episode) => {

        // Variable industrial.
        const matchesVariable =
            selectedFilters.variable === "all" ||
            episode.variable === selectedFilters.variable;

        // Nivel de severidad.
        const matchesSeverity =
            selectedFilters.severity === "all" ||
            episode.status === selectedFilters.severity;

        // Estado operativo del episodio.
        const matchesState =
            selectedFilters.state === "all" ||
            (
                selectedFilters.state === "active" &&
                episode.isActive === true
            ) ||
            (
                selectedFilters.state === "finished" &&
                episode.isActive === false
            );

        // Estado de reconocimiento.
        const matchesAcknowledgement =
            selectedFilters.acknowledgement === "all" ||
            (
                selectedFilters.acknowledgement === "acknowledged" &&
                episode.acknowledged === true
            ) ||
            (
                selectedFilters.acknowledgement === "pending" &&
                episode.acknowledged === false
            );

        return (
            matchesVariable &&
            matchesSeverity &&
            matchesState &&
            matchesAcknowledgement
        );
    });
}
