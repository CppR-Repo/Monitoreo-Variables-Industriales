/* ==========================================
    HOOK PERSONALIZADO: useSimulation

    Gestión del estado de la simulación
    y reconocimiento de alarmas en React.
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


/* ==========================================
    HOOK: useSimulation

    Responsabilidades:
    1. Seleccionar el escenario.
    2. Generar las mediciones.
    3. Mantener la lectura actual.
    4. Avanzar manualmente.
    5. Reproducir automáticamente.
    6. Pausar la reproducción.
    7. Configurar la velocidad.
    8. Reiniciar la simulación.
    9. Evaluar presión y temperatura.
    10. Identificar episodios activos.
    11. Gestionar reconocimientos.
=========================================== */

export function useSimulation() {

    /* --------------------------------------
        01. ESTADOS PRINCIPALES
    --------------------------------------- */

    // Escenario seleccionado.
    const [scenario, setScenario] = useState("normal");

    // Posición actual dentro de las mediciones.
    const [currentIndex, setCurrentIndex] = useState(0);

    // Estado de reproducción automática.
    const [isPlaying, setIsPlaying] = useState(false);

    /*
        Intervalo entre lecturas:

        1000 ms = 1 segundo por lectura.
        500 ms  = 0,5 segundos por lectura.
        250 ms  = 0,25 segundos por lectura.
    */
    const [speed, setSpeed] = useState(1000);


    /* ------------------------------------------
        02. ESTADO DE RECONOCIMIENTOS
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
    ] = useState(resetAcknowledgements);


    /* ----------------------------------------
        03. GENERACIÓN DE MEDICIONES
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
        04. LECTURA Y ESTADOS ACTUALES
    ------------------------------------------ */

    const currentReading = readings[currentIndex];

    const statuses = evaluateReading(currentReading);

    const isFinished =
        currentIndex >= readings.length - 1;


    /* --------------------------------------------
        05. EPISODIOS DE ALARMA ACTIVOS
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
        06. EPISODIOS CON RECONOCIMIENTO
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


    /* ==========================================
        07. HISTORIAL ACUMULADO DE ALARMAS
    =========================================== */

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
        08. REPRODUCCIÓN AUTOMÁTICA
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
        09. AVANCE MANUAL
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
        10. REPRODUCIR
    --------------------------------------- */

    function playSimulation() {

        if (isFinished) {
            return;
        }

        setIsPlaying(true);
    }


    /* --------------------------------------
        11. PAUSAR
    --------------------------------------- */

    function pauseSimulation() {
        setIsPlaying(false);
    }


    /* --------------------------------------
        12. REINICIAR SIMULACIÓN
    --------------------------------------- */

    /*
        Reinicia el índice y elimina todos
        los reconocimientos anteriores.
    */
    function resetSimulation() {

        setIsPlaying(false);
        setCurrentIndex(0);

        setAcknowledgements(
            resetAcknowledgements()
        );
    }


    /* --------------------------------------
        13. CAMBIAR ESCENARIO
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
        14. CAMBIAR VELOCIDAD
    --------------------------------------- */

    function changeSpeed(newSpeed) {
        setSpeed(newSpeed);
    }


    /* --------------------------------------
        15. RECONOCER UNA ALARMA
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
        16. RECONOCER ALARMA HISTÓRICA
    --------------------------------------------- */

    function acknowledgeHistoricalAlarm(episodeId) {

        setAcknowledgements((previous) => {

            return acknowledgeHistoricalEpisode({
                history: alarmHistory, episodeId,
                acknowledgements: previous,
            });
        });
    }


    /* ----------------------------------------------
        17. DATOS Y FUNCIONES DISPONIBLES
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
