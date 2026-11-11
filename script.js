/**
 * ============================================================
 * JAVASCRIPT CALCULATOR LOGIC
 * ============================================================
 * This script handles all user interactions (clicks & keystrokes),
 * maintains the calculator's state, performs math operations,
 * and updates the user interface (UI) in real time.
 */

// ------------------------------------------------------------
// 1. DOM ELEMENT REFERENCES
// ------------------------------------------------------------
// We select elements from index.html so we can manipulate them.
const previousOperandText = document.getElementById("previous-operand");
const currentOperandText = document.getElementById("current-operand");
const keypad = document.querySelector(".keypad");

// ------------------------------------------------------------
// 2. STATE VARIABLES
// ------------------------------------------------------------
// These variables store the "memory" of our calculator at any given moment.
let currentOperand = "0";      // The number currently being typed or viewed
let previousOperand = "";      // The earlier number moved to the top row
let operation = null;          // The active operator (+, -, ×, ÷)
let shouldResetScreen = false; // Flag to overwrite screen when typing after '='

// ------------------------------------------------------------
// 3. CORE CALCULATOR FUNCTIONS
// ------------------------------------------------------------

/**
 * Appends a digit (0-9) to the current operand.
 * @param {string} number - The digit clicked by the user
 */
function appendNumber(number) {
  // If a calculation was just completed, typing a new number resets the screen
  if (shouldResetScreen) {
    currentOperand = "";
    shouldResetScreen = false;
  }

  // Prevent multiple leading zeros (e.g., avoiding "000")
  if (currentOperand === "0" && number === "0") return;

  // If the display is currently just "0", replace it with the new digit
  if (currentOperand === "0" && number !== "0") {
    currentOperand = number;
  } else {
    // Otherwise, append the digit to the end of the existing string
    currentOperand += number;
  }

  updateDisplay();
}

/**
 * Appends a decimal point (.) safely.
 */
function appendDecimal() {
  // If resetting screen, start fresh with "0."
  if (shouldResetScreen) {
    currentOperand = "0";
    shouldResetScreen = false;
  }

  // If there's already a decimal point, don't allow another (prevents "3.14.5")
  if (currentOperand.includes(".")) return;

  // If empty, start with "0."
  if (currentOperand === "") {
    currentOperand = "0";
  }

  currentOperand += ".";
  updateDisplay();
}

/**
 * Sets the operator (+, -, ×, ÷) and shifts numbers into place.
 * @param {string} selectedOperator - The operator symbol
 */
function chooseOperation(selectedOperator) {
  // If the user already entered a previous number and is now entering another
  // operation without hitting '=', compute the running total first!
  if (operation !== null && currentOperand !== "") {
    compute();
  }

  // If no number has been typed yet, do nothing
  if (currentOperand === "" && previousOperand === "") return;

  // Move current operand to previous operand
  operation = selectedOperator;
  previousOperand = currentOperand;
  currentOperand = "";
  updateDisplay();
}

/**
 * Performs the actual arithmetic calculation.
 */
function compute() {
  let computationResult;
  const prev = parseFloat(previousOperand);
  const current = parseFloat(currentOperand);

  // If either number is not a valid number, we cannot calculate
  if (isNaN(prev) || isNaN(current)) return;

  // Execute the arithmetic operation based on selected symbol
  switch (operation) {
    case "+":
      computationResult = prev + current;
      break;
    case "-":
      computationResult = prev - current;
      break;
    case "×":
      computationResult = prev * current;
      break;
    case "÷":
      // Edge Case: Division by zero
      if (current === 0) {
        currentOperand = "Error";
        previousOperand = "";
        operation = null;
        shouldResetScreen = true;
        updateDisplay();
        return;
      }
      computationResult = prev / current;
      break;
    default:
      return;
  }

  // Round floating point precision issues (e.g. 0.1 + 0.2 = 0.30000000000000004)
  // parseFloat(...toPrecision(12)) cleanly cuts off trailing float inaccuracies
  currentOperand = parseFloat(computationResult.toPrecision(12)).toString();
  operation = null;
  previousOperand = "";
  shouldResetScreen = true; // Next digit typed will start a fresh number
  updateDisplay();
}

/**
 * Resets the calculator back to its default starting state (AC).
 */
function clearAll() {
  currentOperand = "0";
  previousOperand = "";
  operation = null;
  shouldResetScreen = false;
  updateDisplay();
}

/**
 * Inverts the sign of the current number (+/-).
 */
function toggleSign() {
  if (currentOperand === "" || currentOperand === "0" || currentOperand === "Error") return;
  
  // Multiply by -1 to flip between positive and negative
  currentOperand = (parseFloat(currentOperand) * -1).toString();
  updateDisplay();
}

/**
 * Converts current number to a percentage (divides by 100).
 */
function applyPercentage() {
  if (currentOperand === "" || currentOperand === "Error") return;

  currentOperand = (parseFloat(currentOperand) / 100).toString();
  updateDisplay();
}

// ------------------------------------------------------------
// 4. DISPLAY HELPER FUNCTIONS
// ------------------------------------------------------------

/**
 * Formats a number with comma separators for clean presentation (e.g., 10,000).
 * Handles partial decimals while typing (e.g., "12.").
 * @param {string} numberStr
 * @returns {string} Formatted number
 */
function formatDisplayNumber(numberStr) {
  if (numberStr === "Error") return "Error";
  if (numberStr === "") return "";

  const [integerPart, decimalPart] = numberStr.split(".");
  const integerNumber = parseFloat(integerPart);

  let formattedInteger = "";
  if (isNaN(integerNumber)) {
    formattedInteger = "";
  } else {
    // toLocaleString() adds comma separators according to standard numbering
    formattedInteger = integerNumber.toLocaleString("en-US");
  }

  // If there is a decimal part (or user just typed the dot), re-attach it
  if (decimalPart !== undefined) {
    return `${formattedInteger}.${decimalPart}`;
  } else {
    return formattedInteger;
  }
}

/**
 * Refreshes both top and bottom rows of the screen with formatted strings.
 */
function updateDisplay() {
  currentOperandText.innerText = formatDisplayNumber(currentOperand);

  if (operation != null) {
    // Show e.g. "15 +" in the upper display row
    previousOperandText.innerText = `${formatDisplayNumber(previousOperand)} ${operation}`;
  } else {
    previousOperandText.innerText = "";
  }
}

// ------------------------------------------------------------
// 5. EVENT LISTENERS (INTERACTION HANDLING)
// ------------------------------------------------------------

/**
 * Event Delegation:
 * Instead of adding separate event listeners to all 19 buttons,
 * we place ONE listener on the parent container (.keypad).
 * When any button inside is clicked, the event bubbles up here!
 */
keypad.addEventListener("click", (event) => {
  // Ensure the clicked element is an actual button
  const button = event.target.closest("button");
  if (!button) return;

  const { number, action, operator } = button.dataset;

  // Case A: A number button was clicked (0 - 9)
  if (number !== undefined) {
    appendNumber(number);
    return;
  }

  // Case B: An action or operator button was clicked
  switch (action) {
    case "decimal":
      appendDecimal();
      break;
    case "operator":
      chooseOperation(operator);
      break;
    case "calculate":
      compute();
      break;
    case "clear":
      clearAll();
      break;
    case "toggle-sign":
      toggleSign();
      break;
    case "percent":
      applyPercentage();
      break;
  }
});

// ------------------------------------------------------------
// 6. BONUS: PHYSICAL KEYBOARD SUPPORT
// ------------------------------------------------------------
// Allows users to type directly on desktop keyboards!
window.addEventListener("keydown", (event) => {
  const key = event.key;

  if (key >= "0" && key <= "9") {
    appendNumber(key);
  } else if (key === ".") {
    appendDecimal();
  } else if (key === "=" || key === "Enter") {
    event.preventDefault(); // Prevents unwanted button focus trigger
    compute();
  } else if (key === "Backspace") {
    // Handle backspace: delete last character
    if (currentOperand.length > 1 && currentOperand !== "Error") {
      currentOperand = currentOperand.slice(0, -1);
    } else {
      currentOperand = "0";
    }
    updateDisplay();
  } else if (key === "Escape") {
    clearAll();
  } else if (key === "+") {
    chooseOperation("+");
  } else if (key === "-") {
    chooseOperation("-");
  } else if (key === "*") {
    chooseOperation("×");
  } else if (key === "/") {
    event.preventDefault(); // Prevents quick find in Firefox
    chooseOperation("÷");
  } else if (key === "%") {
    applyPercentage();
  }
});

// Run display update once at startup so screen shows "0"
updateDisplay();

