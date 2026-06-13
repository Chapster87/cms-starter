"use client"

import React, { useCallback, useMemo } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Edit2, Trash2 } from "lucide-react"
import Button from "@/components/button"
import Avatar from "@/components/avatar"
import ContextMenu from "@/components/context-menu"
import { useAuth } from "@/hooks/use-auth"
import { useUsers, UserRecord } from "@/hooks/use-users"
import UserModal from "./_components/user-modal"
import clsx from "clsx"
import s from "../style.module.css"

/**
 * Page for managing CMS users.
 */
export default function UsersPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user: currentUser } = useAuth()
  const { users, loading, error, refresh, deleteUser } = useUsers()

  const action = searchParams.get("action")
  const userId = searchParams.get("userId")

  const selectedUser = useMemo(() => {
    if (!userId) return null
    return users.find((u) => u.id === userId) || null
  }, [userId, users])

  const handleCloseModal = useCallback(() => {
    const nextParams = new URLSearchParams(searchParams.toString())
    nextParams.delete("action")
    nextParams.delete("userId")
    router.push(`?${nextParams.toString()}`)
    refresh()
  }, [router, searchParams, refresh])

  const handleAddUser = () => {
    const nextParams = new URLSearchParams(searchParams.toString())
    nextParams.set("action", "new-user")
    router.push(`?${nextParams.toString()}`)
  }

  const handleEditUser = (user: UserRecord) => {
    const nextParams = new URLSearchParams(searchParams.toString())
    nextParams.set("action", "edit-user")
    nextParams.set("userId", user.id)
    router.push(`?${nextParams.toString()}`)
  }

  const handleDeleteUser = async (id: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return
    await deleteUser(id)
  }

  return (
    <div className={s.container}>
      <header className={s.header}>
        <div className={s.titleGroup}>
          <h1 className={s.title}>User Management</h1>
          <p className={s.subtitle}>Manage CMS access and assign roles.</p>
        </div>
        <Button onClick={handleAddUser}>Add User</Button>
      </header>

      {error && <p className={s.error}>{error}</p>}

      <div className={s.tableWrapper}>
        <table className={s.table}>
          <thead>
            <tr>
              <th>User</th>
              <th>Role</th>
              <th>Status</th>
              <th>Created</th>
              <th className={s.actionsCell}></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={4}
                  style={{ textAlign: "center", padding: "40px" }}
                >
                  Loading users...
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  style={{ textAlign: "center", padding: "40px" }}
                >
                  No users found.
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr
                  key={user.id}
                  onClick={() => handleEditUser(user)}
                  style={{ cursor: "pointer" }}
                >
                  <td>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                      }}
                    >
                      <Avatar
                        src={user.avatar_url}
                        alt={user.display_name || user.email}
                        size={32}
                      />
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "2px",
                        }}
                      >
                        <span
                          style={{
                            fontWeight: 600,
                            color: "var(--color-grey-900)",
                          }}
                        >
                          {user.display_name || user.email}
                        </span>
                        {user.display_name && (
                          <span
                            style={{
                              fontSize: "12px",
                              color: "var(--color-grey-500)",
                            }}
                          >
                            {user.email}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td>
                    <span
                      className={clsx(s.roleBadge, {
                        [s.roleAdmin]: user.role === "admin",
                        [s.roleEditor]: user.role !== "admin",
                      })}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td>{user.status}</td>
                  <td>{new Date(user.created_at).toLocaleDateString()}</td>
                  <td className={s.actionsCell}>
                    <ContextMenu>
                      <ContextMenu.Trigger className={s.actionsButton} asChild>
                        <button
                          className={s.unstyledButton}
                          type="button"
                          aria-label="More options"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <svg
                            width="16"
                            height="16"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                            />
                          </svg>
                        </button>
                      </ContextMenu.Trigger>
                      <ContextMenu.Content>
                        <ContextMenu.Item
                          onSelect={() => handleEditUser(user)}
                          icon={<Edit2 size={14} />}
                        >
                          Edit
                        </ContextMenu.Item>
                        {currentUser?.id !== user.id && (
                          <ContextMenu.Item
                            onSelect={() => handleDeleteUser(user.id)}
                            variant="danger"
                            icon={<Trash2 size={14} />}
                          >
                            Delete
                          </ContextMenu.Item>
                        )}
                      </ContextMenu.Content>
                    </ContextMenu>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <UserModal
        isOpen={!!action}
        onClose={handleCloseModal}
        mode={action === "edit-user" ? "edit" : "create"}
        user={selectedUser}
      />
    </div>
  )
}
