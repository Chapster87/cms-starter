"use client"

import * as Avatar from "@radix-ui/react-avatar"
import { useAuth } from "@/hooks/use-auth"
import s from "./style.module.css"

/**
 * Renders an avatar indicating the current user's authentication status.
 */
export default function AuthStatus() {
  const { user, loading } = useAuth()

  if (loading) {
    return <div className={s.loadingPulse} />
  }

  return (
    <div className={s.container}>
      <Avatar.Root className={s.avatarRoot}>
        {user ? (
          <>
            <Avatar.Image
              className={s.avatarImage}
              src={user.user_metadata.avatar_url}
              alt={user.email || "User"}
            />
            <Avatar.Fallback className={s.avatarFallback} delayMs={600}>
              {user.email?.charAt(0).toUpperCase() || "U"}
            </Avatar.Fallback>
            <div className={`${s.statusDot} ${s.online}`} />
          </>
        ) : (
          <Avatar.Fallback className={`${s.avatarFallback} ${s.loggedOut}`}>
            ?
            <div className={`${s.statusDot} ${s.offline}`} />
          </Avatar.Fallback>
        )}
      </Avatar.Root>
      <div className={s.userInfo}>
        <span className={s.userEmail}>{user ? user.email : "Logged Out"}</span>
      </div>
    </div>
  )
}
