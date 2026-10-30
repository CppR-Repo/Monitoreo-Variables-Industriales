import Header from "./components/Header/Header";
import MetricCard from "./components/MetricCard/MetricCard";
import pressureIcon from "./assets/icons/presion.svg";
import temperatureIcon from "./assets/icons/temperatura.svg";

import "./App.css";

export default function App() {
  return (
    <div className="app">
      <div className="app__container">
        <Header />

        <main className="dashboard">
          <section
            className="dashboard__metrics"
            aria-label="Variables del proceso"
          >
            <MetricCard
              title="Presión"
              value={450}
              unit="psi"
              icon={pressureIcon}
              status="normal"
              min={0}
              max={500}
            />

            <MetricCard
              title="Temperatura"
              value={60}
              unit="°C"
              icon={temperatureIcon}
              status="normal"
              min={0}
              max={70}
            />
          </section>
        </main>
      </div>
    </div>
  );
}
