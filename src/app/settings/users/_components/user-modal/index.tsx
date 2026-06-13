"use client"

import { useState, useEffect } from "react"
import Button from "@/components/button"
import Modal from "@/components/modal"
import Avatar from "@/components/avatar"
import { useUsers, UserRecord } from "@/hooks/use-users"
import s from "./style.module.css"

interface UserModalProps {
  isOpen: boolean
  onClose: () => void
  user?: UserRecord | null
  mode: "create" | "edit"
}

/**
 * Modal for adding or editing a CMS user.
 */
export default function UserModal({
  isOpen,
  onClose,
  user,
  mode,
}: UserModalProps) {
  const { updateUser } = useUsers()
  const [email, setEmail] = useState("")
  const [displayName, setDisplayName] = useState("")
  const [avatarUrl, setAvatarUrl] = useState("")
  const [role, setRole] = useState("editor")
  const [status, setStatus] = useState("active")
  const [password, setPassword] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const timer = setTimeout(() => {
      if (user && mode === "edit") {
        setEmail(user.email)
        setDisplayName(user.display_name || "")
        setAvatarUrl(user.avatar_url || "")
        setRole(user.role)
        setStatus(user.status)
      } else {
        setEmail("")
        setDisplayName("")
        setAvatarUrl("")
        setRole("editor")
        setStatus("active")
        setPassword("")
      }
    }, 0)
    return () => clearTimeout(timer)
  }, [user, mode, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setError(null)

    try {
      if (mode === "edit" && user) {
        const success = await updateUser(user.id, {
          role,
          status,
          display_name: displayName,
          avatar_url: avatarUrl,
        })
        if (success) onClose()
      } else {
        // TODO: Implement create user via Admin API
        const response = await fetch("/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, role, status, password }),
        })

        if (!response.ok) {
          const result = await response.json()
          throw new Error(result.error || "Failed to create user")
        }

        onClose()
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={(open) => !open && onClose()}
      title={mode === "edit" ? "Edit User" : "Add New User"}
      description={
        mode === "edit"
          ? `Update permissions and status for ${displayName || email}.`
          : "Create a new user account with specific roles."
      }
    >
      <form onSubmit={handleSubmit} className={s.modalForm}>
        {error && <p className={s.errorText}>{error}</p>}

        <div className={s.fieldSection}>
          <label className={s.fieldLabel}>Email Address</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={s.textInput}
            disabled={isSaving || mode === "edit"}
            required
            placeholder="e.g. user@example.com"
          />
        </div>

        <div className={s.fieldSection}>
          <label className={s.fieldLabel}>Display Name</label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className={s.textInput}
            disabled={isSaving}
            placeholder="e.g. John Doe"
          />
        </div>

        <div className={s.fieldSection}>
          <label className={s.fieldLabel}>Avatar</label>
          <div className={s.avatarSection}>
            <Avatar
              src={avatarUrl}
              alt={displayName || email}
              className={s.avatarPreview}
              size={48}
            />
            <div className={s.avatarInputWrapper}>
              <input
                type="url"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                className={s.textInput}
                style={{ width: "100%" }}
                disabled={isSaving}
                placeholder="https://example.com/avatar.png"
              />
            </div>
          </div>
        </div>

        {mode === "create" && (
          <div className={s.fieldSection}>
            <label className={s.fieldLabel}>Initial Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={s.textInput}
              disabled={isSaving}
              required
              placeholder="Min 6 characters"
              minLength={6}
            />
          </div>
        )}

        <div className={s.fieldSection}>
          <label className={s.fieldLabel}>Role</label>
          <select
            className={s.selectField}
            value={role}
            onChange={(e) => setRole(e.target.value)}
            disabled={isSaving}
          >
            <option value="admin">Admin</option>
            <option value="editor">Editor</option>
            <option value="author">Author</option>
          </select>
          <p className={s.fieldDescription}>
            Determines what the user can see and do in the CMS.
          </p>
        </div>

        <div className={s.fieldSection}>
          <label className={s.fieldLabel}>Status</label>
          <select
            className={s.selectField}
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            disabled={isSaving}
          >
            <option value="active">Active</option>
            <option value="disabled">Disabled</option>
          </select>
          <p className={s.fieldDescription}>
            Quickly revoke access without deleting the account.
          </p>
        </div>

        <div className={s.modalActions}>
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button type="submit" isLoading={isSaving} disabled={isSaving}>
            {mode === "edit" ? "Save Changes" : "Create User"}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
