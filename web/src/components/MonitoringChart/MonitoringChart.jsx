/* ==========================================
   COMPONENTE: MonitoringChart
   Gráfico de monitoreo de variables industriales
   ========================================== */

import {
    CartesianGrid,
    Line,
    LineChart,
    ReferenceLine,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";

import styles from "./MonitoringChart.module.css";

/**
 * Componente reutilizable para representar
 * una variable industrial a lo largo del tiempo.
 *
 * Props:
 * - title: nombre de la variable.
 * - data: mediciones generadas por el motor.
 * - dataKey: propiedad que queremos representar.
 * - unit: unidad de medida.
 * - color: color de la línea.
 * - currentIndex: índice de la lectura actual.
 * - warningThreshold: límite de advertencia.
 * - criticalThreshold: límite crítico.
 */
export default function MonitoringChart({
    title,
    data,
    dataKey,
    unit,
    color,
    currentIndex,
    warningThreshold,
    criticalThreshold,
}) {

    /* --------------------------------------
       01. PREPARACIÓN DE DATOS
       -------------------------------------- */

    /**
     * Mostramos las mediciones desde el inicio
     * hasta la lectura actual, inclusive.
     *
     * Así el gráfico crece conforme avanza
     * la reproducción de la simulación.
     */
    const visibleData = data.slice(0, currentIndex + 1);

    /* --------------------------------------
    ESCALA VERTICAL DEL GRÁFICO
   -------------------------------------- */

    /**
     * Calculamos los valores mínimo y máximo
     * de las mediciones visibles.
     *
     * También incluimos los límites de
     * advertencia y criticidad para garantizar
     * que las líneas de referencia sean visibles.
     */
    const values = visibleData.map((reading) => reading[dataKey]);

    const minimumValue = Math.min(
        ...values,
        warningThreshold,
        criticalThreshold
    );

    const maximumValue = Math.max(
        ...values,
        warningThreshold,
        criticalThreshold
    );

    /**
     * Agregamos un margen visual del 10 %
     * para evitar que las líneas queden
     * pegadas a los bordes del gráfico.
     */
    const range = maximumValue - minimumValue;
    const padding = Math.max(range * 0.1, 1);

    const yAxisDomain = [
        Math.floor(minimumValue - padding),
        Math.ceil(maximumValue + padding),
    ];

    /**
     * Identificador único del gráfico.
     *
     * Permite asociar el título con su sección.
     */
    const chartId = `chart-${dataKey}`;

    return (
        <section
            className={styles.chart}
            aria-labelledby={chartId}
        >

            {/* ENCABEZADO */}
            <div className={styles.header}>
                <div>
                    <h2 id={chartId} className={styles.title}>
                        {title}
                    </h2>

                    <p className={styles.description}>
                        Evolución temporal de {title.toLowerCase()}
                    </p>
                </div>

                <span className={styles.unit}>
                    {unit}
                </span>
            </div>


            {/* ÁREA DEL GRÁFICO */}
            <div
                className={styles.chartContainer}
                role="img"
                aria-label={`Gráfico de ${title.toLowerCase()} en ${unit}, con ${visibleData.length} mediciones`}
            >
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                        data={visibleData}
                        margin={{
                            top: 15,
                            right: 15,
                            left: 0,
                            bottom: 5,
                        }}
                    >

                        {/* CUADRÍCULA */}
                        <CartesianGrid
                            stroke="rgba(255, 255, 255, 0.08)"
                            strokeDasharray="3 3"
                            vertical={false}
                        />

                        {/* EJE HORIZONTAL: TIEMPO */}
                        <XAxis
                            dataKey="elapsedMinutes"
                            type="number"
                            domain={[0, 1425]}
                            tickCount={5}
                            tickFormatter={(value) => `${value}m`}
                            stroke="#94a3b8"
                            tick={{ fontSize: 11 }}
                            allowDataOverflow
                        />

                        {/* EJE VERTICAL: VALOR DE LA VARIABLE */}
                        <YAxis
                            type="number"
                            domain={yAxisDomain}
                            allowDataOverflow
                            width={48}
                            stroke="#94a3b8"
                            tick={{ fontSize: 11 }}
                        />

                        {/* INFORMACIÓN AL PASAR EL CURSOR */}
                        <Tooltip
                            formatter={(value) => [
                                `${Number(value).toFixed(2)} ${unit}`,
                                title,
                            ]}
                            labelFormatter={(value) =>
                                `Tiempo: ${value} minutos`
                            }
                            contentStyle={{
                                backgroundColor: "#111827",
                                border: "1px solid #334155",
                                borderRadius: "8px",
                                color: "#f8fafc",
                            }}
                        />

                        {/* LÍMITE DE ADVERTENCIA */}
                        <ReferenceLine
                            y={warningThreshold}
                            stroke="#f59e0b"
                            strokeDasharray="6 4"
                            label={{
                                value: "Advertencia",
                                position: "insideTopRight",
                                fill: "#f59e0b",
                                fontSize: 10,
                            }}
                        />

                        {/* LÍMITE CRÍTICO */}
                        <ReferenceLine
                            y={criticalThreshold}
                            stroke="#ef4444"
                            strokeDasharray="6 4"
                            label={{
                                value: "Crítico",
                                position: "insideTopRight",
                                fill: "#ef4444",
                                fontSize: 10,
                            }}
                        />

                        {/* LÍNEA DE LA VARIABLE */}
                        <Line
                            type="monotone"
                            dataKey={dataKey}
                            stroke={color}
                            strokeWidth={2.5}
                            dot={false}
                            activeDot={{ r: 5 }}
                            isAnimationActive={false}
                        />

                    </LineChart>
                </ResponsiveContainer>
            </div>

            {/* PIE DEL GRÁFICO */}
            <div className={styles.footer}>
                <span>
                    Mediciones visualizadas: {visibleData.length} / {data.length}
                </span>

                <span>
                    Intervalo simulado: 15 min
                </span>
            </div>

        </section>
    );
}
