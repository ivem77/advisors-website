// Navbar mobile toggle
const navbarToggle = document.querySelector('.navbar__toggle');
const navbarMenu = document.querySelector('.navbar__menu');

navbarToggle.addEventListener('click', () => {
  navbarMenu.classList.toggle('active');
});

// Utility function for debouncing input events
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Smooth scrolling for navigation links
document.addEventListener('DOMContentLoaded', function() {
  // Get all navigation links that start with #
  const navLinks = document.querySelectorAll('a[href^="#"]');
  
  navLinks.forEach(link => {
    link.addEventListener('click', function(e) {
      const href = this.getAttribute('href');
      
      // Skip if it's just a # or if target doesn't exist
      if (href === '#' || href === '#signup') {
        return; // Let default behavior handle these
      }
      
      const targetId = href.substring(1);
      const targetElement = document.getElementById(targetId);
      
      if (targetElement) {
        e.preventDefault();
        
        // Calculate the navbar height for offset
        const navbar = document.querySelector('.navbar');
        const navbarHeight = navbar ? navbar.offsetHeight : 80;
        
        // Calculate target position with offset
        const targetPosition = targetElement.offsetTop - navbarHeight - 20;
        
        // Smooth scroll with custom easing
        smoothScrollTo(targetPosition, 600);
        
        // Close mobile menu if open
        if (navbarMenu.classList.contains('active')) {
          navbarMenu.classList.remove('active');
        }
      }
    });
  });
});

// Custom smooth scroll function with easing
function smoothScrollTo(targetPosition, duration) {
  const startPosition = window.pageYOffset;
  const distance = targetPosition - startPosition;
  let startTime = null;
  
  // Updated easing function - starts faster, more responsive
  function easeOutQuart(t) {
    return 1 - (--t) * t * t * t;
  }
  
  function animation(currentTime) {
    if (startTime === null) startTime = currentTime;
    const timeElapsed = currentTime - startTime;
    const progress = Math.min(timeElapsed / duration, 1);
    
    const ease = easeOutQuart(progress);
    window.scrollTo(0, startPosition + distance * ease);
    
    if (timeElapsed < duration) {
      requestAnimationFrame(animation);
    }
  }
  
  requestAnimationFrame(animation);
}

// Enhanced Calculator Logic
let myChart;

// Cache number formatters for better performance
const dollarFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const scientificDollarFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  notation: "scientific",
  maximumFractionDigits: 2
});

function formatDollar(amount, scientific = false) {
  if (scientific && Math.abs(amount) >= 1e8) {
    const formatted = scientificDollarFormatter.format(amount);
    // Replace uppercase 'E' with lowercase 'e'
    return formatted.replace('E', 'e+');
  }
  return dollarFormatter.format(amount);
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

// Cache calculation results to avoid unnecessary recalculation
let lastCalculationParams = null;
let lastCalculationResult = null;

function calculate() {
  const years = parseInt(document.getElementById("years").value);
  const currentValue = parseDollar(document.getElementById("currentValue").value);
  const annualContribution = parseDollar(document.getElementById("annualContribution").value);
  const returnRate = parseFloat(document.getElementById("return").value) / 100;
  const feeRate = parseFloat(document.getElementById("fee").value) / 100;

  // Create a hash of current parameters for caching
  const currentParams = `${years}-${currentValue}-${annualContribution}-${returnRate}-${feeRate}`;
  
  // Use cached result if parameters haven't changed
  if (lastCalculationParams === currentParams && lastCalculationResult) {
    updateResult(lastCalculationResult);
    updateChart(years, lastCalculationResult.withoutFeesY, lastCalculationResult.withFeesY);
    return;
  }

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

  const result = {
    withoutFees,
    withFees,
    moneyLost,
    hourlyRate,
    withoutFeesY,
    withFeesY
  };

  // Cache the result
  lastCalculationParams = currentParams;
  lastCalculationResult = result;

  updateResult(result);
  updateChart(years, withoutFeesY, withFeesY);
}

function updateResult(result) {
  const resultElement = document.getElementById("result");
  resultElement.innerHTML = `
    <div class="result-row">
      <div class="result-label">
        <div class="result-circle" style="background-color: #8961FA;"></div>
        Portfolio value without fees
      </div>
      <div class="result-value">${formatDollar(result.withoutFees, true)}</div>
    </div>
    <div class="result-row">
      <div class="result-label">
        <div class="result-circle" style="background-color: #FF4684;"></div>
        Portfolio value with current asset manager
      </div>
      <div class="result-value">${formatDollar(result.withFees, true)}</div>
    </div>
    <div class="divider"></div>
    <div class="result-row">
      <div class="result-label-bold">Wealth lost in AUM fees:</div>
      <div class="result-value result-highlight">${formatDollar(result.moneyLost, true)}</div>
    </div>
    <div class="result-row last-row">
      <div class="result-label">Your advisor's effective rate:</div>
      <div class="result-value">${formatDollar(result.hourlyRate, true)}/hour</div>
    </div>
  `;
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

// Create debounced version of calculate function
const debouncedCalculate = debounce(calculate, 150);

// Error handling wrapper for calculations
function safeCalculate() {
  try {
    calculate();
  } catch (error) {
    console.error('Calculation error:', error);
    // Fallback to basic calculation if something goes wrong
    const resultElement = document.getElementById("result");
    if (resultElement) {
      resultElement.innerHTML = '<div class="result-row"><div class="result-label-bold">Please check your input values</div></div>';
    }
  }
}

// Validate input values
function validateInputs() {
  const years = parseInt(document.getElementById("years")?.value || 0);
  const currentValue = parseDollar(document.getElementById("currentValue")?.value || "0");
  const annualContribution = parseDollar(document.getElementById("annualContribution")?.value || "0");
  const returnRate = parseFloat(document.getElementById("return")?.value || 0);
  const feeRate = parseFloat(document.getElementById("fee")?.value || 0);

  // Validate ranges
  if (years < 1 || years > 100) return false;
  if (currentValue < 0 || currentValue > 1e12) return false;
  if (annualContribution < 0 || annualContribution > 1e9) return false;
  if (returnRate < 0 || returnRate > 50) return false;
  if (feeRate < 0 || feeRate > 20) return false;

  return true;
}

// Initialize calculator when page loads
document.addEventListener('DOMContentLoaded', function() {
  // Format initial dollar inputs
  ["currentValue", "annualContribution"].forEach((id) => {
    const input = document.getElementById(id);
    if (input) {
      formatDollarInputAsYouType(input);
      // Add ARIA labels for accessibility
      input.setAttribute('aria-describedby', `${id}-help`);
      input.setAttribute('role', 'textbox');
    }
  });

  // Add event listeners for inputs with debouncing for better performance
  ["years", "currentValue", "annualContribution"].forEach((id) => {
    const input = document.getElementById(id);
    if (input) {
      input.addEventListener("input", function () {
        if (id === "currentValue" || id === "annualContribution") {
          formatDollarInputAsYouType(this);
        }
        if (validateInputs()) {
          debouncedCalculate();
        }
      });
      
      // Add keyboard accessibility
      input.addEventListener("keydown", function(e) {
        // Allow: backspace, delete, tab, escape, enter
        if ([46, 8, 9, 27, 13].indexOf(e.keyCode) !== -1 ||
            // Allow: Ctrl+A, Command+A
            (e.keyCode === 65 && (e.ctrlKey === true || e.metaKey === true)) ||
            // Allow: Ctrl+C, Command+C
            (e.keyCode === 67 && (e.ctrlKey === true || e.metaKey === true)) ||
            // Allow: Ctrl+V, Command+V
            (e.keyCode === 86 && (e.ctrlKey === true || e.metaKey === true)) ||
            // Allow: Ctrl+X, Command+X
            (e.keyCode === 88 && (e.ctrlKey === true || e.metaKey === true)) ||
            // Allow: home, end, left, right, down, up
            (e.keyCode >= 35 && e.keyCode <= 40)) {
          return;
        }
        // Ensure that it is a number for numeric inputs
        if (id === "years" && (e.shiftKey || (e.keyCode < 48 || e.keyCode > 57) && (e.keyCode < 96 || e.keyCode > 105))) {
          e.preventDefault();
        }
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
        if (validateInputs()) {
          debouncedCalculate();
        }
      });
      // Add ARIA labels for accessibility
      input.setAttribute('aria-describedby', `${id}-help`);
      input.setAttribute('role', 'textbox');
    }
  });

  // Run initial calculation with error handling
  if (validateInputs()) {
    safeCalculate();
  }
}); 