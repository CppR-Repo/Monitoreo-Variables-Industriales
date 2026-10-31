/* ==========================================
    TESTS: STATISTICS
    Pruebas de estadísticas industriales
=========================================== */

import test from "node:test";
import assert from "node:assert/strict";

import { calculateStatistics } from "../utils/statistics.js";


/* --------------------------------------
    DATOS CONTROLADOS
   -------------------------------------- */

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
        temperature: 65,
    },
    {
        index: 2,
        elapsedMinutes: 30,
        pressure: 510,
        temperature: 72,
    },
    {
        index: 3,
        elapsedMinutes: 45,
        pressure: 490,
        temperature: 68,
    },
    {
        index: 4,
        elapsedMinutes: 60,
        pressure: 460,
        temperature: 62,
    },
];

const events = [
    {
        index: 1,
        variable: "pressure",
        status: "warning",
    },
    {
        index: 2,
        variable: "pressure",
        status: "critical",
    },
    {
        index: 2,
        variable: "temperature",
        status: "critical",
    },
    {
        index: 3,
        variable: "pressure",
        status: "warning",
    },
    {
        index: 4,
        variable: "pressure",
        status: "normal",
    },
];


/* --------------------------------------
    01. DATOS VACÍOS
--------------------------------------- */

test("devuelve estadísticas vacías sin mediciones", () => {

    const result = calculateStatistics([], 0);

    assert.deepEqual(result, {
        maxPressure: null,
        maxTemperature: null,
        criticalEvents: 0,
        elapsedMinutes: 0,
    });
});


/* --------------------------------------
    02. PRIMERA MEDICIÓN
--------------------------------------- */

test("calcula estadísticas de la primera medición", () => {

    const result = calculateStatistics(readings, 0, events);

    assert.equal(result.maxPressure, 450);
    assert.equal(result.maxTemperature, 60);
    assert.equal(result.criticalEvents, 0);
    assert.equal(result.elapsedMinutes, 0);
});


/* --------------------------------------
    03. MÁXIMOS
--------------------------------------- */

test("calcula los valores máximos registrados", () => {

    const result = calculateStatistics(readings, 4, events);

    assert.equal(result.maxPressure, 510);
    assert.equal(result.maxTemperature, 72);
});


/* --------------------------------------
    04. SIN DATOS FUTUROS
--------------------------------------- */

test("no incluye mediciones futuras", () => {

    const result = calculateStatistics(readings, 1, events);

    assert.equal(result.maxPressure, 485);
    assert.equal(result.maxTemperature, 65);
    assert.equal(result.criticalEvents, 0);
    assert.equal(result.elapsedMinutes, 15);
});


/* --------------------------------------
    05. EVENTOS CRÍTICOS
--------------------------------------- */

test("cuenta las transiciones críticas", () => {

    const result = calculateStatistics(readings, 2, events);

    assert.equal(result.criticalEvents, 2);
});


/* --------------------------------------
    06. TIEMPO SIMULADO
--------------------------------------- */

test("calcula el tiempo transcurrido", () => {

    const result = calculateStatistics(readings, 3, events);

    assert.equal(result.elapsedMinutes, 45);
});


/* --------------------------------------
    07. LÍMITE SUPERIOR
--------------------------------------- */

test("limita el índice al último registro", () => {

    const result = calculateStatistics(readings, 100, events);

    assert.equal(result.maxPressure, 510);
    assert.equal(result.maxTemperature, 72);
    assert.equal(result.elapsedMinutes, 60);
});


/* --------------------------------------
    08. ÍNDICES INVÁLIDOS
---------------------------------------- */

test("rechaza índices negativos", () => {

    const result = calculateStatistics(readings, -1, events);

    assert.equal(result.maxPressure, null);
    assert.equal(result.criticalEvents, 0);
});


test("rechaza índices no enteros", () => {

    const result = calculateStatistics(readings, 1.5, events);

    assert.equal(result.maxTemperature, null);
    assert.equal(result.elapsedMinutes, 0);
});
