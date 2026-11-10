/* ==========================================
    TEST: HISTORICAL ACKNOWLEDGEMENTS
=========================================== */

import test from "node:test";
import assert from "node:assert/strict";

import {
    canAcknowledgeHistoricalAlarm,
    acknowledgeHistoricalEpisode,
} from "../utils/historicalAcknowledgements.js";

import {
    generateAlarmHistory,
    summarizeAlarmHistory,
} from "../utils/alarmHistory.js";


/* --------------------------------------
    01. DATOS DE PRUEBA
--------------------------------------- */

const history = [
    {
        id: "episode-1",
        variable: "pressure",
        status: "warning",
        isActive: false,
        acknowledged: false,
    },
    {
        id: "episode-2",
        variable: "temperature",
        status: "critical",
        isActive: true,
        acknowledged: false,
    },
    {
        id: "episode-3",
        variable: "pressure",
        status: "critical",
        isActive: false,
        acknowledged: true,
    },
];

const initialAcknowledgements = {};


/* --------------------------------------
    02. VALIDACIONES
--------------------------------------- */

test("permite reconocer un episodio finalizado pendiente", () => {

    assert.equal(
        canAcknowledgeHistoricalAlarm(
            history,
            "episode-1",
            initialAcknowledgements
        ),
        true
    );
});


test("rechaza episodios activos", () => {

    assert.equal(
        canAcknowledgeHistoricalAlarm(
            history,
            "episode-2",
            initialAcknowledgements
        ),
        false
    );
});


test("rechaza episodios ya reconocidos", () => {

    assert.equal(
        canAcknowledgeHistoricalAlarm(
            history,
            "episode-3",
            initialAcknowledgements
        ),
        false
    );
});


test("rechaza identificadores inexistentes", () => {

    assert.equal(
        canAcknowledgeHistoricalAlarm(
            history,
            "episode-999",
            initialAcknowledgements
        ),
        false
    );
});


test("rechaza identificadores inválidos", () => {

    assert.equal(
        canAcknowledgeHistoricalAlarm(
            history,
            "",
            initialAcknowledgements
        ),
        false
    );

    assert.equal(
        canAcknowledgeHistoricalAlarm(
            history,
            null,
            initialAcknowledgements
        ),
        false
    );
});


test("rechaza historiales inválidos", () => {

    assert.equal(
        canAcknowledgeHistoricalAlarm(
            null,
            "episode-1",
            initialAcknowledgements
        ),
        false
    );
});


/* --------------------------------------
    03. RECONOCIMIENTO
--------------------------------------- */

test("registra el reconocimiento de un episodio finalizado", () => {

    const result = acknowledgeHistoricalEpisode({
        history,
        episodeId: "episode-1",
        acknowledgements: initialAcknowledgements,
    });

    assert.equal(result["episode-1"], true);
});


test("conserva reconocimientos anteriores", () => {

    const previous = {
        "other-episode": true,
    };

    const result = acknowledgeHistoricalEpisode({
        history,
        episodeId: "episode-1",
        acknowledgements: previous,
    });

    assert.equal(result["other-episode"], true);
    assert.equal(result["episode-1"], true);
});


test("no modifica el objeto original", () => {

    const previous = {};

    const result = acknowledgeHistoricalEpisode({
        history,
        episodeId: "episode-1",
        acknowledgements: previous,
    });

    assert.notStrictEqual(result, previous);
    assert.deepEqual(previous, {});
});


test("no modifica los episodios históricos", () => {

    const original = structuredClone(history);

    acknowledgeHistoricalEpisode({
        history,
        episodeId: "episode-1",
        acknowledgements: {},
    });

    assert.deepEqual(history, original);
});


test("evita reconocimientos duplicados", () => {

    const previous = {
        "episode-1": true,
    };

    const result = acknowledgeHistoricalEpisode({
        history,
        episodeId: "episode-1",
        acknowledgements: previous,
    });

    assert.strictEqual(result, previous);
});


test("no reconoce episodios activos", () => {

    const previous = {};

    const result = acknowledgeHistoricalEpisode({
        history,
        episodeId: "episode-2",
        acknowledgements: previous,
    });

    assert.strictEqual(result, previous);
});


test("no reconoce identificadores inexistentes", () => {

    const previous = {};

    const result = acknowledgeHistoricalEpisode({
        history,
        episodeId: "episode-999",
        acknowledgements: previous,
    });

    assert.strictEqual(result, previous);
});


/* --------------------------------------
    04. INTEGRACIÓN CON EL HISTORIAL REAL
--------------------------------------- */

test("el historial refleja el reconocimiento y actualiza los contadores", () => {

    // Mediciones mínimas para producir
    // una advertencia de presión finalizada.
    const readings = [
        {
            pressure: 450,
            temperature: 50,
            elapsedMinutes: 0,
        },
        {
            pressure: 490,
            temperature: 50,
            elapsedMinutes: 15,
        },
        {
            pressure: 450,
            temperature: 50,
            elapsedMinutes: 30,
        },
    ];

    const scenario = "normal";
    const currentIndex = 2;

    const initialHistory = generateAlarmHistory({
        readings,
        currentIndex,
        scenario,
        acknowledgements: {},
    });

    assert.equal(initialHistory.length, 1);

    const episode = initialHistory[0];

    assert.equal(episode.isActive, false);
    assert.equal(episode.acknowledged, false);

    // Reconocemos el episodio.
    const acknowledgements =
        acknowledgeHistoricalEpisode({
            history: initialHistory,
            episodeId: episode.id,
            acknowledgements: {},
        });

    // Regeneramos el historial como lo hace
    // useSimulation cuando cambia el estado.
    const updatedHistory = generateAlarmHistory({
        readings,
        currentIndex,
        scenario,
        acknowledgements,
    });

    const summary = summarizeAlarmHistory(
        updatedHistory
    );

    assert.equal(updatedHistory.length, 1);
    assert.equal(updatedHistory[0].acknowledged, true);

    assert.equal(summary.total, 1);
    assert.equal(summary.acknowledgedCount, 1);
    assert.equal(summary.pendingCount, 0);
});
