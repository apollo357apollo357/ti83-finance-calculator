const $ = (id) => document.getElementById(id);

for (const btn of document.querySelectorAll('.tab')) {
  btn.addEventListener('click', () => {
    for (const b of document.querySelectorAll('.tab')) b.classList.remove('active');
    for (const p of document.querySelectorAll('.panel')) p.classList.remove('active');
    btn.classList.add('active');
    $(btn.dataset.tab).classList.add('active');
  });
}

function num(v) { return Number(v); }
function fmt(v) {
  if (!Number.isFinite(v)) return '—';
  return v.toLocaleString(undefined, { maximumFractionDigits: 6 });
}

function tvmResidual({ n, iy, pv, pmt, fv, py, mode }) {
  const r = iy / 100 / py;
  const when = mode === 'begin' ? 1 : 0;
  if (Math.abs(r) < 1e-12) return pv + pmt * n + fv;
  const g = (1 + r) ** n;
  const ann = ((g - 1) / r) * (1 + when * r);
  return pv * g + pmt * ann + fv;
}

function solveByNewton(targetKey, vars, guess) {
  let x = guess;
  for (let i = 0; i < 80; i++) {
    const base = { ...vars, [targetKey]: x };
    const f = tvmResidual(base);
    if (Math.abs(f) < 1e-9) return x;
    const h = Math.abs(x) > 1 ? Math.abs(x) * 1e-6 : 1e-6;
    const fp = tvmResidual({ ...vars, [targetKey]: x + h });
    const fm = tvmResidual({ ...vars, [targetKey]: x - h });
    const d = (fp - fm) / (2 * h);
    if (!Number.isFinite(d) || Math.abs(d) < 1e-12) break;
    x = x - f / d;
    if (!Number.isFinite(x)) break;
  }
  return NaN;
}

$('solveTvm').addEventListener('click', () => {
  const vars = {
    n: num($('n').value),
    iy: num($('iy').value),
    pv: num($('pv').value),
    pmt: num($('pmt').value),
    fv: num($('fv').value),
    py: num($('py').value),
    mode: $('mode').value,
  };
  const target = $('solveFor').value;
  const guess = vars[target] || (target === 'iy' ? 5 : 1);
  const solved = solveByNewton(target, vars, guess);
  $('tvmResult').textContent = Number.isFinite(solved)
    ? `Solved ${target.toUpperCase()} = ${fmt(solved)}`
    : 'Could not solve. Try a different guess/value set.';
  if (Number.isFinite(solved)) $(target).value = solved;
});

function payment(principal, annualRate, years, py) {
  const n = years * py;
  const r = annualRate / 100 / py;
  if (Math.abs(r) < 1e-12) return principal / n;
  return (principal * r) / (1 - (1 + r) ** -n);
}

$('calcLoan').addEventListener('click', () => {
  const principal = num($('loanPrincipal').value);
  const annualRate = num($('loanRate').value);
  const years = num($('loanYears').value);
  const py = num($('loanPY').value);
  const pmt = payment(principal, annualRate, years, py);
  const total = pmt * years * py;
  const interest = total - principal;
  $('loanResult').textContent = `Payment: ${fmt(pmt)} | Total Interest: ${fmt(interest)} | Total Paid: ${fmt(total)}`;
});

$('buildSchedule').addEventListener('click', () => {
  const principal = num($('amPrincipal').value);
  const annualRate = num($('amRate').value);
  const years = num($('amYears').value);
  const py = num($('amPY').value);
  const n = Math.round(years * py);
  const r = annualRate / 100 / py;
  const pmt = payment(principal, annualRate, years, py);

  let bal = principal;
  const tbody = $('schedule').querySelector('tbody');
  tbody.innerHTML = '';

  for (let i = 1; i <= n; i++) {
    const interest = bal * r;
    let principalPart = pmt - interest;
    if (i === n) {
      principalPart = bal;
    }
    bal = Math.max(0, bal - principalPart);
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${i}</td><td>${fmt(pmt)}</td><td>${fmt(interest)}</td><td>${fmt(principalPart)}</td><td>${fmt(bal)}</td>`;
    tbody.appendChild(tr);
  }
});
