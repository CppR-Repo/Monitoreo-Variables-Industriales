/* ==========================================
    TESTS: ALARM ACKNOWLEDGEMENTS
=========================================== */

import test from "node:test";
import assert from "node:assert/strict";

import {
    createAlarmEpisodeId,
    acknowledgeAlarm,
    isAlarmAcknowledged,
    resetAcknowledgements,
} from "../utils/acknowledgements.js";


/* --------------------------------------
    01. IDENTIFICACIÓN
--------------------------------------- */

test("genera un identificador de episodio", () => {

    const id = createAlarmEpisodeId({
        scenario: "combined",
        variable: "pressure",
        startIndex: 24,
        status: "warning",
    });

    assert.equal(
        id,
        '["combined","pressure",24,"warning"]'
    );
});


test("distingue variables diferentes", () => {

    const pressure = createAlarmEpisodeId({
        scenario: "combined",
        variable: "pressure",
        startIndex: 24,
        status: "warning",
    });

    const temperature = createAlarmEpisodeId({
        scenario: "combined",
        variable: "temperature",
        startIndex: 24,
        status: "warning",
    });

    assert.notEqual(pressure, temperature);
});


test("distingue cambios de severidad", () => {

    const warning = createAlarmEpisodeId({
        scenario: "combined",
        variable: "pressure",
        startIndex: 24,
        status: "warning",
    });

    const critical = createAlarmEpisodeId({
        scenario: "combined",
        variable: "pressure",
        startIndex: 25,
        status: "critical",
    });

    assert.notEqual(warning, critical);
});


test("distingue escenarios diferentes", () => {

    const first = createAlarmEpisodeId({
        scenario: "overpressure",
        variable: "pressure",
        startIndex: 24,
        status: "warning",
    });

    const second = createAlarmEpisodeId({
        scenario: "combined",
        variable: "pressure",
        startIndex: 24,
        status: "warning",
    });

    assert.notEqual(first, second);
});


test("rechaza identificadores inválidos", () => {

    assert.equal(
        createAlarmEpisodeId({
            scenario: "combined",
            variable: "pressure",
            startIndex: -1,
            status: "warning",
        }),
        null
    );

    assert.equal(
        createAlarmEpisodeId({
            scenario: "combined",
            variable: "pressure",
            startIndex: 24,
            status: "normal",
        }),
        null
    );
});


/* --------------------------------------
    02. RECONOCIMIENTO
--------------------------------------- */

test("reconoce una alarma activa", () => {

    const state = acknowledgeAlarm(
        {},
        "episode-1"
    );

    assert.equal(state["episode-1"], true);
});


test("conserva reconocimientos anteriores", () => {

    const state = acknowledgeAlarm(
        { "episode-1": true },
        "episode-2"
    );

    assert.equal(state["episode-1"], true);
    assert.equal(state["episode-2"], true);
});


test("no modifica el objeto original", () => {

    const original = {
        "episode-1": true,
    };

    const result = acknowledgeAlarm(
        original,
        "episode-2"
    );

    assert.notStrictEqual(result, original);

    assert.deepEqual(original, {
        "episode-1": true,
    });
});


test("evita reconocer identificadores inválidos", () => {

    const original = {
        "episode-1": true,
    };

    const result = acknowledgeAlarm(original, "");

    assert.strictEqual(result, original);
});


test("consulta correctamente un reconocimiento", () => {

    const state = {
        "episode-1": true,
    };

    assert.equal(
        isAlarmAcknowledged(state, "episode-1"),
        true
    );

    assert.equal(
        isAlarmAcknowledged(state, "episode-2"),
        false
    );
});


test("reinicia los reconocimientos", () => {

    assert.deepEqual(
        resetAcknowledgements(),
        {}
    );
});
