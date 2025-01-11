const path = "./data/hour.json";

/***************Global Variables **********************/

const selectedMetrics = [];

// Set up the initial timestamps for start and end
let startTimestamp = new Date("2023-01-01"); // Example start date
let endTimestamp = new Date("2023-12-31"); // Example end date

/**********************CHECKBOX SELECTION ************************/

function fetchData(path) {
  return fetch(path).then((response) => {
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
  const svg = d3
    .select(`#${containerId}`)
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  // Add a title to the line chart
  svg
    .append("text")
    .attr("x", width / 2)
    .attr("y", 0 - margin.top / 2)
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
  const x = d3
    .scaleTime()
    .domain(
      d3.extent(filteredData, function (d) {
        return d.date;
      })
    )
    .range([0, width]);

  svg
    .append("g")
    .attr("transform", `translate(0, ${height})`)
    .call(d3.axisBottom(x).tickFormat(d3.timeFormat("%d/%m")));

  // Add Y axis
  const y = d3
    .scaleLinear()
    .domain([
      0,
      d3.max(filteredData, function (d) {
        return d.value;
      }),
    ])
    .range([height, 0]);

  svg.append("g").call(d3.axisLeft(y));

  // Add the line
  svg
    .append("path")
    .datum(filteredData)
    .attr("fill", "none")
    .attr("stroke", color)
    .attr("stroke-width", 1.5)
    .attr(
      "d",
      d3
        .line()
        .x(function (d) {
          return x(d.date);
        })
        .y(function (d) {
          return y(d.value);
        })
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
    fetchData(path).then((data) =>
      createLineChart("chart-voltage", data, "voltaje", "#ff5733")
    );
  } else {
    removeLineChart("chart-voltage");
    d3.select("#chart-voltage").remove();
  }

  if (document.getElementById("current-checkbox").checked) {
    if (!document.getElementById("chart-current")) {
      chartContainer.append("div").attr("id", "chart-current");
    }
    fetchData(path).then((data) =>
      createLineChart("chart-current", data, "corriente", "#33ff57")
    );
  } else {
    removeLineChart("chart-current");
    d3.select("#chart-current").remove();
  }

  if (document.getElementById("power-checkbox").checked) {
    if (!document.getElementById("chart-power")) {
      chartContainer.append("div").attr("id", "chart-power");
    }
    fetchData(path).then((data) => {
      createLineChart("chart-power", data, "potencia", "#3357ff");
    });
  } else {
    removeLineChart("chart-power");
    d3.select("#chart-power").remove();
  }

  if (document.getElementById("frequency-checkbox").checked) {
    if (!document.getElementById("chart-frequency")) {
      chartContainer.append("div").attr("id", "chart-frequency");
    }
    fetchData(path).then((data) => {
      createLineChart("chart-frequency", data, "frecuencia", "#ff33a6");
    });
  } else {
    removeLineChart("chart-frequency");
    d3.select("#chart-frequency").remove();
  }

  if (document.getElementById("energy-checkbox").checked) {
    if (!document.getElementById("chart-energy")) {
      chartContainer.append("div").attr("id", "chart-energy");
    }
    fetchData(path).then((data) =>
      createLineChart("chart-energy", data, "energia", "#ffdd33")
    );
  } else {
    removeLineChart("chart-energy");
    d3.select("#chart-energy").remove();
  }

  if (document.getElementById("temperature-checkbox").checked) {
    if (!document.getElementById("chart-temperature")) {
      chartContainer.append("div").attr("id", "chart-temperature");
    }
    fetchData(path).then((data) =>
      createLineChart("chart-temperature", data, "ESP32_temp", "#33fff2")
    );
  } else {
    removeLineChart("chart-temperature");
    d3.select("#chart-temperature").remove();
  }

  if (document.getElementById("power-factor-checkbox").checked) {
    if (!document.getElementById("chart-power-factor")) {
      chartContainer.append("div").attr("id", "chart-power-factor");
    }
    fetchData(path).then((data) =>
      createLineChart("chart-power-factor", data, "fp", "#a633ff")
    );
  } else {
    removeLineChart("chart-power-factor");
    d3.select("#chart-power-factor").remove();
  }

  if (document.getElementById("consumption-checkbox").checked) {
    if (!document.getElementById("chart-consumption")) {
      chartContainer.append("div").attr("id", "chart-consumption");
    }
    fetchData(path).then((data) =>
      createLineChart("chart-consumption", data, "consumo", "#ff33ff")
    );
  } else {
    removeLineChart("chart-consumption");
    d3.select("#chart-consumption").remove();
  }
};

// Attach event listeners to checkboxes
document.querySelectorAll('input[type="checkbox"]').forEach((checkbox) => {
  checkbox.addEventListener("change", updateVisualization);
});

/*************************** TIME SELECTION *********************/
/************* CALENDAR SELECTION ***************/

// Function to update both visualizations
const updateAllVisualizations = () => {
  updateGridHighlight();
  createTimeline();
  updateClocks();
};

// drag selection state variables
let isDraggingWeeks = false;
let startWeekIndex = null;

// Function to create the grid and handle button clicks
const createTimeGrid = () => {
  const weeksInYear = 52;
  const weeksGrid = d3.select("#time-grid");

  // Clear existing grid
  weeksGrid.selectAll("*").remove();

  // Create week buttons
  for (let i = 0; i < weeksInYear; i++) {
    const weekButton = weeksGrid
      .append("button")
      .attr("class", "time-button")
      .attr("data-week", i)
      .text(`Week ${i + 1}`);

    // Add mouse down handler to start drag
    weekButton.on("mousedown", function (event) {
      event.preventDefault(); // Prevent text selection
      isDraggingWeeks = true;
      startWeekIndex = i;

      // Initial highlight
      updateWeekSelection(startWeekIndex, startWeekIndex);
    });

    // Add mouse enter handler for during drag
    weekButton.on("mouseenter", function () {
      if (isDraggingWeeks) {
        updateWeekSelection(startWeekIndex, i);
      }
    });

    const weekStartDate = getStartOfWeek(i);
    const weekEndDate = new Date(weekStartDate);
    weekEndDate.setDate(weekEndDate.getDate() + 6);

    if (isWeekInRange(weekStartDate, weekEndDate)) {
      weekButton.classed("in-range", true);
    }
  }

  // Add mouse up handler to document to end drag
  document.addEventListener("mouseup", function () {
    if (isDraggingWeeks) {
      isDraggingWeeks = false;
      startWeekIndex = null;
    }
  });

  // Add mouseleave handler to grid to handle when mouse leaves during drag
  weeksGrid.on("mouseleave", function () {
    if (isDraggingWeeks) {
      // Optional: You could either end the drag here or just wait for mouseup
      // isDraggingWeeks = false;
      // startWeekIndex = null;
    }
  });
};

// Function to update the week selection when dragging
const updateWeekSelection = (startIdx, endIdx) => {
  // Determine the actual start and end weeks (allow dragging in either direction)
  const actualStartIdx = Math.min(startIdx, endIdx);
  const actualEndIdx = Math.max(startIdx, endIdx);

  // Get the dates for the selected range
  const rangeStartDate = getStartOfWeek(actualStartIdx);
  const rangeEndDate = getStartOfWeek(actualEndIdx);
  rangeEndDate.setDate(rangeEndDate.getDate() + 6); // End of the last selected week

  // Update the timestamps
  startTimestamp = rangeStartDate;
  endTimestamp = rangeEndDate;

  // Update the visual selection
  d3.selectAll(".time-button").each(function () {
    const weekIdx = parseInt(d3.select(this).attr("data-week"));
    const isInRange = weekIdx >= actualStartIdx && weekIdx <= actualEndIdx;
    d3.select(this).classed("in-range", isInRange);
  });

  // Update all other visualizations
  updateAllVisualizations();
};

// Function to check if the week is within the selected time range
const isWeekInRange = (weekStartDate, weekEndDate) => {
  return weekStartDate >= startTimestamp && weekEndDate <= endTimestamp;
};

// Function to handle button click
const handleWeekClick = (weekIndex) => {
  const startOfWeek = getStartOfWeek(weekIndex);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(endOfWeek.getDate() + 6);

  if (
    Math.abs(startTimestamp - startOfWeek) <= Math.abs(endTimestamp - endOfWeek)
  ) {
    startTimestamp = startOfWeek;
  } else {
    endTimestamp = endOfWeek;
  }

  updateGridSelection(weekIndex);
  updateAllVisualizations();

  // Update the clocks
  updateClocks();
};

// Function to update the grid, highlighting the selected button
const updateGridSelection = (selectedWeek) => {
  d3.selectAll(".time-button").classed("selected", false);
  d3.select(`button[data-week="${selectedWeek}"]`).classed("selected", true);
  console.log("Start Timestamp: ", startTimestamp);
  console.log("End Timestamp: ", endTimestamp);
};

// Function to highlight all weeks that are within the time span
const updateGridHighlight = () => {
  d3.selectAll(".time-button").classed("in-range", false);
  d3.selectAll(".time-button").each(function () {
    const button = d3.select(this);
    const weekIndex = parseInt(button.attr("data-week"));
    const weekStartDate = getStartOfWeek(weekIndex);
    const weekEndDate = new Date(weekStartDate);
    weekEndDate.setDate(weekEndDate.getDate() + 6);

    if (isWeekInRange(weekStartDate, weekEndDate)) {
      button.classed("in-range", true);
    }
  });

  // Also update selection if a specific week is fully contained
  const startWeek = getWeekNumber(startTimestamp);
  const endWeek = getWeekNumber(endTimestamp);

  if (startWeek === endWeek) {
    updateGridSelection(startWeek);
  }
};

// Function to get the start date of a week given the week index
const getStartOfWeek = (weekIndex) => {
  const firstDate = new Date("2023-01-01"); // Start of the year
  const startOfWeek = new Date(
    firstDate.setDate(firstDate.getDate() + weekIndex * 7)
  );
  return startOfWeek;
};

// Function to find the week number for a given date
const getWeekNumber = (date) => {
  const start = new Date(date.getFullYear(), 0, 1);
  const diff = date - start;
  const oneWeek = 1000 * 60 * 60 * 24 * 7;
  return Math.floor(diff / oneWeek);
};

// Helper function for pixel positioning on timeline
const getPixelPosition = (date, startDate, endDate, containerWidth) => {
  const scale = (date - startDate) / (endDate - startDate);
  return scale * containerWidth;
};

// Function to determine the appropriate time interval based on duration
const determineTimeInterval = (start, end) => {
  const duration = end - start; // duration in milliseconds
  const hours = duration / (1000 * 60 * 60);

  if (hours <= 2) {
    // For spans of 2 hours or less, show minutes or seconds
    if (duration <= 1000 * 60 * 5) {
      // 5 minutes or less
      return {
        interval: d3.timeSecond.every(15), // Show every 15 seconds
        format: d3.timeFormat("%H:%M:%S"),
        type: "seconds",
      };
    } else if (duration <= 1000 * 60 * 60) {
      // 1 hour or less
      return {
        interval: d3.timeMinute.every(5), // Show every 5 minutes
        format: d3.timeFormat("%H:%M"),
        type: "minutes",
      };
    } else {
      return {
        interval: d3.timeMinute.every(15), // Show every 15 minutes
        format: d3.timeFormat("%H:%M"),
        type: "minutes",
      };
    }
  } else if (hours <= 24) {
    // For spans up to 24 hours, show hourly gradations
    return {
      interval: d3.timeHour.every(1),
      format: d3.timeFormat("%H:%M"),
      type: "hours",
    };
  } else if (hours <= 24 * 7) {
    // For spans up to a week, show days with hours
    return {
      interval: d3.timeHour.every(6),
      format: d3.timeFormat("%b %d %H:%M"),
      type: "hours",
    };
  } else if (hours <= 24 * 30) {
    // For spans up to a month, show days
    return {
      interval: d3.timeDay.every(1),
      format: d3.timeFormat("%b %d"),
      type: "days",
    };
  } else if (hours <= 24 * 30 * 3) {
    // For spans up to 3 months, show weeks
    return {
      interval: d3.timeWeek.every(1),
      format: d3.timeFormat("%b %d"),
      type: "weeks",
    };
  } else {
    // For longer spans, show months
    return {
      interval: d3.timeMonth.every(1),
      format: d3.timeFormat("%b %Y"),
      type: "months",
    };
  }
};

// Modified createTimeline function with enhanced gradation
const createTimeline = () => {
  const timelineSvg = d3.select("#timeline");
  const containerWidth = timelineSvg.node().getBoundingClientRect().width;
  const containerHeight = 50;

  // Clear existing content
  timelineSvg.selectAll("*").remove();

  const timelineGroup = timelineSvg
    .append("g")
    .attr("transform", "translate(0, 10)");

  // Add main timeline line
  timelineGroup
    .append("line")
    .attr("x1", 0)
    .attr("y1", 20)
    .attr("x2", containerWidth)
    .attr("y2", 20)
    .attr("stroke", "#ccc")
    .attr("stroke-width", 2);

  // Get appropriate interval and format based on timespan
  const { interval, format, type } = determineTimeInterval(
    startTimestamp,
    endTimestamp
  );

  // Create scale for positioning
  const timeScale = d3
    .scaleTime()
    .domain([startTimestamp, endTimestamp])
    .range([0, containerWidth]);

  // Generate gradation points
  const gradationPoints = interval.range(startTimestamp, endTimestamp);

  // Add minor gradations if appropriate
  if (type === "hours" || type === "minutes") {
    const minorInterval =
      type === "hours"
        ? d3.timeMinute.every(15) // Show 15-min marks for hour gradations
        : d3.timeSecond.every(15); // Show 15-sec marks for minute gradations

    const minorPoints = minorInterval.range(startTimestamp, endTimestamp);

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

  // Add major gradation lines
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

  // Add date/time labels
  timelineGroup
    .selectAll(".date-label")
    .data(gradationPoints)
    .enter()
    .append("text")
    .attr("class", "date-label")
    .attr("x", (d) => timeScale(d))
    .attr("y", 35)
    .attr("text-anchor", "middle")
    .attr("transform", (d, i) => {
      const x = timeScale(d);
      return `rotate(-45, ${x}, 35)`;
    })
    .style("font-size", "10px")
    .text((d) => format(d));

  // Add selection functionality
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

  // Keep existing drag handlers...
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

    const newStartDate = timeScale.invert(Math.min(dragStart, endX));
    const newEndDate = timeScale.invert(Math.max(dragStart, endX));

    startTimestamp = newStartDate;
    endTimestamp = newEndDate;

    updateAllVisualizations();
  });
};

// Initialize both visualizations
createTimeGrid();
createTimeline();

/************ CLOCK SELECTION *****************/

const updateClocks = () => {
  // Update start clock
  const startHourHand = d3.select("#start-clock").select(".hour-hand");
  const startHours = startTimestamp.getHours();
  const startMinutes = startTimestamp.getMinutes();
  const startAngle = (startHours + startMinutes / 60) * 15;
  const startRadians = (startAngle - 90) * (Math.PI / 180);
  const clockRadius = 50;
  const hourHandLength = 30;
  const centerX = clockRadius;
  const centerY = clockRadius;

  startHourHand
    .attr("x2", centerX + hourHandLength * Math.cos(startRadians))
    .attr("y2", centerY + hourHandLength * Math.sin(startRadians));

  // Update end clock
  const endHourHand = d3.select("#end-clock").select(".hour-hand");
  const endHours = endTimestamp.getHours();
  const endMinutes = endTimestamp.getMinutes();
  const endAngle = (endHours + endMinutes / 60) * 15;
  const endRadians = (endAngle - 90) * (Math.PI / 180);

  endHourHand
    .attr("x2", centerX + hourHandLength * Math.cos(endRadians))
    .attr("y2", centerY + hourHandLength * Math.sin(endRadians));

  // Update time displays
  updateTimeDisplay();
};

const createClockInterface = () => {
  const clockRadius = 50;
  const hourHandLength = 30;
  const centerX = clockRadius;
  const centerY = clockRadius;

  // Create clock faces
  const startClock = d3.select("#start-clock");
  const endClock = d3.select("#end-clock");

  // Clear existing content
  startClock.selectAll("*").remove();
  endClock.selectAll("*").remove();

  // Function to create a single clock
  const createClock = (svg, date, isStart) => {
    // Create clock face circle
    svg
      .append("circle")
      .attr("cx", centerX)
      .attr("cy", centerY)
      .attr("r", clockRadius)
      .attr("fill", "white")
      .attr("stroke", "#ccc");

    // Add hour marks and numbers for 24-hour clock
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
        const textX = centerX + textRadius * Math.sin(angle);
        const textY = centerY - textRadius * Math.cos(angle);
        svg
          .append("text")
          .attr("x", textX)
          .attr("y", textY)
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
      .attr("x2", centerX)
      .attr("y2", centerY - hourHandLength)
      .attr("stroke", "#009688")
      .attr("stroke-width", 3);

    const updateHourHand = (hours, minutes) => {
      const angle = (hours + minutes / 60) * 15;
      const radians = (angle - 90) * (Math.PI / 180);
      const x2 = centerX + hourHandLength * Math.cos(radians);
      const y2 = centerY + hourHandLength * Math.sin(radians);
      hourHand.attr("x2", x2).attr("y2", y2);
    };

    updateHourHand(date.getHours(), date.getMinutes());

    const clockArea = svg
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
          let hours = Math.round(((angle + 90 + 360) % 360) / 15);
          if (hours === 24) hours = 0;

          const newDate = isStart
            ? new Date(startTimestamp)
            : new Date(endTimestamp);
          newDate.setHours(hours);
          if (isStart) {
            startTimestamp = newDate;
          } else {
            endTimestamp = newDate;
          }

          updateHourHand(hours, 0);
          updateTimeDisplay();

          // Recreate timeline to update visualization
          createTimeline();
          // Update grid highlights if needed
          updateGridHighlight();
        };

        svg.on("mousemove", updateTime);
        svg.on("mouseup", () => {
          svg.on("mousemove", null);
        });

        updateTime(event);
      });

    // Create a foreignObject to hold the input element
    const fo = svg
      .append("foreignObject")
      .attr("x", centerX - 40)
      .attr("y", centerY + clockRadius + 10)
      .attr("width", 80)
      .attr("height", 25);

    // Add an HTML input element
    const input = fo
      .append("xhtml:input")
      .attr("type", "text")
      .attr("class", `${isStart ? "start" : "end"}-time-display`)
      .style("width", "100%")
      .style("text-align", "center")
      .style("font-family", "Arial")
      .style("font-size", "12px")
      .style("border", "1px solid #ccc")
      .style("border-radius", "3px")
      .style("padding", "2px")
      .attr("value", date.toLocaleTimeString("en-US", { hour12: false }));

    // Add event listener for input changes
    input.on("change", function () {
      const timeValue = this.value;
      const [hours, minutes, seconds] = timeValue.split(":").map(Number);

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
        // Reset to current value if invalid input
        this.value = (
          isStart ? startTimestamp : endTimestamp
        ).toLocaleTimeString("en-US", { hour12: false });
        return;
      }

      const newDate = isStart
        ? new Date(startTimestamp)
        : new Date(endTimestamp);
      newDate.setHours(hours, minutes || 0, seconds || 0);

      if (isStart) {
        startTimestamp = newDate;
      } else {
        endTimestamp = newDate;
      }

      updateHourHand(hours, minutes || 0);
      updateTimeDisplay();

      // Update timeline and grid when time is changed through input
      createTimeline();
      updateGridHighlight();
    });
  };

  createClock(startClock, startTimestamp, true);
  createClock(endClock, endTimestamp, false);
};

// Function to update time displays
const updateTimeDisplay = () => {
  const timeOptions = { hour12: false };
  d3.selectAll(".start-time-display").property(
    "value",
    startTimestamp.toLocaleTimeString("en-US", timeOptions)
  );
  d3.selectAll(".end-time-display").property(
    "value",
    endTimestamp.toLocaleTimeString("en-US", timeOptions)
  );
};

createClockInterface();
