import "./styles.css";

// Function to update the visualization when a checkbox is toggled
const updateVisualization = () => {
  const selectedMetrics = [];

  // Check which checkboxes are selected
  if (document.getElementById("voltage-checkbox").checked) {
    selectedMetrics.push("Voltage");
  }
  if (document.getElementById("current-checkbox").checked) {
    selectedMetrics.push("Current");
  }
  if (document.getElementById("power-checkbox").checked) {
    selectedMetrics.push("Power");
  }
  if (document.getElementById("frequency-checkbox").checked) {
    selectedMetrics.push("Frequency");
  }
  if (document.getElementById("energy-checkbox").checked) {
    selectedMetrics.push("Energy");
  }
  if (document.getElementById("temperature-checkbox").checked) {
    selectedMetrics.push("Temperature");
  }
  if (document.getElementById("power-factor-checkbox").checked) {
    selectedMetrics.push("Power Factor");
  }
  if (document.getElementById("consumption-checkbox").checked) {
    selectedMetrics.push("Consumption");
  }

  // For now, just log the selected metrics
  console.log("Selected Metrics: ", selectedMetrics);

  // Here you can update your D3.js visualization based on selected metrics
  // Example: D3 code to update graph based on selectedMetrics...
};

// Attach event listeners to checkboxes
document.querySelectorAll('input[type="checkbox"]').forEach((checkbox) => {
  checkbox.addEventListener("change", updateVisualization);
});