import styles from "./MetricCard.module.css";

export default function MetricCard({
    title,
    value,
    unit,
    icon,
    status = "normal",
    min,
    max,
}) {
    const statusLabels = {
        normal: "Normal",
        warning: "Advertencia",
        critical: "Crítico",
    };

    const formattedValue =
        typeof value === "number"
            ? value.toLocaleString("es-AR", {
                maximumFractionDigits: 1,
            })
            : "—";

    return (
        <article
            className={`${styles.card} ${styles[status]}`}
            aria-label={`${title}: ${formattedValue} ${unit}`}
        >
            <div className={styles.header}>
                <div className={styles.heading}>
                    <span className={styles.icon} aria-hidden="true">
                        <span
                            className={styles.iconImage}
                            style={{
                                maskImage: `url("${icon}")`,
                                WebkitMaskImage: `url("${icon}")`,
                            }}>
                        </span>
                    </span>

                    <h2 className={styles.title}>{title}</h2>
                </div>

                <span className={styles.status}>
                    <span
                        className={styles.statusDot}
                        aria-hidden="true"
                    />
                    {statusLabels[status] ?? "Sin datos"}
                </span>
            </div>

            <div className={styles.reading}>
                <span className={styles.value}>{formattedValue}</span>
                <span className={styles.unit}>{unit}</span>
            </div>

            <div className={styles.footer}>
                <span>Rango de referencia</span>
                <strong>
                    {min} – {max} {unit}
                </strong>
            </div>
        </article>
    );
}
