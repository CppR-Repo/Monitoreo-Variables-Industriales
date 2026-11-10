/* ==========================================
    PRUEBAS AUTOMATIZADAS
    Motor de simulación industrial
   ========================================== */

/**
    OBJETIVO

    Comprobar que el motor de simulación:

    1. Genere correctamente las mediciones.
    2. Mantenga los intervalos temporales.
    3. Produzca resultados reproducibles.
    4. Clasifique los estados de las variables.
    5. Aplique perturbaciones de presión.
    6. Aplique perturbaciones de temperatura.
    7. Ejecute escenarios combinados.

    Utilizamos el módulo de pruebas integrado de Node.js, sin dependencias adicionales.
*/

// Herramienta para declarar y ejecutar pruebas.
import test from "node:test";

// Herramienta para comparar resultados esperados
// con los resultados reales.
import assert from "node:assert/strict";

// Funciones del motor de simulación.
import {
    createRandomGenerator,
    generateSimulation,
    getPressureDisturbance,
    getTemperatureDisturbance,
} from "../services/simulation.js";

// Funciones para evaluar el estado de las variables.
import {
    evaluateReading,
    evaluateStatus,
    THRESHOLDS,
} from "../utils/thresholds.js";


/* ==========================================
    01. GENERACIÓN DE MEDICIONES
=========================================== */

/*
    PRUEBA 01

    Verifica que el simulador genere exactamente 96 mediciones, según la configuración inicial.
*/
test("Genera 96 mediciones", () => {
    // Ejecutamos una simulación con valores por defecto.
    const readings = generateSimulation();

    // Comprobamos la cantidad de elementos del array.
    assert.equal(readings.length, 96);
});


/*
    PRUEBA 02

    Comprueba que la primera lectura coincida con los valores nominales configurados.

    Presión inicial: 450 psi.
    Temperatura inicial: 60 °C.
    Tiempo inicial: 0 minutos.
*/
test("Comienza con valores nominales", () => {
    const readings = generateSimulation();

    // La primera lectura corresponde al índice 0.
    assert.equal(readings[0].pressure, 450);
    assert.equal(readings[0].temperature, 60);
    assert.equal(readings[0].elapsedMinutes, 0);
});


/*
    PRUEBA 03

    Comprueba que las mediciones estén separadas por intervalos simulados de 15 minutos.

    Ejemplos:
    Índice 0 = 0 minutos.
    Índice 1 = 15 minutos.
    Índice 2 = 30 minutos.

    La última lectura ocurre en el minuto 1425.
*/
test("Mantiene intervalos de 15 minutos", () => {
    const readings = generateSimulation();

    // Recorremos todas las mediciones.
    readings.forEach((reading, index) => {
        // El tiempo esperado depende del índice.
        const expectedMinutes = index * 15;

        assert.equal(
            reading.elapsedMinutes,
            expectedMinutes
        );
    });
});


/* ==========================================
    02. GENERADOR PSEUDOALEATORIO
=========================================== */

/*
    PRUEBA 04

    Comprueba que dos simulaciones ejecutadas con la misma semilla generen los mismos datos.

    Esto permite reproducir los resultados durante el desarrollo y las pruebas.
*/
test("La misma semilla genera los mismos datos", () => {
    const first = generateSimulation({ seed: 42 });
    const second = generateSimulation({ seed: 42 });

    // deepEqual compara el contenido completo
    // de ambos arrays y sus objetos internos.
    assert.deepEqual(first, second);
});


/*
    PRUEBA 05

    Verifica que el generador pseudoaleatorio devuelva valores dentro del intervalo:
    0 <= valor < 1

    Se realizan 100 comprobaciones consecutivas.
*/
test("El generador produce valores entre 0 y 1", () => {
    const random = createRandomGenerator(42);

    for (let index = 0; index < 100; index++) {
        const value = random();

        // El valor debe ser mayor o igual que cero.
        assert.ok(value >= 0);

        // El valor debe ser estrictamente menor que uno.
        assert.ok(value < 1);
    }
});


/* ==========================================
    03. EVALUACIÓN DE ESTADOS
=========================================== */

/*
    PRUEBA 06

    Comprueba que los valores nominales sean clasificados como normales.
*/
test("Identifica valores normales", () => {
    const result = evaluateReading({
        pressure: 450,
        temperature: 60,
    });

    assert.deepEqual(result, {
        pressure: "normal",
        temperature: "normal",
    });
});


/*
    PRUEBA 07

    Comprueba que los valores ubicados entre los umbrales de advertencia y los críticos
    sean clasificados como "warning".
*/
test("Identifica advertencias", () => {
    const result = evaluateReading({
        pressure: 490,
        temperature: 67,
    });

    assert.deepEqual(result, {
        pressure: "warning",
        temperature: "warning",
    });
});


/*
    PRUEBA 08

    Comprueba que los valores superiores a los límites críticos sean identificados.
    Presión crítica: 500 psi.
    Temperatura crítica: 70 °C.
*/
test("Identifica condiciones críticas", () => {
    const result = evaluateReading({
        pressure: 525,
        temperature: 75,
    });

    assert.deepEqual(result, {
        pressure: "critical",
        temperature: "critical",
    });
});


/*
    PRUEBA 09

    Comprueba los límites exactos.

    Al alcanzar el umbral, el estado correspondiente debe activarse.
*/
test("Clasifica correctamente los umbrales", () => {
    // Presión: límite de advertencia.
    assert.equal(
        evaluateStatus(480, THRESHOLDS.pressure),
        "warning"
    );

    // Presión: límite crítico.
    assert.equal(
        evaluateStatus(500, THRESHOLDS.pressure),
        "critical"
    );

    // Temperatura: límite crítico.
    assert.equal(
        evaluateStatus(70, THRESHOLDS.temperature),
        "critical"
    );
});


/*
    PRUEBA 10

    Verifica que los valores inválidos no sean clasificados como normales.

    NaN: no representa un número válido.
    Infinity: representa infinito.
    null: ausencia explícita de valor.
*/
test("Rechaza valores no válidos", () => {
    assert.equal(
        evaluateStatus(NaN, THRESHOLDS.pressure),
        "invalid"
    );

    assert.equal(
        evaluateStatus(Infinity, THRESHOLDS.pressure),
        "invalid"
    );

    assert.equal(
        evaluateStatus(null, THRESHOLDS.pressure),
        "invalid"
    );
});


/* ==========================================
    04. PERTURBACIONES DE PRESIÓN
   ========================================== */

/*
    PRUEBA 11

    Comprueba que el escenario normal no aplique perturbaciones adicionales.

    Las variaciones aleatorias propias del modelo continúan existiendo.
*/
test("El escenario normal no recibe perturbaciones", () => {
    assert.equal(
        getPressureDisturbance(12, "normal"),
        0
    );

    assert.equal(
        getPressureDisturbance(60, "normal"),
        0
    );
});


/*
    PRUEBA 12

    Verifica el primer episodio de sobrepresión.

    Inicio: índice 12.
    Final: índice 15.
    Incremento: 22 psi por paso.

    Antes y después del episodio, la perturbación debe ser igual a cero.
*/
test("Activa la primera perturbación en los índices correctos", () => {
    // Antes del episodio.
    assert.equal(
        getPressureDisturbance(11, "overpressure"),
        0
    );

    // Primer índice afectado.
    assert.equal(
        getPressureDisturbance(12, "overpressure"),
        22
    );

    // Último índice afectado.
    assert.equal(
        getPressureDisturbance(15, "overpressure"),
        22
    );

    // Primer índice posterior al episodio.
    assert.equal(
        getPressureDisturbance(16, "overpressure"),
        0
    );
});


/*
    PRUEBA 13

    Verifica el segundo episodio de sobrepresión.

    Inicio: índice 60.
    Final: índice 62.
    Incremento: 25 psi por paso.
*/
test("Activa la segunda perturbación en los índices correctos", () => {
    assert.equal(
        getPressureDisturbance(59, "overpressure"),
        0
    );

    assert.equal(
        getPressureDisturbance(60, "overpressure"),
        25
    );

    assert.equal(
        getPressureDisturbance(62, "overpressure"),
        25
    );

    assert.equal(
        getPressureDisturbance(63, "overpressure"),
        0
    );
});


/*
    PRUEBA 14

    Comprueba que la simulación de sobrepresión genere al menos una lectura crítica.

    some() devuelve true cuando encuentra un elemento que cumple la condición.
*/
test("La sobrepresión genera al menos una lectura crítica", () => {
    const readings = generateSimulation({
        seed: 42,
        scenario: "overpressure",
    });

    const hasCriticalPressure = readings.some(
        (reading) =>
            evaluateReading(reading).pressure === "critical"
    );

    assert.equal(hasCriticalPressure, true);
});


/*
    PRUEBA 15

    Verifica que la presión comience a disminuir después del primer episodio de sobrepresión.

    Se utiliza la semilla 42 para obtener una secuencia conocida y reproducible.

    Esta prueba no garantiza que cualquier semilla produzca una caída en cada paso.
*/
test("La presión comienza a recuperarse después del primer episodio", () => {
    const readings = generateSimulation({
        seed: 42,
        scenario: "overpressure",
    });

    // La lectura 16 debe ser menor que la 15.
    assert.ok(
        readings[16].pressure < readings[15].pressure
    );

    // La lectura 17 debe ser menor que la 16.
    assert.ok(
        readings[17].pressure < readings[16].pressure
    );
});


/*
    PRUEBA 16

    Comprueba que el escenario de sobrepresión sea reproducible con la misma semilla.
*/
test("El escenario de sobrepresión es reproducible", () => {
    const first = generateSimulation({
        seed: 42,
        scenario: "overpressure",
    });

    const second = generateSimulation({
        seed: 42,
        scenario: "overpressure",
    });

    assert.deepEqual(first, second);
});


/* ==========================================
    05. VALIDACIÓN DE ESCENARIOS
=========================================== */

/*
    PRUEBA 17

    Comprueba que el motor rechace escenarios que no estén definidos.

    assert.throws() verifica que la función produzca el tipo de error esperado.
*/
test("Rechaza escenarios desconocidos", () => {
    assert.throws(
        () => generateSimulation({
            scenario: "unknown",
        }),
        RangeError
    );
});


/* ==========================================
    06. PERTURBACIONES DE TEMPERATURA 
========================================== */

/*
    PRUEBA 18

    Comprueba la activación y desactivación del primer episodio de sobretemperatura.

    Inicio: índice 30.
    Final: índice 35.
    Incremento: 3.5 °C por paso.
*/
test("Activa correctamente la sobretemperatura", () => {
    // Antes del episodio.
    assert.equal(
        getTemperatureDisturbance(29, "overtemperature"),
        0
    );

    // Inicio del episodio.
    assert.equal(
        getTemperatureDisturbance(30, "overtemperature"),
        3.5
    );

    // Final del episodio.
    assert.equal(
        getTemperatureDisturbance(35, "overtemperature"),
        3.5
    );

    // Después del episodio.
    assert.equal(
        getTemperatureDisturbance(36, "overtemperature"),
        0
    );
});


/*
    PRUEBA 19

    Comprueba que el escenario de sobretemperatura genere al menos una lectura crítica.

    El límite crítico configurado es 70 °C.
*/
test("La sobretemperatura genera una lectura crítica", () => {
    const readings = generateSimulation({
        seed: 42,
        scenario: "overtemperature",
    });

    const hasCriticalTemperature = readings.some(
        (reading) =>
            evaluateReading(reading).temperature === "critical"
    );

    assert.equal(hasCriticalTemperature, true);
});


/* ==========================================
    07. ESCENARIO COMBINADO
=========================================== */

/*
    PRUEBA 20

    Comprueba que el escenario combinado produzca condiciones críticas tanto
    de presión como de temperatura.

    Los eventos pueden ocurrir en distintos momentos de la simulación.
*/
test("El escenario combinado afecta ambas variables", () => {
    const readings = generateSimulation({
        seed: 42,
        scenario: "combined",
    });

    // Buscamos al menos una presión crítica.
    const hasCriticalPressure = readings.some(
        (reading) =>
            evaluateReading(reading).pressure === "critical"
    );

    // Buscamos al menos una temperatura crítica.
    const hasCriticalTemperature = readings.some(
        (reading) =>
            evaluateReading(reading).temperature === "critical"
    );

    assert.equal(hasCriticalPressure, true);
    assert.equal(hasCriticalTemperature, true);
});


/*
    PRUEBA 21

    Verifica que dos ejecuciones del escenario combinado con la misma semilla produzcan exactamente las mismas mediciones.
*/
test("El escenario combinado es reproducible", () => {
    const first = generateSimulation({
        seed: 42,
        scenario: "combined",
    });

    const second = generateSimulation({
        seed: 42,
        scenario: "combined",
    });

    assert.deepEqual(first, second);
});
