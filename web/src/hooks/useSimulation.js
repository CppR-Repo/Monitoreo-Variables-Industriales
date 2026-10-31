
/* ==========================================
    HOOK PERSONALIZADO: useSimulation
    Gestión del estado de la simulación en React
=========================================== */

import { useEffect, useMemo, useState } from "react";

// Motor independiente de simulación.
import {
    generateSimulation,
} from "../services/simulation.js";

// Evaluación de los estados de las variables.
import {
    evaluateReading,
} from "../utils/thresholds.js";

/*
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
 */
export function useSimulation() {

    /* --------------------------------------
        01. ESTADOS PRINCIPALES
    --------------------------------------- */

    // Escenario seleccionado.
    const [scenario, setScenario] = useState("normal");

    // Posición actual dentro de las mediciones.
    const [currentIndex, setCurrentIndex] = useState(0);

    // Indica si la reproducción automática está activa.
    const [isPlaying, setIsPlaying] = useState(false);

    /*
        Intervalo entre lecturas, en milisegundos.

        1000 ms = 1 segundo real por lectura.
        500 ms  = 0,5 segundos reales por lectura.
        250 ms  = 0,25 segundos reales por lectura.
     */
    const [speed, setSpeed] = useState(1000);


    /* --------------------------------------
        02. GENERACIÓN DE MEDICIONES
    --------------------------------------- */

    /*
        Generamos las mediciones únicamente cuando
        cambia el escenario.

        La semilla fija permite obtener resultados
        reproducibles.
     */
    const readings = useMemo(() => {
        return generateSimulation({
            seed: 42,
            scenario,
        });
    }, [scenario]);


    /* -----------------------------------------
        03. LECTURA Y ESTADOS ACTUALES
    ----------------------------------------- */

    // Obtenemos la medición correspondiente al índice.
    const currentReading = readings[currentIndex];

    // Evaluamos el estado de presión y temperatura.
    const statuses = evaluateReading(currentReading);

    // Comprobamos si llegamos a la última medición.
    const isFinished = currentIndex >= readings.length - 1;


    /* -----------------------------------------
        04. REPRODUCCIÓN AUTOMÁTICA
    ----------------------------------------- */

    /*
        useEffect administra el temporizador.

        Solo se activa cuando isPlaying es true
        y todavía quedan mediciones por recorrer.

        Cada intervalo incrementa currentIndex.
     */
    useEffect(() => {

        // No iniciamos el temporizador si está pausado
        // o si llegamos a la última medición.
        if (!isPlaying || isFinished) {
            return;
        }

        // Creamos el temporizador de reproducción.
        const intervalId = setInterval(() => {

            setCurrentIndex((previousIndex) => {

                // Impedimos avanzar más allá del último índice.
                return Math.min(
                    previousIndex + 1,
                    readings.length - 1
                );
            });

        }, speed);

        /*
            Función de limpieza.

            React ejecuta esta función cuando:
            - Se pausa la reproducción.
            - Cambia la velocidad.
            - Se alcanza la última lectura.
            - El componente se desmonta.

            Evita mantener temporizadores innecesarios.
         */
        return () => {
            clearInterval(intervalId);
        };

    }, [isPlaying, isFinished, speed, readings.length]);


    /* ---------------------------------------
        05. AVANCE MANUAL
    --------------------------------------- */

    /*
        Avanza una medición.

        Pausamos primero la reproducción para evitar
        que el temporizador avance simultáneamente.
     */
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
        06. REPRODUCIR
    --------------------------------------- */

    /*
        Inicia o reanuda la reproducción.

        No inicia si ya estamos en la última lectura.
     */
    function playSimulation() {
        if (isFinished) {
            return;
        }

        setIsPlaying(true);
    }


    /* --------------------------------------
        07. PAUSAR
    --------------------------------------- */

    /*
        Detiene el avance automático.

        Conserva el índice actual para poder
        reanudar desde la misma medición.
     */
    function pauseSimulation() {
        setIsPlaying(false);
    }


    /* --------------------------------------
        08. REINICIAR
    --------------------------------------- */

    /*
        Detiene la reproducción y vuelve
        a la primera medición.
     */
    function resetSimulation() {
        setIsPlaying(false);
        setCurrentIndex(0);
    }


    /* --------------------------------------
        09. CAMBIAR ESCENARIO
    --------------------------------------- */

    /*
        Detiene la reproducción, selecciona
        un escenario y vuelve al inicio.

        useMemo generará las nuevas mediciones.
     */
    function changeScenario(newScenario) {
        setIsPlaying(false);
        setScenario(newScenario);
        setCurrentIndex(0);
    }


    /* --------------------------------------
        10. CAMBIAR VELOCIDAD
    --------------------------------------- */

    /*
        Actualiza el intervalo de reproducción.

        Al cambiar speed, useEffect limpia el
        temporizador anterior y crea otro con
        el nuevo intervalo si estamos reproduciendo.
     */
    function changeSpeed(newSpeed) {
        setSpeed(newSpeed);
    }


    /* ---------------------------------------------
        11. DATOS Y FUNCIONES DISPONIBLES
    --------------------------------------------- */

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
