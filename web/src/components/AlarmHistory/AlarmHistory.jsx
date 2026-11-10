/* ==========================================
    COMPONENT: ALARM HISTORY

    Registro detallado de episodios históricos.

    Responsabilidades:
    1. Mostrar los episodios acumulados.
    2. Identificar variable y severidad.
    3. Mostrar inicio, fin y duración.
    4. Diferenciar episodios activos.
    5. Mostrar el reconocimiento.
    6. Adaptarse a distintos dispositivos.
    7. Filtrar episodios históricos.
    8. Reconocer episodios finalizados.
    9. Exportar el historial a CSV.
=========================================== */
import { useMemo, useState } from "react";

import {
    exportAlarmHistoryToCSV,
} from "../../utils/export.js";

import {
    downloadCSV,
} from "../../utils/downloadCSV.js";

import {
    filterAlarmHistory,
    DEFAULT_ALARM_FILTERS,
} from "../../utils/alarmHistoryFilters.js";

import styles from "./AlarmHistory.module.css";

/* --------------------------------------
    01. CONFIGURACIÓN VISUAL
--------------------------------------- */

const VARIABLE_LABELS = {
    pressure: "Presión",
    temperature: "Temperatura",
};

const STATUS_LABELS = {
    warning: "Advertencia",
    critical: "Crítico",
};


/* --------------------------------------
    02. FORMATO DE LECTURAS
--------------------------------------- */

/*
    Los índices comienzan en cero.
    Sumamos uno para mostrarlos de forma más natural al operador.
*/
function formatReading(index) {

    if (!Number.isInteger(index)) {
        return "—";
    }

    return `#${index + 1}`;
}


/* --------------------------------------
    03. FORMATO DE DURACIÓN
--------------------------------------- */

function formatDuration(minutes) {

    if (
        !Number.isFinite(minutes) ||
        minutes < 0
    ) {
        return "—";
    }

    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (hours === 0) {
        return `${remainingMinutes} min`;
    }

    if (remainingMinutes === 0) {
        return `${hours} h`;
    }

    return `${hours} h ${remainingMinutes} min`;
}


/* --------------------------------------
    04. FILA DE INFORMACIÓN
--------------------------------------- */

function Detail({ label, children }) {

    return (
        <div className={styles.detail}>
            <span className={styles.detailLabel}>
                {label}
            </span>

            <strong className={styles.detailValue}>
                {children}
            </strong>
        </div>
    );
}


/* ---------------------------------------------------
    BOTÓN DE RECONOCIMIENTO HISTÓRICO
---------------------------------------------------- */
function AcknowledgeButton({
    episode,
    onAcknowledge,
}) {

    // Solo se reconocen desde el historial los episodios finalizados y pendientes.
    const canAcknowledge =
        episode.isActive === false &&
        episode.acknowledged === false &&
        typeof onAcknowledge === "function";

    if (!canAcknowledge) {
        return null;
    }

    return (
        <button
            type="button"
            className={styles.acknowledgeButton}
            onClick={() => onAcknowledge(episode.id)}
            aria-label={`Reconocer episodio de ${
                VARIABLE_LABELS[episode.variable] ??
                episode.variable
            }`}
        >
            Reconocer
        </button>
    );
}


/* --------------------------------------
    05. EPISODIO INDIVIDUAL
--------------------------------------- */

function EpisodeCard({ episode, onAcknowledge, }) {

    const variableLabel =
        VARIABLE_LABELS[episode.variable] ??
        episode.variable;

    const statusLabel =
        STATUS_LABELS[episode.status] ??
        episode.status;

    const statusClass =
        episode.status === "critical"
            ? styles.critical
            : styles.warning;

    return (
        <article className={styles.card}>

            <div className={styles.cardHeader}>

                <h3 className={styles.cardTitle}>
                    {variableLabel}
                </h3>

                <span
                    className={`${styles.severity} ${statusClass}`}
                >
                    {statusLabel}
                </span>

            </div>

            <div className={styles.cardDetails}>

                <Detail label="Inicio">
                    {formatReading(episode.startIndex)}
                </Detail>

                <Detail label="Última lectura">
                    {formatReading(
                        episode.lastObservedIndex
                    )}
                </Detail>

                <Detail label="Finalización">
                    {episode.isActive
                        ? "En curso"
                        : formatReading(episode.endIndex)}
                </Detail>

                <Detail label="Duración observada">
                    {formatDuration(
                        episode.durationMinutes
                    )}
                </Detail>

            </div>

            <div className={styles.cardFooter}>

                <span
                    className={
                        episode.isActive
                            ? styles.active
                            : styles.finished
                    }
                >
                    {episode.isActive
                        ? "Activa"
                        : "Finalizada"}
                </span>

                <span
                    className={
                        episode.acknowledged
                            ? styles.acknowledged
                            : styles.pending
                    }
                >
                    {episode.acknowledged
                        ? "Reconocida"
                        : "Sin reconocer"}
                </span>

                <AcknowledgeButton
                    episode={episode}
                    onAcknowledge={onAcknowledge}
                />
            </div>

        </article>
    );
}



/* --------------------------------------
    06. CONTROLES DE FILTRADO
--------------------------------------- */

function AlarmHistoryFilters({
    filters,
    onFilterChange,
    onReset,
}) {

    const hasActiveFilters = Object.values(
        filters
    ).some((value) => value !== "all");

    return (
        <div className={styles.filters}>

            <div className={styles.filtersHeader}>
                <h3 className={styles.filtersTitle}>
                    Filtrar episodios
                </h3>

                <button
                    type="button"
                    className={styles.resetButton}
                    onClick={onReset}
                    disabled={!hasActiveFilters}
                >
                    Restablecer filtros
                </button>
            </div>

            <div className={styles.filtersGrid}>

                <label className={styles.filterField}>
                    <span>Variable</span>

                    <select
                        value={filters.variable}
                        onChange={(event) =>
                            onFilterChange(
                                "variable",
                                event.target.value
                            )
                        }
                    >
                        <option value="all">
                            Todas
                        </option>
                        <option value="pressure">
                            Presión
                        </option>
                        <option value="temperature">
                            Temperatura
                        </option>
                    </select>
                </label>

                <label className={styles.filterField}>
                    <span>Severidad</span>

                    <select
                        value={filters.severity}
                        onChange={(event) =>
                            onFilterChange(
                                "severity",
                                event.target.value
                            )
                        }
                    >
                        <option value="all">
                            Todas
                        </option>
                        <option value="warning">
                            Advertencia
                        </option>
                        <option value="critical">
                            Crítico
                        </option>
                    </select>
                </label>

                <label className={styles.filterField}>
                    <span>Estado</span>

                    <select
                        value={filters.state}
                        onChange={(event) =>
                            onFilterChange(
                                "state",
                                event.target.value
                            )
                        }
                    >
                        <option value="all">
                            Todos
                        </option>
                        <option value="active">
                            Activos
                        </option>
                        <option value="finished">
                            Finalizados
                        </option>
                    </select>
                </label>

                <label className={styles.filterField}>
                    <span>Reconocimiento</span>

                    <select
                        value={filters.acknowledgement}
                        onChange={(event) =>
                            onFilterChange(
                                "acknowledgement",
                                event.target.value
                            )
                        }
                    >
                        <option value="all">
                            Todos
                        </option>
                        <option value="acknowledged">
                            Reconocidos
                        </option>
                        <option value="pending">
                            Pendientes
                        </option>
                    </select>
                </label>

            </div>
        </div>
    );
}


/* --------------------------------------
    07. COMPONENTE PRINCIPAL
--------------------------------------- */

export default function AlarmHistory({
    history = [],
    onAcknowledge,
}) {

    /* --------------------------------
        ESTADO DE LOS FILTROS
    -------------------------------- */
    const [filters, setFilters] = useState(() => ({ ...DEFAULT_ALARM_FILTERS }));

    /* --------------------------------------
        HISTORIAL FILTRADO
    -------------------------------------- */
    const episodes = useMemo(() => {
        const filtered = filterAlarmHistory(
            history,
            filters
        );

        // Episodios recientes primero.
        return [...filtered].reverse();

    }, [history, filters]);

    /* ----------------------------------------
        EXPORTACIÓN DEL HISTORIAL
    ---------------------------------------- */
    
    /*
        Descarga todos los episodios históricos, independientemente de los filtros.
    */
    function handleExportAll() {

        const csv = exportAlarmHistoryToCSV(history);

        downloadCSV(
            csv,
            "historial-alarmas-completo.csv"
        );
    }
    
    /* ----------------------------------------------
        EXPORTAR RESULTADOS FILTRADOS
    ---------------------------------------------- */
    /*
        Descarga únicamente los episodios que cumple los filtros seleccionados.

        La variable episodes ya contiene los resultados filtrados y ordenados.
    */
    function handleExportFiltered() {

        const csv = exportAlarmHistoryToCSV(episodes);

        downloadCSV(
            csv,
            "historial-alarmas-completo.csv"
        );
    }


    /* ------------------------------------------
        EXPORTAR RESULTADOS FILTRADOS
    ------------------------------------------ */
    function handleFilterChange(name, value) {

        setFilters((previous) => ({
            ...previous,
            [name]: value,
        }));
    }

    /* --------------------------------------
        RESTABLECER FILTROS
    -------------------------------------- */
    function handleResetFilters() {

        setFilters({ ...DEFAULT_ALARM_FILTERS });
    }

    const totalEpisodes = Array.isArray(history) ? history.length : 0;
    const visibleEpisodes = episodes.length;
    
    return (
        <section
            className={styles.panel}
            aria-labelledby="alarm-history-detail-title"
        >

            <header className={styles.header}>

                <div>
                    <span className={styles.eyebrow}>
                        SUPERVISIÓN / HISTORIAL
                    </span>

                    <h2
                        id="alarm-history-detail-title"
                        className={styles.title}
                    >
                        Registro histórico de alarmas
                    </h2>

                    <p className={styles.description}>
                        Episodios detectados desde el inicio
                        de la simulación hasta la lectura actual.
                    </p>
                </div>

                <span className={styles.counter}>
                    {totalEpisodes} episodios
                </span>

            </header>

            <AlarmHistoryFilters
                filters={filters}
                onFilterChange={handleFilterChange}
                onReset={handleResetFilters}
            />

            {/* ----------------------------------------------
                EXPORTACIÓN DEL HISTORIAL
            ---------------------------------------------- */}
            <div className={styles.exportActions}>

                {/* Historial completo */}
                <button
                    type="button"
                    className={styles.exportButton}
                    onClick={handleExportAll}
                    disabled={totalEpisodes === 0}
                >
                    Descargar historial completo
                </button>

                {/* Resultados filtrados */}
                <button
                    className={styles.exportButtonSecondary}
                    onClick={handleExportFiltered}
                    disabled={visibleEpisodes === 0}
                >
                    Descargar resultado filtrados
                </button>
            </div>

            <p className={styles.results} role="status">
                Mostrando {visibleEpisodes} de {totalEpisodes} episodios
            </p>

            {episodes.length === 0 ? (

                <p className={styles.empty}>
                    {totalEpisodes === 0
                        ? "Todavía no se registraron episodios de advertencia o estado crítico."
                        : "No se encontraron episodios que coincidan con los filtros seleccionados."}
                </p>

            ) : (

                <>
                    {/* VISTA MÓVIL */}

                    <div className={styles.cards}>
                        {episodes.map((episode) => (
                            <EpisodeCard
                                key={episode.id}
                                episode={episode}
                                onAcknowledge={onAcknowledge}
                            />
                        ))}
                    </div>

                    {/* VISTA TABLET / DESKTOP */}

                    <div className={styles.tableContainer}>

                        <table className={styles.table}>

                            <caption className={styles.srOnly}>
                                Historial detallado de episodios
                                de alarmas industriales
                            </caption>

                            <thead>
                                <tr>
                                    <th scope="col">Variable</th>
                                    <th scope="col">Severidad</th>
                                    <th scope="col">Inicio</th>
                                    <th scope="col">Última</th>
                                    <th scope="col">Fin</th>
                                    <th scope="col">Duración</th>
                                    <th scope="col">Estado</th>
                                    <th scope="col">Reconocimiento</th>
                                    <th scope="col">Acción</th>
                                </tr>
                            </thead>

                            <tbody>
                                {episodes.map((episode) => (

                                    <tr key={episode.id}>

                                        <td>
                                            {VARIABLE_LABELS[
                                                episode.variable
                                            ] ?? episode.variable}
                                        </td>

                                        <td>
                                            <span
                                                className={`${styles.severity} ${
                                                    episode.status === "critical"
                                                        ? styles.critical
                                                        : styles.warning
                                                }`}
                                            >
                                                {STATUS_LABELS[
                                                    episode.status
                                                ] ?? episode.status}
                                            </span>
                                        </td>

                                        <td>
                                            {formatReading(
                                                episode.startIndex
                                            )}
                                        </td>

                                        <td>
                                            {formatReading(
                                                episode.lastObservedIndex
                                            )}
                                        </td>

                                        <td>
                                            {episode.isActive
                                                ? "En curso"
                                                : formatReading(
                                                    episode.endIndex
                                                )}
                                        </td>

                                        <td>
                                            {formatDuration(
                                                episode.durationMinutes
                                            )}
                                        </td>

                                        <td>
                                            <span
                                                className={
                                                    episode.isActive
                                                        ? styles.active
                                                        : styles.finished
                                                }
                                            >
                                                {episode.isActive
                                                    ? "Activa"
                                                    : "Finalizada"}
                                            </span>
                                        </td>

                                        <td>
                                            <span
                                                className={
                                                    episode.acknowledged
                                                        ? styles.acknowledged
                                                        : styles.pending
                                                }
                                            >
                                                {episode.acknowledged
                                                    ? "Reconocida"
                                                    : "Sin reconocer"}
                                            </span>
                                        </td>

                                        <td>
                                            <AcknowledgeButton
                                                episode={episode}
                                                onAcknowledge={onAcknowledge}
                                            />
                                        </td>
                                    </tr>

                                ))}
                            </tbody>

                        </table>

                    </div>
                </>

            )}

        </section>
    );
}
