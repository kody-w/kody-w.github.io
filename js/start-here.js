(() => {
  const STORAGE_KEY = "kodyw-reading-progress-v1";
  const steps = [...document.querySelectorAll("[data-reading-step]")];
  const pathSections = [...document.querySelectorAll("[data-reading-path]")];
  const validStepIds = new Set(steps.map((step) => step.dataset.readingStep));
  const overallCount = document.querySelector("#start-completed-count");
  const overallMeter = document.querySelector("#start-overall-meter");
  const resetAll = document.querySelector("#start-reset-all");
  let completed = new Set();

  if (steps.length === 0 || !overallCount || !overallMeter || !resetAll) {
    return;
  }

  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    completed = new Set(
      Array.isArray(stored) ? stored.filter((id) => validStepIds.has(id)) : [],
    );
  } catch {
    completed = new Set();
  }

  function persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...completed]));
    } catch {
      // Progress still works for this page view when storage is unavailable.
    }
  }

  function render() {
    steps.forEach((step) => {
      const id = step.dataset.readingStep;
      const done = completed.has(id);
      const button = step.querySelector(".start-step-toggle");
      const title = step.querySelector("h3").textContent.trim();
      step.classList.toggle("is-complete", done);
      button.setAttribute("aria-pressed", String(done));
      button.setAttribute(
        "aria-label",
        `Mark ${title} ${done ? "incomplete" : "complete"}`,
      );
    });

    pathSections.forEach((section) => {
      const pathId = section.dataset.readingPath;
      const pathSteps = steps.filter((step) => step.dataset.pathId === pathId);
      const done = pathSteps.filter((step) => completed.has(step.dataset.readingStep)).length;
      const label = section.querySelector(`[data-path-progress="${pathId}"]`);
      label.textContent = `${done} / ${pathSteps.length} complete`;
    });

    overallCount.textContent = completed.size;
    overallMeter.value = completed.size;
    overallMeter.textContent = `${completed.size} of ${steps.length}`;
  }

  steps.forEach((step) => {
    step.querySelector(".start-step-toggle").addEventListener("click", () => {
      const id = step.dataset.readingStep;
      if (completed.has(id)) {
        completed.delete(id);
      } else {
        completed.add(id);
      }
      persist();
      render();
    });
  });

  document.querySelectorAll("[data-reset-path]").forEach((button) => {
    button.addEventListener("click", () => {
      const pathId = button.dataset.resetPath;
      steps
        .filter((step) => step.dataset.pathId === pathId)
        .forEach((step) => completed.delete(step.dataset.readingStep));
      persist();
      render();
    });
  });

  resetAll.addEventListener("click", () => {
    completed.clear();
    persist();
    render();
  });

  render();
})();
