"use client"

import React from "react"
import { Folder, HardDrive } from "lucide-react"
import { clsx } from "clsx"

import s from "./style.module.css"

interface FolderSidebarProps {
  folders: string[]
  activeFolder: string | null
  onFolderSelect: (folder: string | null) => void
}

export default function FolderSidebar({
  folders,
  activeFolder,
  onFolderSelect,
}: FolderSidebarProps) {
  return (
    <aside className={s.sidebar}>
      <div className={s.section}>
        <h3 className={s.title}>Library</h3>
        <ul className={s.folderList}>
          <li
            className={clsx(s.folderItem, !activeFolder && s.active)}
            onClick={() => onFolderSelect(null)}
          >
            <HardDrive size={16} className={s.folderIcon} />
            <span>All Assets</span>
          </li>
        </ul>
      </div>

      <div className={s.section}>
        <h3 className={s.title}>Folders</h3>
        <ul className={s.folderList}>
          {folders.map((folder) => (
            <li
              key={folder}
              className={clsx(
                s.folderItem,
                activeFolder === folder && s.active
              )}
              onClick={() => onFolderSelect(folder)}
            >
              <Folder size={16} className={s.folderIcon} />
              <span>{folder}</span>
            </li>
          ))}
          {folders.length === 0 && (
            <p className={s.emptyHint}>No folders created.</p>
          )}
        </ul>
      </div>
    </aside>
  )
}
