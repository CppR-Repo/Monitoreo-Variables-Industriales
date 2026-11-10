/* ==========================================
    TESTS: ALARM HISTORY
=========================================== */

import test from "node:test";
import assert from "node:assert/strict";

import {
    generateAlarmHistory,
    summarizeAlarmHistory,
} from "../utils/alarmHistory.js";

import {
    createAlarmEpisodeId,
} from "../utils/acknowledgements.js";


/* --------------------------------------
    DATOS DE PRUEBA
--------------------------------------- */

const readings = [
    { pressure: 450, temperature: 60 },
    { pressure: 485, temperature: 60 },
    { pressure: 490, temperature: 60 },
    { pressure: 510, temperature: 60 },
    { pressure: 515, temperature: 60 },
    { pressure: 490, temperature: 60 },
    { pressure: 450, temperature: 60 },
];

const baseOptions = {
    readings,
    scenario: "overpressure",
};


/* --------------------------------------
    PRUEBAS
--------------------------------------- */

test("no genera episodios en condiciones normales", () => {

    const history = generateAlarmHistory({
        ...baseOptions,
        currentIndex: 0,
    });

    assert.equal(history.length, 0);
});


test("registra la primera advertencia", () => {

    const history = generateAlarmHistory({
        ...baseOptions,
        currentIndex: 1,
    });

    assert.equal(history.length, 1);
    assert.equal(history[0].status, "warning");
    assert.equal(history[0].startIndex, 1);
});


test("no duplica episodios consecutivos", () => {

    const history = generateAlarmHistory({
        ...baseOptions,
        currentIndex: 2,
    });

    assert.equal(history.length, 1);
});


test("registra un episodio nuevo al pasar a crítico", () => {

    const history = generateAlarmHistory({
        ...baseOptions,
        currentIndex: 3,
    });

    assert.equal(history.length, 2);
    assert.equal(history[1].status, "critical");
    assert.equal(history[1].startIndex, 3);
});


test("no duplica un episodio crítico continuo", () => {

    const history = generateAlarmHistory({
        ...baseOptions,
        currentIndex: 4,
    });

    assert.equal(history.length, 2);
});


test("registra el retorno a advertencia", () => {

    const history = generateAlarmHistory({
        ...baseOptions,
        currentIndex: 5,
    });

    assert.equal(history.length, 3);
    assert.equal(history[2].status, "warning");
});


test("conserva el historial al normalizarse", () => {

    const history = generateAlarmHistory({
        ...baseOptions,
        currentIndex: 6,
    });

    assert.equal(history.length, 3);
});


test("identifica episodios reconocidos", () => {

    const id = createAlarmEpisodeId({
        scenario: "overpressure",
        variable: "pressure",
        startIndex: 1,
        status: "warning",
    });

    const history = generateAlarmHistory({
        ...baseOptions,
        currentIndex: 3,
        acknowledgements: {
            [id]: true,
        },
    });

    assert.equal(history[0].acknowledged, true);
    assert.equal(history[1].acknowledged, false);
});


test("resume correctamente los episodios", () => {

    const history = generateAlarmHistory({
        ...baseOptions,
        currentIndex: 6,
    });

    const summary = summarizeAlarmHistory(history);

    assert.deepEqual(summary, {
        total: 3,
        warningCount: 2,
        criticalCount: 1,
        acknowledgedCount: 0,
        pendingCount: 3,
    });
});


test("rechaza entradas inválidas", () => {

    assert.deepEqual(
        generateAlarmHistory({
            readings: null,
            currentIndex: 2,
            scenario: "normal",
        }),
        []
    );

    assert.deepEqual(
        summarizeAlarmHistory(null),
        {
            total: 0,
            warningCount: 0,
            criticalCount: 0,
            acknowledgedCount: 0,
            pendingCount: 0,
        }
    );
});


/* ==========================================
    PRUEBAS: EVOLUCIÓN DE LOS EPISODIOS
=========================================== */

test("un episodio nuevo comienza activo", () => {

    const history = generateAlarmHistory({
        ...baseOptions,
        currentIndex: 1,
    });

    const episode = history[0];

    assert.equal(episode.isActive, true);
    assert.equal(episode.endIndex, null);
    assert.equal(episode.lastObservedIndex, 1);
    assert.equal(episode.durationMinutes, 0);
});


test("actualiza la duración de un episodio activo", () => {

    const history = generateAlarmHistory({
        ...baseOptions,
        currentIndex: 2,
    });

    const episode = history[0];

    assert.equal(episode.isActive, true);
    assert.equal(episode.endIndex, null);
    assert.equal(episode.lastObservedIndex, 2);
    assert.equal(episode.durationMinutes, 15);
});


test("cierra la advertencia al pasar a crítico", () => {

    const history = generateAlarmHistory({
        ...baseOptions,
        currentIndex: 3,
    });

    const warning = history[0];
    const critical = history[1];

    assert.equal(warning.isActive, false);
    assert.equal(warning.endIndex, 2);
    assert.equal(warning.lastObservedIndex, 2);
    assert.equal(warning.durationMinutes, 15);

    assert.equal(critical.isActive, true);
    assert.equal(critical.endIndex, null);
});


test("mantiene la duración del episodio crítico", () => {

    const history = generateAlarmHistory({
        ...baseOptions,
        currentIndex: 4,
    });

    const critical = history[1];

    assert.equal(critical.isActive, true);
    assert.equal(critical.lastObservedIndex, 4);
    assert.equal(critical.durationMinutes, 15);
});


test("cierra el episodio crítico al volver a advertencia", () => {

    const history = generateAlarmHistory({
        ...baseOptions,
        currentIndex: 5,
    });

    const critical = history[1];
    const warning = history[2];

    assert.equal(critical.isActive, false);
    assert.equal(critical.endIndex, 4);

    assert.equal(warning.isActive, true);
    assert.equal(warning.startIndex, 5);
});


test("finaliza todos los episodios al normalizarse", () => {

    const history = generateAlarmHistory({
        ...baseOptions,
        currentIndex: 6,
    });

    assert.equal(history.length, 3);

    assert.ok(
        history.every((episode) => episode.isActive === false)
    );

    assert.equal(history[2].endIndex, 5);
    assert.equal(history[2].durationMinutes, 0);
});


test("respeta las marcas temporales de las mediciones", () => {

    const timedReadings = [
        {
            pressure: 485,
            temperature: 60,
            elapsedMinutes: 0,
        },
        {
            pressure: 490,
            temperature: 60,
            elapsedMinutes: 10,
        },
        {
            pressure: 495,
            temperature: 60,
            elapsedMinutes: 25,
        },
    ];

    const history = generateAlarmHistory({
        readings: timedReadings,
        currentIndex: 2,
        scenario: "overpressure",
    });

    assert.equal(history.length, 1);
    assert.equal(history[0].durationMinutes, 25);
    assert.equal(history[0].lastObservedIndex, 2);
});


test("mantiene independientes los episodios de ambas variables", () => {

    const combinedReadings = [
        { pressure: 450, temperature: 60 },
        { pressure: 485, temperature: 66 },
        { pressure: 510, temperature: 68 },
        { pressure: 450, temperature: 72 },
    ];

    const history = generateAlarmHistory({
        readings: combinedReadings,
        currentIndex: 3,
        scenario: "combined",
    });

    assert.equal(history.length, 4);

    const activeEpisodes = history.filter(
        (episode) => episode.isActive
    );

    assert.equal(activeEpisodes.length, 1);
    assert.equal(activeEpisodes[0].variable, "temperature");
    assert.equal(activeEpisodes[0].status, "critical");
});


test("conserva los identificadores originales", () => {

    const history = generateAlarmHistory({
        ...baseOptions,
        currentIndex: 6,
    });

    const expectedId = createAlarmEpisodeId({
        scenario: "overpressure",
        variable: "pressure",
        startIndex: 1,
        status: "warning",
    });

    assert.equal(history[0].id, expectedId);
});


test("no modifica las mediciones originales", () => {

    const originalReadings = structuredClone(readings);

    generateAlarmHistory({
        ...baseOptions,
        currentIndex: 6,
    });

    assert.deepEqual(readings, originalReadings);
});
