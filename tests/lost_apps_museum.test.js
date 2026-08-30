const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const source = fs.readFileSync(
  path.join(__dirname, "..", "js", "lost-apps-museum.js"),
  "utf8"
);

class FakeElement {
  constructor({ dataset = {}, value = "" } = {}) {
    this.dataset = dataset;
    this.value = value;
    this.hidden = false;
    this.listeners = {};
    this.attributes = {};
  }

  addEventListener(type, listener) {
    this.listeners[type] = listener;
  }

  dispatch(type, event = { target: this }) {
    this.listeners[type]?.(event);
  }

  setAttribute(name, value) {
    this.attributes[name] = value;
  }

  removeAttribute(name) {
    delete this.attributes[name];
    delete this[name];
  }

  focus() {
    this.focused = true;
  }
}

function museumContext(searchValue = "") {
  const cards = [
    new FakeElement({
      dataset: {
        search: "agent workflow local editor",
        category: "agent-workbenches",
        readiness: "Needs hardening",
      },
    }),
    new FakeElement({
      dataset: {
        search: "therapy consent privacy",
        category: "sensitive-human-centered",
        readiness: "Context only",
      },
    }),
  ];
  const controls = {
    "#lost-apps-search": new FakeElement(),
    "#lost-apps-category": new FakeElement(),
    "#lost-apps-readiness": new FakeElement(),
    "#lost-apps-reset": new FakeElement(),
    "#lost-apps-result-count": new FakeElement(),
    "#lost-apps-empty": new FakeElement(),
    "#lost-app-preview-dialog": new FakeElement(),
    "#lost-app-preview-frame": new FakeElement(),
    "#lost-app-preview-title": new FakeElement(),
    "#lost-app-preview-close": new FakeElement(),
  };
  controls["#lost-app-preview-dialog"].showModal = function showModal() {
    this.open = true;
  };
  controls["#lost-app-preview-dialog"].close = function close() {
    this.open = false;
    this.dispatch("close");
  };
  const preview = new FakeElement({
    dataset: {
      lostAppPreview: "/learnwithkody/demos/367-agent-workflow-lab.html",
      lostAppTitle: "Agent Workflow Lab",
    },
  });
  let currentUrl = "";
  const context = {
    URLSearchParams,
    document: {
      querySelector: (selector) => controls[selector] || null,
      querySelectorAll: (selector) => {
        if (selector === "[data-lost-app-card]") return cards;
        if (selector === "[data-lost-app-preview]") return [preview];
        return [];
      },
    },
    window: {
      location: { pathname: "/lost-apps/", search: searchValue, hash: "" },
      history: {
        replaceState: (_state, _title, url) => {
          currentUrl = url;
        },
      },
      setTimeout: (callback) => callback(),
    },
  };
  vm.runInNewContext(source, context);
  return { cards, controls, preview, currentUrl: () => currentUrl };
}

test("museum search and filters update visible cards and URL state", () => {
  const fixture = museumContext("?q=workflow&category=agent-workbenches");
  assert.equal(fixture.cards[0].hidden, false);
  assert.equal(fixture.cards[1].hidden, true);
  assert.equal(
    fixture.controls["#lost-apps-result-count"].textContent,
    "Showing 1 of 2 exhibits"
  );
  assert.equal(fixture.currentUrl(), "/lost-apps/?q=workflow&category=agent-workbenches");

  fixture.controls["#lost-apps-search"].value = "";
  fixture.controls["#lost-apps-category"].value = "";
  fixture.controls["#lost-apps-readiness"].value = "Context only";
  fixture.controls["#lost-apps-readiness"].dispatch("input");
  assert.equal(fixture.cards[0].hidden, true);
  assert.equal(fixture.cards[1].hidden, false);
  assert.equal(fixture.currentUrl(), "/lost-apps/?readiness=Context+only");
});

test("preview opens only an allowlisted clean-room demo and clears it on close", () => {
  const fixture = museumContext();
  const dialog = fixture.controls["#lost-app-preview-dialog"];
  const frame = fixture.controls["#lost-app-preview-frame"];
  fixture.preview.dispatch("click");
  assert.equal(dialog.open, true);
  assert.equal(frame.src, "/learnwithkody/demos/367-agent-workflow-lab.html");
  assert.match(frame.title, /Agent Workflow Lab/);

  fixture.controls["#lost-app-preview-close"].dispatch("click");
  assert.equal(dialog.open, false);
  assert.equal(frame.src, undefined);
  assert.equal(fixture.preview.focused, true);

  fixture.preview.dataset.lostAppPreview = "https://kodyw.com/untrusted.html";
  fixture.preview.dispatch("click");
  assert.equal(dialog.open, false);
  assert.equal(frame.src, undefined);
});
