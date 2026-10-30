import styles from "./Header.module.css";

export default function Header() {
    return (
        <header className={styles.header}>
            <div className={styles.brand}>
                <div className={styles.brandIcon} aria-hidden="true">
                    <span className={styles.brandPulse} />
                </div>

                <div className={styles.brandContent}>
                    <span className={styles.eyebrow}>
                        INDUSTRIAL MONITORING SYSTEM
                    </span>

                    <h1 className={styles.title}>
                        Monitoreo de Variables Industriales
                    </h1>

                    <p className={styles.description}>
                        Simulación y análisis de presión y temperatura
                    </p>
                </div>
            </div>

            <div className={styles.status}>
                <span className={styles.statusIndicator} aria-hidden="true" />
                <span>ENTORNO DE SIMULACIÓN</span>
            </div>
        </header>
    );
}
