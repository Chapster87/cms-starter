"use client"

import { Plus, Trash2 } from "lucide-react"
import Button from "@/components/button"
import { CMSFieldOption } from "@/types/fields"
import s from "../../style.module.css"

interface SelectSettingsProps {
  choices: CMSFieldOption[]
  setChoices: (choices: CMSFieldOption[]) => void
}

export default function SelectSettings({
  choices,
  setChoices,
}: SelectSettingsProps) {
  const handleAddChoice = () => {
    setChoices([...choices, { label: "", value: "" }])
  }

  const handleRemoveChoice = (index: number) => {
    const newChoices = [...choices]
    newChoices.splice(index, 1)
    setChoices(newChoices)
  }

  const handleUpdateChoice = (
    index: number,
    key: "label" | "value",
    val: string
  ) => {
    const newChoices = [...choices]
    const oldChoice = newChoices[index]

    if (key === "label") {
      const oldAutoValue = oldChoice.label
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "-")

      if (!oldChoice.value || oldChoice.value === oldAutoValue) {
        newChoices[index] = {
          ...oldChoice,
          label: val,
          value: val.toLowerCase().replace(/[^a-z0-9]/g, "-"),
        }
      } else {
        newChoices[index] = { ...oldChoice, label: val }
      }
    } else {
      newChoices[index] = { ...oldChoice, [key]: val }
    }
    setChoices(newChoices)
  }

  return (
    <div className={s.advancedSettingsSection}>
      <hr className={s.separator} />
      <div className={s.sectionHeader}>
        <h4 className={s.settingsTitle}>Dropdown Options</h4>
        <Button
          type="button"
          unstyled
          onClick={handleAddChoice}
          className={s.addOptionButton}
        >
          <Plus size={14} /> Add Option
        </Button>
      </div>

      <div className={s.optionsList}>
        {choices.map((choice, index) => (
          <div key={index} className={s.optionRow}>
            <input
              type="text"
              className={s.optionInput}
              placeholder="Label (e.g. Red)"
              value={choice.label}
              onChange={(e) =>
                handleUpdateChoice(index, "label", e.target.value)
              }
            />
            <input
              type="text"
              className={s.optionInput}
              placeholder="Value (e.g. red)"
              value={choice.value}
              onChange={(e) =>
                handleUpdateChoice(index, "value", e.target.value)
              }
            />
            <Button
              type="button"
              unstyled
              onClick={() => handleRemoveChoice(index)}
              className={s.removeOptionButton}
            >
              <Trash2 size={16} />
            </Button>
          </div>
        ))}
        {choices.length === 0 && (
          <p className={s.emptyText}>No options added yet.</p>
        )}
      </div>
    </div>
  )
}
