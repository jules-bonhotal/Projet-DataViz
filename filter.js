const fs = require('fs');

function filtrerParDate(donnees, dateDebut, dateFin) {
    const debut = new Date(dateDebut);
    const fin = new Date(dateFin);

    return donnees.filter(entree => {
        const dateEntree = new Date(entree.fecha_servidor);
        return dateEntree >= debut && dateEntree <= fin;
    });
}

// Lire et filtrer les données
fs.readFile('day_S1.json', 'utf8', (err, data) => {
    if (err) {
        console.error("Erreur lors de la lecture du fichier :", err);
        return;
    }

    // Convertir en JSON
    const jsonData = JSON.parse(data);

    // Plage de dates
    const dateDebut = "2021-05-01";
    const dateFin = "2021-05-31";

    // Filtrer les données
    const resultatsFiltres = filtrerParDate(jsonData, dateDebut, dateFin);

    // Afficher les résultats
    console.log("Données filtrées :", resultatsFiltres);
});
