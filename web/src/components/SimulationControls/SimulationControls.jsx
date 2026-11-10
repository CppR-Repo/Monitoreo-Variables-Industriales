/* ==========================================
    COMPONENTE: SIMULATION CONTROLS
    Controles de la simulación industrial
=========================================== */

import styles from "./SimulationControls.module.css";

/* ------------------------------------------
    01. ESCENARIOS DISPONIBLES
------------------------------------------- */

/*
    Cada valor debe coincidir con los escenarios
    definidos en nuestro motor simulation.js.
*/
const SCENARIOS = [
    { value: "normal", label: "Operación normal" },
    { value: "overpressure", label: "Sobrepresión" },
    { value: "overtemperature", label: "Sobretemperatura" },
    { value: "combined", label: "Escenario combinado" },
];


/* -------------------------------------------
    02. VELOCIDADES DE REPRODUCCIÓN
------------------------------------------- */

/*
    Las velocidades representan el tiempo real
    transcurrido entre dos mediciones.

    Cada medición representa 15 minutos
    de tiempo industrial simulado.

    1000 ms = velocidad normal (1x).
    500 ms  = velocidad doble (2x).
    250 ms  = velocidad cuádruple (4x).
*/
const SPEED_OPTIONS = [
    { value: 1000, label: "1x — Normal" },
    { value: 500, label: "2x — Rápida" },
    { value: 250, label: "4x — Muy rápida" },
];


/* ------------------------------------------
    03. COMPONENTE PRINCIPAL
------------------------------------------- */

/*
    Recibe los datos y las funciones del hook
    a través de las propiedades de App.jsx.

    No genera mediciones ni administra
    temporizadores por su cuenta.
*/
export default function SimulationControls({
    // Información de la simulación.
    scenario,
    currentIndex,
    totalReadings,
    elapsedMinutes,

    // Estado de reproducción.
    isPlaying,
    isFinished,
    speed,

    // Funciones de control.
    onNext,
    onReset,
    onScenarioChange,
    onPlay,
    onPause,
    onSpeedChange,
}) {

    /* ----------------------------------------
        04. VALORES CALCULADOS
    ---------------------------------------- */

    // Los índices comienzan en cero.
    // Mostramos las mediciones comenzando en uno.
    const readingNumber = currentIndex + 1;

    // Comprobamos si estamos en la primera lectura.
    const isFirstReading = currentIndex === 0;


    /* --------------------------------------
        05. INTERFAZ DEL COMPONENTE
    --------------------------------------- */

    return (
        <section
            className={styles.controls}
            aria-labelledby="simulation-controls-title"
        >

            {/* ENCABEZADO */}
            <div className={styles.header}>
                <div>
                    <h2
                        id="simulation-controls-title"
                        className={styles.title}
                    >
                        Control de simulación
                    </h2>

                    <p className={styles.description}>
                        Seleccioná un escenario y controla
                        la reproducción de las mediciones.
                    </p>
                </div>
            </div>


            {/* SELECTOR DE ESCENARIO */}
            <div className={styles.field}>
                <label
                    className={styles.label}
                    htmlFor="simulation-scenario"
                >
                    Escenario
                </label>

                <select
                    id="simulation-scenario"
                    className={styles.select}
                    value={scenario}
                    onChange={(event) => {
                        onScenarioChange(event.target.value);
                    }}
                >
                    {SCENARIOS.map((option) => (
                        <option
                            key={option.value}
                            value={option.value}
                        >
                            {option.label}
                        </option>
                    ))}
                </select>
            </div>


            {/* SELECTOR DE VELOCIDAD */}
            <div className={styles.field}>
                <label
                    className={styles.label}
                    htmlFor="simulation-speed"
                >
                    Velocidad de reproducción
                </label>

                <select
                    id="simulation-speed"
                    className={styles.select}
                    value={speed}
                    onChange={(event) => {
                        // Los valores de un select son cadenas.
                        // Convertimos el valor a número.
                        onSpeedChange(Number(event.target.value));
                    }}
                >
                    {SPEED_OPTIONS.map((option) => (
                        <option
                            key={option.value}
                            value={option.value}
                        >
                            {option.label}
                        </option>
                    ))}
                </select>
            </div>


            {/* INFORMACIÓN DE LA SIMULACIÓN */}
            <div className={styles.information}>
                <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>
                        Medición
                    </span>

                    <strong className={styles.infoValue}>
                        {readingNumber} / {totalReadings}
                    </strong>
                </div>

                <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>
                        Tiempo transcurrido
                    </span>

                    <strong className={styles.infoValue}>
                        {elapsedMinutes} min
                    </strong>
                </div>
            </div>


            {/* CONTROLES DE REPRODUCCIÓN */}
            <div className={styles.actions}>

                {/* REINICIAR */}
                <button
                    type="button"
                    className={`${styles.button} ${styles.buttonSecondary}`}
                    onClick={onReset}
                    disabled={isFirstReading && !isPlaying}
                >
                    Reiniciar
                </button>


                {/* AVANCE MANUAL */}
                <button
                    type="button"
                    className={`${styles.button} ${styles.buttonSecondary}`}
                    onClick={onNext}
                    disabled={isFinished || isPlaying}
                >
                    Siguiente lectura
                </button>


                {/* REPRODUCIR O PAUSAR */}
                {isPlaying ? (
                    <button
                        type="button"
                        className={`${styles.button} ${styles.buttonPrimary}`}
                        onClick={onPause}
                    >
                        Pausar
                    </button>
                ) : (
                    <button
                        type="button"
                        className={`${styles.button} ${styles.buttonPrimary}`}
                        onClick={onPlay}
                        disabled={isFinished}
                    >
                        Reproducir
                    </button>
                )}

            </div>
        </section>
    );
}
