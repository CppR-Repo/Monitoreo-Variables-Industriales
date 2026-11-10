/* ==========================================
    TESTS: EVENTS
    Pruebas del historial de eventos industriales
=========================================== */

import test from "node:test";
import assert from "node:assert/strict";

import { generateEvents } from "../utils/events.js";


/* --------------------------------------
    DATOS DE PRUEBA
--------------------------------------- */

/*
    Secuencia controlada para comprobar
    las transiciones de presión.

    La temperatura permanece normal.
 */
const readings = [
    {
        index: 0,
        elapsedMinutes: 0,
        pressure: 450,
        temperature: 60,
    },
    {
        index: 1,
        elapsedMinutes: 15,
        pressure: 485,
        temperature: 60,
    },
    {
        index: 2,
        elapsedMinutes: 30,
        pressure: 490,
        temperature: 60,
    },
    {
        index: 3,
        elapsedMinutes: 45,
        pressure: 510,
        temperature: 60,
    },
    {
        index: 4,
        elapsedMinutes: 60,
        pressure: 495,
        temperature: 60,
    },
    {
        index: 5,
        elapsedMinutes: 75,
        pressure: 450,
        temperature: 60,
    },
];


/* --------------------------------------
    01. SIN EVENTOS
--------------------------------------- */

test("no genera eventos sin mediciones", () => {
    assert.deepEqual(generateEvents([], 0), []);
});

test("no genera eventos en la primera lectura", () => {
    assert.deepEqual(generateEvents(readings, 0), []);
});


/* --------------------------------------
    02. TRANSICIONES
--------------------------------------- */

test("detecta el ingreso a advertencia", () => {
    const events = generateEvents(readings, 1);

    assert.equal(events.length, 1);
    assert.equal(events[0].previousStatus, "normal");
    assert.equal(events[0].status, "warning");
    assert.equal(events[0].elapsedMinutes, 15);
});

test("no repite eventos si el estado no cambia", () => {
    const events = generateEvents(readings, 2);

    assert.equal(events.length, 1);
});

test("detecta el ingreso a estado crítico", () => {
    const events = generateEvents(readings, 3);

    assert.equal(events.length, 2);
    assert.equal(events[1].previousStatus, "warning");
    assert.equal(events[1].status, "critical");
});

test("detecta la recuperación de crítico a advertencia", () => {
    const events = generateEvents(readings, 4);

    assert.equal(events.length, 3);
    assert.equal(events[2].previousStatus, "critical");
    assert.equal(events[2].status, "warning");
});

test("detecta el retorno a operación normal", () => {
    const events = generateEvents(readings, 5);

    assert.equal(events.length, 4);
    assert.equal(events[3].previousStatus, "warning");
    assert.equal(events[3].status, "normal");
});


/* ---------------------------------------------
    03. LÍMITES Y ESCENARIOS ESPECIALES
--------------------------------------------- */

test("limita el historial al índice solicitado", () => {
    const events = generateEvents(readings, 2);

    assert.ok(events.every((event) => event.index <= 2));
});

test("detecta saltos directos a estado crítico", () => {
    const directReadings = [
        {
            index: 0,
            elapsedMinutes: 0,
            pressure: 450,
            temperature: 60,
        },
        {
            index: 1,
            elapsedMinutes: 15,
            pressure: 520,
            temperature: 60,
        },
    ];

    const events = generateEvents(directReadings, 1);

    assert.equal(events.length, 1);
    assert.equal(events[0].previousStatus, "normal");
    assert.equal(events[0].status, "critical");
});

test("detecta eventos simultáneos en ambas variables", () => {
    const combinedReadings = [
        {
            index: 0,
            elapsedMinutes: 0,
            pressure: 450,
            temperature: 60,
        },
        {
            index: 1,
            elapsedMinutes: 15,
            pressure: 510,
            temperature: 72,
        },
    ];

    const events = generateEvents(combinedReadings, 1);

    assert.equal(events.length, 2);
    assert.deepEqual(
        events.map((event) => event.variable),
        ["pressure", "temperature"]
    );
});
