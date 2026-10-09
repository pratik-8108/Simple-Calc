(function () {
  const symbols = { "+": "+", "-": "−", "*": "×", "/": "÷" };
  const valueEl = document.getElementById("value");
  const exprEl = document.getElementById("expr");
  const historyList = document.getElementById("historyList");
 
  let current = "0";   // number being typed (or the last result)
  let prev = null;     // stored left operand
  let op = null;       // pending operator
  let fresh = false;   // next digit starts a new number
  let error = false;
  let history = [];
 
  function format(str) {
    if (error) return str;
    const [int, dec] = str.split(".");
    const sign = int.startsWith("-") ? "-" : "";
    const grouped = int.replace("-", "").replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return sign + grouped + (dec !== undefined ? "." + dec : "");
  }
 
  function render() {
    valueEl.textContent = format(current);
    valueEl.classList.toggle("small", current.length > 11);
    exprEl.textContent = op !== null ? format(String(prev)) + " " + symbols[op] : "";
  }
 
  function compute(a, b, operator) {
    a = parseFloat(a); b = parseFloat(b);
    switch (operator) {
      case "+": return a + b;
      case "-": return a - b;
      case "*": return a * b;
      case "/": return b === 0 ? null : a / b;
    }
  }
 
  function clean(n) {
    // trims floating-point noise: 0.1 + 0.2 -> 0.3
    return String(parseFloat(n.toPrecision(12)));
  }
 
  function showError(msg) {
    error = true; current = msg; prev = null; op = null; fresh = true;
    render();
  }
 
  function resetIfError() {
    if (error) { error = false; current = "0"; }
  }
 
  function digit(d) {
    resetIfError();
    if (fresh) { current = "0"; fresh = false; }
    if (current.replace(/[-.]/g, "").length >= 15) return;
    current = current === "0" ? d : current === "-0" ? "-" + d : current + d;
    render();
  }
 
  function dot() {
    resetIfError();
    if (fresh) { current = "0"; fresh = false; }
    if (!current.includes(".")) current += ".";
    render();
  }
 
  function setOp(next) {
    if (error) return;
    if (op !== null && !fresh) {
      const result = compute(prev, current, op);
      if (result === null) return showError("Cannot divide by 0");
      prev = clean(result);
      current = prev;
    } else {
      prev = current;
    }
    op = next;
    fresh = true;
    render();
  }
 
  function equals() {
    if (error || op === null) return;
    const result = compute(prev, current, op);
    if (result === null) return showError("Cannot divide by 0");
    const answer = clean(result);
    addHistory(format(String(prev)) + " " + symbols[op] + " " + format(current), format(answer));
    current = answer;
    prev = null; op = null; fresh = true;
    render();
  }
 
  function clearAll() {
    current = "0"; prev = null; op = null; fresh = false; error = false;
    render();
  }
 
  function back() {
    if (error) return clearAll();
    if (fresh) return;
    current = current.length > 1 && !(current.length === 2 && current.startsWith("-"))
      ? current.slice(0, -1) : "0";
    render();
  }
 
  function negate() {
    if (error || current === "0") return;
    current = current.startsWith("-") ? current.slice(1) : "-" + current;
    render();
  }
 
  function percent() {
    if (error) return;
    current = clean(parseFloat(current) / 100);
    fresh = true;
    render();
  }
 
  function addHistory(expression, result) {
    history.unshift({ expression, result });
    history = history.slice(0, 20);
    renderHistory();
  }
 
  function renderHistory() {
    historyList.innerHTML = "";
    if (!history.length) {
      const li = document.createElement("li");
      li.className = "empty";
      li.textContent = "No calculations yet.";
      historyList.appendChild(li);
      return;
    }
    history.forEach(function (item) {
      const li = document.createElement("li");
      const left = document.createElement("span");
      const right = document.createElement("span");
      left.textContent = item.expression;
      right.textContent = "= " + item.result;
      li.title = "Use this result";
      li.append(left, right);
      li.addEventListener("click", function () {
        error = false;
        current = item.result.replace(/,/g, "");
        prev = null; op = null; fresh = true;
        render();
      });
      historyList.appendChild(li);
    });
  }
 
  // Button clicks
  document.querySelector(".keys").addEventListener("click", function (e) {
    const btn = e.target.closest("button");
    if (!btn) return;
    if (btn.dataset.digit) return digit(btn.dataset.digit);
    if (btn.dataset.op) return setOp(btn.dataset.op);
    const actions = { clear: clearAll, back: back, negate: negate, percent: percent, dot: dot, equals: equals };
    if (actions[btn.dataset.action]) actions[btn.dataset.action]();
  });
 
  document.getElementById("clearHistory").addEventListener("click", function () {
    history = [];
    renderHistory();
  });
 
  // Keyboard support
  document.addEventListener("keydown", function (e) {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.target.closest && e.target.closest("button") && (e.key === "Enter" || e.key === " ")) return;
    const k = e.key;
    if (/^[0-9]$/.test(k)) digit(k);
    else if (k === ".") dot();
    else if (["+", "-", "*", "/"].includes(k)) { e.preventDefault(); setOp(k); }
    else if (k === "Enter" || k === "=") { e.preventDefault(); equals(); }
    else if (k === "Backspace") back();
    else if (k === "Escape" || k === "Delete") clearAll();
    else if (k === "%") percent();
  });
 
  render();
})();
 