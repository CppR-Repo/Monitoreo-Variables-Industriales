/* ==========================================
    UTILITY: DOWNLOAD CSV

    Descarga de archivos CSV en el navegador.
=========================================== */

/*
    Recibe el contenido CSV y el nombre del archivo que queremos descargar.

    El BOM permite que Excel interprete correctamente los caracteres UTF-8.
*/

export function downloadCSV(content, filename) {

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

    // Liberamos la URL temporal después
    // de iniciar la descarga.
    setTimeout(() => {
        URL.revokeObjectURL(url);
    }, 1000);
}
