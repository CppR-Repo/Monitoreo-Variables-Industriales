import test from "node:test";
import assert from "node:assert/strict";

import {
    getCurrentAlarmEpisodes,
} from "../utils/alarmEpisodes.js";


/* ==========================================
    DATOS DE PRUEBA
=========================================== */

const readings = [
    { pressure: 450, temperature: 60 },
    { pressure: 485, temperature: 60 },
    { pressure: 490, temperature: 60 },
    { pressure: 510, temperature: 60 },
    { pressure: 515, temperature: 60 },
    { pressure: 490, temperature: 60 },
    { pressure: 450, temperature: 60 },
];


/* ==========================================
    PRUEBAS
=========================================== */

test("no genera episodios en estado normal", () => {

    const episodes = getCurrentAlarmEpisodes({
        readings,
        currentIndex: 0,
        scenario: "test",
    });

    assert.deepEqual(episodes, []);
});


test("detecta el inicio de una advertencia", () => {

    const episodes = getCurrentAlarmEpisodes({
        readings,
        currentIndex: 1,
        scenario: "test",
    });

    assert.equal(episodes.length, 1);
    assert.equal(episodes[0].variable, "pressure");
    assert.equal(episodes[0].startIndex, 1);
    assert.equal(episodes[0].status, "warning");
});


test("mantiene el episodio mientras no cambia el estado", () => {

    const first = getCurrentAlarmEpisodes({
        readings,
        currentIndex: 1,
        scenario: "test",
    });

    const second = getCurrentAlarmEpisodes({
        readings,
        currentIndex: 2,
        scenario: "test",
    });

    assert.equal(first[0].id, second[0].id);
});


test("genera un nuevo episodio al pasar a crítico", () => {

    const episodes = getCurrentAlarmEpisodes({
        readings,
        currentIndex: 3,
        scenario: "test",
    });

    assert.equal(episodes[0].startIndex, 3);
    assert.equal(episodes[0].status, "critical");
});


test("mantiene el episodio crítico", () => {

    const first = getCurrentAlarmEpisodes({
        readings,
        currentIndex: 3,
        scenario: "test",
    });

    const second = getCurrentAlarmEpisodes({
        readings,
        currentIndex: 4,
        scenario: "test",
    });

    assert.equal(first[0].id, second[0].id);
});


test("genera un episodio nuevo al volver a advertencia", () => {

    const episodes = getCurrentAlarmEpisodes({
        readings,
        currentIndex: 5,
        scenario: "test",
    });

    assert.equal(episodes[0].startIndex, 5);
    assert.equal(episodes[0].status, "warning");
});


test("elimina episodios activos al normalizarse", () => {

    const episodes = getCurrentAlarmEpisodes({
        readings,
        currentIndex: 6,
        scenario: "test",
    });

    assert.deepEqual(episodes, []);
});


test("rechaza entradas inválidas", () => {

    assert.deepEqual(
        getCurrentAlarmEpisodes({
            readings: [],
            currentIndex: 0,
            scenario: "test",
        }),
        []
    );

    assert.deepEqual(
        getCurrentAlarmEpisodes({
            readings,
            currentIndex: -1,
            scenario: "test",
        }),
        []
    );
});
