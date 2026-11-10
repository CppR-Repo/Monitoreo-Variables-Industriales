/* ==========================================
    TEST: ALARM HISTORY FILTERS
=========================================== */

import test from "node:test";
import assert from "node:assert/strict";

import {
    filterAlarmHistory,
    DEFAULT_ALARM_FILTERS,
} from "../utils/alarmHistoryFilters.js";


/* --------------------------------------
    DATOS DE PRUEBA
--------------------------------------- */

const history = [
    {
        id: "episode-1",
        variable: "pressure",
        status: "warning",
        isActive: false,
        acknowledged: true,
    },
    {
        id: "episode-2",
        variable: "pressure",
        status: "critical",
        isActive: true,
        acknowledged: false,
    },
    {
        id: "episode-3",
        variable: "temperature",
        status: "warning",
        isActive: false,
        acknowledged: false,
    },
    {
        id: "episode-4",
        variable: "temperature",
        status: "critical",
        isActive: true,
        acknowledged: true,
    },
];


/* --------------------------------------
    PRUEBAS
--------------------------------------- */

test("sin filtros conserva todos los episodios", () => {

    const result = filterAlarmHistory(history);

    assert.equal(result.length, 4);
});


test("filtra por presión", () => {

    const result = filterAlarmHistory(history, {
        variable: "pressure",
    });

    assert.deepEqual(
        result.map((episode) => episode.id),
        ["episode-1", "episode-2"]
    );
});


test("filtra por temperatura", () => {

    const result = filterAlarmHistory(history, {
        variable: "temperature",
    });

    assert.equal(result.length, 2);
});


test("filtra advertencias", () => {

    const result = filterAlarmHistory(history, {
        severity: "warning",
    });

    assert.deepEqual(
        result.map((episode) => episode.id),
        ["episode-1", "episode-3"]
    );
});


test("filtra episodios críticos", () => {

    const result = filterAlarmHistory(history, {
        severity: "critical",
    });

    assert.equal(result.length, 2);
});


test("filtra episodios activos", () => {

    const result = filterAlarmHistory(history, {
        state: "active",
    });

    assert.deepEqual(
        result.map((episode) => episode.id),
        ["episode-2", "episode-4"]
    );
});


test("filtra episodios finalizados", () => {

    const result = filterAlarmHistory(history, {
        state: "finished",
    });

    assert.equal(result.length, 2);
});


test("filtra episodios reconocidos", () => {

    const result = filterAlarmHistory(history, {
        acknowledgement: "acknowledged",
    });

    assert.deepEqual(
        result.map((episode) => episode.id),
        ["episode-1", "episode-4"]
    );
});


test("filtra episodios pendientes", () => {

    const result = filterAlarmHistory(history, {
        acknowledgement: "pending",
    });

    assert.equal(result.length, 2);
});


test("combina varios filtros", () => {

    const result = filterAlarmHistory(history, {
        variable: "pressure",
        severity: "critical",
        state: "active",
        acknowledgement: "pending",
    });

    assert.deepEqual(
        result.map((episode) => episode.id),
        ["episode-2"]
    );
});


test("devuelve vacío cuando no hay coincidencias", () => {

    const result = filterAlarmHistory(history, {
        variable: "pressure",
        severity: "critical",
        state: "finished",
    });

    assert.deepEqual(result, []);
});


test("rechaza historiales inválidos", () => {

    assert.deepEqual(
        filterAlarmHistory(null),
        []
    );
});


test("no modifica el historial original", () => {

    const originalIds = history.map(
        (episode) => episode.id
    );

    filterAlarmHistory(history, {
        severity: "critical",
    });

    assert.deepEqual(
        history.map((episode) => episode.id),
        originalIds
    );
});


test("los filtros predeterminados están desactivados", () => {

    assert.deepEqual(DEFAULT_ALARM_FILTERS, {
        variable: "all",
        severity: "all",
        state: "all",
        acknowledgement: "all",
    });
});
