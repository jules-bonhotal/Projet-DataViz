const fs = require("fs");

function filtrerParDate(donnees, dateDebut, dateFin) {
  const debut = new Date(dateDebut);
  const fin = new Date(dateFin);

  return donnees.filter((entree) => {
    const dateEntree = new Date(entree.fecha_servidor);
    return dateEntree >= debut && dateEntree <= fin;
  });
}

// Lire et filtrer les données
fs.readFile("day_S1.json", "utf8", (err, data) => {
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
const fs = require("fs");

// Charger le fichier JSON nommé 'hour.json'
const data = JSON.parse(fs.readFileSync("hour.json", "utf8"));

// Définir les heures de début et de fin pour le filtre
const startTime = "22:00:00";
const endTime = "08:00:00";

// Fonction pour filtrer les données sur la base des heures
function filterByTimeRange(data, startTime, endTime) {
  return data.filter((entry) => {
    const time = entry.fecha_servidor.split("T")[1]; // Extraire l'heure
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
fs.writeFileSync(
  "filtered_hour.json",
  JSON.stringify(filteredData, null, 2),
  "utf8"
);

console.log(
  "Les données filtrées ont été sauvegardées dans filtered_hour.json"
);
const fs = require("fs");

// Charger le fichier JSON nommé 'hour.json'
data = JSON.parse(fs.readFileSync("hour.json", "utf8"));

// Fonction pour obtenir le numéro de la semaine
function getWeekNumber(dateString) {
  const date = new Date(dateString);
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
}

// Définir les semaines à filtrer (entre 1 et 52)
const startWeek = 1;
const endWeek = 52;

// Filtrer les données par semaines
function filterByWeekRange(data, startWeek, endWeek) {
  return data.filter((entry) => {
    const weekNumber = getWeekNumber(entry.fecha_servidor);
    return weekNumber >= startWeek && weekNumber <= endWeek;
  });
}

// Appliquer le filtre
filteredData = filterByWeekRange(data, startWeek, endWeek);

// Sauvegarder les résultats filtrés dans un fichier nommé 'week.json'
fs.writeFileSync("week.json", JSON.stringify(filteredData, null, 2), "utf8");

console.log(
  "Les données filtrées par semaine ont été sauvegardées dans week.json"
);

// Charger toutes les données des fichiers JSON
async function loadAllData() {
  const files = [
    "data/day.json",
    "data/hour.json",
    "data/minute.json",
    "data/week.json"
  ];
  const allData = [];
  for (const file of files) {
    const response = await fetch(file);
    const jsonData = await response.json();
    allData.push(...jsonData);
  }
  return allData;
}

// Obtenir les attributs sélectionnés via les cases à cocher
function getSelectedAttributes() {
  const checkboxes = document.querySelectorAll(
    "#checkbox-section input[type='checkbox']"
  );
  const selectedAttributes = [];
  checkboxes.forEach((checkbox) => {
    if (checkbox.checked) {
      selectedAttributes.push(checkbox.id.replace("-checkbox", ""));
    }
  });
  return selectedAttributes;
}

// Filtrer les données en fonction des attributs sélectionnés
function filterDataByAttributes(data, selectedAttributes) {
  return data.map((entry) => {
    const filteredEntry = { fecha_servidor: entry.fecha_servidor }; // Toujours inclure la date
    selectedAttributes.forEach((attr) => {
      if (entry[attr] !== undefined) {
        filteredEntry[attr] = entry[attr];
      }
    });
    return filteredEntry;
  });
}

// Créer un graphique de lignes avec D3.js
function createLineChart(filteredData, selectedAttributes) {
  // Vider l'ancien graphique
  const chartSection = document.getElementById("line-chart-section");
  chartSection.innerHTML = "";

  if (filteredData.length === 0 || selectedAttributes.length === 0) {
    chartSection.innerHTML =
      "<p>Veuillez sélectionner des métriques pour afficher les données.</p>";
    return;
  }

  // Dimensions du graphique
  const margin = { top: 20, right: 30, bottom: 30, left: 50 };
  const width = 800 - margin.left - margin.right;
  const height = 400 - margin.top - margin.bottom;

  // Créer un conteneur SVG
  const svg = d3
    .select("#line-chart-section")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  // Échelle pour l'axe X (date)
  const x = d3
    .scaleTime()
    .domain(d3.extent(filteredData, (d) => new Date(d.fecha_servidor)))
    .range([0, width]);

  svg
    .append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x));

  // Échelle pour l'axe Y (valeurs des métriques)
  const y = d3
    .scaleLinear()
    .domain([
      0,
      d3.max(
        filteredData,
        (d) => d3.max(selectedAttributes.map((attr) => d[attr])) || 0
      )
    ])
    .nice()
    .range([height, 0]);

  svg.append("g").call(d3.axisLeft(y));

  // Ajouter des lignes pour chaque métrique sélectionnée
  selectedAttributes.forEach((attr, index) => {
    const line = d3
      .line()
      .x((d) => x(new Date(d.fecha_servidor)))
      .y((d) => y(d[attr]));

    svg
      .append("path")
      .datum(filteredData)
      .attr("fill", "none")
      .attr("stroke", d3.schemeCategory10[index % 10])
      .attr("stroke-width", 1.5)
      .attr("d", line);

    // Ajouter une légende
    svg
      .append("text")
      .attr("x", width - 100)
      .attr("y", 20 + index * 20)
      .attr("fill", d3.schemeCategory10[index % 10])
      .text(attr)
      .style("font-size", "12px");
  });
}

// Initialiser les cases à cocher et la visualisation
async function initialize() {
  const data = await loadAllData();

  const updateVisualization = () => {
    const selectedAttributes = getSelectedAttributes();
    const filteredData = filterDataByAttributes(data, selectedAttributes);
    createLineChart(filteredData, selectedAttributes);
  };

  // Ajouter des écouteurs aux cases à cocher
  const checkboxes = document.querySelectorAll(
    "#checkbox-section input[type='checkbox']"
  );
  checkboxes.forEach((checkbox) => {
    checkbox.addEventListener("change", updateVisualization);
  });

  // Charger une visualisation initiale vide
  updateVisualization();
}

initialize();
