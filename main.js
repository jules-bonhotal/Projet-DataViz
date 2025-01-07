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
