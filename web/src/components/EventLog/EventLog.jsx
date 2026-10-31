/* ==========================================
    COMPONENT: EVENT LOG
    Historial de eventos y alarmas industriales
=========================================== */

import { useState } from "react";

import styles from "./EventLog.module.css";


/* --------------------------------------
    01. CONFIGURACIÓN DE ESTADOS
--------------------------------------- */

const STATUS_LABELS = {
    normal: "Normal",
    warning: "Advertencia",
    critical: "Crítico",
};


/* --------------------------------------
    02. COMPONENTE PRINCIPAL
--------------------------------------- */

/*
    Muestra el historial de transiciones
    y permite filtrar por variable y estado.

    @param {Object} props
    @param {Array} props.events
 */
export default function EventLog({ events = [] }) {

    /* ----------------------------------
        ESTADO DE LOS FILTROS
    ----------------------------------- */

    const [variableFilter, setVariableFilter] = useState("all");
    const [statusFilter, setStatusFilter] = useState("all");


    /* ----------------------------------
        FILTRADO DE EVENTOS
    ----------------------------------- */

    /*
        Aplicamos ambos filtros sobre los
        eventos recibidos por props.

        No modificamos el arreglo original.
     */
    const filteredEvents = events.filter((event) => {

        const matchesVariable =
            variableFilter === "all" ||
            event.variable === variableFilter;

        const matchesStatus =
            statusFilter === "all" ||
            event.status === statusFilter;

        return matchesVariable && matchesStatus;
    });


    /* ----------------------------------
        ORDEN CRONOLÓGICO
    ----------------------------------- */

    // Los eventos más recientes aparecen primero.
    const sortedEvents = [...filteredEvents].reverse();


    /* ----------------------------------
        RESTABLECER FILTROS
    ----------------------------------- */

    function resetFilters() {
        setVariableFilter("all");
        setStatusFilter("all");
    }

    const hasActiveFilters =
        variableFilter !== "all" ||
        statusFilter !== "all";


    /* ----------------------------------
        RENDERIZADO
    ----------------------------------- */

    return (
        <section
            className={styles.eventLog}
            aria-labelledby="event-log-title"
        >

            {/* ENCABEZADO */}

            <header className={styles.header}>

                <div className={styles.heading}>

                    <span className={styles.eyebrow}>
                        MONITOREO / EVENTOS
                    </span>

                    <h2
                        id="event-log-title"
                        className={styles.title}
                    >
                        Historial de eventos
                    </h2>

                    <p className={styles.description}>
                        Registro de cambios de estado
                        durante la simulación.
                    </p>

                </div>

                <span
                    className={styles.counter}
                    aria-label={`${filteredEvents.length} eventos encontrados de ${events.length} registrados`}
                >
                    {filteredEvents.length} / {events.length} eventos
                </span>

            </header>


            {/* FILTROS */}

            <div
                className={styles.filters}
                aria-label="Filtros del historial"
            >

                <div className={styles.filterGroup}>

                    <label
                        className={styles.filterLabel}
                        htmlFor="event-variable-filter"
                    >
                        Variable
                    </label>

                    <select
                        id="event-variable-filter"
                        className={styles.filterSelect}
                        value={variableFilter}
                        onChange={(event) =>
                            setVariableFilter(event.target.value)
                        }
                    >
                        <option value="all">
                            Todas las variables
                        </option>

                        <option value="pressure">
                            Presión
                        </option>

                        <option value="temperature">
                            Temperatura
                        </option>
                    </select>

                </div>


                <div className={styles.filterGroup}>

                    <label
                        className={styles.filterLabel}
                        htmlFor="event-status-filter"
                    >
                        Estado
                    </label>

                    <select
                        id="event-status-filter"
                        className={styles.filterSelect}
                        value={statusFilter}
                        onChange={(event) =>
                            setStatusFilter(event.target.value)
                        }
                    >
                        <option value="all">
                            Todos los estados
                        </option>

                        <option value="normal">
                            Normal
                        </option>

                        <option value="warning">
                            Advertencia
                        </option>

                        <option value="critical">
                            Crítico
                        </option>
                    </select>

                </div>


                <button
                    type="button"
                    className={styles.resetButton}
                    onClick={resetFilters}
                    disabled={!hasActiveFilters}
                >
                    Restablecer filtros
                </button>

            </div>


            {/* CONTENIDO */}

            {events.length === 0 ? (

                <div
                    className={styles.emptyState}
                    role="status"
                >
                    <span
                        className={styles.emptyIndicator}
                        aria-hidden="true"
                    />

                    <p className={styles.emptyTitle}>
                        Sin eventos registrados
                    </p>

                    <p className={styles.emptyDescription}>
                        Los cambios de estado aparecerán
                        aquí a medida que avance la simulación.
                    </p>
                </div>

            ) : sortedEvents.length === 0 ? (

                <div
                    className={styles.emptyState}
                    role="status"
                >
                    <p className={styles.emptyTitle}>
                        No se encontraron eventos
                    </p>

                    <p className={styles.emptyDescription}>
                        No hay eventos que coincidan
                        con los filtros seleccionados.
                    </p>

                    <button
                        type="button"
                        className={styles.resetButton}
                        onClick={resetFilters}
                    >
                        Mostrar todos los eventos
                    </button>
                </div>

            ) : (

                <div className={styles.tableWrapper}>

                    <table className={styles.table}>

                        <caption className={styles.srOnly}>
                            Historial filtrado de eventos
                            de presión y temperatura,
                            ordenado del más reciente
                            al más antiguo.
                        </caption>

                        <thead>
                            <tr>
                                <th scope="col">Tiempo</th>
                                <th scope="col">Variable</th>
                                <th scope="col">Medición</th>
                                <th scope="col">Estado</th>
                            </tr>
                        </thead>

                        <tbody>

                            {sortedEvents.map((event) => (

                                <tr key={event.id}>

                                    <td
                                        className={styles.timeCell}
                                        data-label="Tiempo"
                                    >
                                        {event.elapsedMinutes} min
                                    </td>

                                    <td data-label="Variable">
                                        {event.label}
                                    </td>

                                    <td
                                        className={styles.valueCell}
                                        data-label="Medición"
                                    >
                                        {event.value} {event.unit}
                                    </td>

                                    <td data-label="Estado">

                                        <span
                                            className={[
                                                styles.status,
                                                styles[event.status],
                                            ].join(" ")}
                                        >
                                            <span
                                                className={styles.statusDot}
                                                aria-hidden="true"
                                            />

                                            {STATUS_LABELS[event.status]}
                                        </span>

                                    </td>

                                </tr>

                            ))}

                        </tbody>

                    </table>

                </div>

            )}

        </section>
    );
}
