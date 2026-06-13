"use client"

import { useAuth } from "@/hooks/use-auth"
import { createClient } from "@/utils/supabase"
import { useRouter } from "next/navigation"
import Avatar from "@/components/avatar"
import Text from "@components/typography/text"
import ContextMenu from "@/components/context-menu"
import s from "./style.module.css"

/**
 * Renders an avatar indicating the current user's authentication status.
 */
export default function AuthStatus() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const supabase = createClient()

  const handleGoogleSignIn = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
  }

  if (loading) {
    return <div className={s.loadingPulse} />
  }

  return (
    <div className={s.container}>
      <ContextMenu>
        <ContextMenu.Trigger className={s.menuTrigger}>
          <div className={s.avatarContainer}>
            <div style={{ position: "relative" }}>
              <Avatar
                src={user?.user_metadata.avatar_url}
                alt={user?.email || "User"}
                fallback={
                  user?.user_metadata.full_name ||
                  user?.user_metadata.name ||
                  user?.email ||
                  "?"
                }
                bordered
              />
              <div
                className={`${s.statusDot} ${user ? s.online : s.offline}`}
              />
            </div>

            <div className={s.userInfo}>
              <Text className={s.userName}>
                {user ? user.user_metadata.name : "Guest"}
              </Text>
              <Text className={s.userEmail}>
                {user ? user.email : "Logged Out"}
              </Text>
            </div>
          </div>
        </ContextMenu.Trigger>

        <ContextMenu.Content>
          {user ? (
            <ContextMenu.Item
              onSelect={async () => {
                await supabase.auth.signOut()
                router.push("/auth")
              }}
            >
              Sign Out
            </ContextMenu.Item>
          ) : (
            <ContextMenu.Item onSelect={handleGoogleSignIn}>
              Sign In
            </ContextMenu.Item>
          )}
        </ContextMenu.Content>
      </ContextMenu>
    </div>
  )
}
