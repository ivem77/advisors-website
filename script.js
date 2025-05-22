// Navbar mobile toggle
const navbarToggle = document.querySelector('.navbar__toggle');
const navbarLinks = document.querySelector('.navbar__links');
const navbarCta = document.querySelector('.navbar__cta');

navbarToggle.addEventListener('click', () => {
  navbarLinks.classList.toggle('active');
  navbarCta.classList.toggle('active');
});

// Enhanced Calculator Logic
let myChart;

function formatDollar(amount, scientific = false) {
  if (scientific && Math.abs(amount) >= 1e8) {
    const formatted = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      notation: "scientific",
      maximumFractionDigits: 2
    }).format(amount);
    // Replace uppercase 'E' with lowercase 'e'
    return formatted.replace('E', 'e+');
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function parseDollar(value) {
  return parseFloat(value.replace(/[$,]/g, "")) || 0;
}

function formatDollarInputAsYouType(input) {
  const cursorPosition = input.selectionStart;
  const oldLength = input.value.length;
  const unformattedValue = parseDollar(input.value);
  const formattedValue = formatDollar(unformattedValue);
  input.value = formattedValue;

  const newLength = input.value.length;
  const newCursorPosition = cursorPosition - (oldLength - newLength);
  input.setSelectionRange(newCursorPosition, newCursorPosition);
}

function parsePercent(value) {
  const parsedValue = parseFloat(value.replace("%", "").trim());
  return isNaN(parsedValue) ? 0 : parsedValue;
}

function formatPercentInputAsYouType(input) {
  // Store the cursor position before formatting
  let cursorPosition = input.selectionStart;

  // Remove non-numeric characters except for the decimal point
  let unformattedValue = input.value.replace(/[^0-9.]/g, "");

  // Prevent multiple decimal points
  const parts = unformattedValue.split(".");
  if (parts.length > 2) {
    unformattedValue = parts[0] + "." + parts[1]; // Keep only the first decimal point
  }

  // If there is a decimal point, limit to one decimal place
  if (parts.length > 1) {
    unformattedValue = parts[0] + "." + parts[1].substring(0, 1);
  }

  // Format the value as a percentage
  input.value = unformattedValue + "%";
  // Prevent the cursor from moving past the '%' sign
  if (cursorPosition > unformattedValue.length) {
    cursorPosition = unformattedValue.length;
    // Ensure the cursor position stays within valid bounds
    input.setSelectionRange(cursorPosition, cursorPosition);
  }
}

function handlePercentInputKeyDown(event) {
  const input = event.target;
  const cursorPosition = input.selectionStart;
  const value = input.value;

  // Prevent cursor from moving last character
  if (cursorPosition === value.length - 1 && event.key === "ArrowRight") {
    event.preventDefault();
  }
}

function handlePercentInputClick(event) {
  const input = event.target;
  const cursorPosition = input.selectionStart;
  const value = input.value;

  // Prevent cursor from moving last character
  if (cursorPosition >= value.length) {
    input.setSelectionRange(cursorPosition - 1, cursorPosition - 1);
  }
}

function calculate() {
  const years = parseInt(document.getElementById("years").value);
  const currentValue = parseDollar(document.getElementById("currentValue").value);
  const annualContribution = parseDollar(document.getElementById("annualContribution").value);
  const returnRate = parseFloat(document.getElementById("return").value) / 100;
  const feeRate = parseFloat(document.getElementById("fee").value) / 100;

  let withoutFees = currentValue;
  let withFees = currentValue;
  const withoutFeesY = [currentValue];
  const withFeesY = [currentValue];

  for (let i = 1; i <= years; i++) {
    withoutFees = withoutFees * (1 + returnRate) + annualContribution;
    withFees = withFees * (1 + returnRate - feeRate) + annualContribution;
    withoutFeesY.push(withoutFees);
    withFeesY.push(withFees);
  }

  const moneyLost = withoutFees - withFees;
  const hourlyRate = moneyLost / years / 3;

  document.getElementById("result").innerHTML = `
    <div class="result-row">
      <div class="result-label">
        <div class="result-circle" style="background-color: #8961FA;"></div>
        Portfolio value without fees
      </div>
      <div class="result-value">${formatDollar(withoutFees, true)}</div>
    </div>
    <div class="result-row">
      <div class="result-label">
        <div class="result-circle" style="background-color: #FF4684;"></div>
        Portfolio value with current asset manager
      </div>
      <div class="result-value">${formatDollar(withFees, true)}</div>
    </div>
    <div class="divider"></div>
    <div class="result-row">
      <div class="result-label-bold">Wealth lost in AUM fees:</div>
      <div class="result-value result-highlight">${formatDollar(moneyLost, true)}</div>
    </div>
    <div class="result-row last-row">
      <div class="result-label">Your advisor's effective rate:</div>
      <div class="result-value">${formatDollar(hourlyRate, true)}/hour</div>
    </div>
  `;

  updateChart(years, withoutFeesY, withFeesY);
}

function updateChart(years, withoutFeesY, withFeesY) {
  const ctx = document.getElementById("myChart");
  const currentDate = new Date();
  const retirementDate = new Date(
    currentDate.getFullYear() + years,
    currentDate.getMonth(),
    currentDate.getDate()
  );
  const numDataPoints = Math.min(years * 12, 200);

  const chartDates = [];
  const chartWithoutFees = [];
  const chartWithFees = [];

  for (let i = 0; i <= numDataPoints; i++) {
    const dateIndex = (i * years) / numDataPoints;
    const date = new Date(currentDate.getTime() + dateIndex * 365.25 * 24 * 60 * 60 * 1000);
    chartDates.push(date);

    const withoutFeesInterpolated =
      withoutFeesY[Math.floor(dateIndex)] * (1 - (dateIndex % 1)) +
      (withoutFeesY[Math.ceil(dateIndex)] || withoutFeesY[withoutFeesY.length - 1]) * (dateIndex % 1);
    const withFeesInterpolated =
      withFeesY[Math.floor(dateIndex)] * (1 - (dateIndex % 1)) +
      (withFeesY[Math.ceil(dateIndex)] || withFeesY[withFeesY.length - 1]) * (dateIndex % 1);

    chartWithoutFees.push(withoutFeesInterpolated);
    chartWithFees.push(withFeesInterpolated);
  }

  if (myChart) {
    myChart.destroy();
  }

  const middleDate1 = new Date(currentDate.getTime() + (years / 3) * 365.25 * 24 * 60 * 60 * 1000);
  const middleDate2 = new Date(currentDate.getTime() + (years / 3) * 2 * 365.25 * 24 * 60 * 60 * 1000);
  const xAxisLabels = (axis) =>
    (axis.ticks = [currentDate, middleDate1, middleDate2, retirementDate].map((v) => ({ value: v })));

  myChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: chartDates,
      datasets: [
        {
          label: "Without Fees",
          data: chartWithoutFees,
          borderColor: "#8961FA",
          tension: 0.4,
          fill: false,
          pointRadius: 0,
          pointHoverRadius: 0,
        },
        {
          label: "With Fees",
          data: chartWithFees,
          borderColor: "#FF4684",
          tension: 0.4,
          fill: false,
          pointRadius: 0,
          pointHoverRadius: 0,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      aspectRatio: 16 / 9,
      scales: {
        x: {
          type: "time",
          time: {
            unit: "year",
            displayFormats: {
              year: "yyyy",
            },
          },
          min: currentDate,
          afterBuildTicks: xAxisLabels,
          ticks: {
            maxRotation: 0,
            autoSkip: true,
            maxTicksLimit: 4,
            font: {
              family: "'Satoshi', Arial, sans-serif",
              size: 10,
            },
          },
          grid: {
            display: false,
          },
        },
        y: {
          beginAtZero: true,
          ticks: {
            callback: function (value) {
              return formatDollar(value, true);
            },
            font: {
              family: "'Satoshi', Arial, sans-serif",
              size: 10,
            },
          },
          grid: {
            display: false,
          },
        },
      },
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          enabled: false,
        },
      },
    },
  });
}

// Initialize calculator when page loads
document.addEventListener('DOMContentLoaded', function() {
  // Format initial dollar inputs
  ["currentValue", "annualContribution"].forEach((id) => {
    const input = document.getElementById(id);
    if (input) {
      formatDollarInputAsYouType(input);
    }
  });

  // Add event listeners for inputs
  ["years", "currentValue", "annualContribution"].forEach((id) => {
    const input = document.getElementById(id);
    if (input) {
      input.addEventListener("input", function () {
        if (id === "currentValue" || id === "annualContribution") {
          formatDollarInputAsYouType(this);
        }
        calculate();
      });
    }
  });

  // Add percent formatting and event listeners
  ["return", "fee"].forEach((id) => {
    const input = document.getElementById(id);
    if (input) {
      formatPercentInputAsYouType(input);
      input.addEventListener("keydown", handlePercentInputKeyDown);
      input.addEventListener("click", handlePercentInputClick);
      input.addEventListener("input", function () {
        formatPercentInputAsYouType(this);
        calculate();
      });
    }
  });

  // Run initial calculation
  calculate();
}); 