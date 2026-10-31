/* ==========================================
    COMPONENT: SIMULATION STATS
    Resumen estadístico del monitoreo industrial
=========================================== */

import styles from "./SimulationStats.module.css";

import pressureIcon from "../../assets/icons/presion.svg";
import temperatureIcon from "../../assets/icons/temperatura.svg";
import dangerIcon from "../../assets/icons/peligro.svg";
import timeIcon from "../../assets/icons/tiempo.svg";


/* -----------------------------------------------
    01. CONFIGURACIÓN DE INDICADORES
----------------------------------------------- */

/*
    Formatea un valor numérico para mostrarlo
    con un máximo de dos decimales.
*/
function formatValue(value) {
    if (!Number.isFinite(value)) {
        return "—";
    }

    return new Intl.NumberFormat("es-AR", {
        maximumFractionDigits: 2,
    }).format(value);
}


/* --------------------------------------
    02. TARJETA ESTADÍSTICA
--------------------------------------- */

/*
    Componente interno reutilizable.

    @param {Object} props
*/
function StatCard({
    title,
    value,
    unit,
    description,
    variant,
    icon,
}) {
    return (
        <article
            className={[
                styles.statCard,
                styles[variant],
            ].join(" ")}
        >

            <div className={styles.cardHeader}>

                <span
                    className={styles.iconWrapper}
                    aria-hidden="true"
                >
                    <img
                        src={icon}
                        alt=""
                        className={styles.icon}
                    />
                </span>

                <h3 className={styles.cardTitle}>
                    {title}
                </h3>

            </div>

            <div className={styles.cardValue}>
                <span className={styles.number}>
                    {formatValue(value)}
                </span>

                {unit && (
                    <span className={styles.unit}>
                        {unit}
                    </span>
                )}
            </div>

            <p className={styles.cardDescription}>
                {description}
            </p>

        </article>
    );
}


/* --------------------------------------
    03. COMPONENTE PRINCIPAL
--------------------------------------- */

/*
    Presenta las estadísticas calculadas
    sobre las mediciones visibles.

    @param {Object} props
    @param {Object} props.statistics
 */
export default function SimulationStats({ statistics }) {

    const {
        maxPressure,
        maxTemperature,
        criticalEvents,
        elapsedMinutes,
    } = statistics;

    return (
        <section
            className={styles.simulationStats}
            aria-labelledby="simulation-stats-title"
        >

            {/* ENCABEZADO */}

            <header className={styles.header}>

                <span className={styles.eyebrow}>
                    MONITOREO / ESTADÍSTICAS
                </span>

                <h2
                    id="simulation-stats-title"
                    className={styles.title}
                >
                    Resumen de la simulación
                </h2>

                <p className={styles.description}>
                    Indicadores calculados a partir de
                    las mediciones registradas hasta
                    el momento.
                </p>

            </header>


            {/* INDICADORES */}

            <div className={styles.statsGrid}>

                <StatCard
                    title="Presión máxima"
                    value={maxPressure}
                    unit="psi"
                    description="Máximo registrado"
                    variant="pressure"
                    icon={pressureIcon}
                />

                <StatCard
                    title="Temperatura máxima"
                    value={maxTemperature}
                    unit="°C"
                    description="Máximo registrado"
                    variant="temperature"
                    icon={temperatureIcon}
                />

                <StatCard
                    title="Eventos críticos"
                    value={criticalEvents}
                    description="Transiciones a estado crítico"
                    variant="critical"
                    icon={dangerIcon}
                />

                <StatCard
                    title="Tiempo monitoreado"
                    value={elapsedMinutes}
                    unit="min"
                    description="Tiempo simulado transcurrido"
                    variant="time"
                    icon={timeIcon}
                />

            </div>

        </section>
    );
}
