import { HYP3E } from "./config.mjs"
import { getRollModeChoices } from "./foundry-compat.mjs"
import { Hyp3eLogger } from "./logger.mjs"

function getRollDialogFormData(button) {
  const formData = new foundry.applications.ux.FormDataExtended(button.form)
  const formDataObj = formData.object
  if (formDataObj.sitMod == '') { formDataObj.sitMod = 0 }
  return formDataObj
}

function requireDialogResult(result, dialogName) {
  if (result !== null) return result
  throw new Error(`${dialogName} canceled`)
}

export class Hyp3eDialog {
  /**
   * Handle item and ability check dialogs
   * @param dataset
   */
  static async ShowBasicRollDialog(dataset) {
    // rollMode prioritizes dataset (for pre-setting roll mode in the dialog), 
    //  then the player's chat bar setting, then defaults to public roll
    const rollMode = dataset?.rollMode 
      ?? game.settings.get("core", "rollMode") 
      ?? "publicroll";
    let dialogData = {
      dataset: dataset,
      rollModes: getRollModeChoices(),
      rollMode: rollMode
    }
    Hyp3eLogger.info("Hyp3eDialog ShowBasicRollDialog", `Dialog dataset:`, dialogData);
    const template = `${HYP3E.templatePath}/dialog/roll-dialog.hbs`
    const dialogHtml = await foundry.applications.handlebars.renderTemplate(template, dialogData)

    // Roll dialog for item and ability checks
    const result = await foundry.applications.api.DialogV2.wait({
      window: { title: `${dataset.label}` },
      content: dialogHtml,
      buttons: [{
        action: "roll",
        icon: "fas fa-dice-d20",
        label: dataset.rollButtonLabel,
        default: true,
        callback: (_event, button) => {
          const formDataObj = getRollDialogFormData(button)
          if (CONFIG.HYP3E.flipRollUnderMods) {
            Hyp3eLogger.info("Hyp3eDialog ShowBasicRollDialog", `Rolling ${dataset.roll} - ${formDataObj.sitMod}...`, formDataObj)
          } else {
            Hyp3eLogger.info("Hyp3eDialog ShowBasicRollDialog", `Rolling ${dataset.roll} + ${formDataObj.sitMod} ...`, formDataObj)
          }
          return formDataObj
        }
      }, {
        action: "cancel",
        icon: "fas fa-times",
        label: "Cancel",
        callback: () => null
      }],
      rejectClose: false,
      render: () => Hyp3eLogger.info("Hyp3eDialog ShowBasicRollDialog", `Register interactivity in the rendered dialog`),
      close: () => Hyp3eLogger.info("Hyp3eDialog ShowBasicRollDialog", `Dialog closed`)
    })
    if (result === null) Hyp3eLogger.info("Hyp3eDialog ShowBasicRollDialog", `Roll canceled!`)
    return requireDialogResult(result, "Basic roll dialog")
  }

  /**
   * Handle attack dialogs
   * @param dataset
   */
  static async ShowAttackRollDialog(dataset) {
    // rollMode prioritizes dataset (for pre-setting roll mode in the dialog), 
    //  then the player's chat bar setting, then defaults to public roll
    const rollMode = dataset?.rollMode 
      ?? game.settings.get("core", "rollMode") 
      ?? "publicroll";
    let dialogData = {
      dataset: dataset,
      rollModes: getRollModeChoices(),
      rollMode: rollMode,
      ammoTypes: dataset.carriedAmmo ?? null,
      selectedAmmo: dataset.selectedAmmo ?? null,
      rangeGroup: dataset.rangeGroup ?? null,
      ranges: dataset.ranges ?? null,
      chosen: dataset.chosenRange ?? null
    }
    // Log the dataset
    Hyp3eLogger.info("Hyp3eDialog ShowAttackRollDialog", `Dialog dataset:`, dataset);
    const template = `${HYP3E.templatePath}/dialog/roll-dialog.hbs`
    const dialogHtml = await foundry.applications.handlebars.renderTemplate(template, dialogData)

    // Roll dialog for attacks
    const result = await foundry.applications.api.DialogV2.wait({
      window: { title: `${dataset.label}` },
      content: dialogHtml,
      buttons: [{
        action: "roll",
        icon: "fas fa-dice-d20",
        label: "Attack",
        default: true,
        callback: (_event, button) => {
          const formDataObj = getRollDialogFormData(button)
          Hyp3eLogger.info("Hyp3eDialog ShowAttackRollDialog", `Rolling ${dataset.roll} + ${formDataObj.sitMod}...`, formDataObj)
          return formDataObj
        }
      }, {
        action: "cancel",
        icon: "fas fa-times",
        label: "Cancel",
        callback: () => null
      }],
      rejectClose: false,
      render: () => Hyp3eLogger.info("Hyp3eDialog ShowAttackRollDialog", `Register interactivity in the rendered dialog`),
      close: () => Hyp3eLogger.info("Hyp3eDialog ShowAttackRollDialog", `Dialog closed`)
    })
    if (result === null) Hyp3eLogger.info("Hyp3eDialog ShowAttackRollDialog", `Roll canceled!`)
    return requireDialogResult(result, "Attack roll dialog")
  }

  /**
   * Handle spellcasting dialog
   * @param dataset
   */
  static async ShowSpellcastingDialog(dataset) {
    // rollMode prioritizes dataset (for pre-setting roll mode in the dialog), 
    //  then the player's chat bar setting, then defaults to public roll
    const rollMode = dataset?.rollMode 
      ?? game.settings.get("core", "rollMode") 
      ?? "publicroll";
    let dialogData = {
      // roll: dataset.roll,
      enableRoll: dataset.enableRoll,
      dataset: dataset,
      rollModes: getRollModeChoices(),
      rollMode: rollMode
    }
    Hyp3eLogger.info("Hyp3eDialog ShowSpellcastingDialog", `Dialog dataset:`, dataset);
    const template = `${HYP3E.templatePath}/dialog/roll-dialog.hbs`
    const dialogHtml = await foundry.applications.handlebars.renderTemplate(template, dialogData)

    // Roll dialog for casting spells
    const result = await foundry.applications.api.DialogV2.wait({
      window: { title: `${dataset.label}` },
      content: dialogHtml,
      buttons: [{
        action: "roll",
        icon: "fas fa-scroll",
        label: "Cast Spell",
        default: true,
        callback: (_event, button) => {
          const formDataObj = getRollDialogFormData(button)
          Hyp3eLogger.info("Hyp3eDialog ShowSpellcastingDialog", `Rolling ${dataset.roll} + ${formDataObj.sitMod}...`, formDataObj)
          return formDataObj
        }
      }, {
        action: "cancel",
        icon: "fas fa-times",
        label: "Cancel",
        callback: () => null
      }],
      rejectClose: false,
      render: () => Hyp3eLogger.info("Hyp3eDialog ShowSpellcastingDialog", `Register interactivity in the rendered dialog`),
      close: () => Hyp3eLogger.info("Hyp3eDialog ShowSpellcastingDialog", `Dialog closed`)
    })
    if (result === null) Hyp3eLogger.info("Hyp3eDialog ShowSpellcastingDialog", `Roll canceled!`)
    return requireDialogResult(result, "Spellcasting dialog")
  }
  
  /**
   * Handle saving throw dialog
   * @param dataset
   */
  static async ShowSaveRollDialog(dataset) {
    // rollMode prioritizes dataset (for pre-setting roll mode in the dialog), 
    //  then the player's chat bar setting, then defaults to public roll
    const rollMode = dataset?.rollMode 
      ?? game.settings.get("core", "rollMode") 
      ?? "publicroll";
    let dialogData = {
      // roll: dataset.roll,
      dataset: dataset,
      rollModes: getRollModeChoices(),
      rollMode: rollMode
    }
    Hyp3eLogger.info("Hyp3eDialog ShowSaveRollDialog", `Dialog dataset:`, dataset);
    const template = `${HYP3E.templatePath}/dialog/roll-dialog.hbs`
    const dialogHtml = await foundry.applications.handlebars.renderTemplate(template, dialogData)

    // Roll dialog for saving throws, with save modifiers
    const result = await foundry.applications.api.DialogV2.wait({
      window: { title: `${dataset.label}` },
      content: dialogHtml,
      buttons: [{
        action: "roll",
        icon: "fas fa-dice-d20",
        label: "Roll Save",
        default: true,
        callback: (_event, button) => {
          const formDataObj = getRollDialogFormData(button)
          Hyp3eLogger.info("Hyp3eDialog ShowSaveRollDialog", `Rolling basic save: ${dataset.roll} + ${formDataObj.sitMod}...`, formDataObj)
          return formDataObj
        }
      }, {
        action: "avoid",
        icon: "fas fa-dice-d20",
        label: "Avoidance Mod",
        callback: (_event, button) => {
          const formDataObj = getRollDialogFormData(button)
          formDataObj.avoidMod = dataset.avoidMod
          Hyp3eLogger.info("Hyp3eDialog ShowSaveRollDialog", `Rolling save with Avoidance mod: ${dataset.roll} + ${formDataObj.avoidMod} + ${formDataObj.sitMod}...`, formDataObj)
          return formDataObj
        }
      }, {
        action: "poison",
        icon: "fas fa-dice-d20",
        label: "Poison/Rad Mod",
        callback: (_event, button) => {
          const formDataObj = getRollDialogFormData(button)
          formDataObj.poisonMod = dataset.poisonMod
          Hyp3eLogger.info("Hyp3eDialog ShowSaveRollDialog", `Rolling save with Poison/Radiation mod: ${dataset.roll} + ${formDataObj.poisonMod} + ${formDataObj.sitMod}...`, formDataObj)
          return formDataObj
        }
      }, {
        action: "willpower",
        icon: "fas fa-dice-d20",
        label: "Willpower Mod",
        callback: (_event, button) => {
          const formDataObj = getRollDialogFormData(button)
          formDataObj.willMod = dataset.willMod
          Hyp3eLogger.info("Hyp3eDialog ShowSaveRollDialog", `Rolling save with Willpower mod: ${dataset.roll} + ${formDataObj.willMod} + ${formDataObj.sitMod}...`, formDataObj)
          return formDataObj
        }
      }, {
        action: "cancel",
        icon: "fas fa-times",
        label: "Cancel",
        callback: () => null
      }],
      rejectClose: false,
      render: () => Hyp3eLogger.info("Hyp3eDialog ShowSaveRollDialog", `Register interactivity in the rendered dialog`),
      close: () => Hyp3eLogger.info("Hyp3eDialog ShowSaveRollDialog", `Dialog closed`)
    })
    if (result === null) Hyp3eLogger.info("Hyp3eDialog ShowSaveRollDialog", `Roll canceled!`)
    return requireDialogResult(result, "Save roll dialog")
  }

  /**
   * Handle Set Attribute Mods confirmation dialog
   * @param dataset
   */
  static async ShowSetModifiersDialog() {
    // Dialog to confirm setting modifiers
    const result = await foundry.applications.api.DialogV2.wait({
      window: { title: "Confirm set/reset attribute modifiers" },
      content: "Set attribute modifiers? This will replace any values already in place!",
      buttons: [{
        action: "confirm",
        label: "Confirm",
        icon: "fas fa-check",
        callback: () => true
      }, {
        action: "cancel",
        label: "Cancel",
        icon: "fas fa-times",
        default: true,
        callback: () => false
      }],
      rejectClose: false,
      render: () => Hyp3eLogger.info("Hyp3eDialog ShowSetModifiersDialog", `Register interactivity in the rendered dialog`),
      close: () => Hyp3eLogger.info("Hyp3eDialog ShowSetModifiersDialog", `Dialog closed`)
    })
    if (result === false) ui.notifications.info("Hyp3eDialog Set attribute modifiers - canceled!")
    if (result !== true) throw new Error("Set attribute modifiers dialog canceled")
  }

  /**
   * Handle Level-Up confirmation dialog
   * @param dataset
   */
  static async ShowLevelUpDialog(dataset) {
    // Dialog to confirm setting modifiers
    const result = await foundry.applications.api.DialogV2.wait({
      window: { title: "Confirm character level-up" },
      content: "Level up character? This will replace any values already in place!",
      buttons: [{
        action: "confirm",
        label: "Confirm",
        icon: "fas fa-check",
        callback: () => true
      }, {
        action: "cancel",
        label: "Cancel",
        icon: "fas fa-times",
        default: true,
        callback: () => false
      }],
      rejectClose: false,
      render: () => Hyp3eLogger.info("Hyp3eDialog ShowLevelUpDialog", `Register interactivity in the rendered dialog`),
      close: () => Hyp3eLogger.info("Hyp3eDialog ShowLevelUpDialog", `Dialog closed`)
    })
    if (result === false) ui.notifications.info("Hyp3eDialog Level up character - canceled!")
    if (result !== true) throw new Error("Level up dialog canceled")
  }
}
