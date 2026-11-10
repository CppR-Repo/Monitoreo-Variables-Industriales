/* ==========================================
    TESTS: SIMULATION STORAGE
=========================================== */

import test from "node:test";
import assert from "node:assert/strict";

import {
    STORAGE_KEY,
    validateSimulationState,
    loadSimulationState,
    saveSimulationState,
    clearSimulationState,
} from "../utils/simulationStorage.js";

/* --------------------------------------
    ALMACENAMIENTO SIMULADO
--------------------------------------- */

function createMockStorage() {
    const data = new Map();

    return {
        getItem(key) {
            return data.get(key) ?? null;
        },

        setItem(key, value) {
            data.set(key, String(value));
        },

        removeItem(key) {
            data.delete(key);
        },
    };
}

/* --------------------------------------
    DATOS DE PRUEBA
--------------------------------------- */

function createValidState() {
    return {
        scenario: "combined",
        currentIndex: 35,
        speed: 500,
        acknowledgements: {
            "episode-1": true,
        },
    };
}

/* --------------------------------------
    VALIDACIÓN
--------------------------------------- */

test("acepta un estado válido", () => {
    const result = validateSimulationState(
        createValidState()
    );

    assert.deepEqual(result, createValidState());
});

test("rechaza un escenario desconocido", () => {
    const state = createValidState();
    state.scenario = "unknown";

    assert.equal(
        validateSimulationState(state),
        null
    );
});

test("rechaza índices fuera de rango", () => {
    for (const index of [-1, 96, 1.5]) {
        const state = createValidState();
        state.currentIndex = index;

        assert.equal(
            validateSimulationState(state),
            null
        );
    }
});

test("rechaza velocidades desconocidas", () => {
    const state = createValidState();
    state.speed = 750;

    assert.equal(
        validateSimulationState(state),
        null
    );
});

test("rechaza reconocimientos inválidos", () => {
    const state = createValidState();
    state.acknowledgements = [];

    assert.equal(
        validateSimulationState(state),
        null
    );
});

test("descarta reconocimientos que no sean true", () => {
    const state = createValidState();

    state.acknowledgements = {
        valid: true,
        invalid: false,
        other: "true",
    };

    const result = validateSimulationState(state);

    assert.deepEqual(
        result.acknowledgements,
        { valid: true }
    );
});

test("no modifica el estado original", () => {
    const state = createValidState();
    const original = structuredClone(state);

    validateSimulationState(state);

    assert.deepEqual(state, original);
});

/* --------------------------------------
    GUARDADO Y RECUPERACIÓN
--------------------------------------- */

test("guarda correctamente una sesión", () => {
    const storage = createMockStorage();

    const saved = saveSimulationState(
        storage,
        createValidState()
    );

    assert.equal(saved, true);
    assert.ok(storage.getItem(STORAGE_KEY));
});

test("recupera una sesión guardada", () => {
    const storage = createMockStorage();
    const state = createValidState();

    saveSimulationState(storage, state);

    assert.deepEqual(
        loadSimulationState(storage),
        state
    );
});

test("devuelve null si no existe una sesión", () => {
    const storage = createMockStorage();

    assert.equal(
        loadSimulationState(storage),
        null
    );
});

test("rechaza JSON corrupto", () => {
    const storage = createMockStorage();

    storage.setItem(STORAGE_KEY, "{invalid");

    assert.equal(
        loadSimulationState(storage),
        null
    );
});

test("no guarda estados inválidos", () => {
    const storage = createMockStorage();

    assert.equal(
        saveSimulationState(storage, {
            scenario: "invalid",
        }),
        false
    );

    assert.equal(storage.getItem(STORAGE_KEY), null);
});

test("elimina una sesión almacenada", () => {
    const storage = createMockStorage();

    saveSimulationState(storage, createValidState());

    assert.equal(
        clearSimulationState(storage),
        true
    );

    assert.equal(
        loadSimulationState(storage),
        null
    );
});

/* --------------------------------------
    ERRORES DE ALMACENAMIENTO
--------------------------------------- */

test("maneja almacenamiento no disponible", () => {
    assert.equal(loadSimulationState(null), null);
    assert.equal(
        saveSimulationState(null, createValidState()),
        false
    );
    assert.equal(clearSimulationState(null), false);
});

test("maneja errores del almacenamiento", () => {
    const brokenStorage = {
        getItem() {
            throw new Error("Storage unavailable");
        },

        setItem() {
            throw new Error("Storage unavailable");
        },

        removeItem() {
            throw new Error("Storage unavailable");
        },
    };

    assert.equal(
        loadSimulationState(brokenStorage),
        null
    );

    assert.equal(
        saveSimulationState(
            brokenStorage,
            createValidState()
        ),
        false
    );

    assert.equal(
        clearSimulationState(brokenStorage),
        false
    );
});
