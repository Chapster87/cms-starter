"use client"

import { useAuth } from "@/hooks/use-auth"
import { supabase } from "@/utils/supabaseClient"
import { useRouter } from "next/navigation"
import * as Avatar from "@radix-ui/react-avatar"
import Text from "@components/typography/text"
import ContextMenu from "@/components/context-menu"
import s from "./style.module.css"

/**
 * Renders an avatar indicating the current user's authentication status.
 */
export default function AuthStatus() {
  const router = useRouter()
  const { user, loading } = useAuth()

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
            <Avatar.Root className={s.avatarRoot}>
              {user ? (
                <>
                  <Avatar.Image
                    className={s.avatarImage}
                    src={user.user_metadata.avatar_url}
                    alt={user.email || "User"}
                  />
                  <Avatar.Fallback className={s.avatarFallback} delayMs={600}>
                    {user.user_metadata.avatar_url.name
                      ?.charAt(0)
                      .toUpperCase() || "U"}
                  </Avatar.Fallback>
                  <div className={`${s.statusDot} ${s.online}`} />
                </>
              ) : (
                <Avatar.Fallback
                  className={`${s.avatarFallback} ${s.loggedOut}`}
                >
                  ?
                  <div className={`${s.statusDot} ${s.offline}`} />
                </Avatar.Fallback>
              )}
            </Avatar.Root>

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
