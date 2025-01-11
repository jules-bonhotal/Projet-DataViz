const path = "./data/hour_S1.json";

selectedMetrics = [];

function fetchData(path) {
    return fetch(path)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        });
}

// dimensions and margins of the graph
const margin = { top: 40, right: 30, bottom: 30, left: 60 },
    width = 460 - margin.left - margin.right,
    height = 400 - margin.top - margin.bottom;

// Function to create a line chart
function createLineChart(containerId, data, valueKey, color) {
    // Remove existing chart in the container
    d3.select(`#${containerId}`).select("svg").remove();

    // Create SVG for the chart
    const svg = d3.select(`#${containerId}`)
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Add a title to the line chart
    svg.append("text")
        .attr("x", (width / 2))
        .attr("y", 0 - (margin.top / 2))
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .style("text-decoration", "underline")
        .text(valueKey);

    // Format the data
    data.forEach(function (d) {
        d.date = d3.timeParse("%Y-%m-%dT%H:%M:%S")(d.fecha_servidor);
        d.value = +d[valueKey];
    });

    // Filter data to include only every 10th value
    const filteredData = data.filter((d, i) => i % 10 === 0);

    // Add X axis --> it is a date format
    const x = d3.scaleTime()
        .domain(d3.extent(filteredData, function (d) { return d.date; }))
        .range([0, width]);

    svg.append("g")
        .attr("transform", `translate(0, ${height})`)
        .call(d3.axisBottom(x).tickFormat(d3.timeFormat("%d/%m")));

    // Add Y axis
    const y = d3.scaleLinear()
        .domain([0, d3.max(filteredData, function (d) { return d.value; })])
        .range([height, 0]);

    svg.append("g")
        .call(d3.axisLeft(y));

    // Add the line
    svg.append("path")
        .datum(filteredData)
        .attr("fill", "none")
        .attr("stroke", color)
        .attr("stroke-width", 1.5)
        .attr("d", d3.line()
            .x(function (d) { return x(d.date); })
            .y(function (d) { return y(d.value); })
        );
}

// Function to remove a line chart
function removeLineChart(containerId) {
    d3.select(`#${containerId}`).select("svg").remove();
}

// Function to update the visualization when a checkbox is toggled
const updateVisualization = () => {
    const chartContainer = d3.select("#line-chart-section");

    if (document.getElementById("voltage-checkbox").checked) {
        if (!document.getElementById("chart-voltage")) {
            chartContainer.append("div").attr("id", "chart-voltage");
        }
        fetchData(path).then(data => createLineChart("chart-voltage", data, "voltaje", "#ff5733"));
    } else {
        removeLineChart("chart-voltage");
        d3.select("#chart-voltage").remove();
    }

    if (document.getElementById("current-checkbox").checked) {
        if (!document.getElementById("chart-current")) {
            chartContainer.append("div").attr("id", "chart-current");
        }
        fetchData(path).then(data => createLineChart("chart-current", data, "corriente", "#33ff57"));
    } else {
        removeLineChart("chart-current");
        d3.select("#chart-current").remove();
    }

    if (document.getElementById("power-checkbox").checked) {
        if (!document.getElementById("chart-power")) {
            chartContainer.append("div").attr("id", "chart-power");
        }
        fetchData(path).then(data => createLineChart("chart-power", data, "potencia", "#3357ff"));
    } else {
        removeLineChart("chart-power");
        d3.select("#chart-power").remove();
    }

    if (document.getElementById("frequency-checkbox").checked) {
        if (!document.getElementById("chart-frequency")) {
            chartContainer.append("div").attr("id", "chart-frequency");
        }
        fetchData(path).then(data => createLineChart("chart-frequency", data, "frecuencia", "#ff33a6"));
    } else {
        removeLineChart("chart-frequency");
        d3.select("#chart-frequency").remove();
    }

    if (document.getElementById("energy-checkbox").checked) {
        if (!document.getElementById("chart-energy")) {
            chartContainer.append("div").attr("id", "chart-energy");
        }
        fetchData(path).then(data => createLineChart("chart-energy", data, "energia", "#ffdd33"));
    } else {
        removeLineChart("chart-energy");
        d3.select("#chart-energy").remove();
    }

    if (document.getElementById("temperature-checkbox").checked) {
        if (!document.getElementById("chart-temperature")) {
            chartContainer.append("div").attr("id", "chart-temperature");
        }
        fetchData(path).then(data => createLineChart("chart-temperature", data, "ESP32_temp", "#33fff2"));
    } else {
        removeLineChart("chart-temperature");
        d3.select("#chart-temperature").remove();
    }

    if (document.getElementById("power-factor-checkbox").checked) {
        if (!document.getElementById("chart-power-factor")) {
            chartContainer.append("div").attr("id", "chart-power-factor");
        }
        fetchData(path).then(data => createLineChart("chart-power-factor", data, "fp", "#a633ff"));
    } else {
        removeLineChart("chart-power-factor");
        d3.select("#chart-power-factor").remove();
    }

    if (document.getElementById("consumption-checkbox").checked) {
        if (!document.getElementById("chart-consumption")) {
            chartContainer.append("div").attr("id", "chart-consumption");
        }
        fetchData(path).then(data => createLineChart("chart-consumption", data, "consumo", "#ff33ff"));
    } else {
        removeLineChart("chart-consumption");
        d3.select("#chart-consumption").remove();
    }
};

// Attach event listeners to checkboxes
document.querySelectorAll('input[type="checkbox"]').forEach((checkbox) => {
    checkbox.addEventListener("change", updateVisualization);
});
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Interactive Donut Chart with Options</title>
    <script src="https://d3js.org/d3.v7.min.js"></script>
    <style>
        body {
            font-family: Arial, sans-serif;
            background-color: #fdf5ce;
            display: flex;
            justify-content: center;
            align-items: center;
            flex-direction: column;
            margin: 0;
            height: 100vh;
        }
        .checkbox-section, .options-section {
            margin-bottom: 20px;
        }
        svg {
            background-color: #fff6dc;
            border-radius: 8px;
        }
    </style>
</head>
<body>
    <!-- Options pour personnaliser l'affichage -->
    <div class="options-section">
        <label>
            <input type="radio" name="view-option" value="show-values" checked>
            En affichant leur valeur.
        </label>
        <label>
            <input type="radio" name="view-option" value="hide-values">
            Sans leur afficher la valeur (uniquement l'ordre).
        </label>
        <label>
            <input type="radio" name="view-option" value="sectors-only">
            Avec un graphique à secteurs.
        </label>
    </div>

    <!-- Checkboxes pour sélectionner les métriques -->
    <div class="checkbox-section">
        <label>
            <input type="checkbox" id="cpu-checkbox" checked>
            CPU
        </label>
        <label>
            <input type="checkbox" id="ram-checkbox" checked>
            RAM
        </label>
        <label>
            <input type="checkbox" id="gpu-checkbox" checked>
            GPU
        </label>
    </div>

    <!-- Conteneur pour le graphique -->
    <div id="donut-chart"></div>

    <script>
        const path = "./data/hour_S1.json"; // Fichier contenant les données

        // Dimensions et marges
        const width = 300;
        const height = 300;
        const margin = 20;
        const radius = Math.min(width, height) / 2 - margin;

        // Couleurs pour chaque catégorie
        const color = d3.scaleOrdinal()
            .domain(["CPU", "RAM", "GPU"])
            .range(["#4682b4", "#87ceeb", "#32cd32"]);

        // Fonction pour récupérer les données
        function fetchData(path) {
            return fetch(path)
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    return response.json();
                });
        }

        // Fonction pour créer un graphique
        function createDonutChart(containerId, data, option) {
            // Supprimer l'ancien graphique
            d3.select(`#${containerId}`).select("svg").remove();

            // Créer le conteneur SVG
            const svg = d3.select(`#${containerId}`)
                .append("svg")
                .attr("width", width)
                .attr("height", height)
                .append("g")
                .attr("transform", `translate(${width / 2}, ${height / 2})`);

            // Transformer les données pour D3
            const pie = d3.pie().value(d => d[1]);
            const data_ready = pie(Object.entries(data));

            // Créer les arcs
            const arc = d3.arc()
                .innerRadius(option === "sectors-only" ? 0 : radius * 0.5) // Rayon intérieur
                .outerRadius(radius); // Rayon extérieur

            // Ajouter les sections du donut
            svg.selectAll('path')
                .data(data_ready)
                .join('path')
                .attr('d', arc)
                .attr('fill', d => color(d.data[0]))
                .attr("stroke", "black")
                .style("stroke-width", "1px")
                .style("opacity", 0.7);

            // Ajouter les labels selon l'option sélectionnée
            if (option === "show-values") {
                svg.selectAll('text')
                    .data(data_ready)
                    .join('text')
                    .text(d => `${d.data[0]} ${d.data[1]}%`)
                    .attr("transform", d => `translate(${arc.centroid(d)})`)
                    .style("text-anchor", "middle")
                    .style("font-size", "12px");
            } else if (option === "hide-values") {
                svg.selectAll('text')
                    .data(data_ready)
                    .join('text')
                    .text(d => `${d.data[0]}`)
                    .attr("transform", d => `translate(${arc.centroid(d)})`)
                    .style("text-anchor", "middle")
                    .style("font-size", "12px");
            }
        }

        // Fonction pour mettre à jour le graphique
        function updateVisualization() {
            const selectedData = {};
            const selectedOption = document.querySelector('input[name="view-option"]:checked').value;

            // Vérifier les métriques sélectionnées
            if (document.getElementById("cpu-checkbox").checked) {
                selectedData["CPU"] = 24.7; // Exemple, valeurs à extraire dynamiquement
            }
            if (document.getElementById("ram-checkbox").checked) {
                selectedData["RAM"] = 34.2;
            }
            if (document.getElementById("gpu-checkbox").checked) {
                selectedData["GPU"] = 41.1;
            }

            // Créer un nouveau graphique avec les données sélectionnées et l'option
            createDonutChart("donut-chart", selectedData, selectedOption);
        }

        // Charger les données et initialiser le graphique
        fetchData(path).then(data => {
            updateVisualization();
            document.querySelectorAll('input[type="checkbox"]').forEach((checkbox) => {
                checkbox.addEventListener("change", updateVisualization);
            });
            document.querySelectorAll('input[name="view-option"]').forEach((radio) => {
                radio.addEventListener("change", updateVisualization);
            });
        });
    </script>
</body>
</html>
