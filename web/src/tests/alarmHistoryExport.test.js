import test from "node:test";
import assert from "node:assert/strict";

import {
    exportAlarmHistoryToCSV,
} from "../utils/export.js";


/* --------------------------------------
    DATOS DE PRUEBA
--------------------------------------- */

const history = [
    {
        id: "episode-pressure-1",
        variable: "pressure",
        status: "warning",
        startIndex: 2,
        lastObservedIndex: 4,
        endIndex: 4,
        durationMinutes: 30,
        isActive: false,
        acknowledged: true,
    },
    {
        id: "episode-temperature-1",
        variable: "temperature",
        status: "critical",
        startIndex: 6,
        lastObservedIndex: 8,
        endIndex: null,
        durationMinutes: 30,
        isActive: true,
        acknowledged: false,
    },
];


/* --------------------------------------
    01. ESTRUCTURA
--------------------------------------- */

test("genera encabezados del historial", () => {

    const csv = exportAlarmHistoryToCSV([]);

    assert.ok(csv.includes("ID episodio"));
    assert.ok(csv.includes("Duración (min)"));
    assert.ok(csv.includes("Reconocimiento"));
});


test("exporta todos los episodios recibidos", () => {

    const csv = exportAlarmHistoryToCSV(history);
    const rows = csv.split("\r\n");

    assert.equal(rows.length, 3);
});


test("utiliza punto y coma como separador", () => {

    const csv = exportAlarmHistoryToCSV(history);

    assert.ok(csv.includes(";"));
});


/* --------------------------------------
    02. CONTENIDO
--------------------------------------- */

test("traduce los nombres de las variables", () => {

    const csv = exportAlarmHistoryToCSV(history);

    assert.ok(csv.includes("Presión"));
    assert.ok(csv.includes("Temperatura"));
});


test("traduce la severidad de los episodios", () => {

    const csv = exportAlarmHistoryToCSV(history);

    assert.ok(csv.includes("Advertencia"));
    assert.ok(csv.includes("Crítico"));
});


test("convierte los índices en números de lectura", () => {

    const csv = exportAlarmHistoryToCSV(history);

    assert.ok(csv.includes(";3;5;5;"));
    assert.ok(csv.includes(";7;9;;"));
});


test("exporta la duración en minutos", () => {

    const csv = exportAlarmHistoryToCSV(history);

    assert.ok(csv.includes(";30;"));
});


test("distingue episodios activos y finalizados", () => {

    const csv = exportAlarmHistoryToCSV(history);

    assert.ok(csv.includes("Finalizada"));
    assert.ok(csv.includes("Activa"));
});


test("exporta el reconocimiento de los episodios", () => {

    const csv = exportAlarmHistoryToCSV(history);

    assert.ok(csv.includes("Reconocida"));
    assert.ok(csv.includes("Pendiente"));
});


test("deja vacía la lectura final de episodios activos", () => {

    const csv = exportAlarmHistoryToCSV([
        history[1],
    ]);

    assert.ok(csv.includes(";7;9;;30;Activa;"));
});


/* --------------------------------------
    03. VALIDACIONES
--------------------------------------- */

test("devuelve encabezados ante un historial inválido", () => {

    const csv = exportAlarmHistoryToCSV(null);

    assert.equal(csv.split("\r\n").length, 1);
});


test("no modifica el historial original", () => {

    const original = structuredClone(history);

    exportAlarmHistoryToCSV(history);

    assert.deepEqual(history, original);
});


test("permite exportar solamente episodios filtrados", () => {

    const filtered = history.filter(
        (episode) => episode.variable === "pressure"
    );

    const csv = exportAlarmHistoryToCSV(filtered);

    assert.ok(csv.includes("Presión"));
    assert.ok(!csv.includes("Temperatura"));
});


test("protege campos de texto con separadores CSV", () => {

    const customHistory = [
        {
            ...history[0],
            id: 'episodio;"especial"',
        },
    ];

    const csv = exportAlarmHistoryToCSV(customHistory);

    assert.ok(
        csv.includes('"episodio;""especial"""')
    );
});
