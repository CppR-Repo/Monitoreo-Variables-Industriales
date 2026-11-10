/* ==========================================
    UTILITY: SIMULATION STORAGE

    Persistencia del estado de la simulación mediante localStorage.

    Responsabilidades:
    1. Validar los datos guardados.
    2. Recuperar una sesión anterior.
    3. Guardar el estado actual.
    4. Eliminar una sesión almacenada.
=========================================== */

import {
    SIMULATION_CONFIG,
    SIMULATION_SCENARIOS,
} from "../services/simulation.js";

export const STORAGE_KEY = "cppr-industrial-simulation-v1";

export const DEFAULT_SIMULATION_STATE = {
    scenario: "normal",
    currentIndex: 0,
    speed: 1000,
    acknowledgements: {},
};

const VALID_SCENARIOS = Object.keys(
    SIMULATION_SCENARIOS
);

const MAX_READING_INDEX = SIMULATION_CONFIG.totalReadings - 1;

const VALID_SPEEDS = [250, 500, 1000];

/* --------------------------------------
    01. VALIDACIÓN DEL ESTADO
--------------------------------------- */

export function validateSimulationState(data) {

    if (
        !data ||
        typeof data !== "object" ||
        Array.isArray(data)
    ) {
        return null;
    }

    const {
        scenario,
        currentIndex,
        speed,
        acknowledgements,
    } = data;

    if (!VALID_SCENARIOS.includes(scenario)) {
        return null;
    }

    if (
        !Number.isInteger(currentIndex) ||
        currentIndex < 0 ||
        currentIndex > MAX_READING_INDEX
    ) {
        return null;
    }

    if (!VALID_SPEEDS.includes(speed)) {
        return null;
    }

    if (
        !acknowledgements ||
        typeof acknowledgements !== "object" ||
        Array.isArray(acknowledgements)
    ) {
        return null;
    }

    // Conservamos únicamente reconocimientos
    // cuyo valor sea exactamente true.
    const validAcknowledgements = {};

    for (const [id, value] of Object.entries(acknowledgements)) {

        if (value === true && id !== "__proto__") {
            Object.defineProperty(
                validAcknowledgements,
                id,
                {
                    value: true,
                    enumerable: true,
                    writable: true,
                    configurable: true,
                }
            );
        }
    }

    return {
        scenario,
        currentIndex,
        speed,
        acknowledgements: validAcknowledgements,
    };
}

/* --------------------------------------
    02. RECUPERAR SESIÓN
--------------------------------------- */

export function loadSimulationState(storage) {

    if (!storage) {
        return null;
    }

    try {
        const saved = storage.getItem(STORAGE_KEY);

        if (!saved) {
            return null;
        }

        const parsed = JSON.parse(saved);

        return validateSimulationState(parsed);

    } catch {
        // Evita que datos corruptos o errores
        // de almacenamiento bloqueen la app.
        return null;
    }
}

/* --------------------------------------
    03. GUARDAR SESIÓN
--------------------------------------- */

export function saveSimulationState(storage, state) {

    if (!storage) {
        return false;
    }

    const validated = validateSimulationState(state);

    if (!validated) {
        return false;
    }

    try {
        storage.setItem(
            STORAGE_KEY,
            JSON.stringify(validated)
        );

        return true;

    } catch {
        return false;
    }
}

/* --------------------------------------
    04. ELIMINAR SESIÓN
--------------------------------------- */

export function clearSimulationState(storage) {

    if (!storage) {
        return false;
    }

    try {
        storage.removeItem(STORAGE_KEY);
        return true;

    } catch {
        return false;
    }
}
