const form = document.querySelector("#calculator-form");
const nameInput = document.querySelector("#student-name");
const subjectInputs = [
  { id: "math", label: "Math" },
  { id: "english", label: "English" },
  { id: "science", label: "Science" },
  { id: "history", label: "History" },
  { id: "computer", label: "Computer" }
];
const resultEmpty = document.querySelector("#result-empty");
const resultContent = document.querySelector("#result-content");
const formStatus = document.querySelector("#form-status");
const themeToggle = document.querySelector("#theme-toggle");
const themeLabel = document.querySelector("#theme-label");
const storedResultKey = "grade-calculator-latest-result";
const storedThemeKey = "grade-calculator-theme";

function setFieldError(input, message) {
  const field = input.closest(".field-group");
  const error = document.querySelector(`#${input.id}-error`);
  field.classList.toggle("has-error", Boolean(message));
  input.setAttribute("aria-invalid", message ? "true" : "false");
  error.textContent = message;
}

function validateName() {
  const name = nameInput.value.trim();
  setFieldError(nameInput, name ? "" : "Please enter a student name.");
  return name;
}

function validateMark(input) {
  const rawValue = input.value.trim();
  if (!rawValue) {
    setFieldError(input, "Enter a mark.");
    return null;
  }

  const mark = Number(rawValue);
  if (!Number.isFinite(mark)) {
    setFieldError(input, "Use a number from 0 to 100.");
    return null;
  }
  if (mark < 0 || mark > 100) {
    setFieldError(input, "Mark must be between 0 and 100.");
    return null;
  }

  setFieldError(input, "");
  return mark;
}

function getGrade(average) {
  if (average >= 90) return "A+";
  if (average >= 80) return "A";
  if (average >= 70) return "B";
  if (average >= 60) return "C";
  if (average >= 50) return "D";
  return "F";
}

function formatMark(mark) {
  return Number.isInteger(mark) ? String(mark) : mark.toFixed(2);
}

function buildResult(name, marks) {
  const total = marks.reduce((sum, mark) => sum + mark, 0);
  const average = total / subjectInputs.length;
  const grade = getGrade(average);
  const belowPassMark = subjectInputs.filter((subject, index) => marks[index] < 33).map((subject) => subject.label);
  const passed = average >= 50 && belowPassMark.length === 0;

  return {
    name,
    marks,
    total,
    average,
    grade,
    passed,
    belowPassMark,
    savedAt: new Date().toISOString()
  };
}

function showResult(result) {
  resultEmpty.hidden = true;
  resultContent.hidden = false;
  document.querySelector("#result-name").textContent = result.name;
  document.querySelector("#result-total").textContent = formatMark(result.total);
  document.querySelector("#result-average").textContent = result.average.toFixed(2);
  document.querySelector("#result-grade").textContent = result.grade;

  const badge = document.querySelector("#result-badge");
  badge.textContent = result.passed ? "Pass" : "Fail";
  badge.classList.toggle("fail", !result.passed);

  const weakSubjects = document.querySelector("#weak-subjects");
  const weakSubjectList = document.querySelector("#weak-subject-list");
  weakSubjects.hidden = result.belowPassMark.length === 0;
  weakSubjectList.textContent = result.belowPassMark.length
    ? `${result.belowPassMark.join(", ")} ${result.belowPassMark.length === 1 ? "is" : "are"} below 33.`
    : "";

  document.querySelector("#result-footnote").textContent = `Saved in this browser ${new Date(result.savedAt).toLocaleString()}.`;
}

function clearResult() {
  resultEmpty.hidden = false;
  resultContent.hidden = true;
  formStatus.textContent = "";
}

function saveResult(result) {
  localStorage.setItem(storedResultKey, JSON.stringify(result));
}

function restoreResult() {
  const stored = localStorage.getItem(storedResultKey);
  if (!stored) return;

  try {
    const result = JSON.parse(stored);
    const resultIsValid = result && typeof result.name === "string" && Array.isArray(result.marks) && result.marks.length === subjectInputs.length;
    if (!resultIsValid) throw new Error("Invalid saved result");
    nameInput.value = result.name;
    result.marks.forEach((mark, index) => {
      document.querySelector(`#${subjectInputs[index].id}`).value = mark;
    });
    showResult(result);
  } catch {
    localStorage.removeItem(storedResultKey);
  }
}

function applyTheme(theme) {
  const isDark = theme === "dark";
  document.documentElement.dataset.theme = isDark ? "dark" : "light";
  themeLabel.textContent = isDark ? "Light mode" : "Dark mode";
  themeToggle.setAttribute("aria-label", isDark ? "Switch to light mode" : "Switch to dark mode");
  themeToggle.setAttribute("aria-pressed", String(isDark));
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const name = validateName();
  const marks = subjectInputs.map((subject) => validateMark(document.querySelector(`#${subject.id}`)));

  if (!name || marks.some((mark) => mark === null)) {
    formStatus.textContent = "Check the highlighted fields before calculating.";
    return;
  }

  const result = buildResult(name, marks);
  saveResult(result);
  showResult(result);
  formStatus.textContent = "Result calculated and saved.";
});

form.addEventListener("reset", () => {
  window.setTimeout(() => {
    subjectInputs.forEach((subject) => setFieldError(document.querySelector(`#${subject.id}`), ""));
    setFieldError(nameInput, "");
    localStorage.removeItem(storedResultKey);
    clearResult();
  }, 0);
});

themeToggle.addEventListener("click", () => {
  const nextTheme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  applyTheme(nextTheme);
  localStorage.setItem(storedThemeKey, nextTheme);
});

const savedTheme = localStorage.getItem(storedThemeKey);
applyTheme(savedTheme === "dark" ? "dark" : "light");
restoreResult();
