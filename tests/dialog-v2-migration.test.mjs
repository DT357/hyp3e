import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

async function findSourceFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(entries.map(entry => {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return findSourceFiles(entryPath);
    return /\.(?:mjs|js)$/.test(entry.name) ? [entryPath] : [];
  }));
  return files.flat();
}

test("production modules do not use the V1 Dialog API", async () => {
  const moduleRoot = path.join(repoRoot, "module");
  const sourceFiles = await findSourceFiles(moduleRoot);
  const v1CallSites = [];

  for (const sourceFile of sourceFiles) {
    const source = await readFile(sourceFile, "utf8");
    const matches = source.match(/\bnew\s+Dialog\s*\(|\bDialog\.(?:confirm|prompt|wait)\s*\(/g);
    if (!matches) continue;
    v1CallSites.push(`${path.relative(repoRoot, sourceFile)}: ${matches.length}`);
  }

  assert.deepEqual(v1CallSites, []);
});

test("DialogV2 roll content does not include a nested form", async () => {
  const templatePath = path.join(repoRoot, "templates", "dialog", "roll-dialog.hbs");
  const template = await readFile(templatePath, "utf8");

  assert.doesNotMatch(template, /<\/?form\b/i);
});

test("basic rolls use the DialogV2 form and preserve cancellation behavior", async () => {
  const originalConfig = globalThis.CONFIG;
  const originalFoundry = globalThis.foundry;
  const originalGame = globalThis.game;
  const form = {};
  const dialogConfigs = [];

  globalThis.CONFIG = {
    ChatMessage: {},
    Dice: { rollModes: { publicroll: "CHAT.RollPublic" } },
    HYP3E: { flipRollUnderMods: false }
  };
  globalThis.game = {
    settings: {
      get: (namespace, key) => namespace === "core" && key === "rollMode"
        ? "publicroll"
        : Number.POSITIVE_INFINITY
    }
  };
  globalThis.foundry = {
    applications: {
      api: {
        DialogV2: {
          wait: async config => {
            dialogConfigs.push(config);
            if (dialogConfigs.length > 1) return null;
            const rollButton = config.buttons.find(button => button.action === "roll");
            return rollButton.callback(null, { form });
          }
        }
      },
      handlebars: {
        renderTemplate: async () => '<div class="hyp3e roll-dialog"></div>'
      },
      ux: {
        FormDataExtended: class {
          constructor(receivedForm) {
            assert.equal(receivedForm, form);
            this.object = { rollMode: "publicroll", sitMod: "" };
          }
        }
      }
    }
  };

  try {
    const { Hyp3eDialog } = await import("../module/helpers/dialog.mjs");
    const dataset = {
      label: "Test of Strength",
      roll: "1d20",
      rollButtonLabel: "Roll"
    };

    const rollData = await Hyp3eDialog.ShowBasicRollDialog(dataset);
    assert.deepEqual(rollData, { rollMode: "publicroll", sitMod: 0 });
    assert.equal(dialogConfigs[0].window.title, dataset.label);
    assert.equal(dialogConfigs[0].buttons[0].default, true);
    assert.equal(dialogConfigs[0].rejectClose, false);

    await assert.rejects(
      Hyp3eDialog.ShowBasicRollDialog(dataset),
      /Basic roll dialog canceled/
    );
  } finally {
    if (originalConfig === undefined) delete globalThis.CONFIG;
    else globalThis.CONFIG = originalConfig;
    if (originalFoundry === undefined) delete globalThis.foundry;
    else globalThis.foundry = originalFoundry;
    if (originalGame === undefined) delete globalThis.game;
    else globalThis.game = originalGame;
  }
});
