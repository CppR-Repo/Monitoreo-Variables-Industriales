/* ==========================================
    TESTS: ACTIVE ALARMS
    Pruebas del sistema de alarmas activas
=========================================== */

import test from "node:test";
import assert from "node:assert/strict";

import {
    getActiveAlarms,
    summarizeAlarms,
} from "../utils/alarms.js";


/* --------------------------------------
    01. DATOS DE PRUEBA
--------------------------------------- */

const normalReading = {
    pressure: 450,
    temperature: 60,
};

const warningReading = {
    pressure: 485,
    temperature: 67,
};

const criticalReading = {
    pressure: 510,
    temperature: 73,
};


/* --------------------------------------
    02. GENERACIÓN DE ALARMAS
--------------------------------------- */

test("no genera alarmas en condiciones normales", () => {

    const alarms = getActiveAlarms(
        normalReading,
        {
            pressure: "normal",
            temperature: "normal",
        }
    );

    assert.equal(alarms.length, 0);
});


test("detecta advertencia de presión", () => {

    const alarms = getActiveAlarms(
        {
            pressure: 485,
            temperature: 60,
        },
        {
            pressure: "warning",
            temperature: "normal",
        }
    );

    assert.equal(alarms.length, 1);
    assert.equal(alarms[0].variable, "pressure");
    assert.equal(alarms[0].threshold, 480);
    assert.equal(alarms[0].status, "warning");
});


test("detecta advertencia de temperatura", () => {

    const alarms = getActiveAlarms(
        {
            pressure: 450,
            temperature: 67,
        },
        {
            pressure: "normal",
            temperature: "warning",
        }
    );

    assert.equal(alarms.length, 1);
    assert.equal(alarms[0].variable, "temperature");
    assert.equal(alarms[0].unit, "°C");
});


test("detecta condiciones críticas simultáneas", () => {

    const alarms = getActiveAlarms(
        criticalReading,
        {
            pressure: "critical",
            temperature: "critical",
        }
    );

    assert.equal(alarms.length, 2);
    assert.ok(
        alarms.every((alarm) => alarm.status === "critical")
    );
});


test("ordena las alarmas por severidad", () => {

    const alarms = getActiveAlarms(
        {
            pressure: 485,
            temperature: 73,
        },
        {
            pressure: "warning",
            temperature: "critical",
        }
    );

    assert.equal(alarms[0].variable, "temperature");
    assert.equal(alarms[0].severity, 2);

    assert.equal(alarms[1].variable, "pressure");
    assert.equal(alarms[1].severity, 1);
});


test("descarta lecturas inválidas", () => {

    assert.deepEqual(
        getActiveAlarms(null, null),
        []
    );

    assert.deepEqual(
        getActiveAlarms(
            { pressure: NaN },
            { pressure: "critical" }
        ),
        []
    );
});


test("no genera alarmas para estados desconocidos", () => {

    const alarms = getActiveAlarms(
        warningReading,
        {
            pressure: "unknown",
            temperature: "normal",
        }
    );

    assert.equal(alarms.length, 0);
});


/* --------------------------------------
    03. RESUMEN GENERAL
--------------------------------------- */

test("resume un proceso normal", () => {

    const summary = summarizeAlarms([]);

    assert.deepEqual(summary, {
        total: 0,
        criticalCount: 0,
        warningCount: 0,
        overallStatus: "normal",
    });
});


test("resume advertencias activas", () => {

    const alarms = getActiveAlarms(
        warningReading,
        {
            pressure: "warning",
            temperature: "warning",
        }
    );

    const summary = summarizeAlarms(alarms);

    assert.equal(summary.total, 2);
    assert.equal(summary.warningCount, 2);
    assert.equal(summary.overallStatus, "warning");
});


test("prioriza el estado crítico general", () => {

    const alarms = getActiveAlarms(
        {
            pressure: 510,
            temperature: 67,
        },
        {
            pressure: "critical",
            temperature: "warning",
        }
    );

    const summary = summarizeAlarms(alarms);

    assert.equal(summary.total, 2);
    assert.equal(summary.criticalCount, 1);
    assert.equal(summary.warningCount, 1);
    assert.equal(summary.overallStatus, "critical");
});


test("maneja una lista inválida", () => {

    const summary = summarizeAlarms(null);

    assert.equal(summary.total, 0);
    assert.equal(summary.overallStatus, "normal");
});
