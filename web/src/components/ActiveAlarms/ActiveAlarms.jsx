/* ==========================================
    COMPONENT: ACTIVE ALARMS

    Panel de alarmas industriales activas con reconocimiento individual.

    Arquitectura:
    - AlarmCard: tarjeta individual.
    - AlarmOverview: resumen del proceso.
    - ActiveAlarms: componente principal.
=========================================== */

import {
    getActiveAlarms,
    summarizeAlarms,
} from "../../utils/alarms.js";

import notificationIcon from "../../assets/icons/notificacion.svg"

import styles from "./ActiveAlarms.module.css";


/* --------------------------------------
    01. CONFIGURACIÓN VISUAL
--------------------------------------- */

/*
    Etiquetas correspondientes a los
    estados de las variables industriales.
*/
const STATUS_LABELS = {
    normal: "Operación normal",
    warning: "Advertencia",
    critical: "Estado crítico",
};

/*
    Formato numérico para Argentina.
*/
const numberFormatter = new Intl.NumberFormat("es-AR", {
    maximumFractionDigits: 2,
});


/* --------------------------------------
    02. TARJETA DE ALARMA
--------------------------------------- */

/*
    Muestra:
    - Variable y severidad.
    - Valor actual.
    - Umbral.
    - Estado de reconocimiento.
    - Acción del operador.
*/
function AlarmCard({ alarm, episode, onAcknowledge, }) {

    const isCritical = alarm.status === "critical";

    const isAcknowledged = episode?.acknowledged === true;

    const canAcknowledge = Boolean(episode?.id) && typeof onAcknowledge === "function";

    const message = isCritical
        ? "La variable alcanzó el umbral crítico."
        : "La variable superó el umbral de advertencia.";

    function handleAcknowledge() {

        if (
            !canAcknowledge || isAcknowledged
        ) {
            return;
        }

        onAcknowledge(episode.id);
    }

    return (
        <article
            className={`${styles.alarmCard} ${styles[alarm.status]}`}
        >

            {/* ENCABEZADO DE LA ALARMA */}

            <div className={styles.alarmHeader}>

                <h3 className={styles.alarmTitle}>
                    {alarm.label}
                </h3>

                <span className={styles.alarmStatus}>
                    {STATUS_LABELS[alarm.status]}
                </span>

            </div>


            {/* VALOR ACTUAL */}

            <p className={styles.alarmValue}>

                {numberFormatter.format(alarm.value)}

                <span className={styles.unit}>
                    {alarm.unit}
                </span>

            </p>


            {/* UMBRAL CORRESPONDIENTE */}

            <p className={styles.alarmThreshold}>
                Umbral:{" "}
                {numberFormatter.format(alarm.threshold)}{" "}
                {alarm.unit}
            </p>


            {/* DESCRIPCIÓN */}

            <p className={styles.alarmMessage}>
                {message}
            </p>

            {/* RECONOCIMIENTO */}

            <div className={styles.acknowledgement}>

                <div className={styles.acknowledgementInfo}>
                    <img
                        src={notificationIcon}
                        alt=""
                        aria-hidden
                        className={styles.notificationIcon}
                    />

                    <span
                        className={`${styles.acknowledgementStatus} ${isAcknowledged ? styles.acknowledged : styles.pending
                            }`}
                    >
                        {isAcknowledged ? "Alarma reconocida" : "Pendiente de reconocimiento"}
                    </span>

                </div>

                <button
                    type="button"
                    className={styles.acknowledgeButton}
                    onClick={handleAcknowledge}
                    disabled={!canAcknowledge || isAcknowledged}
                    aria-label={`Reconocer alarma de ${alarm.label}`}>
                    {isAcknowledged ? "Reconocida" : "Reconocer alarma"}
                </button>
            </div>

        </article>
    );
}


/* --------------------------------------
    03. RESUMEN DEL PROCESO
--------------------------------------- */

/*
    Presenta el estado general y la cantidad
    de alarmas activas por severidad.
*/
function AlarmOverview({ summary, pendingCount, acknowledgedCount, }) {

    return (
        <aside
            className={styles.overview}
            aria-label="Resumen de alarmas"
        >

            <h3 className={styles.overviewTitle}>
                Resumen del proceso
            </h3>


            {/* ESTADO GENERAL */}

            <div className={styles.overviewRow}>

                <span>Estado general</span>

                <strong
                    className={styles[summary.overallStatus]}
                >
                    {STATUS_LABELS[summary.overallStatus]}
                </strong>

            </div>


            {/* ADVERTENCIAS */}

            <div className={styles.overviewRow}>
                <span>Advertencias</span>
                <strong>{summary.warningCount}</strong>
            </div>


            {/* ALARMAS CRÍTICAS */}

            <div className={styles.overviewRow}>
                <span>Alarmas críticas</span>
                <strong> {summary.criticalCount}</strong>
            </div>

            {/* PENDIENTES */}
            <div className={styles.overviewRow}>
                <span>Pendientes de reconocimiento</span>
                <strong className={styles.pendingCount}>
                    {pendingCount}
                </strong>
            </div>

            {/* RECONOCIDAS */}
            <div className={styles.overviewRow}>
                <span>Alarma reconocidas</span>

                <strong className={styles.acknowledgedCount}>
                    {acknowledgedCount}
                </strong>
            </div>

            {/* VARIABLES */}

            <div className={styles.overviewRow}>
                <span>Variables monitoreadas</span>
                <strong>2</strong>
            </div>

        </aside>
    );
}


/* ==========================================
    04. RESUMEN HISTÓRICO DE ALARMAS
=========================================== */

/*
    Presenta los episodios acumulados desde el inicio de la simulación 
    hasta la medición actual.

    A diferencia de AlarmOverview:
    - No representa únicamente alarmas activas.
    - Conserva los episodios ya finalizados.
    - Incluye los reconocimientos históricos.
*/
function AlarmHistoryOverview({ summary }) {

    return (
        <aside
            className={styles.historyOverview}
            aria-labelledby="alarm-history-title"
        >

            {/* ENCABEZADO */}

            <div className={styles.historyHeader}>

                <div>
                    <h3
                        id="alarm-history-title"
                        className={styles.historyTitle}
                    >
                        Historial acumulado
                    </h3>

                    <p className={styles.historyDescription}>
                        Episodios registrados hasta la
                        medición actual.
                    </p>
                </div>

            </div>


            {/* CONTADORES DE EPISODIOS */}

            <div className={styles.historyStats}>

                <div className={styles.historyStat}>
                    <span className={styles.historyStatLabel}>
                        Episodios totales
                    </span>

                    <strong className={styles.historyStatValue}>
                        {summary.total}
                    </strong>
                </div>

                <div className={`${styles.historyStat} ${styles.historyWarning}`}>
                    <span className={styles.historyStatLabel}>
                        Advertencias
                    </span>

                    <strong className={styles.historyStatValue}>
                        {summary.warningCount}
                    </strong>
                </div>

                <div className={`${styles.historyStat} ${styles.historyCritical}`}>
                    <span className={styles.historyStatLabel}>
                        Críticos
                    </span>

                    <strong className={styles.historyStatValue}>
                        {summary.criticalCount}
                    </strong>
                </div>

            </div>


            {/* RECONOCIMIENTOS HISTÓRICOS */}

            <div className={styles.historyAcknowledgements}>

                <div className={styles.historyRow}>
                    <span>Episodios reconocidos</span>

                    <strong className={styles.historyAcknowledged}>
                        {summary.acknowledgedCount}
                    </strong>
                </div>

                <div className={styles.historyRow}>
                    <span>Episodios sin reconocer</span>

                    <strong className={styles.historyPending}>
                        {summary.pendingCount}
                    </strong>
                </div>

            </div>

        </aside>
    );
}


/* --------------------------------------
    05. PANEL PRINCIPAL
--------------------------------------- */

/*
    Muestra las alarmas activas de la
    lectura actual.

    Recibe los valores del hook useSimulation
    mediante las propiedades de App.jsx.

    No almacena eventos históricos.
*/
export default function ActiveAlarms({
    currentReading,
    statuses,

    // Episodios activos.
    alarmEpisodes = [],
    onAcknowledge,

    // Resumen histórico.
    alarmHistorySummary,
}) {

    /* ------------------------------------
        GENERACIÓN DE ALARMAS
    ------------------------------------ */

    const alarms = getActiveAlarms(
        currentReading,
        statuses
    );

    const summary = summarizeAlarms(alarms);

    const isNormal =
        summary.overallStatus === "normal";

    /* --------------------------------------
        RELACIÓN ALARMA / EPISODIO
    --------------------------------------- */

    /*
    Relacionamos cada alarma activa con el episodio correspondiente.

    alarm.variable identifica la variable:
    - pressure
    - temperature

    También comprobamos la severidad para evitar
    asociar episodios de estados diferentes.
    */
    const alarmsWithEpisodes = alarms.map((alarm) => {

        const episode = alarmEpisodes.find(
            (item) => item.variable === alarm.variable && item.status === alarm.status
        );

        return {
            alarm,
            episode,
        };
    });


    /* -------------------------------------------
        RESUMEN DE RECONOCIMIENTOS
    ------------------------------------------- */

    const acknowledgedCount = alarmsWithEpisodes.filter(
        ({ episode }) => episode?.acknowledged === true
    ).length;

    const pendingCount = summary.total - acknowledgedCount;


    /* -----------------------------------------
        TEXTO DEL INDICADOR GENERAL
    ----------------------------------------- */

    const summaryText = isNormal
        ? "Sin alarmas activas"
        : `${summary.total} ${summary.total === 1
            ? "alarma activa"
            : "alarmas activas"
        }`;


    /* ----------------------------------
        RENDERIZADO
    ----------------------------------- */

    return (
        <section
            className={styles.panel}
            aria-labelledby="active-alarms-title"
        >

            {/* ==================================
                ENCABEZADO DEL PANEL
            =================================== */}

            <header className={styles.header}>

                <div className={styles.heading}>

                    <span className={styles.eyebrow}>
                        SUPERVISIÓN / ALARMAS
                    </span>

                    <h2
                        id="active-alarms-title"
                        className={styles.title}
                    >
                        Alarmas activas
                    </h2>

                    <p className={styles.description}>
                        Estado de las variables en
                        la medición actual.
                    </p>

                </div>


                {/* INDICADOR DE ALARMAS */}

                <span
                    className={`${styles.summary} ${styles[summary.overallStatus]
                        }`}
                >
                    {summaryText}
                </span>

            </header>


            {/* ==================================
                CONTENIDO PRINCIPAL
            =================================== */}

            <div className={styles.content}>

                {/* ---------------------------------
                    ZONA IZQUIERDA: ALARMAS
                --------------------------------- */}

                <div className={styles.mainContent}>

                    {isNormal ? (

                        <div className={styles.normalState}>

                            <span
                                className={styles.normalIndicator}
                                aria-hidden="true"
                            />

                            <div>

                                <h3 className={styles.normalTitle}>
                                    Proceso en condiciones normales
                                </h3>

                                <p className={styles.normalDescription}>
                                    No se detectan alarmas activas
                                    en la lectura actual.
                                </p>

                            </div>

                        </div>

                    ) : (

                        <div className={styles.alarmsGrid}>

                            {alarmsWithEpisodes.map(({ alarm, episode }) => (

                                <AlarmCard
                                    key={episode?.id ?? alarm.id}
                                    alarm={alarm}
                                    episode={episode}
                                    onAcknowledge={onAcknowledge}
                                />

                            ))}

                        </div>

                    )}

                </div>


                {/* ------------------------------
                    ZONA DERECHA: RESUMEN
                   ------------------------------ */}

                <AlarmOverview
                    summary={summary}
                    pendingCount={pendingCount}
                    acknowledgedCount={acknowledgedCount}
                />

            </div>

            {/* -----------------------------------------------------
                    HISTORIAL ACUMULADO DE ALARMAS
            ------------------------------------------------------ */}
            <AlarmHistoryOverview
                summary={alarmHistorySummary}
            />

        </section>
    );
}
