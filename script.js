// Navbar mobile toggle
const navbarToggle = document.querySelector('.navbar__toggle');
const navbarLinks = document.querySelector('.navbar__links');
const navbarCta = document.querySelector('.navbar__cta');

navbarToggle.addEventListener('click', () => {
  navbarLinks.classList.toggle('active');
  navbarCta.classList.toggle('active');
});

// Calculator logic
const calculatorForm = document.querySelector('.calculator__form');
const resultNoFee = document.getElementById('result-no-fee');
const resultWithFee = document.getElementById('result-with-fee');
const resultLost = document.getElementById('result-lost');
const resultRate = document.getElementById('result-rate');

function formatMoney(num) {
  return '$' + num.toLocaleString('en-US', {maximumFractionDigits: 0});
}

calculatorForm.addEventListener('submit', function(e) {
  e.preventDefault();
  const years = parseInt(this.years.value, 10);
  const principal = parseFloat(this.portfolio.value);
  const annual = parseFloat(this.contribution.value);
  const annualReturn = parseFloat(this.return.value) / 100;
  const aumFee = parseFloat(this.aumfee.value) / 100;

  // Compound interest without fee
  let futureNoFee = principal;
  for (let i = 0; i < years; i++) {
    futureNoFee = (futureNoFee + annual) * (1 + annualReturn);
  }

  // Compound interest with AUM fee
  let futureWithFee = principal;
  const netReturn = annualReturn - aumFee;
  for (let i = 0; i < years; i++) {
    futureWithFee = (futureWithFee + annual) * (1 + netReturn);
  }

  const lost = futureNoFee - futureWithFee;
  // Estimate "advisor's effective rate" as lost / (years * 90) (90 = 0.5h/month * 12 * years)
  const effectiveRate = lost / (years * 90);

  resultNoFee.textContent = formatMoney(futureNoFee);
  resultWithFee.textContent = formatMoney(futureWithFee);
  resultLost.textContent = formatMoney(lost);
  resultRate.textContent = formatMoney(Math.round(effectiveRate)) + '/hour';
}); 