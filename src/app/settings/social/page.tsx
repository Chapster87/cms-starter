"use client"

import React, { useState, useEffect } from "react"
import Button from "@/components/button"
import MediaField from "@/components/fields/media-field"
import TextField from "@/components/fields/text-field"
import SelectField from "@/components/fields/select-field"
import { useSocialSettings } from "@/hooks/use-social-settings"
import s from "../style.module.css"

/**
 * Page for managing global social media settings and Open Graph defaults.
 */
export default function SocialSettingsPage() {
  const { settings, loading, error, updateSettings } = useSocialSettings()
  const [formData, setFormData] = useState({
    socialSiteName: "",
    twitterHandle: "",
    twitterUrl: "",
    facebookUrl: "",
    instagramUrl: "",
    linkedinUrl: "",
    youtubeUrl: "",
    tiktokUrl: "",
    socialCard: null as string | null,
    ogType: "website",
    ogLocale: "en_US",
    twitterCardType: "summary_large_image" as "summary" | "summary_large_image",
  })

  useEffect(() => {
    if (settings) {
      const timer = setTimeout(() => {
        setFormData({
          socialSiteName: settings.socialSiteName || "",
          twitterHandle: settings.twitterHandle || "",
          twitterUrl: settings.twitterUrl || "",
          facebookUrl: settings.facebookUrl || "",
          instagramUrl: settings.instagramUrl || "",
          linkedinUrl: settings.linkedinUrl || "",
          youtubeUrl: settings.youtubeUrl || "",
          tiktokUrl: settings.tiktokUrl || "",
          socialCard: settings.socialCard || null,
          ogType: settings.ogType || "website",
          ogLocale: settings.ogLocale || "en_US",
          twitterCardType: settings.twitterCardType || "summary_large_image",
        })
      }, 0)
      return () => clearTimeout(timer)
    }
  }, [settings])

  const handleChange = (key: string, value: unknown) => {
    // If it's a change event from an input, extract the value immediately
    let finalValue = value
    if (value && typeof value === "object" && "target" in value) {
      finalValue = (value.target as HTMLInputElement).value
    }

    setFormData((prev) => ({ ...prev, [key]: finalValue }))
  }

  const handleSave = async () => {
    await updateSettings(formData)
  }

  if (loading && !settings) {
    return (
      <div className={s.container}>
        <header className={s.header}>
          <div className={s.titleGroup}>
            <h1 className={s.title}>Social Media Settings</h1>
            <p className={s.subtitle}>Loading settings...</p>
          </div>
        </header>
      </div>
    )
  }

  return (
    <div className={s.container}>
      <header className={s.header}>
        <div className={s.titleGroup}>
          <h1 className={s.title}>Social Media Settings</h1>
          <p className={s.subtitle}>
            Manage your social media profiles and Open Graph sharing defaults.
          </p>
        </div>
        <div style={{ display: "flex", gap: "12px" }}>
          <Button onClick={handleSave}>Save Changes</Button>
        </div>
      </header>

      {error && <p className={s.error}>{error}</p>}

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "32px",
          maxWidth: "800px",
        }}
      >
        <section
          style={{ display: "flex", flexDirection: "column", gap: "16px" }}
        >
          <h2
            style={{
              fontSize: "18px",
              fontWeight: 600,
              borderBottom: "1px solid var(--color-grey-200)",
              paddingBottom: "8px",
            }}
          >
            Social Profiles
          </h2>
          <TextField
            label="Social Site Name"
            value={formData.socialSiteName}
            onChange={(val) => handleChange("socialSiteName", val)}
            placeholder="e.g. My Company Name"
            fieldNote="Used as the og:site_name property."
          />
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "16px",
            }}
          >
            <TextField
              label="Twitter Handle"
              value={formData.twitterHandle}
              onChange={(val) => handleChange("twitterHandle", val)}
              placeholder="@username"
            />
            <TextField
              label="Twitter Profile URL"
              value={formData.twitterUrl}
              onChange={(val) => handleChange("twitterUrl", val)}
              placeholder="https://twitter.com/..."
            />
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "16px",
            }}
          >
            <TextField
              label="Facebook Profile URL"
              value={formData.facebookUrl}
              onChange={(val) => handleChange("facebookUrl", val)}
              placeholder="https://facebook.com/..."
            />
            <TextField
              label="Instagram Profile URL"
              value={formData.instagramUrl}
              onChange={(val) => handleChange("instagramUrl", val)}
              placeholder="https://instagram.com/..."
            />
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "16px",
            }}
          >
            <TextField
              label="LinkedIn Profile URL"
              value={formData.linkedinUrl}
              onChange={(val) => handleChange("linkedinUrl", val)}
              placeholder="https://linkedin.com/company/..."
            />
            <TextField
              label="TikTok Profile URL"
              value={formData.tiktokUrl}
              onChange={(val) => handleChange("tiktokUrl", val)}
              placeholder="https://tiktok.com/@..."
            />
          </div>
          <TextField
            label="YouTube Channel URL"
            value={formData.youtubeUrl}
            onChange={(val) => handleChange("youtubeUrl", val)}
            placeholder="https://youtube.com/c/..."
          />
        </section>

        <section
          style={{ display: "flex", flexDirection: "column", gap: "16px" }}
        >
          <h2
            style={{
              fontSize: "18px",
              fontWeight: 600,
              borderBottom: "1px solid var(--color-grey-200)",
              paddingBottom: "8px",
            }}
          >
            Sharing Defaults (Open Graph & Twitter)
          </h2>
          <MediaField
            label="Default Social Card"
            value={formData.socialCard || ""}
            onChange={(val) => {
              const asset = Array.isArray(val) ? val[0] : val
              handleChange("socialCard", asset ? asset.id : null)
            }}
            multiple={false}
            fieldNote="Fallback image used when sharing pages on social media."
          />
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "16px",
            }}
          >
            <SelectField
              label="OG Type"
              value={formData.ogType}
              onChange={(val) => handleChange("ogType", val)}
              options={[
                { label: "Website", value: "website" },
                { label: "Article", value: "article" },
                { label: "Profile", value: "profile" },
              ]}
            />
            <TextField
              label="OG Locale"
              value={formData.ogLocale}
              onChange={(val) => handleChange("ogLocale", val)}
              placeholder="en_US"
            />
          </div>
          <SelectField
            label="Twitter Card Type"
            value={formData.twitterCardType}
            onChange={(val) => handleChange("twitterCardType", val)}
            options={[
              { label: "Summary", value: "summary" },
              { label: "Summary Large Image", value: "summary_large_image" },
            ]}
          />
        </section>
      </div>
    </div>
  )
}
