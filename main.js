const path = "./data/hour.json";

// Core state
const state = {
  selectedMetrics: [],
  startTimestamp: new Date("2021-01-01"),
  endTimestamp: new Date("2021-12-31"),
  isDraggingWeeks: false,
  startWeekIndex: null,
};

// Chart configuration
const chartConfig = {
  margin: { top: 40, right: 30, bottom: 30, left: 60 },
  get width() {
    return 280 - this.margin.left - this.margin.right;
  },
  get height() {
    return 180 - this.margin.top - this.margin.bottom;
  },
};

// Metric definitions
const metrics = {
  voltage: { key: "voltaje", color: "#ff5733" },
  current: { key: "corriente", color: "#33ff57" },
  frequency: { key: "frecuencia", color: "#ff33a6" },
  energy: { key: "energia", color: "#ffdd33" },
  temperature: { key: "ESP32_temp", color: "#33fff2" },
  //powerFactor: { key: "fp", color: "#a633ff" },
  consumption: { key: "consumo", color: "#ff33ff" },
};

// Data fetching
const fetchData = async (path) => {
  const response = await fetch(path);
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  return response.json();
};

// Fonction pour extraire les données directement pour le graphique
function getChartData(data) {
  const chartData = {
    CPU: 0,
    GPU: 0,
    RAM: 0,
    unknown: 0,
  };
  let count = 0;
  data.forEach((entry) => {
    // Only include entries where the power values are not 0
    if (
      entry.WORKSTATION_CPU_POWER > 0 &&
      entry.WORKSTATION_GPU_POWER > 0 &&
      entry.WORKSTATION_RAM_POWER > 0
    ) {
      chartData.CPU += entry.WORKSTATION_CPU_POWER || 0;
      chartData.GPU += entry.WORKSTATION_GPU_POWER || 0;
      chartData.RAM += entry.WORKSTATION_RAM_POWER || 0;
      count++;
    }
  });
  if (count > 0) {
    chartData.CPU = Math.round(chartData.CPU / count);
    chartData.GPU = Math.round(chartData.GPU / count);
    chartData.RAM = Math.round(chartData.RAM / count);
  }
  chartData.unknown = Math.max(
    0,
    Math.round(100 - chartData.CPU - chartData.GPU - chartData.RAM)
  );
  return chartData;
}

function createPieChart(containerId, data, colors) {
  const width = 180;
  const height = 180;
  const margin = 0;
  const radius = Math.min(width, height) / 2 - margin;

  // Remove existing chart
  d3.select(`#${containerId}`).select("svg").remove();

  // Create SVG container
  const svg = d3
    .select(`#${containerId}`)
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .append("g")
    .attr("transform", `translate(${width / 2}, ${height / 2})`);

  // Set up colors
  const color = d3.scaleOrdinal().range(colors);

  // Convert data to pie chart format
  const pie = d3.pie().value((d) => d[1]); // d[1] corresponds to the value
  const data_ready = pie(Object.entries(data)); // Use Object.entries instead of d3.entries

  // Define arc
  const arc = d3
    .arc()
    .innerRadius(radius * 0.5)
    .outerRadius(radius);

  // Add arcs
  svg
    .selectAll("path")
    .data(data_ready)
    .enter()
    .append("path")
    .attr("d", arc)
    .attr("fill", (d) => color(d.data[0])) // d.data[0] corresponds to the key
    .attr("stroke", "white")
    .style("stroke-width", "2px");

  // Add labels
  svg
    .selectAll("text")
    .data(data_ready)
    .enter()
    .append("text")
    .text((d) => `${d.data[0]}: ${d.data[1]}%`) // d.data[0] is key, d.data[1] is value
    .attr("transform", (d) => `translate(${arc.centroid(d)})`)
    .style("text-anchor", "middle")
    .style("font-size", "7px");

  // Handle no data case
  if (data.unknown === 100) {
    svg.selectAll("text").remove();
    svg
      .append("text")
      .attr("x", 0)
      .attr("y", 0)
      .attr("text-anchor", "middle")
      .style("font-size", "8px")
      .text("No data available in this range");
    return; // Exit function early as no need to create a pie chart
  }
}

const createLineChart = (containerId, data, valueKey, color) => {
  // Clear existing chart
  d3.select(`#${containerId}`).select("svg").remove();

  let title = valueKey;

  // switch case to translate the key to the correct title to display
  switch (valueKey) {
    case "voltaje":
      title = "Voltage";
      break;
    case "corriente":
      title = "Current";
      break;
    case "frecuencia":
      title = "Frequency";
      break;
    case "energia":
      title = "Energy";
      break;
    case "ESP32_temp":
      title = "Temperature";
      break;
    case "fp":
      title = "Power Factor";
      break;
    case "consumo":
      title = "Consumption";
      break;
    default:
      valueKey = "Unknown";
  }

  const svg = d3
    .select(`#${containerId}`)
    .append("svg")
    .style("background-color", "white")
    .attr(
      "width",
      chartConfig.width + chartConfig.margin.left + chartConfig.margin.right
    )
    .attr(
      "height",
      chartConfig.height + chartConfig.margin.top + chartConfig.margin.bottom
    )
    .append("g")
    .attr(
      "transform",
      `translate(${chartConfig.margin.left},${chartConfig.margin.top})`
    );

  // Chart title
  svg
    .append("text")
    .attr("x", chartConfig.width / 2)
    .attr("y", -chartConfig.margin.top / 2)
    .attr("text-anchor", "middle")
    .style("font-size", "16px")
    .style("text-decoration", "underline")
    .text(title);

  // Correct date parsing
  const dateParser = d3.timeParse("%Y-%m-%dT%H:%M:%S");

  const parsedData = data
    .map((d) => {
      const parsedDate = dateParser(d.fecha_servidor);
      const value = +d[valueKey];
      if (!parsedDate) console.warn("Invalid date:", d.fecha_servidor);
      return {
        date: parsedDate,
        value: isNaN(value) || value === 0 || value === null ? null : value,
      };
    })
    .filter((d) => {
      const inRange =
        d.date >= state.startTimestamp && d.date <= state.endTimestamp;
      return d.date && inRange && !isNaN(d.value);
    });

  // Handle no data case
  if (parsedData.length === 0) {
    svg
      .append("text")
      .attr("x", chartConfig.width / 2)
      .attr("y", chartConfig.height / 2)
      .attr("text-anchor", "middle")
      .style("font-size", "14px")
      .text("No data available in this range");
    return;
  }

  const timeDifference = state.endTimestamp - state.startTimestamp;
  let timeFormatl;
  let ticksl;

  if (timeDifference < 2 * 60 * 1000) {
    // Less than an hour
    timeFormatl = "%M";
    ticksl = d3.timeMinute.every(15);
    console.log("Less than an hour");
  } else if (timeDifference < 24 * 60 * 60 * 1000) {
    // Less than a day
    timeFormatl = "%H:%M";
    ticksl = d3.timeHour.every(2);
    console.log("Less than a day");
  } else if (timeDifference < 2 * 24 * 60 * 60 * 1000) {
    // Less than 2 days
    timeFormatl = "%d/%m";
    ticksl = d3.timeHour.every(12);
    console.log("Less than 2 days");
  } else if (timeDifference < 7 * 24 * 60 * 60 * 1000) {
    // Less than a week
    timeFormatl = "%d/%m";
    ticksl = d3.timeDay.every(1);
    console.log("Less than a week");
  } else if (timeDifference < 30 * 24 * 60 * 60 * 1000) {
    // Less than a month
    timeFormatl = "%d/%m";
    ticksl = d3.timeDay.every(6);
    console.log("Less than a month");
  } else if (timeDifference < 90 * 24 * 60 * 60 * 1000) {
    // Less than 3 months
    timeFormatl = "%d/%m";
    ticksl = d3.timeWeek.every(1);
    console.log("Less than 3 months");
  } else {
    // More than a month
    timeFormatl = "%d/%m";
    ticksl = d3.timeMonth.every(1);
    console.log("More than a month");
  }

  // X axis
  const x = d3
    .scaleTime()
    .domain(d3.extent(parsedData, (d) => d.date))
    .range([0, chartConfig.width]);

  svg
    .append("g")
    .attr("transform", `translate(0, ${chartConfig.height})`)
    .call(d3.axisBottom(x).tickFormat(d3.timeFormat(timeFormatl)).ticks(ticksl))
    .selectAll("text")
    .attr("transform", "rotate(-45)")
    .style("font-size", "8px")
    .style("text-anchor", "end");

  // Y axis
  const y = d3
    .scaleLinear()
    .domain([0, d3.max(parsedData, (d) => d.value)])
    .nice()
    .range([chartConfig.height, 0]);

  svg.append("g").call(d3.axisLeft(y));

  // Draw line
  svg
    .append("path")
    .datum(parsedData)
    .attr("fill", "none")
    .attr("stroke", color)
    .attr("stroke-width", 1.5)
    .attr(
      "d",
      d3
        .line()
        .defined(
          (d) => d.value !== null && d.value !== undefined && !isNaN(d.value)
        )
        .x((d) => x(d.date))
        .y((d) => y(d.value))
        .curve(d3.curveLinear)
    );

  // --- Tooltip Section ---
  const tooltip = d3
    .select(`#${containerId}`)
    .append("div")
    .style("position", "absolute")
    .style("background-color", "white")
    .style("border", "1px solid #ccc")
    .style("padding", "6px")
    .style("border-radius", "4px")
    .style("pointer-events", "none")
    .style("font-size", "12px")
    .style("box-shadow", "0px 0px 5px rgba(0,0,0,0.3)")
    .style("opacity", 0);

  // Add hover points
  svg
    .selectAll("dot")
    .data(parsedData)
    .enter()
    .append("circle")
    .attr("cx", (d) => x(d.date))
    .attr("cy", (d) => y(d.value))
    .attr("r", 4)
    .attr("fill", color)
    .attr("opacity", 0)
    .on("mouseover", function (event, d) {
      tooltip.transition().duration(200).style("opacity", 1);
      tooltip
        .html(
          `<strong>Date:</strong> ${d3.timeFormat("%Y-%m-%d")(d.date)}<br>
           <strong>Time:</strong> ${d3.timeFormat("%H:%M:%S")(d.date)}<br>
           <strong>${title}:</strong> ${d.value.toFixed(2)}`
        )
        .style("left", event.pageX + 10 + "px")
        .style("top", event.pageY - 28 + "px");

      d3.select(this)
        .transition()
        .duration(100)
        .attr("opacity", 1)
        .attr("r", 6);
    })
    .on("mousemove", function (event) {
      tooltip
        .style("left", event.pageX + 10 + "px")
        .style("top", event.pageY - 28 + "px");
    })
    .on("mouseout", function () {
      tooltip.transition().duration(300).style("opacity", 0);
      d3.select(this)
        .transition()
        .duration(100)
        .attr("opacity", 0)
        .attr("r", 4);
    });
};

// Time utilities
const timeUtils = {
  getStartOfWeek: (weekIndex) => {
    const firstDate = new Date("2021-01-01");
    return new Date(firstDate.setDate(firstDate.getDate() + weekIndex * 7));
  },

  getWeekNumber: (date) => {
    const start = new Date(date.getFullYear(), 0, 1);
    return Math.floor((date - start) / (1000 * 60 * 60 * 24 * 7));
  },

  isWeekInRange: (weekStartDate, weekEndDate) => {
    return (
      weekStartDate >= state.startTimestamp && weekEndDate <= state.endTimestamp
    );
  },

  determineTimeInterval: (start, end) => {
    const duration = end - start;
    const hours = duration / (1000 * 60 * 60);

    if (hours <= 2) {
      return duration <= 1000 * 60 * 5
        ? {
            interval: d3.timeSecond.every(15),
            format: d3.timeFormat("%H:%M:%S"),
            type: "seconds",
          }
        : duration <= 1000 * 60 * 60
        ? {
            interval: d3.timeMinute.every(5),
            format: d3.timeFormat("%H:%M"),
            type: "minutes",
          }
        : {
            interval: d3.timeMinute.every(15),
            format: d3.timeFormat("%H:%M"),
            type: "minutes",
          };
    }

    if (hours <= 24)
      return {
        interval: d3.timeHour.every(1),
        format: d3.timeFormat("%H:%M"),
        type: "hours",
      };
    if (hours <= 24 * 7)
      return {
        interval: d3.timeHour.every(6),
        format: d3.timeFormat("%b %d %H:%M"),
        type: "hours",
      };
    if (hours <= 24 * 30)
      return {
        interval: d3.timeDay.every(1),
        format: d3.timeFormat("%b %d"),
        type: "days",
      };
    if (hours <= 24 * 30 * 3)
      return {
        interval: d3.timeWeek.every(1),
        format: d3.timeFormat("%b %d"),
        type: "weeks",
      };
    return {
      interval: d3.timeMonth.every(1),
      format: d3.timeFormat("%b %Y"),
      type: "months",
    };
  },
};

// Timeline creation
const createTimeline = () => {
  const timelineSvg = d3.select("#timeline");
  const containerWidth = timelineSvg.node().getBoundingClientRect().width;
  const containerHeight = 50;

  timelineSvg.selectAll("*").remove();

  const timelineGroup = timelineSvg
    .append("g")
    .attr("transform", "translate(0, 10)");

  timelineGroup
    .append("line")
    .attr("x1", 0)
    .attr("y1", 20)
    .attr("x2", containerWidth)
    .attr("y2", 20)
    .attr("stroke", "#ccc")
    .attr("stroke-width", 2);

  const { interval, format, type } = timeUtils.determineTimeInterval(
    state.startTimestamp,
    state.endTimestamp
  );

  const timeScale = d3
    .scaleTime()
    .domain([state.startTimestamp, state.endTimestamp])
    .range([0, containerWidth]);

  const gradationPoints = interval.range(
    state.startTimestamp,
    state.endTimestamp
  );

  if (type === "hours" || type === "minutes") {
    const minorInterval =
      type === "hours" ? d3.timeMinute.every(15) : d3.timeSecond.every(15);

    const minorPoints = minorInterval.range(
      state.startTimestamp,
      state.endTimestamp
    );

    timelineGroup
      .selectAll(".minor-gradation")
      .data(minorPoints)
      .enter()
      .append("line")
      .attr("class", "minor-gradation")
      .attr("x1", (d) => timeScale(d))
      .attr("y1", 18)
      .attr("x2", (d) => timeScale(d))
      .attr("y2", 22)
      .attr("stroke", "#ccc")
      .attr("stroke-width", 0.5);
  }

  timelineGroup
    .selectAll(".gradation-line")
    .data(gradationPoints)
    .enter()
    .append("line")
    .attr("class", "gradation-line")
    .attr("x1", (d) => timeScale(d))
    .attr("y1", 15)
    .attr("x2", (d) => timeScale(d))
    .attr("y2", 25)
    .attr("stroke", "#666")
    .attr("stroke-width", 1);

  timelineGroup
    .selectAll(".date-label")
    .data(gradationPoints)
    .enter()
    .append("text")
    .attr("class", "date-label")
    .attr("x", (d) => timeScale(d) - 25)
    .attr("y", 30)
    .attr("text-anchor", "middle")
    .attr("transform", (d, i) => {
      const x = timeScale(d);
      return `rotate(-45, ${x}, 35)`;
    })
    .style("font-size", "10px")
    .text((d) => format(d));

  const selectionRect = timelineGroup
    .append("rect")
    .attr("class", "timeline-selection")
    .attr("y", 10)
    .attr("height", 20)
    .attr("fill", "rgba(0, 150, 136, 0.3)")
    .attr("stroke", "#009688")
    .style("display", "none");

  let isDragging = false;
  let dragStart = null;

  timelineSvg.on("mousedown", function (event) {
    isDragging = true;
    dragStart = d3.pointer(event)[0];
    selectionRect.style("display", null).attr("x", dragStart).attr("width", 0);
  });

  timelineSvg.on("mousemove", function (event) {
    if (!isDragging) return;

    const currentX = d3.pointer(event)[0];
    const selectionX = Math.min(dragStart, currentX);
    const selectionWidth = Math.abs(currentX - dragStart);

    selectionRect.attr("x", selectionX).attr("width", selectionWidth);
  });

  timelineSvg.on("mouseup", function (event) {
    if (!isDragging) return;

    isDragging = false;
    const endX = d3.pointer(event)[0];

    state.startTimestamp = timeScale.invert(Math.min(dragStart, endX));
    state.endTimestamp = timeScale.invert(Math.max(dragStart, endX));

    renderSystem.updateAll();
  });
};

// Clock Interface
const createClockInterface = () => {
  const clockRadius = 50;
  const hourHandLength = 30;
  const centerX = clockRadius + 28;
  const centerY = clockRadius + 10;

  const createClock = (svg, date, isStart) => {
    svg.selectAll("*").remove();

    svg
      .append("circle")
      .attr("cx", centerX)
      .attr("cy", centerY)
      .attr("r", clockRadius)
      .attr("fill", "white")
      .attr("stroke", "#ccc");

    for (let i = 0; i < 24; i++) {
      const angle = i * 15 * (Math.PI / 180);
      const isMainMark = i % 3 === 0;
      const markOuterRadius = isMainMark ? clockRadius : clockRadius - 5;

      const x1 = centerX + (clockRadius - 10) * Math.sin(angle);
      const y1 = centerY - (clockRadius - 10) * Math.cos(angle);
      const x2 = centerX + markOuterRadius * Math.sin(angle);
      const y2 = centerY - markOuterRadius * Math.cos(angle);

      svg
        .append("line")
        .attr("x1", x1)
        .attr("y1", y1)
        .attr("x2", x2)
        .attr("y2", y2)
        .attr("stroke", "#666")
        .attr("stroke-width", isMainMark ? 2 : 1);

      if (isMainMark) {
        const textRadius = clockRadius - 20;
        svg
          .append("text")
          .attr("x", centerX + textRadius * Math.sin(angle))
          .attr("y", centerY - textRadius * Math.cos(angle))
          .attr("text-anchor", "middle")
          .attr("dominant-baseline", "middle")
          .attr("font-size", "10px")
          .text(i);
      }
    }

    svg
      .append("circle")
      .attr("cx", centerX)
      .attr("cy", centerY)
      .attr("r", clockRadius * 0.15)
      .attr("fill", "none")
      .attr("stroke", "#ccc")
      .attr("stroke-dasharray", "2,2");

    const hourHand = svg
      .append("line")
      .attr("class", "hour-hand")
      .attr("x1", centerX)
      .attr("y1", centerY)
      .attr("stroke", "#009688")
      .attr("stroke-width", 3);

    const updateHourHand = (hours, minutes) => {
      const angle = (hours + minutes / 60) * 15;
      const radians = (angle - 90) * (Math.PI / 180);
      hourHand
        .attr("x2", centerX + hourHandLength * Math.cos(radians))
        .attr("y2", centerY + hourHandLength * Math.sin(radians));
    };

    updateHourHand(date.getHours(), date.getMinutes());

    svg
      .append("circle")
      .attr("cx", centerX)
      .attr("cy", centerY)
      .attr("r", clockRadius)
      .attr("fill", "transparent")
      .style("cursor", "pointer")
      .on("mousedown", function (event) {
        const updateTime = (event) => {
          const [x, y] = d3.pointer(event, this);
          const angle = Math.atan2(y - centerY, x - centerX) * (180 / Math.PI);
          let hours = Math.round(((angle + 90 + 360) % 360) / 15) % 24;

          const newDate = new Date(
            isStart ? state.startTimestamp : state.endTimestamp
          );
          newDate.setHours(hours);

          if (isStart) {
            state.startTimestamp = newDate;
          } else {
            state.endTimestamp = newDate;
          }

          updateHourHand(hours, 0);
          renderSystem.updateTimeDisplay();
          renderSystem.updateAll();
        };

        svg.on("mousemove", updateTime);
        svg.on("mouseup", () => svg.on("mousemove", null));
        updateTime(event);
      });

    const fo = svg
      .append("foreignObject")
      .attr("x", centerX - 40)
      .attr("y", centerY + clockRadius + 10)
      .attr("width", 80)
      .attr("height", 25);

    fo.append("xhtml:input")
      .attr("type", "text")
      .attr("class", `${isStart ? "start" : "end"}-time-display`)
      .style("width", "100%")
      .style("text-align", "center")
      .style("font-family", "Arial")
      .style("font-size", "12px")
      .style("border", "1px solid #ccc")
      .style("border-radius", "3px solid #3357ff")

      .style("padding", "2px")
      .attr("value", date.toLocaleTimeString("en-US", { hour12: false }))
      .on("change", function () {
        const [hours, minutes, seconds] = this.value.split(":").map(Number);

        if (
          isNaN(hours) ||
          hours < 0 ||
          hours >= 24 ||
          isNaN(minutes) ||
          minutes < 0 ||
          minutes >= 60 ||
          (seconds !== undefined &&
            (isNaN(seconds) || seconds < 0 || seconds >= 60))
        ) {
          this.value = (
            isStart ? state.startTimestamp : state.endTimestamp
          ).toLocaleTimeString("en-US", { hour12: false });
          return;
        }

        const newDate = new Date(
          isStart ? state.startTimestamp : state.endTimestamp
        );
        newDate.setHours(hours, minutes || 0, seconds || 0);

        if (isStart) {
          state.startTimestamp = newDate;
        } else {
          state.endTimestamp = newDate;
        }

        updateHourHand(hours, minutes || 0);
        renderSystem.updateTimeDisplay();
        renderSystem.updateAll();
      });
  };

  createClock(d3.select("#start-clock"), state.startTimestamp, true);
  createClock(d3.select("#end-clock"), state.endTimestamp, false);
};

// Time Grid
const createTimeGrid = () => {
  const weeksInYear = 52;
  const weeksGrid = d3.select("#time-grid");
  weeksGrid.selectAll("*").remove();

  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  const monthContainers = {};

  months.forEach((month, index) => {
    const monthDiv = weeksGrid.append("div").attr("class", "month-container");
    monthDiv.append("h3").text(month);
    monthContainers[index] = monthDiv;
  });

  for (let i = 0; i < weeksInYear; i++) {
    const weekStartDate = timeUtils.getStartOfWeek(i);
    const weekEndDate = new Date(weekStartDate);
    weekEndDate.setDate(weekEndDate.getDate() + 6);

    const monthIndex = weekStartDate.getMonth();
    const weekButton = monthContainers[monthIndex]
      .append("button")
      .attr("class", "time-button")
      .attr("data-week", i)
      .text(`Week ${i + 1}`);

    weekButton.on("mousedown", function (event) {
      event.preventDefault();
      state.isDraggingWeeks = true;
      state.startWeekIndex = i;
      renderSystem.updateWeekSelection(
        state.startWeekIndex,
        state.startWeekIndex
      );
    });

    weekButton.on("mouseenter", function () {
      if (state.isDraggingWeeks) {
        renderSystem.updateWeekSelection(state.startWeekIndex, i);
      }
    });

    if (timeUtils.isWeekInRange(weekStartDate, weekEndDate)) {
      weekButton.classed("in-range", true);
    }
  }

  document.addEventListener("mouseup", () => {
    if (state.isDraggingWeeks) {
      state.isDraggingWeeks = false;
      state.startWeekIndex = null;
    }
  });
};

// Unified rendering system
const renderSystem = {
  updateAll() {
    this.updateGridHighlight();
    createTimeline();
    this.updateClocks();
    this.updateVisualizations();
  },

  updateGridHighlight() {
    d3.selectAll(".time-button").each(function () {
      const weekIndex = parseInt(d3.select(this).attr("data-week"));
      const weekStartDate = timeUtils.getStartOfWeek(weekIndex);
      const weekEndDate = new Date(weekStartDate);
      weekEndDate.setDate(weekEndDate.getDate() + 6);

      d3.select(this).classed(
        "in-range",
        timeUtils.isWeekInRange(weekStartDate, weekEndDate)
      );
    });

    const startWeek = timeUtils.getWeekNumber(state.startTimestamp);
    const endWeek = timeUtils.getWeekNumber(state.endTimestamp);
    if (startWeek === endWeek) {
      this.updateGridSelection(startWeek);
    }
  },

  updateGridSelection(selectedWeek) {
    d3.selectAll(".time-button").classed("selected", false);
    d3.select(`button[data-week="${selectedWeek}"]`).classed("selected", true);
  },

  async updateVisualizations() {
    try {
      const data = await fetchData(path);

      /* Correlation Matrix */
      const selectedMetrics = [
        "voltaje",
        "corriente",
        "frecuencia",
        "energia",
        "fp",
      ];

      // à factoriser
      const dateParser = d3.timeParse("%Y-%m-%dT%H:%M:%S");
      const parsedData = data
        .map((d) => {
          const parsedDate = dateParser(d.fecha_servidor);
          if (!parsedDate) {
            console.warn("Invalid date:", d.fecha_servidor);
            d["date"] = null; // Ensure `d["date"]` is always set, even if invalid
          } else {
            d["date"] = parsedDate;
          }
          return d;
        })
        .filter((d) => {
          const inRange =
            d["date"] &&
            d["date"] >= state.startTimestamp &&
            d["date"] <= state.endTimestamp;
          return inRange;
        });

      const filteredData = getSelectedMetricsData(parsedData, selectedMetrics);
      const matrixData = calculateCorrelationMatrix(
        filteredData,
        selectedMetrics
      );

      const matrixDataFull = calculateCorrelationMatrix(data, selectedMetrics);
      console.log("Matrix", matrixDataFull);
      const allCorrelations = matrixDataFull.matrix.flat(); // Aplatissez la matrice pour avoir toutes les valeurs
      //console.log(allCorrelations);
      const minCorrelation = d3.min(allCorrelations);
      const maxCorrelation = d3.max(allCorrelations);
      console.log("Corrélation Minimale Moyenne: ", minCorrelation);
      console.log("Corrélation Maximale Moyenne: ", maxCorrelation);
      createCorrelationHeatmap(
        "correlation-matrix-container",
        matrixData,
        "",
        minCorrelation,
        maxCorrelation
      );
      console.log("Matrice de corrélation générée avec succès.");

      /** Fin correlation matrix */

      Object.entries(metrics).forEach(([metric, config]) => {
        const checkbox = document.getElementById(`${metric}-checkbox`);
        const chartId = `chart-${metric}`;

        if (checkbox?.checked) {
          if (!document.getElementById(chartId)) {
            d3.select("#line-chart-section").append("div").attr("id", chartId);
          }
          /************** AJOUT **************/
          if (chartId === "chart-consumption") {
            const dateParser = d3.timeParse("%Y-%m-%dT%H:%M:%S");

            const parsedData = data
              .map((d) => {
                const parsedDate = dateParser(d.fecha_servidor);
                if (!parsedDate) {
                  console.warn("Invalid date:", d.fecha_servidor);
                  d["date"] = null; // Ensure `d["date"]` is always set, even if invalid
                } else {
                  d["date"] = parsedDate;
                }
                return d;
              })
              .filter((d) => {
                const inRange =
                  d["date"] &&
                  d["date"] >= state.startTimestamp &&
                  d["date"] <= state.endTimestamp;
                return inRange;
              });

            const chartData = getChartData(parsedData);
            // Appeler directement la fonction `createPieChart`
            const colors = ["#4CAF50", "#2196F3", "#FFC107", "#808080"];
            createPieChart("chart-consumption", chartData, colors);
            createStackedAreaChart("stacked-area-chart-container", data);
          } else {
            createLineChart(chartId, data, config.key, config.color);
          }
          /************** FIN AJOUT **************/
        } else {
          d3.select(`#${chartId}`).remove();
        }
      });
    } catch (error) {
      console.error("Error updating visualizations:", error);
    }
  },

  updateClocks() {
    const updateHand = (clockId, timestamp) => {
      const hourHand = d3.select(clockId).select(".hour-hand");
      const hours = timestamp.getHours();
      const minutes = timestamp.getMinutes();
      const angle = (hours + minutes / 60) * 15;
      const radians = (angle - 90) * (Math.PI / 180);
      const centerX = 78; // clockRadius + 28
      const centerY = 60; // clockRadius + 10
      const length = 30; // hourHandLength

      hourHand
        .attr("x2", centerX + length * Math.cos(radians))
        .attr("y2", centerY + length * Math.sin(radians));
    };

    updateHand("#start-clock", state.startTimestamp);
    updateHand("#end-clock", state.endTimestamp);
    this.updateTimeDisplay();
  },

  updateTimeDisplay() {
    const timeOptions = { hour12: false };
    d3.selectAll(".start-time-display").property(
      "value",
      state.startTimestamp.toLocaleTimeString("en-US", timeOptions)
    );
    d3.selectAll(".end-time-display").property(
      "value",
      state.endTimestamp.toLocaleTimeString("en-US", timeOptions)
    );
  },

  updateWeekSelection(startIdx, endIdx) {
    const actualStartIdx = Math.min(startIdx, endIdx);
    const actualEndIdx = Math.max(startIdx, endIdx);

    const rangeStartDate = timeUtils.getStartOfWeek(actualStartIdx);
    const rangeEndDate = timeUtils.getStartOfWeek(actualEndIdx);
    rangeEndDate.setDate(rangeEndDate.getDate() + 6);

    state.startTimestamp = rangeStartDate;
    state.endTimestamp = rangeEndDate;

    d3.selectAll(".time-button").each(function () {
      const weekIdx = parseInt(d3.select(this).attr("data-week"));
      const isInRange = weekIdx >= actualStartIdx && weekIdx <= actualEndIdx;
      d3.select(this).classed("in-range", isInRange);
    });

    this.updateAll();
  },
};

// Event handlers
const setupEventListeners = () => {
  document.querySelectorAll('input[type="checkbox"]').forEach((checkbox) => {
    checkbox.addEventListener("change", () => renderSystem.updateAll());
  });
};

// Initialization
const initialize = () => {
  createTimeGrid();
  createClockInterface();
  renderSystem.updateAll();
  setupEventListeners();
};

initialize();

function createStackedAreaChart(containerId, data) {
  d3.select(`#${containerId}`).select("svg").remove();

  const margin = { top: 80, right: 75, bottom: 50, left: 60 }, // Ajout d'espace en haut et à droite
    width = 360 - margin.left - margin.right,
    height = 280 - margin.top - margin.bottom;

  // Préparation des données
  const dateParser = d3.timeParse("%Y-%m-%dT%H:%M:%S");
  const preparedData = data
    .map((d) => ({
      date: dateParser(d.fecha_servidor),
      CPU: d.WORKSTATION_CPU_POWER || 0,
      GPU: d.WORKSTATION_GPU_POWER || 0,
      RAM: d.WORKSTATION_RAM_POWER || 0,
    }))
    .filter((d) => {
      const inRange =
        d.date &&
        d.date >= state.startTimestamp &&
        d.date <= state.endTimestamp;
      return inRange;
    });

  const timeDifference = state.endTimestamp - state.startTimestamp;
  let timeFormatl;
  let ticksl;

  if (timeDifference < 2 * 60 * 1000) {
    // Less than an hour
    timeFormatl = "%M";
    ticksl = d3.timeMinute.every(15);
    console.log("Less than an hour");
  } else if (timeDifference < 24 * 60 * 60 * 1000) {
    // Less than a day
    timeFormatl = "%H:%M";
    ticksl = d3.timeHour.every(2);
    console.log("Less than a day");
  } else if (timeDifference < 2 * 24 * 60 * 60 * 1000) {
    // Less than 2 days
    timeFormatl = "%d/%m";
    ticksl = d3.timeHour.every(12);
    console.log("Less than 2 days");
  } else if (timeDifference < 7 * 24 * 60 * 60 * 1000) {
    // Less than a week
    timeFormatl = "%d/%m";
    ticksl = d3.timeDay.every(1);
    console.log("Less than a week");
  } else if (timeDifference < 30 * 24 * 60 * 60 * 1000) {
    // Less than a month
    timeFormatl = "%d/%m";
    ticksl = d3.timeDay.every(6);
    console.log("Less than a month");
  } else if (timeDifference < 90 * 24 * 60 * 60 * 1000) {
    // Less than 3 months
    timeFormatl = "%d/%m";
    ticksl = d3.timeWeek.every(1);
    console.log("Less than 3 months");
  } else {
    // More than a month
    timeFormatl = "%d/%m";
    ticksl = d3.timeMonth.every(1);
    console.log("More than a month");
  }
  // Création des échelles
  const x = d3
    .scaleTime()
    .domain(d3.extent(preparedData, (d) => d.date))
    .range([0, width]);

  const y = d3
    .scaleLinear()
    .domain([0, d3.max(preparedData, (d) => d.CPU + d.GPU + d.RAM)])
    .nice()
    .range([height, 0]);

  const color = d3
    .scaleOrdinal()
    .domain(["CPU", "GPU", "RAM"])
    .range(["#ff5733", "#33ff57", "#3357ff"]);

  const stack = d3.stack().keys(["CPU", "GPU", "RAM"]);
  const stackedData = stack(preparedData);

  // Création du conteneur SVG
  const svg = d3
    .select(`#${containerId}`)
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  // Ajouter le titre en haut
  d3.select(`#${containerId} svg`)
    .append("text")
    .attr("x", (width + margin.left + margin.right) / 2)
    .attr("y", 30) // Position au-dessus du graphique
    .attr("text-anchor", "middle")
    .style("font-size", "12px")
    .style("font-weight", "bold")
    .text("Energy Consumption by Component (CPU, GPU, RAM)");

  // Ajouter une aire empilée
  const area = d3
    .area()
    .x((d) => x(d.data.date))
    .y0((d) => y(d[0]))
    .y1((d) => y(d[1]))
    .curve(d3.curveBasis);

  svg
    .selectAll("path")
    .data(stackedData)
    .enter()
    .append("path")
    .attr("d", area)
    .attr("fill", (d) => color(d.key))
    .attr("opacity", 0.8);

  // Ajouter les axes
  svg
    .append("g")
    .attr("transform", `translate(0,${height})`)
    .call(
      d3.axisBottom(x).tickFormat(d3.timeFormat(timeFormatl)).ticks(ticksl)
    );

  svg.append("g").call(d3.axisLeft(y));

  // Ajouter une légende (à droite du graphique)
  const legend = svg
    .append("g")
    .attr("class", "legend")
    .attr("transform", `translate(${width + 20}, 0)`); // Position à droite

  // Ajouter les rectangles colorés de la légende
  legend
    .selectAll("rect")
    .data(color.domain())
    .enter()
    .append("rect")
    .attr("x", 0)
    .attr("y", (_, i) => i * 25)
    .attr("width", 18)
    .attr("height", 18)
    .style("fill", (d) => color(d));

  // Ajouter les labels de la légende
  legend
    .selectAll("text")
    .data(color.domain())
    .enter()
    .append("text")
    .attr("x", 25) // Décalage du texte par rapport aux rectangles
    .attr("y", (_, i) => i * 25 + 9) // Alignement vertical
    .attr("dy", ".35em")
    .style("text-anchor", "start")
    .style("font-size", "12px")
    .text((d) => d);

  // Ajouter un message si les données sont vides ou nulles
  if (
    preparedData.length === 0 ||
    preparedData.every((d) => d.CPU === 0 && d.GPU === 0 && d.RAM === 0)
  ) {
    svg
      .append("text")
      .attr("x", width / 2)
      .attr("y", height / 2)
      .attr("text-anchor", "middle")
      .style("font-size", "8px")
      .style("fill", "red")
      .text("No data available in this range");
    return;
  }
}

/** Correlation Matrix */

// Récupérer les données des métriques sélectionnées
function getSelectedMetricsData(data, selectedMetrics) {
  return data.map((d) =>
    selectedMetrics.reduce((acc, metric) => {
      acc[metric] = d[metric] || 0; // Remplace les valeurs nulles ou indéfinies par 0
      return acc;
    }, {})
  );
}

// Calculer la matrice de corrélation
function calculateCorrelationMatrix(data, selectedMetrics) {
  const matrix = [];
  const keys = selectedMetrics;

  keys.forEach((key1, i) => {
    matrix[i] = [];
    keys.forEach((key2, j) => {
      const x = data.map((d) => d[key1]);
      const y = data.map((d) => d[key2]);

      //console.log(`Calcul de la corrélation entre ${key1} et ${key2}`);
      matrix[i][j] = pearsonCorrelation(x, y);
    });
  });

  return { matrix, keys };
}

// Calculer la corrélation de Pearson
function pearsonCorrelation(x, y) {
  const n = x.length;
  const meanX = d3.mean(x);
  const meanY = d3.mean(y);

  const numerator = d3.sum(x.map((xi, i) => (xi - meanX) * (y[i] - meanY)));
  const denominator = Math.sqrt(
    d3.sum(x.map((xi) => Math.pow(xi - meanX, 2))) *
      d3.sum(y.map((yi) => Math.pow(yi - meanY, 2)))
  );

  return denominator === 0 ? 0 : numerator / denominator;
}

function createCorrelationHeatmap(
  containerId,
  matrixData,
  title,
  minCorr,
  maxCorr
) {
  const { matrix, keys } = matrixData;
  const cellSize = 25; // Adjusted cell size for better layout
  const labelOffset = 90; // Increased space for labels
  const titlePosX = cellSize * keys.length;
  const height = cellSize * keys.length;

  // Clear any existing heatmap
  d3.select(`#${containerId}`).select("svg").remove();

  const svg = d3
    .select(`#${containerId}`)
    .append("svg")
    .attr("width", 300) // Extra space for better centering
    .attr("height", 300) // Extra space for title and legend
    .append("g")
    .attr("transform", `translate(${labelOffset + 30}, ${labelOffset})`);

  // Add title
  d3.select(`#${containerId} svg`)
    .append("text")
    .attr("x", (titlePosX + 0 + 50) / 2)
    .attr("y", 30) // More space above
    .style("text-anchor", "middle")
    .style("font-size", "14px")
    .style("font-weight", "bold")
    .text(title);

  const colorScale = d3
    .scaleLinear()
    .domain([minCorr, 0.5 * (minCorr + maxCorr), maxCorr])
    .range(["#d73027", "#ffffbf", "#1a9850"]);

  // Add heatmap cells
  svg
    .selectAll("rect")
    .data(matrix.flat())
    .enter()
    .append("rect")
    .attr("x", (_, i) => (i % keys.length) * cellSize)
    .attr("y", (_, i) => Math.floor(i / keys.length) * cellSize)
    .attr("width", cellSize)
    .attr("height", cellSize)
    .style("fill", (d) => colorScale(d))
    .style("stroke", "white");

  // Add cell values
  svg
    .selectAll("text.cell-value")
    .data(matrix.flat())
    .enter()
    .append("text")
    .attr("class", "cell-value")
    .attr("x", (_, i) => (i % keys.length) * cellSize + cellSize / 2)
    .attr("y", (_, i) => Math.floor(i / keys.length) * cellSize + cellSize / 2)
    .attr("dy", ".35em")
    .style("text-anchor", "middle")
    .style("font-size", "10px") // Smaller text
    .style("font-weight", "bold")
    .style("fill", "black")
    .text((d) => (d !== null ? d.toFixed(2) : ""));

  // Add X-axis labels (rotated)
  svg
    .selectAll(".x-label")
    .data(keys)
    .enter()
    .append("text")
    .attr("x", (_, i) => i * cellSize + cellSize / 2)
    .attr("y", -5)
    .attr(
      "transform",
      (_, i) => `rotate(90, ${i * cellSize + cellSize / 2}, -5)`
    )
    .style("text-anchor", "end")
    .style("font-size", "10px")
    .style("font-weight", "bold")
    .text((d) => d.toUpperCase());

  // Add Y-axis labels
  svg
    .selectAll(".y-label")
    .data(keys)
    .enter()
    .append("text")
    .attr("x", -10)
    .attr("y", (_, i) => i * cellSize + cellSize / 2)
    .attr("dy", ".35em")
    .style("text-anchor", "end")
    .style("font-size", "10px")
    .style("font-weight", "bold")
    .text((d) => d.toUpperCase());

  // Add legend
  const legend = svg
    .append("g")
    .attr("class", "legend")
    .attr("transform", `translate(0, ${height + 20})`);

  //const legendScale = [-1, -0.5, 0, 0.5, 1];
  const legendScale = [minCorr, minCorr / 2, 0, maxCorr / 2, maxCorr];
  const legendWidth = 30;

  console.log(colorScale(maxCorr));
  legend
    .selectAll("rect")
    .data(d3.range(legendScale.length))
    .enter()
    .append("rect")
    .attr("x", (_, i) => i * legendWidth - 15)
    .attr("width", legendWidth)
    .attr("height", 10)
    .style("fill", (_, i) => colorScale(legendScale[i]));

  // Add legend labels
  legend
    .selectAll("text")
    .data(legendScale)
    .enter()
    .append("text")
    .attr("x", (_, i) => i * legendWidth)
    .attr("y", 25)
    .style("text-anchor", "middle")
    .style("font-size", "10px")
    .text((d) => d.toFixed(1));
}

/*
document.addEventListener("DOMContentLoaded", function () {
  const path = "./data/hour.json";

    // Add to your existing initialization code
  document.getElementById('toggle-metrics').addEventListener('click', function() {
    const section = document.getElementById('checkbox-section');
    const button = this;
    section.classList.toggle('metrics-hidden');
    button.classList.toggle('collapsed');
    button.textContent = button.classList.contains('collapsed') ? '▶' : '▼';
  });

  // Vérifier si toutes les métriques sont sélectionnées
  function areAllMetricsSelected() {
    const checkboxes = document.querySelectorAll(
      "#checkbox-section input[type='checkbox']"
    );
    return Array.from(checkboxes).every((checkbox) => checkbox.checked);
  }

  // Charger les données depuis le fichier JSON
  async function fetchData(path) {
    const response = await fetch(path);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return response.json();
  }

  // Récupérer les données des métriques sélectionnées
  function getSelectedMetricsData(data, selectedMetrics) {
    return data.map((d) =>
      selectedMetrics.reduce((acc, metric) => {
        acc[metric] = d[metric] || 0; // Remplace les valeurs nulles ou indéfinies par 0
        return acc;
      }, {})
    );
  }

  // Calculer la matrice de corrélation
  function calculateCorrelationMatrix(data, selectedMetrics) {
    const matrix = [];
    const keys = selectedMetrics;

    keys.forEach((key1, i) => {
      matrix[i] = [];
      keys.forEach((key2, j) => {
        const x = data.map((d) => d[key1]);
        const y = data.map((d) => d[key2]);

        console.log(`Calcul de la corrélation entre ${key1} et ${key2}`);
        matrix[i][j] = pearsonCorrelation(x, y);
      });
    });

    return { matrix, keys };
  }

  // Calculer la corrélation de Pearson
  function pearsonCorrelation(x, y) {
    const n = x.length;
    const meanX = d3.mean(x);
    const meanY = d3.mean(y);

    const numerator = d3.sum(x.map((xi, i) => (xi - meanX) * (y[i] - meanY)));
    const denominator = Math.sqrt(
      d3.sum(x.map((xi) => Math.pow(xi - meanX, 2))) *
        d3.sum(y.map((yi) => Math.pow(yi - meanY, 2)))
    );

    return denominator === 0 ? 0 : numerator / denominator;
  }

  function createCorrelationHeatmap(containerId, matrixData, title) {
    const { matrix, keys } = matrixData;
    const cellSize = 70; // Taille des cellules
    const labelOffset = 150; // Espace pour les étiquettes
    const width = cellSize * keys.length;
    const height = cellSize * keys.length;
  
    // Supprimer tout graphique existant
    d3.select(`#${containerId}`).select("svg").remove();
  
    const svg = d3
      .select(`#${containerId}`)
      .append("svg")
      .attr("width", width + labelOffset)
      .attr("height", height + labelOffset + 100) // Ajouter de l'espace pour le titre et la légende
      .append("g")
      .attr("transform", `translate(${labelOffset}, 70)`);
  
    // Ajouter un titre en haut de la figure
    d3.select(`#${containerId} svg`)
      .append("text")
      .attr("x", (width + labelOffset) / 2) // Centrer le texte
      .attr("y", 20) // Position tout en haut
      .style("text-anchor", "middle")
      .style("font-size", "18px")
      .style("font-weight", "bold")
      .text(title); // Titre dynamique
  
    const colorScale = d3
      .scaleLinear()
      .domain([-1, 0, 1])
      .range(["#d73027", "#ffffbf", "#1a9850"]);
  
    // Ajouter les cellules de la heatmap
    svg
      .selectAll("rect")
      .data(matrix.flat())
      .enter()
      .append("rect")
      .attr("x", (_, i) => (i % keys.length) * cellSize)
      .attr("y", (_, i) => Math.floor(i / keys.length) * cellSize)
      .attr("width", cellSize)
      .attr("height", cellSize)
      .style("fill", (d) => colorScale(d))
      .style("stroke", "black");
  
    // Ajouter les valeurs dans les cellules
    svg
      .selectAll("text.cell-value")
      .data(matrix.flat())
      .enter()
      .append("text")
      .attr("class", "cell-value")
      .attr("x", (_, i) => (i % keys.length) * cellSize + cellSize / 2)
      .attr("y", (_, i) => Math.floor(i / keys.length) * cellSize + cellSize / 2)
      .attr("dy", ".35em")
      .style("text-anchor", "middle")
      .style("font-size", "14px")
      .style("font-weight", "bold")
      .style("fill", "black")
      .text((d) => (d !== null ? d.toFixed(2) : "N/A"));
  
    // Ajouter les labels des colonnes (axe X)
    svg
      .selectAll(".x-label")
      .data(keys)
      .enter()
      .append("text")
      .attr("x", (_, i) => i * cellSize + cellSize / 2)
      .attr("y", -23)
      .style("text-anchor", "middle")
      .style("font-size", "11px")
      .style("font-weight", "bold")
      .text((d) => d.toUpperCase());
  
    // Ajouter les labels des lignes (axe Y)
    svg
      .selectAll(".y-label")
      .data(keys)
      .enter()
      .append("text")
      .attr("x", -10)
      .attr("y", (_, i) => i * cellSize + cellSize / 2)
      .attr("dy", ".35em")
      .style("text-anchor", "end")
      .style("font-size", "12px")
      .style("font-weight", "bold")
      .text((d) => d.toUpperCase());
  
    // Ajouter une légende
    const legend = svg
      .append("g")
      .attr("class", "legend")
      .attr("transform", `translate(0, ${height + 30})`);
  
    // Couleurs de la légende
    const legendScale = [-1, -0.5, 0, 0.5, 1];
    const legendSize = 20;
  
    legend
      .selectAll("rect")
      .data(legendScale)
      .enter()
      .append("rect")
      .attr("x", (_, i) => i * legendSize * 4)
      .attr("width", legendSize * 4)
      .attr("height", legendSize)
      .style("fill", (d) => colorScale(d));
  
    // Texte de la légende
    legend
      .selectAll("text")
      .data(legendScale)
      .enter()
      .append("text")
      .attr("x", (_, i) => i * legendSize * 4 + (legendSize * 2))
      .attr("y", legendSize + 15)
      .style("text-anchor", "middle")
      .style("font-size", "12px")
      .text((d) => d.toFixed(1));
  }
  
  
  // Écouter les changements sur les cases à cocher
  document
    .querySelectorAll("#checkbox-section input[type='checkbox']")
    .forEach((checkbox) => {
      checkbox.addEventListener("change", async () => {
        if (areAllMetricsSelected()) {
          try {
            // Charger les données
            const data = await fetchData(path);

            // Calculer et afficher la matrice de corrélation
            const selectedMetrics = [
              "voltaje",
              "corriente",
              "frecuencia",
              "energia",
              "fp",
            ];
            const preparedData = getSelectedMetricsData(
              data,
              selectedMetrics
            );
            const matrixData = calculateCorrelationMatrix(
              preparedData,
              selectedMetrics
            );

            // Créer la heatmap
            createCorrelationHeatmap(
              "correlation-matrix-container",
              matrixData
            );
            console.log("Matrice de corrélation générée avec succès.");
          } catch (error) {
            console.error(
              "Erreur lors de la génération de la matrice de corrélation :",
              error
            );
          }
        } else {
          // Supprimer la heatmap si toutes les métriques ne sont pas sélectionnées
          d3.select("#correlation-matrix-container").select("svg").remove();
          console.warn("Toutes les métriques doivent être sélectionnées.");
        }
      });
    });

    
    document.addEventListener("DOMContentLoaded", function () {
      // Charger les données JSON
      fetch("./data/hour.json")
        .then((response) => {
          if (!response.ok) {
            throw new Error(`Erreur HTTP: ${response.status}`);
          }
          return response.json();
        })
        .then((data) => {
          console.log("Données JSON chargées :", data);
          setupMetricSelection(data); // Configurer la sélection des métriques
        })
        .catch((error) => {
          console.error("Erreur lors du chargement des données :", error);
        });
    
      function setupMetricSelection(data) {
        const checkboxes = document.querySelectorAll(
          "#checkbox-section input[type='checkbox']"
        );
        const selectedMetrics = new Set();
    
        checkboxes.forEach((checkbox) => {
          checkbox.addEventListener("change", () => {
            const metric = checkbox.id.replace("-checkbox", ""); // Récupère le nom de la métrique
    
            if (checkbox.checked) {
              selectedMetrics.add(metric);
            } else {
              selectedMetrics.delete(metric);
            }
    
            console.log("Métriques sélectionnées :", selectedMetrics);
    
            // Vérifier si exactement 3 métriques sont sélectionnées
            if (selectedMetrics.size === 3) {
              console.log("Trois métriques sélectionnées. Génération du graphique.");
              updateRankChart(data, Array.from(selectedMetrics)); // Mettre à jour le graphique
            } else {
              console.warn(
                "Veuillez sélectionner exactement 3 métriques pour afficher le graphique."
              );
              d3.select("#rank-chart-container").select("svg").remove();
            }
          });
        });
      }
    
      function updateRankChart(data, selectedMetrics) {
        const filteredData = data.map((d) => {
          const result = { fecha_servidor: d.fecha_servidor };
          selectedMetrics.forEach((metric) => {
            result[metric.toUpperCase()] =
              d[`WORKSTATION_${metric.toUpperCase()}_POWER`] || 0;
          });
          return result;
        });
    
        console.log("Données filtrées :", filteredData);
    
        createRankChangeChart("rank-chart-container", filteredData, selectedMetrics);
      }
    
      function createRankChangeChart(containerId, data, metrics) {
        console.log("Création du graphique de rang...");
        d3.select(`#${containerId}`).select("svg").remove();
    
        const margin = { top: 20, right: 20, bottom: 50, left: 50 };
        const width = 600 - margin.left - margin.right;
        const height = 400 - margin.top - margin.bottom;
    
        const svg = d3
          .select(`#${containerId}`)
          .append("svg")
          .attr("width", width + margin.left + margin.right)
          .attr("height", height + margin.top + margin.bottom)
          .append("g")
          .attr("transform", `translate(${margin.left},${margin.top})`);
    
        const parseDate = d3.timeParse("%Y-%m-%dT%H:%M:%S");
        data.forEach((d) => {
          d.fecha_servidor = parseDate(d.fecha_servidor);
        });
    
        const x = d3
          .scaleTime()
          .domain(d3.extent(data, (d) => d.fecha_servidor))
          .range([0, width]);
    
        const y = d3.scalePoint().domain([1, 2, 3]).range([0, height]);
    
        const color = d3
          .scaleOrdinal()
          .domain(metrics)
          .range(["#ff8c00", "#8c564b", "#1f77b4"]);
    
        const rankData = metrics.map((metric) => ({
          name: metric,
          values: data.map((d) => ({
            date: d.fecha_servidor,
            rank: getRank(d, metrics, metric),
          })),
        }));
    
        svg
          .append("g")
          .attr("transform", `translate(0, ${height})`)
          .call(d3.axisBottom(x).tickFormat(d3.timeFormat("%d/%m")));
    
        svg.append("g").call(d3.axisLeft(y));
    
        rankData.forEach((metricData) => {
          const line = d3
            .line()
            .x((d) => x(d.date))
            .y((d) => y(d.rank))
            .curve(d3.curveBasis);
    
          svg
            .append("path")
            .datum(metricData.values)
            .attr("fill", "none")
            .attr("stroke", color(metricData.name))
            .attr("stroke-width", 2)
            .attr("d", line);
        });
    
        svg
          .selectAll(".legend")
          .data(metrics)
          .enter()
          .append("text")
          .attr("x", width - 60)
          .attr("y", (d, i) => 20 + i * 20)
          .style("fill", (d) => color(d))
          .style("font-size", "12px")
          .style("font-weight", "bold")
          .text((d) => d.toUpperCase());
      }
    
      function getRank(d, metrics, currentMetric) {
        const values = metrics.map(
          (metric) => d[`WORKSTATION_${metric.toUpperCase()}_POWER`] || 0
        );
        const sorted = [...values].sort((a, b) => b - a);
        const rank =
          sorted.indexOf(d[`WORKSTATION_${currentMetric.toUpperCase()}_POWER`]) + 1;
        return rank;
      }
    });
    
});
*/
