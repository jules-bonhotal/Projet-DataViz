// Fonction pour filtrer les données par plage de dates
function filterDataByDate(startDate, endDate) {
    // Convertir les dates de début et de fin en objets Date
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Filtrer les données
    const filteredData = data.filter(item => {
        const currentDate = new Date(item.fecha_servidor);
        return currentDate >= start && currentDate <= end;
    });

    // Retourner les données filtrées
    return filteredData;
}

// Exemple d'utilisation
const startDate = "2021-05-05";
const endDate = "2021-05-10";
const result = filterDataByDate(startDate, endDate);

// Affichage des résultats dans la console
console.log("Données filtrées :", result);
const fs = require("fs");

// Fonction pour filtrer les données
function filterDataByDate(data, startDate, endDate) {
  const startTimestamp = new Date(startDate).getTime();
  const endTimestamp = new Date(endDate).getTime();

  return data.filter((item) => {
    const itemTimestamp = new Date(item.fecha_servidor).getTime();
    return itemTimestamp >= startTimestamp && itemTimestamp <= endTimestamp;
  });
}

// Charger et traiter les fichiers JSON
function processFiles(file1Path, file2Path, startDate, endDate) {

  // Filtrer les données
  const filteredData = filterDataByDate(combinedData, startDate, endDate);

  return filteredData;
}

// Exemple d'utilisation
const startDate = "2021-05-05T22:30:00";
const endDate = "2021-05-06T00:30:00";

const result = processFiles("file1.json", "file2.json", startDate, endDate);
console.log("Données filtrées :", result);
