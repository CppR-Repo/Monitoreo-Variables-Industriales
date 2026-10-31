/* ==========================================
  COMPONENTE PRINCIPAL: APP
  Dashboard de monitoreo industrial
=========================================== */

// Herramientas de React para carga diferida.
import { lazy, Suspense } from "react";

// Componentes visuales del dashboard.
import Header from "./components/Header/Header";
import MetricCard from "./components/MetricCard/MetricCard";
import SimulationControls from "./components/SimulationControls/SimulationControls";

// Hook que administra las mediciones y escenarios.
import { useSimulation } from "./hooks/useSimulation";

// Mostrará el historial de cambios de estado de presión y temperatura durante la simulación
import { generateEvents } from "./utils/events.js";
import EventLog from "./components/EventLog/EventLog.jsx";

import { calculateStatistics } from "./utils/statistics.js";
import SimulationStats from "./components/SimulationStats/SimulationStats.jsx";

import ExportControls from "./components/ExportControls/ExportControls.jsx";

// Iconos de las variables industriales.
import pressureIcon from "./assets/icons/presion.svg";
import temperatureIcon from "./assets/icons/temperatura.svg";

// Estilos generales.
import "./App.css";


/* --------------------------------------
  01. CARGA DIFERIDA DE GRÁFICOS
--------------------------------------- */

/*
  React.lazy() permite separar MonitoringChart
  del paquete JavaScript principal.

  El componente se descarga cuando React
  necesita mostrar los gráficos.

  Como MonitoringChart utiliza Recharts,
  esta estrategia también permite separar
  parte del código de esa biblioteca.
 */
const MonitoringChart = lazy(
  () => import("./components/MonitoringChart/MonitoringChart.jsx")
);


/*
  COMPONENTE APP

  Conecta el motor de simulación con:
  - Encabezado.
  - Tarjetas de monitoreo.
  - Controles de simulación.
  - Gráficos de presión y temperatura.
 */
export default function App() {

  /* --------------------------------------
    02. DATOS Y FUNCIONES DEL HOOK
  --------------------------------------- */

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

  const events = generateEvents(readings, currentIndex);

  const statistics = calculateStatistics(
    readings,
    currentIndex,
    events
  );


  /* --------------------------------------
    03. INTERFAZ PRINCIPAL
  --------------------------------------- */

  return (
    <div className="app">
      <div className="app__container">

        {/* ENCABEZADO PRINCIPAL */}
        <Header />

        <main className="dashboard">

          {/* --------------------------------
              TARJETAS DE MONITOREO
            --------------------------------- */}

          <section
            className="dashboard__metrics"
            aria-label="Variables del proceso"
          >

            {/* TARJETA DE PRESIÓN */}
            <MetricCard
              title="Presión"
              value={currentReading.pressure}
              unit="psi"
              icon={pressureIcon}
              status={statuses.pressure}
              min={0}
              max={500}
            />

            {/* TARJETA DE TEMPERATURA */}
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
            --------------------------------- */}

          <SimulationControls

            // Escenario seleccionado.
            scenario={scenario}

            // Posición de la lectura actual.
            currentIndex={currentIndex}

            // Cantidad total de mediciones.
            totalReadings={readings.length}

            // Tiempo de la lectura actual.
            elapsedMinutes={currentReading.elapsedMinutes}

            // Estado de reproducción.
            isPlaying={isPlaying}
            isFinished={isFinished}
            speed={speed}

            // Controles automáticos.
            onPlay={playSimulation}
            onPause={pauseSimulation}
            onSpeedChange={changeSpeed}

            // Controles manuales.
            onNext={nextReading}
            onReset={resetSimulation}

            // Selector de escenario.
            onScenarioChange={changeScenario}
          />


          {/* ==================================
              GRÁFICOS DE MONITOREO INDUSTRIAL
            =================================== */}

          <section
            className="dashboard__charts"
            aria-label="Gráficos de monitoreo industrial"
          >

            {/*
              Suspense muestra el mensaje
              provisional mientras se descarga
              el componente MonitoringChart.

              Una vez cargado, ambos gráficos
              utilizan el mismo módulo.
            */}
            <Suspense
              fallback={
                <p role="status">
                  Preparando gráficos de monitoreo...
                </p>
              }
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

            </Suspense>
          </section>

          <section
            className="dashboard__statistics"
            aria-label="Estadísticas del monitoreo industrial"
          >
            <SimulationStats statistics={statistics} />
          </section>

          <section
            className="dashboard__export"
            aria-label="Descarga de datos industriales"
          >
            <ExportControls
              readings={readings}
              currentIndex={currentIndex}
              events={events}
              scenario={scenario}
            />
          </section>

          <section
            className="dashboard__events"
            aria-label="Registro de eventos industriales"
          >
            <EventLog events={events} />
          </section>

        </main>

      </div>
    </div>
  );
}

