/* ==========================================
    COMPONENT: ACTIVE ALARMS
    Panel de alarmas industriales activas
=========================================== */

import {
    getActiveAlarms,
    summarizeAlarms,
} from "../../utils/alarms.js";

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

    Ejemplo:
    496.82 -> 496,82
*/
const numberFormatter = new Intl.NumberFormat("es-AR", {
    maximumFractionDigits: 2,
});


/* --------------------------------------
    02. TARJETA DE ALARMA
--------------------------------------- */

/*
    Representa una variable que actualmente
    se encuentra en advertencia o estado crítico.

    @param {Object} alarm
*/
function AlarmCard({ alarm }) {

    const isCritical = alarm.status === "critical";

    const message = isCritical
        ? "La variable alcanzó el umbral crítico."
        : "La variable superó el umbral de advertencia.";

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
function AlarmOverview({ summary }) {

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

                <strong>
                    {summary.warningCount}
                </strong>

            </div>


            {/* ALARMAS CRÍTICAS */}

            <div className={styles.overviewRow}>

                <span>Alarmas críticas</span>

                <strong>
                    {summary.criticalCount}
                </strong>

            </div>


            {/* VARIABLES SUPERVISADAS */}

            <div className={styles.overviewRow}>

                <span>Variables monitoreadas</span>

                <strong>2</strong>

            </div>

        </aside>
    );
}


/* --------------------------------------
    04. PANEL PRINCIPAL
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
        TEXTO DEL INDICADOR GENERAL
    -------------------------------------- */

    const summaryText = isNormal
        ? "Sin alarmas activas"
        : `${summary.total} ${
            summary.total === 1
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
                    className={`${styles.summary} ${
                        styles[summary.overallStatus]
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

                            {alarms.map((alarm) => (

                                <AlarmCard
                                    key={alarm.id}
                                    alarm={alarm}
                                />

                            ))}

                        </div>

                    )}

                </div>


                {/* ------------------------------
                    ZONA DERECHA: RESUMEN
                   ------------------------------ */}

                <AlarmOverview summary={summary} />

            </div>

        </section>
    );
}
