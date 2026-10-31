
/* ==========================================
    TESTS: EXPORT
    Pruebas de exportación CSV industrial
=========================================== */

import test from "node:test";
import assert from "node:assert/strict";

import {
    exportReadingsToCSV,
    exportEventsToCSV,
} from "../utils/export.js";


/* --------------------------------------
    01. DATOS CONTROLADOS
--------------------------------------- */

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
        pressure: 485.5,
        temperature: 66.25,
    },
    {
        index: 2,
        elapsedMinutes: 30,
        pressure: 510.75,
        temperature: 72.5,
    },
];

const events = [
    {
        index: 1,
        elapsedMinutes: 15,
        variable: "pressure",
        label: "Presión",
        value: 485.5,
        unit: "psi",
        previousStatus: "normal",
        status: "warning",
    },
    {
        index: 2,
        elapsedMinutes: 30,
        variable: "pressure",
        label: "Presión",
        value: 510.75,
        unit: "psi",
        previousStatus: "warning",
        status: "critical",
    },
];


/* ----------------------------------------
    02. EXPORTACIÓN DE MEDICIONES
----------------------------------------- */

test("genera encabezados de mediciones", () => {

    const csv = exportReadingsToCSV([], 0);

    assert.ok(csv.startsWith(
        "Índice;Tiempo (min);Presión (psi)"
    ));
});


test("exporta solamente las mediciones visibles", () => {

    const csv = exportReadingsToCSV(readings, 1);
    const lines = csv.split("\r\n");

    // Encabezado + dos mediciones visibles.
    assert.equal(lines.length, 3);

    assert.ok(csv.includes("485,5"));
    assert.ok(!csv.includes("510,75"));
});


test("utiliza coma decimal y punto y coma", () => {

    const csv = exportReadingsToCSV(readings, 1);

    assert.ok(csv.includes("485,5;Advertencia;66,25"));
});


test("incluye los estados de ambas variables", () => {

    const csv = exportReadingsToCSV(readings, 2);

    assert.ok(csv.includes("Crítico"));
    assert.ok(csv.includes("Advertencia"));
});


test("limita el índice al último registro", () => {

    const csv = exportReadingsToCSV(readings, 100);
    const lines = csv.split("\r\n");

    assert.equal(lines.length, 4);
});


test("rechaza índices negativos", () => {

    const csv = exportReadingsToCSV(readings, -1);
    const lines = csv.split("\r\n");

    assert.equal(lines.length, 1);
});


/* --------------------------------------
    03. EXPORTACIÓN DE EVENTOS
--------------------------------------- */

test("genera encabezados de eventos", () => {

    const csv = exportEventsToCSV([], 0);

    assert.ok(csv.startsWith(
        "Índice;Tiempo (min);Variable"
    ));
});


test("exporta solamente los eventos visibles", () => {

    const csv = exportEventsToCSV(events, 1);
    const lines = csv.split("\r\n");

    assert.equal(lines.length, 2);
    assert.ok(csv.includes("Advertencia"));
    assert.ok(!csv.includes("Crítico"));
});


test("incluye los estados anterior y nuevo", () => {

    const csv = exportEventsToCSV(events, 2);

    assert.ok(csv.includes("Normal;Advertencia"));
    assert.ok(csv.includes("Advertencia;Crítico"));
});


test("conserva los valores decimales de eventos", () => {

    const csv = exportEventsToCSV(events, 2);

    assert.ok(csv.includes("510,75"));
});


test("devuelve solo encabezados sin eventos", () => {

    const csv = exportEventsToCSV([], 0);
    const lines = csv.split("\r\n");

    assert.equal(lines.length, 1);
});


test("rechaza índices inválidos en eventos", () => {

    const csv = exportEventsToCSV(events, -1);
    const lines = csv.split("\r\n");

    assert.equal(lines.length, 1);
});
