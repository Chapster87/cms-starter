"use client"

import React, { useMemo } from "react"
import { Plus, Trash2, Star } from "lucide-react"
import clsx from "clsx"

import Button from "@/components/button"
import {
  calculateRugbyPoints,
  calculateLPPG,
  calculatePD,
} from "@/utils/rugby-logic"
import FieldWrapper from "../field-wrapper"
import ReferenceField from "../reference-field"

import s from "./style.module.css"

interface StandingRow {
  team_id: string
  team_name: string
  team_logo?: unknown
  is_focused?: boolean
  gp: number
  w: number
  l: number
  t: number
  pf: number
  pa: number
  pd: number
  bt: number
  bl: number
  ff: number
}

interface RecordPreview {
  id: string
  display_name: string
  subtitle?: string
  model_name: string
  model_id?: string
  status?: string
  has_draft?: boolean
  raw_data?: Record<string, unknown>
}

interface StandingsFieldProps {
  label: string
  value: StandingRow[] | string | null
  onChange: (value: StandingRow[]) => void
  description?: string
  fieldNote?: string
  required?: boolean
  disabled?: boolean
  leagueId?: string
  divisionId?: string
}

/**
 * A specialized field for managing Rugby League standings data.
 */
export default function StandingsField({
  label,
  value,
  onChange,
  description,
  fieldNote,
  required,
  disabled,
  leagueId,
  divisionId,
}: StandingsFieldProps) {
  const id = React.useId()
  const pickerRef = React.useRef<HTMLDivElement>(null)
  const rows = useMemo(() => {
    if (!value) return []
    if (Array.isArray(value)) return value
    try {
      const parsed = JSON.parse(value as string)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }, [value])

  const handleUpdateRow = (index: number, updates: Partial<StandingRow>) => {
    const nextRows = [...rows]
    nextRows[index] = { ...nextRows[index], ...updates }

    // Auto-calculate PD (Point Differential) using helper
    if (updates.pf !== undefined || updates.pa !== undefined) {
      nextRows[index].pd = calculatePD(nextRows[index].pf, nextRows[index].pa)
    }

    onChange(nextRows)
  }

  const handleAddTeam = (record: RecordPreview) => {
    // Check if team already exists
    if (rows.find((r) => r.team_id === record.id)) return

    console.log("Adding team to standings:", record)

    const newRow: StandingRow = {
      team_id: record.id,
      team_name: record.display_name,
      team_logo: record.raw_data?.logo || record.raw_data?.team_logo,
      gp: 0,
      w: 0,
      l: 0,
      t: 0,
      pf: 0,
      pa: 0,
      pd: 0,
      bt: 0,
      bl: 0,
      ff: 0,
    }
    onChange([...rows, newRow])
  }

  const handleRemoveRow = (index: number) => {
    const nextRows = rows.filter((_, i) => i !== index)
    onChange(nextRows)
  }

  // Wrappers for helpers to keep template clean
  const getPts = (row: StandingRow) => calculateRugbyPoints(row)
  const getLPPG = (row: StandingRow) => calculateLPPG(getPts(row), row.gp)

  const isFilterReady = !!leagueId && !!divisionId

  // Calculate filters and exclusions for ReferenceField
  const filters = useMemo(() => {
    if (!isFilterReady) return undefined
    return {
      teams: {
        league: leagueId,
        division: divisionId,
      },
    }
  }, [leagueId, divisionId, isFilterReady])

  const excludeIds = useMemo(() => {
    return rows.map((r) => r.team_id).filter(Boolean)
  }, [rows])

  return (
    <FieldWrapper
      id={id}
      label={label}
      description={description}
      fieldNote={fieldNote}
      required={required}
    >
      <div className={s.container}>
        <div className={s.tableWrapper}>
          <table className={s.table}>
            <thead>
              <tr>
                <th rowSpan={2}>Team</th>
                <th colSpan={4} className={s.groupHeader}>
                  Record
                </th>
                <th colSpan={3} className={s.groupHeader}>
                  Points
                </th>
                <th colSpan={3} className={s.groupHeader}>
                  Bonus
                </th>
                <th colSpan={2} className={s.groupHeader}>
                  Calculated
                </th>
                <th rowSpan={2}>Focus</th>
                <th rowSpan={2}></th>
              </tr>
              <tr>
                <th>GP</th>
                <th>W</th>
                <th>L</th>
                <th className={s.groupDivider}>T</th>
                <th>PF</th>
                <th>PA</th>
                <th className={s.groupDivider}>PD</th>
                <th>BT</th>
                <th>BL</th>
                <th className={s.groupDivider}>FF</th>
                <th>Pts</th>
                <th>LPPG</th>
              </tr>
            </thead>
            <tbody>
              {rows.length > 0 ? (
                rows.map((row, idx) => (
                  <tr key={row.team_id}>
                    <td className={clsx(s.teamCell, s.groupDivider)}>
                      <div className={s.teamInfo}>
                        <span className={s.teamName}>{row.team_name}</span>
                      </div>
                    </td>
                    <td className={s.inputCell}>
                      <input
                        type="number"
                        className={s.statInput}
                        value={row.gp}
                        onChange={(e) =>
                          handleUpdateRow(idx, {
                            gp: parseInt(e.target.value) || 0,
                          })
                        }
                        disabled={disabled}
                      />
                    </td>
                    <td className={s.inputCell}>
                      <input
                        type="number"
                        className={s.statInput}
                        value={row.w}
                        onChange={(e) =>
                          handleUpdateRow(idx, {
                            w: parseInt(e.target.value) || 0,
                          })
                        }
                        disabled={disabled}
                      />
                    </td>
                    <td className={s.inputCell}>
                      <input
                        type="number"
                        className={s.statInput}
                        value={row.l}
                        onChange={(e) =>
                          handleUpdateRow(idx, {
                            l: parseInt(e.target.value) || 0,
                          })
                        }
                        disabled={disabled}
                      />
                    </td>
                    <td className={clsx(s.inputCell, s.groupDivider)}>
                      <input
                        type="number"
                        className={s.statInput}
                        value={row.t}
                        onChange={(e) =>
                          handleUpdateRow(idx, {
                            t: parseInt(e.target.value) || 0,
                          })
                        }
                        disabled={disabled}
                      />
                    </td>
                    <td className={s.inputCell}>
                      <input
                        type="number"
                        className={s.statInput}
                        value={row.pf}
                        onChange={(e) =>
                          handleUpdateRow(idx, {
                            pf: parseInt(e.target.value) || 0,
                          })
                        }
                        disabled={disabled}
                      />
                    </td>
                    <td className={s.inputCell}>
                      <input
                        type="number"
                        className={s.statInput}
                        value={row.pa}
                        onChange={(e) =>
                          handleUpdateRow(idx, {
                            pa: parseInt(e.target.value) || 0,
                          })
                        }
                        disabled={disabled}
                      />
                    </td>
                    <td className={clsx(s.calcCell, s.groupDivider)}>
                      {row.pd}
                    </td>
                    <td className={s.inputCell}>
                      <input
                        type="number"
                        className={s.statInput}
                        value={row.bt}
                        onChange={(e) =>
                          handleUpdateRow(idx, {
                            bt: parseInt(e.target.value) || 0,
                          })
                        }
                        disabled={disabled}
                      />
                    </td>
                    <td className={s.inputCell}>
                      <input
                        type="number"
                        className={s.statInput}
                        value={row.bl}
                        onChange={(e) =>
                          handleUpdateRow(idx, {
                            bl: parseInt(e.target.value) || 0,
                          })
                        }
                        disabled={disabled}
                      />
                    </td>
                    <td className={clsx(s.inputCell, s.groupDivider)}>
                      <input
                        type="number"
                        className={s.statInput}
                        value={row.ff}
                        onChange={(e) =>
                          handleUpdateRow(idx, {
                            ff: parseInt(e.target.value) || 0,
                          })
                        }
                        disabled={disabled}
                      />
                    </td>
                    <td className={s.calcCell}>{getPts(row)}</td>
                    <td className={s.calcCell}>{getLPPG(row)}</td>
                    <td className={s.actionsCell}>
                      <Button
                        type="button"
                        variant="secondary"
                        size="small"
                        unstyled
                        className={clsx(
                          s.focusBtn,
                          row.is_focused && s.isFocused
                        )}
                        onClick={() =>
                          handleUpdateRow(idx, { is_focused: !row.is_focused })
                        }
                        disabled={disabled}
                        title={
                          row.is_focused
                            ? "Remove focus"
                            : "Mark as focused team"
                        }
                      >
                        <Star
                          size={14}
                          fill={row.is_focused ? "currentColor" : "none"}
                        />
                      </Button>
                    </td>
                    <td className={s.actionsCell}>
                      <Button
                        type="button"
                        variant="secondary"
                        size="small"
                        unstyled
                        className={s.removeBtn}
                        onClick={() => handleRemoveRow(idx)}
                        disabled={disabled}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={14} className={s.emptyState}>
                    No teams added to standings yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className={s.footer}>
          <Button
            type="button"
            variant="secondary"
            className={s.addTeamButton}
            onClick={() => {
              // Trigger the ReferenceField inside the container
              // We look for the add button inside the reference field container
              const addBtn = pickerRef.current?.querySelector(
                'button[class*="addBtn"]'
              ) as HTMLElement
              if (addBtn) {
                addBtn.click()
              }
            }}
            disabled={disabled || !isFilterReady}
            beforeText={<Plus size={16} />}
            title={
              !isFilterReady
                ? "Please select a League and Division first"
                : "Add team to standings"
            }
          >
            {!isFilterReady
              ? "Select League & Division to Add Teams"
              : "Add Team"}
          </Button>

          <div className={s.hiddenPicker}>
            <ReferenceField
              label=""
              value={null}
              onChange={() => {}}
              onSelectRecord={handleAddTeam}
              allowedModels={["teams"]}
              placeholder="Add Team to Table..."
              disabled={disabled}
              filters={filters}
              excludeIds={excludeIds}
              triggerRef={pickerRef}
            />
          </div>
        </div>
      </div>
    </FieldWrapper>
  )
}
