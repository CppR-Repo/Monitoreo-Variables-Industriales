/* ==========================================
    COMPONENT: EXPORT CONTROLS
    Descarga de datos industriales en CSV
=========================================== */

import {
    exportReadingsToCSV,
    exportEventsToCSV,
} from "../../utils/export.js";

import styles from "./ExportControls.module.css";


/* --------------------------------------
    01. DESCARGA DE ARCHIVOS
--------------------------------------- */

/*
    Genera y descarga un archivo CSV.

    El BOM facilita que Excel reconozca
    correctamente caracteres UTF-8.
*/
function downloadCSV(content, filename) {

    const BOM = "\uFEFF";

    const blob = new Blob(
        [BOM, content],
        {
            type: "text/csv;charset=utf-8;",
        }
    );

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = filename;

    document.body.appendChild(link);
    link.click();
    link.remove();

    // Liberamos el recurso temporal después
    // de iniciar la descarga.
    setTimeout(() => {
        URL.revokeObjectURL(url);
    }, 1000);
}


/* --------------------------------------
    02. COMPONENTE PRINCIPAL
--------------------------------------- */

/*
    Permite descargar las mediciones y
    los eventos registrados hasta el momento.
*/
export default function ExportControls({
    readings,
    currentIndex,
    events,
    scenario,
}) {

    /* ----------------------------------
        EXPORTAR MEDICIONES
    ----------------------------------- */

    function handleExportReadings() {

        const csv = exportReadingsToCSV(
            readings,
            currentIndex
        );

        downloadCSV(
            csv,
            `mediciones-${scenario}.csv`
        );
    }


    /* ----------------------------------
        EXPORTAR EVENTOS
    ----------------------------------- */

    function handleExportEvents() {

        const csv = exportEventsToCSV(
            events,
            currentIndex
        );

        downloadCSV(
            csv,
            `eventos-${scenario}.csv`
        );
    }


    /* ----------------------------------
        DISPONIBILIDAD DE DATOS
    ----------------------------------- */

    const hasReadings =
        Array.isArray(readings) &&
        readings.length > 0 &&
        currentIndex >= 0;

    const hasEvents =
        Array.isArray(events) &&
        events.some((event) =>
            event.index <= currentIndex
        );


    /* ----------------------------------
        RENDERIZADO
    ----------------------------------- */

    return (
        <section
            className={styles.exportControls}
            aria-labelledby="export-controls-title"
        >

            <header className={styles.header}>

                <span className={styles.eyebrow}>
                    MONITOREO / EXPORTACIÓN
                </span>

                <h2
                    id="export-controls-title"
                    className={styles.title}
                >
                    Exportación de datos
                </h2>

                <p className={styles.description}>
                    Descarga las mediciones y los eventos
                    registrados hasta el momento en
                    formato CSV.
                </p>

            </header>


            <div className={styles.actions}>

                <button
                    type="button"
                    className={styles.primaryButton}
                    onClick={handleExportReadings}
                    disabled={!hasReadings}
                >
                    Descargar mediciones CSV
                </button>

                <button
                    type="button"
                    className={styles.secondaryButton}
                    onClick={handleExportEvents}
                    disabled={!hasEvents}
                >
                    Descargar eventos CSV
                </button>

            </div>

            <p className={styles.note}>
                Los archivos incluyen únicamente
                los datos registrados durante
                la reproducción.
            </p>

        </section>
    );
}
