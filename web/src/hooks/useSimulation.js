/* ==========================================
    HOOK: useSimulation

    Responsabilidades:
    1. Restauración de sesión.
    2. Estados principales.
    3. Seleccionar el escenario.
    4. Persistir automáticamente el estado.
    5. Generar las mediciones.
    6. Mantener la lectura actual.
    7. Episodios de alarma activos.
    8. Episodios con reconocimiento.
    9. Historial acumulado de alarmas.
    10. Reproducción automática.
    11. Avance manual.
    12. Reproducir.
    13. Pausar la reproducción.
    14. Reiniciar la simulación.
    15. Cambiar escenario.
    16. Cambiar velocidad.
    17. Reconocer una alarma.
    18. Reconocer alarma histórica.
    19. Datos y funciones disponibles.
=========================================== */

import { useEffect, useMemo, useState } from "react";

// Motor independiente de simulación.
import {
    generateSimulation,
} from "../services/simulation.js";

// Evaluación de presión y temperatura.
import {
    evaluateReading,
} from "../utils/thresholds.js";

// Identificación de episodios activos.
import {
    getCurrentAlarmEpisodes,
} from "../utils/alarmEpisodes.js";

// Gestión de reconocimientos.
import {
    acknowledgeAlarm,
    isAlarmAcknowledged,
    resetAcknowledgements,
} from "../utils/acknowledgements.js";

// Historial acumulado de alarmas
import {
    generateAlarmHistory,
    summarizeAlarmHistory,
} from "../utils/alarmHistory.js";

import {
    acknowledgeHistoricalEpisode,
} from "../utils/historicalAcknowledgements.js";

import {
    DEFAULT_SIMULATION_STATE,
    loadSimulationState,
    saveSimulationState,
} from "../utils/simulationStorage.js";


export function useSimulation() {

    /* --------------------------------------
        01. RESTAURACIÓN DE SESIÓN
    --------------------------------------- */

    /*
        useState recibe una función para recuperar
        el estado inicial durante la inicialización del componente, sin consultar localStorage
        en cada renderizado.

        Si no existe una sesión válida, utilizamos los valores predeterminados.
    */

    const [initialState] = useState(() => {

        // En entornos sin navegador, utilizamos
        // los valores predeterminados.
        if (typeof window === "undefined") {
            return DEFAULT_SIMULATION_STATE;
        }

        // Recuperamos una sesión válida o
        // utilizamos los valores iniciales.
        try {
            return (
                loadSimulationState(window.localStorage) ??
                DEFAULT_SIMULATION_STATE
            );
        } catch {
            return DEFAULT_SIMULATION_STATE;
        }
    });


    /* --------------------------------------
        02. ESTADOS PRINCIPALES
    --------------------------------------- */

    // Escenario seleccionado.
    const [scenario, setScenario] = useState(initialState.scenario);

    // Posición actual dentro de las mediciones.
    const [currentIndex, setCurrentIndex] = useState(initialState.currentIndex);

    // Siempre iniciamos con la reproducción pausada.
    const [isPlaying, setIsPlaying] = useState(false);

    /*
        Intervalo entre lecturas:

        1000 ms = 1 segundo por lectura.
        500 ms  = 0,5 segundos por lectura.
        250 ms  = 0,25 segundos por lectura.
    */
    const [speed, setSpeed] = useState(initialState.speed);


    /* ------------------------------------------
        03. ESTADO DE RECONOCIMIENTOS
    ------------------------------------------ */

    /*
        Almacena los identificadores de los
        episodios reconocidos por el operador.
    
        Ejemplo:
    
        {
            '["combined","pressure",24,"warning"]': true
        }
    */
    const [
        acknowledgements,
        setAcknowledgements,
    ] = useState(initialState.acknowledgements);


    /* ------------------------------------------
        04. PERSISTENCIA AUTOMÁTICA
    ------------------------------------------ */

    /*
        Guardamos únicamente los estados necesarios para reconstruir la sesión:

        - Escenario seleccionado.
        - Índice de la última medición.
        - Velocidad de reproducción.
        - Reconocimientos de alarmas.

        No guardamos las mediciones ni el historial, porque se calculan nuevamente a partir
        del escenario y del índice restaurados.

        Tampoco guardamos isPlaying: por seguridad, la reproducción siempre comienza pausada.
    */
    useEffect(() => {

        if (typeof window === "undefined") {
            return;
        }

        try {
            saveSimulationState(window.localStorage, {
                scenario,
                currentIndex,
                speed,
                acknowledgements,
            });
        } catch {
            // Protege el acceso a localStorage si el navegador lo restringe.
        }
    }, [
        scenario,
        currentIndex,
        speed,
        acknowledgements,
    ]);


    /* ----------------------------------------
        05. GENERACIÓN DE MEDICIONES
    ---------------------------------------- */

    /*
        Solo regeneramos las lecturas cuando
        cambia el escenario.

        La semilla fija garantiza resultados
        reproducibles.
    */
    const readings = useMemo(() => {

        return generateSimulation({
            seed: 42,
            scenario,
        });

    }, [scenario]);


    /* ------------------------------------------
        06. LECTURA Y ESTADOS ACTUALES
    ------------------------------------------ */

    const currentReading = readings[currentIndex];

    const statuses = evaluateReading(currentReading);

    const isFinished =
        currentIndex >= readings.length - 1;


    /* --------------------------------------------
        07. EPISODIOS DE ALARMA ACTIVOS
    -------------------------------------------- */

    /*
        Determinamos el episodio correspondiente
        a cada variable en la lectura actual.

        Se recalcula cuando:
        - Cambia el escenario.
        - Avanza o retrocede el índice.
        - Cambian las mediciones.
    */
    const activeEpisodes = useMemo(() => {

        return getCurrentAlarmEpisodes({
            readings,
            currentIndex,
            scenario,
        });

    }, [readings, currentIndex, scenario]);


    /* ------------------------------------------------
        08. EPISODIOS CON RECONOCIMIENTO
    ------------------------------------------------ */

    /*
        Combinamos cada episodio con su estado
        de reconocimiento.

        No modificamos los objetos originales.
    */
    const alarmEpisodes = useMemo(() => {

        return activeEpisodes.map((episode) => ({
            ...episode,

            acknowledged: isAlarmAcknowledged(
                acknowledgements,
                episode.id
            ),
        }));

    }, [activeEpisodes, acknowledgements]);


    /* ----------------------------------------------------------
        09. HISTORIAL ACUMULADO DE ALARMAS
    --------------------------------------------------------- */

    /*
        Recuperamos todos los episodios ocurridos
        desde el inicio de la simulación hasta la medición actual.

        Los reconocimientos se mantienen asociados a sus episodios correspondientes.
    */
    const alarmHistory = useMemo(() => {

        return generateAlarmHistory({
            readings,
            currentIndex,
            scenario,
            acknowledgements,
        });

    }, [
        readings,
        currentIndex,
        scenario,
        acknowledgements,
    ]);

    /*
        Calculamos los indicadores históricos:
        - Episodios totales.
        - Advertencias.
        - Condiciones críticas.
        - Episodios reconocidos.
        - Episodios pendientes.
    */
    const alarmHistorySummary = useMemo(() => {

        return summarizeAlarmHistory(alarmHistory);

    }, [alarmHistory]);


    /* -----------------------------------------
        10. REPRODUCCIÓN AUTOMÁTICA
    ----------------------------------------- */

    useEffect(() => {

        // No reproducimos si está pausado
        // o ya alcanzamos el final.
        if (!isPlaying || isFinished) {
            return;
        }

        const intervalId = setInterval(() => {

            setCurrentIndex((previousIndex) => {

                return Math.min(
                    previousIndex + 1,
                    readings.length - 1
                );

            });

        }, speed);

        /*
            Limpieza del temporizador.

            Se ejecuta al pausar, cambiar
            velocidad, finalizar o desmontar.
        */
        return () => {
            clearInterval(intervalId);
        };

    }, [
        isPlaying,
        isFinished,
        speed,
        readings.length,
    ]);


    /* --------------------------------------
        11. AVANCE MANUAL
    --------------------------------------- */

    function nextReading() {

        setIsPlaying(false);

        setCurrentIndex((previousIndex) => {

            return Math.min(
                previousIndex + 1,
                readings.length - 1
            );

        });
    }


    /* --------------------------------------
        12. REPRODUCIR
    --------------------------------------- */

    function playSimulation() {

        if (isFinished) {
            return;
        }

        setIsPlaying(true);
    }


    /* --------------------------------------
        13. PAUSAR
    --------------------------------------- */

    function pauseSimulation() {
        setIsPlaying(false);
    }


    /* --------------------------------------
        14. REINICIAR SIMULACIÓN
    --------------------------------------- */

    /*
        Reinicia la posición de la simulación y elimina los reconocimientos anteriores.

        Conserva el escenario y la velocidad seleccionados por el operador.

        El efecto de persistencia guardará automáticamente el nuevo estado.
    */
    function resetSimulation() {

        setIsPlaying(false);
        setCurrentIndex(0);

        setAcknowledgements(
            resetAcknowledgements()
        );
    }


    /* --------------------------------------
        15. CAMBIAR ESCENARIO
    --------------------------------------- */

    /*
        Selecciona un escenario nuevo y
        reinicia los reconocimientos.
    */
    function changeScenario(newScenario) {

        setIsPlaying(false);
        setScenario(newScenario);
        setCurrentIndex(0);

        setAcknowledgements(
            resetAcknowledgements()
        );
    }


    /* --------------------------------------
        16. CAMBIAR VELOCIDAD
    --------------------------------------- */

    function changeSpeed(newSpeed) {
        setSpeed(newSpeed);
    }


    /* --------------------------------------
        17. RECONOCER UNA ALARMA
    --------------------------------------- */

    /*
        Solo permite reconocer un episodio que esté activo en la lectura actual.

        No modifica el estado físico de presión o temperatura.
    */
    function acknowledgeActiveAlarm(episodeId) {

        const isActive = activeEpisodes.some(
            (episode) => episode.id === episodeId
        );

        if (!isActive) {
            return;
        }

        setAcknowledgements((previous) => {

            return acknowledgeAlarm(
                previous,
                episodeId
            );

        });
    }


    /* --------------------------------------------
        18. RECONOCER ALARMA HISTÓRICA
    --------------------------------------------- */

    function acknowledgeHistoricalAlarm(episodeId) {

        setAcknowledgements((previous) => {

            return acknowledgeHistoricalEpisode({
                history: alarmHistory,
                episodeId,
                acknowledgements: previous,
            });
        });
    }


    /* ----------------------------------------------
        19. DATOS Y FUNCIONES DISPONIBLES
    ---------------------------------------------- */

    return {

        // Estado general.
        scenario,
        currentIndex,
        readings,
        currentReading,
        statuses,

        // Reproducción automática.
        isPlaying: isPlaying && !isFinished,
        isFinished,
        speed,

        // Episodios y reconocimientos.
        alarmEpisodes,
        acknowledgeActiveAlarm,
        acknowledgeHistoricalAlarm,

        // Historial acumulado.
        alarmHistory,
        alarmHistorySummary,

        // Controles manuales.
        nextReading,
        resetSimulation,
        changeScenario,

        // Controles automáticos.
        playSimulation,
        pauseSimulation,
        changeSpeed,
    };
}
