/* ==========================================
    TESTS: useSimulation

    Pruebas de integración del hook con React.

    Verificamos:
    1. Inicialización predeterminada.
    2. Restauración de sesiones.
    3. Reproducción pausada al restaurar.
    4. Persistencia del avance manual.
    5. Restauración después de desmontar.
    6. Datos corruptos.
    7. Cambio de escenario.
    8. Reinicio de la simulación.
    9. Reconocimiento de una alarma activa.
    10. Reconocimiento de una alarma histórica.
    11. Restauración de reconocimientos.
    12. Reproducción automática y pausa.
    13. Cambio de velocidad.
    14. Finalización automática.
=========================================== */

import test, { afterEach } from "node:test";
import assert from "node:assert/strict";
import { mock } from "node:test";

import { evaluateReading } from "../utils/thresholds.js";

import { JSDOM } from "jsdom";

import {
    STORAGE_KEY,
} from "../utils/simulationStorage.js";

import { SIMULATION_CONFIG } from "../services/simulation.js";

/* ------------------------------------------
    CONFIGURACIÓN DE LAS PRUEBAS
------------------------------------------- */

// Último índice válido de la simulación.
const lastIndex = SIMULATION_CONFIG.totalReadings - 1;

// Índice anterior al último.
const penultimateIndex = lastIndex - 1;

/* -----------------------------------------------------
    ENTORNO DE NAVEGADOR SIMULADO
----------------------------------------------------- */

// Creamos un documento HTML simulado.
// La URL permite utilizar localStorage.
const dom = new JSDOM(
    "<!doctype html><html><body></body></html>",
    {
        url: "http://localhost/",
    }
);

// Exponemos las propiedades necesarias para ejecutar las pruebas de React.
globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.HTMLElement = dom.window.HTMLElement;

// Node.js 22 puede definir navigator como una propiedad de solo lectura.

// Object.defineProperty permite configurar correctamente el navegador simulado.
Object.defineProperty(globalThis, "navigator", {
    configurable: true,
    value: dom.window.navigator,
});

// Indicamos a React que estamos utilizando un entorno compatible con act().
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

/* --------------------------------------------------------
    IMPORTACIÓN DE REACT TESTING LIBRARY
--------------------------------------------------------- */

// Importamos la biblioteca después de crear el entorno DOM.
const {
    renderHook,
    act,
    cleanup,
} = await import("@testing-library/react");

const {
    useSimulation,
} = await import("../hooks/useSimulation.js");

/* ------------------------------------------
    LIMPIEZA ENTRE PRUEBAS
------------------------------------------- */

afterEach(() => {

    // Desmontamos los componentes React.
    cleanup();

    // Evitamos compartir sesiones entre pruebas.
    window.localStorage.clear();
});

/* ------------------------------------------
    01. ESTADO INICIAL
------------------------------------------- */
test("inicia con valores predeterminados", () => {

    const { result } = renderHook(() => useSimulation());

    assert.equal(result.current.scenario, "normal");
    assert.equal(result.current.currentIndex, 0);
    assert.equal(result.current.speed, 1000);
    assert.equal(result.current.isPlaying, false);
    assert.equal(result.current.readings.length, SIMULATION_CONFIG.totalReadings);
});

/* ------------------------------------------
    02. RESTAURACIÓN DE SESIÓN
------------------------------------------- */
test("restaura una sesión almacenada", () => {

    window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
            scenario: "combined",
            currentIndex: 35,
            speed: 500,
            acknowledgements: {},
        })
    );

    const { result } = renderHook(() => useSimulation());

    assert.equal(result.current.scenario, "combined");
    assert.equal(result.current.currentIndex, 35);
    assert.equal(result.current.speed, 500);
    assert.equal(result.current.isPlaying, false);
});

/* ------------------------------------------
    03. REPRODUCCIÓN PAUSADA
------------------------------------------- */
test("restaura una sesión con reproducción pausada", () => {

    window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
            scenario: "overpressure",
            currentIndex: 20,
            speed: 250,
            acknowledgements: {},
            isPlaying: true,
        })
    );

    const { result } = renderHook(() => useSimulation());

    // Aunque los datos almacenados incluyan isPlaying, el hook debe ignorarlo.
    assert.equal(result.current.isPlaying, false);
    assert.equal(result.current.currentIndex, 20);
});

/* ------------------------------------------------
    04. PERSISTENCIA DEL AVANCE MANUAL
------------------------------------------------- */
test("guarda el índice después de avanzar", () => {

    const { result } = renderHook(() => useSimulation());

    act(() => {
        result.current.nextReading();
    });

    assert.equal(result.current.currentIndex, 1);

    const saved = JSON.parse(
        window.localStorage.getItem(STORAGE_KEY)
    );

    assert.equal(saved.currentIndex, 1);
});

/* -------------------------------------------------------
    05. RESTAURACIÓN DESPUÉS DE DESMONTAR
------------------------------------------------------- */
test("conserva el estado al montar nuevamente el hook", () => {

    const first = renderHook(() => useSimulation());

    act(() => {
        first.result.current.changeScenario("combined");
        first.result.current.changeSpeed(250);
        first.result.current.nextReading();
    });

    first.unmount();

    // Simulamos una nueva carga de la aplicación.
    const second = renderHook(() => useSimulation());

    assert.equal(second.result.current.scenario, "combined");
    assert.equal(second.result.current.currentIndex, 1);
    assert.equal(second.result.current.speed, 250);
    assert.equal(second.result.current.isPlaying, false);
});

/* ------------------------------------------
    06. DATOS CORRUPTOS
------------------------------------------- */
test("utiliza valores iniciales ante datos corruptos", () => {

    window.localStorage.setItem(
        STORAGE_KEY,
        "{invalid-json"
    );

    const { result } = renderHook(() => useSimulation());

    assert.equal(result.current.scenario, "normal");
    assert.equal(result.current.currentIndex, 0);
    assert.equal(result.current.speed, 1000);
    assert.equal(result.current.isPlaying, false);
});


/* --------------------------------------
    07. CAMBIO DE ESCENARIO
--------------------------------------- */
test("reinicia la lectura al cambiar de escenario", () => {

    const { result } = renderHook(() => useSimulation());

    act(() => {
        result.current.nextReading();
        result.current.nextReading();
    });

    assert.equal(result.current.currentIndex, 2);

    act(() => {
        result.current.changeScenario("overtemperature");
    });

    assert.equal(result.current.scenario, "overtemperature");
    assert.equal(result.current.currentIndex, 0);
    assert.equal(result.current.isPlaying, false);

    const saved = JSON.parse(
        window.localStorage.getItem(STORAGE_KEY)
    );

    assert.equal(saved.scenario, "overtemperature");
    assert.equal(saved.currentIndex, 0);
});


/* -------------------------------------
    08. REINICIO DE  LA SIMULACIÓN
-------------------------------------- */
test("reinicia la simulación conservando escenario y velocidad", () => {

    const { result } = renderHook(() => useSimulation());

    act(() => {
        result.current.changeScenario("combined");
        result.current.changeSpeed(250);
        result.current.nextReading();
    });

    act(() => {
        result.current.resetSimulation();
    });

    assert.equal(result.current.scenario, "combined");
    assert.equal(result.current.speed, 250);
    assert.equal(result.current.currentIndex, 0);
    assert.equal(result.current.isPlaying, false);

    const saved = JSON.parse(
        window.localStorage.getItem(STORAGE_KEY)
    );

    assert.equal(saved.currentIndex, 0);
    assert.deepEqual(saved.acknowledgements, {});
});


/* ------------------------------------------------------
    09. RECONOCIMIENTO DE UNA ALARMA ACTIVA
------------------------------------------------------ */
test("reconoce una alarma activa y guarda su identificador", () => {

    const { result } = renderHook(() => useSimulation());

    act(() => {
        result.current.changeScenario("combined");
    });

    // Localizamos una lectura con una alarma activa.
    const alarmIndex = result.current.readings.findIndex(
        (reading) => {
            const statuses = evaluateReading(reading);

            return (
                statuses.pressure !== "normal" ||
                statuses.temperature !== "normal"
            );
        }
    );

    assert.ok(alarmIndex >= 0);

    act(() => {
        for (let index = 0; index < alarmIndex; index++) {
            result.current.nextReading();
        }
    });

    const episode = result.current.alarmEpisodes[0];

    assert.ok(episode);
    assert.equal(episode.acknowledged, false);

    act(() => {
        result.current.acknowledgeActiveAlarm(episode.id);
    });

    assert.equal(
        result.current.alarmEpisodes[0].acknowledged,
        true
    );

    const saved = JSON.parse(
        window.localStorage.getItem(STORAGE_KEY)
    );

    assert.equal(saved.acknowledgements[episode.id], true);
});


/* ----------------------------------------------------------
    10. RECONOCIMIENTO DE UNA ALARMA HISTÓRICA
----------------------------------------------------------- */
test("reconoce un episodio histórico finalizado", () => {

    const { result } = renderHook(() => useSimulation());

    act(() => {
        result.current.changeScenario("combined");
    });

    // Avanzamos hasta completar la simulación.
    act(() => {
        for (let index = 1; index < SIMULATION_CONFIG.totalReadings; index++) {
            result.current.nextReading();
        }
    });

    const episode = result.current.alarmHistory.find(
        (item) => !item.isActive && !item.acknowledged
    );

    assert.ok(episode);

    act(() => {
        result.current.acknowledgeHistoricalAlarm(episode.id);
    });

    const updatedEpisode = result.current.alarmHistory.find(
        (item) => item.id === episode.id
    );

    assert.equal(updatedEpisode.acknowledged, true);

    const saved = JSON.parse(
        window.localStorage.getItem(STORAGE_KEY)
    );

    assert.equal(saved.acknowledgements[episode.id], true);
});


/* -------------------------------------------------
    11. RESTAURACIÓN DE RECONOCIMIENTOS
------------------------------------------------- */
test("restaura reconocimientos después de montar nuevamente", () => {

    const first = renderHook(() => useSimulation());

    act(() => {
        first.result.current.changeScenario("combined");
    });

    act(() => {
        for (let index = 1; index < SIMULATION_CONFIG.totalReadings; index++) {
            first.result.current.nextReading();
        }
    });

    const episode = first.result.current.alarmHistory.find(
        (item) => !item.isActive && !item.acknowledged
    );

    assert.ok(episode);

    act(() => {
        first.result.current.acknowledgeHistoricalAlarm(episode.id);
    });

    first.unmount();

    const second = renderHook(() => useSimulation());

    const restoredEpisode = second.result.current.alarmHistory.find(
        (item) => item.id === episode.id
    );

    assert.ok(restoredEpisode);
    assert.equal(restoredEpisode.acknowledged, true);
    assert.equal(second.result.current.isPlaying, false);
});

/* -----------------------------------------------------
    12. REPRODUCCIÓN AUTOMÁTICA Y PAUSA
----------------------------------------------------- */
test("avanza automáticamente y se detiene al pausar", () => {

    // Simulamos el paso del tiempo sin esperar
    // segundos reales durante la prueba.
    mock.timers.enable({
        apis: ["setInterval"],
    });

    try {
        const { result } = renderHook(() => useSimulation());

        // Comenzamos la reproducción.
        act(() => {
            result.current.playSimulation();
        });

        assert.equal(result.current.isPlaying, true);
        assert.equal(result.current.currentIndex, 0);

        // Avanzamos un segundo simulado.
        act(() => {
            mock.timers.tick(1000);
        });

        assert.equal(result.current.currentIndex, 1);

        // Pausamos la reproducción.
        act(() => {
            result.current.pauseSimulation();
        });

        assert.equal(result.current.isPlaying, false);

        // El tiempo sigue avanzando, pero la
        // lectura debe permanecer detenida.
        act(() => {
            mock.timers.tick(3000);
        });

        assert.equal(result.current.currentIndex, 1);

    } finally {
        // Restauramos los temporizadores reales.
        mock.timers.reset();
    }
});


/* ------------------------------------------
    13. CAMBIO DE VELOCIDAD
------------------------------------------- */
test("actualiza el intervalo al cambiar la velocidad", () => {

    mock.timers.enable({
        apis: ["setInterval"],
    });

    try {
        const { result } = renderHook(() => useSimulation());

        act(() => {
            result.current.playSimulation();
        });

        // A velocidad 1x todavía no debe avanzar.
        act(() => {
            mock.timers.tick(500);
        });

        assert.equal(result.current.currentIndex, 0);

        // Cambiamos a velocidad 4x.
        act(() => {
            result.current.changeSpeed(250);
        });

        assert.equal(result.current.speed, 250);
        assert.equal(result.current.isPlaying, true);

        // El nuevo intervalo es de 250 ms.
        act(() => {
            mock.timers.tick(250);
        });

        assert.equal(result.current.currentIndex, 1);

        // Otros 500 ms equivalen a dos lecturas.
        act(() => {
            mock.timers.tick(500);
        });

        assert.equal(result.current.currentIndex, 3);

    } finally {
        mock.timers.reset();
    }
});


/* ------------------------------------------
    14. FINALIZACIÓN AUTOMÁTICA
------------------------------------------- */
test("detiene la reproducción al alcanzar la última lectura", () => {

    // Guardamos una sesión en la penúltima
    // posición de la simulación.
    window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
            scenario: "normal",
            currentIndex: penultimateIndex,
            speed: 1000,
            acknowledgements: {},
        })
    );

    mock.timers.enable({
        apis: ["setInterval"],
    });

    try {
        const { result } = renderHook(() => useSimulation());

        assert.equal(result.current.currentIndex, penultimateIndex);
        assert.equal(result.current.isFinished, false);

        act(() => {
            result.current.playSimulation();
        });

        // Avanzamos hasta la lectura final.
        act(() => {
            mock.timers.tick(1000);
        });

        assert.equal(result.current.currentIndex, lastIndex);
        assert.equal(result.current.isFinished, true);

        // El hook debe informar que la
        // reproducción ya no está activa.
        assert.equal(result.current.isPlaying, false);

        // Aunque pase más tiempo, el índice
        // no puede superar la última lectura.
        act(() => {
            mock.timers.tick(5000);
        });

        assert.equal(result.current.currentIndex, lastIndex);

    } finally {
        mock.timers.reset();
    }
});