"use client"

import React, { useState, useEffect } from "react"
import Button from "@/components/button"
import CheckboxField from "@/components/fields/checkbox-field"
import MediaField from "@/components/fields/media-field"
import TextAreaField from "@/components/fields/text-area-field"
import TextField from "@/components/fields/text-field"
import { useSiteSettings } from "@/hooks/use-site-settings"
import s from "../style.module.css"

/**
 * Page for managing global site settings and baseline SEO.
 */
export default function SiteSettingsPage() {
  const { settings, loading, error, updateSettings } = useSiteSettings()
  const [formData, setFormData] = useState({
    defaultPageTitle: "",
    titleSuffix: "",
    fallbackDescription: "",
    noIndex: false,
    socialSiteName: "",
    twitterHandle: "",
    twitterUrl: "",
    facebookUrl: "",
    instagramUrl: "",
    siteUrl: "",
    socialCard: null as string | null,
    favicon: null as string | null,
  })

  useEffect(() => {
    if (settings) {
      const timer = setTimeout(() => {
        setFormData((prev) => {
          // Only update if something actually changed to avoid cascading renders
          const next = {
            defaultPageTitle: settings.defaultPageTitle || "",
            titleSuffix: settings.titleSuffix || "",
            fallbackDescription: settings.fallbackDescription || "",
            noIndex: !!settings.noIndex,
            socialSiteName: settings.socialSiteName || "",
            twitterHandle: settings.twitterHandle || "",
            twitterUrl: settings.twitterUrl || "",
            facebookUrl: settings.facebookUrl || "",
            instagramUrl: settings.instagramUrl || "",
            siteUrl: settings.siteUrl || "",
            socialCard: settings.socialCard || null,
            favicon: settings.favicon || null,
          }

          if (JSON.stringify(prev) === JSON.stringify(next)) return prev
          return next
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
            <h1 className={s.title}>Site Settings</h1>
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
          <h1 className={s.title}>Site Settings</h1>
          <p className={s.subtitle}>
            Manage your baseline SEO and global site configurations.
          </p>
        </div>
        <Button onClick={handleSave}>Save Changes</Button>
      </header>

      {error && <p className={s.error}>{error}</p>}

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "24px",
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
            General & SEO
          </h2>
          <TextField
            label="Site URL"
            value={formData.siteUrl}
            onChange={(val) => handleChange("siteUrl", val)}
            placeholder="e.g. https://my-site.com"
            fieldNote="The base URL of your live website."
          />
          <TextField
            label="Default Page Title"
            value={formData.defaultPageTitle}
            onChange={(val) => handleChange("defaultPageTitle", val)}
            placeholder="e.g. My Awesome Site"
          />
          <TextField
            label="Title Suffix"
            value={formData.titleSuffix}
            onChange={(val) => handleChange("titleSuffix", val)}
            placeholder="e.g. | My Company"
          />
          <TextAreaField
            label="Fallback Description"
            value={formData.fallbackDescription}
            onChange={(val) => handleChange("fallbackDescription", val)}
            placeholder="Default meta description for pages that don't have one."
          />
          <CheckboxField
            label="No Index (Global)"
            checked={formData.noIndex}
            onChange={(val) => handleChange("noIndex", val)}
            description="Prevent search engines from indexing the entire site."
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
            Brand Assets
          </h2>
          <MediaField
            label="Favicon"
            value={formData.favicon || ""}
            onChange={(val) => {
              const asset = Array.isArray(val) ? val[0] : val
              handleChange("favicon", asset ? asset.id : null)
            }}
            multiple={false}
            fieldNote="Recommended size: 32x32px or 48x48px (PNG/ICO/SVG)."
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
            Social & Open Graph
          </h2>
          <TextField
            label="Social Site Name"
            value={formData.socialSiteName}
            onChange={(val) => handleChange("socialSiteName", val)}
            placeholder="e.g. My Company Name"
          />
          <TextField
            label="Twitter Handle"
            value={formData.twitterHandle}
            onChange={(val) => handleChange("twitterHandle", val)}
            placeholder="e.g. @mycompany"
          />
          <TextField
            label="Twitter Profile URL"
            value={formData.twitterUrl}
            onChange={(val) => handleChange("twitterUrl", val)}
            placeholder="e.g. https://twitter.com/mycompany"
          />
          <TextField
            label="Facebook Profile URL"
            value={formData.facebookUrl}
            onChange={(val) => handleChange("facebookUrl", val)}
            placeholder="e.g. https://facebook.com/mycompany"
          />
          <TextField
            label="Instagram Profile URL"
            value={formData.instagramUrl}
            onChange={(val) => handleChange("instagramUrl", val)}
            placeholder="e.g. https://instagram.com/mycompany"
          />
          <MediaField
            label="Default Social Card"
            value={formData.socialCard || ""}
            onChange={(val) => {
              const asset = Array.isArray(val) ? val[0] : val
              handleChange("socialCard", asset ? asset.id : null)
            }}
            multiple={false}
          />
        </section>
      </div>
    </div>
  )
}
