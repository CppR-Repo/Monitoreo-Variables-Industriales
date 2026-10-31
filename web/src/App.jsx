/* ==========================================
   COMPONENTE PRINCIPAL: APP
   Dashboard de monitoreo industrial
   ========================================== */

// Componentes visuales del dashboard.
import Header from "./components/Header/Header";
import MetricCard from "./components/MetricCard/MetricCard";
import SimulationControls from "./components/SimulationControls/SimulationControls";

// Hook que administra las mediciones y los escenarios.
import { useSimulation } from "./hooks/useSimulation";

import MonitoringChart from "./components/MonitoringChart/MonitoringChart.jsx";

// Iconos de las variables industriales.
import pressureIcon from "./assets/icons/presion.svg";
import temperatureIcon from "./assets/icons/temperatura.svg";

// Estilos generales.
import "./App.css";


/**
 * COMPONENTE APP
 *
 * Conecta el estado de la simulación con
 * las tarjetas y el panel de controles.
 */
export default function App() {

  /* --------------------------------------
     01. DATOS Y FUNCIONES DEL HOOK
     -------------------------------------- */

  /**
   * Obtenemos:
   *
   * scenario: escenario seleccionado.
   * currentIndex: posición de la lectura actual.
   * readings: todas las mediciones generadas.
   * currentReading: medición que se muestra.
   * statuses: clasificación de las variables.
   *
   * nextReading: avanza una medición.
   * resetSimulation: vuelve al inicio.
   * changeScenario: selecciona otro escenario.
   */
  const {
    scenario,
    currentIndex,
    readings,
    currentReading,
    statuses,

    isPlaying,
    isFinished,
    speed,

    nextReading,
    resetSimulation,
    changeScenario,

    playSimulation,
    pauseSimulation,
    changeSpeed,
  } = useSimulation();


  /* --------------------------------------
     02. INTERFAZ PRINCIPAL
     -------------------------------------- */

  return (
    <div className="app">
      <div className="app__container">

        {/* Encabezado principal. */}
        <Header />

        <main className="dashboard">

          {/* --------------------------------
              TARJETAS DE MONITOREO
              -------------------------------- */}

          <section
            className="dashboard__metrics"
            aria-label="Variables del proceso"
          >
            <MetricCard
              title="Presión"
              value={currentReading.pressure}
              unit="psi"
              icon={pressureIcon}
              status={statuses.pressure}
              min={0}
              max={500}
            />

            <MetricCard
              title="Temperatura"
              value={currentReading.temperature}
              unit="°C"
              icon={temperatureIcon}
              status={statuses.temperature}
              min={0}
              max={70}
            />
          </section>


          {/* --------------------------------
              CONTROLES DE SIMULACIÓN
              -------------------------------- */}

          <SimulationControls
            // Escenario seleccionado.
            scenario={scenario}

            // Posición de la lectura actual.
            currentIndex={currentIndex}

            // Cantidad total de mediciones.
            totalReadings={readings.length}

            // Tiempo correspondiente a la lectura.
            elapsedMinutes={currentReading.elapsedMinutes}

            // Estado de reproducción
            isPlaying={isPlaying}
            isFinished={isFinished}
            speed={speed}

            // Controles automáticos
            onPlay={playSimulation}
            onPause={pauseSimulation}
            onSpeedChange={changeSpeed}

            // Funciones que ejecutarán los botones.
            onNext={nextReading}
            onReset={resetSimulation}

            // Función que ejecutará el selector.
            onScenarioChange={changeScenario}
          />


          {/* ==========================================
          GRÁFICOS DE MONITOREO INDUSTRIAL
          ========================================== */}

          <section
            className="dashboard__charts"
            aria-label="Gráficos de monitoreo industrial"
          >
            {/* GRÁFICO DE PRESIÓN */}
            <MonitoringChart
              title="Presión"
              data={readings}
              dataKey="pressure"
              unit="psi"
              color="#22d3ee"
              currentIndex={currentIndex}
              warningThreshold={480}
              criticalThreshold={500}
            />

            {/* GRÁFICO DE TEMPERATURA */}
            <MonitoringChart
              title="Temperatura"
              data={readings}
              dataKey="temperature"
              unit="°C"
              color="#fb923c"
              currentIndex={currentIndex}
              warningThreshold={65}
              criticalThreshold={70}
            />
          </section>


        </main>
      </div>
    </div>
  );
}
