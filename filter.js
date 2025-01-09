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
const fs = require('fs');

// Charger le fichier JSON nommé 'hour.json'
const data = JSON.parse(fs.readFileSync('hour.json', 'utf8'));

// Définir les heures de début et de fin pour le filtre
const startTime = "22:00:00";
const endTime = "08:00:00";

// Fonction pour filtrer les données sur la base des heures
function filterByTimeRange(data, startTime, endTime) {
  return data.filter(entry => {
    const time = entry.fecha_servidor.split('T')[1]; // Extraire l'heure
    if (startTime <= endTime) {
      // Si l'heure de début est avant l'heure de fin (dans la même journée)
      return time >= startTime && time <= endTime;
    } else {
      // Si l'heure de début est après l'heure de fin (traverse la nuit)
      return time >= startTime || time <= endTime;
    }
  });
}

// Appliquer le filtre
const filteredData = filterByTimeRange(data, startTime, endTime);

// Sauvegarder les résultats filtrés dans un nouveau fichier JSON
fs.writeFileSync('filtered_hour.json', JSON.stringify(filteredData, null, 2), 'utf8');

console.log('Les données filtrées ont été sauvegardées dans filtered_hour.json');
