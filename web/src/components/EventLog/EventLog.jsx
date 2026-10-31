
/* ==========================================
    COMPONENT: EVENT LOG
    Historial de eventos y alarmas industriales
=========================================== */

import styles from "./EventLog.module.css";


/* ---------------------------------------
    01. CONFIGURACIÓN DE ESTADOS
---------------------------------------- */

/*
    Información visual asociada a cada estado.

    Las claves coinciden con los valores
    devueltos por evaluateReading().
*/
const STATUS_LABELS = {
    normal: "Normal",
    warning: "Advertencia",
    critical: "Crítico",
};


/* --------------------------------------
    02. COMPONENTE PRINCIPAL
--------------------------------------- */

/*
    Muestra los cambios de estado registrados
    durante la simulación.

    @param {Object} props
    @param {Array} props.events
*/
export default function EventLog({ events = [] }) {

    /* ----------------------------------
        ORDEN DE LOS EVENTOS
    ----------------------------------- */

    /*
        Mostramos primero los eventos más
        recientes, sin modificar el arreglo
        original recibido por props.
     */
    const sortedEvents = [...events].reverse();

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
                    aria-label={`${events.length} eventos registrados`}
                >
                    {events.length} eventos
                </span>

            </header>


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

            ) : (

                <div className={styles.tableWrapper}>

                    <table className={styles.table}>

                        <caption className={styles.srOnly}>
                            Historial de eventos de presión
                            y temperatura, ordenado del
                            más reciente al más antiguo.
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
