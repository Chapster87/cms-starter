"use client"

import { useState, useEffect, use } from "react"
import Link from "next/link"
import s from "./style.module.css"
import { useAuth } from "@/hooks/use-auth"
import FieldList from "./_components/field-list"

interface ModelPageProps {
  params: Promise<{
    model: string | undefined
  }>
}

/**
 * Renders the schema management page for a specific model.
 */
export default function ModelSchemaPage({ params }: ModelPageProps) {
  const { model } = use(params)
  const { accessToken, loading: authLoading } = useAuth()
  const [modelData, setModelData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadModel = async () => {
      if (authLoading || !model) return
      setLoading(true)
      try {
        const headers: Record<string, string> = {}
        if (accessToken) {
          headers["Authorization"] = `Bearer ${accessToken}`
        }

        const response = await fetch(`/api/models`, { headers })
        if (!response.ok) throw new Error("Failed to fetch models")
        const allModels = await response.json()

        const data = allModels.find(
          (m: any) => m.slug === model || m.table_name === model
        )
        if (!data) throw new Error("Model not found")

        setModelData(data)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    loadModel()
  }, [model, accessToken, authLoading])

  if (loading || authLoading) return <p>Loading schema...</p>
  if (error) return <p>Error: {error}</p>

  return (
    <div className={s.container}>
      <div className={s.header}>
        <div className={s.titleGroup}>
          <Link href="/schema" className={s.backLink}>
            ← Back to models
          </Link>
          <h1>
            {modelData.friendly_name}{" "}
            <span className={s.tableName}>({modelData.table_name})</span>
          </h1>
        </div>
        <Link href={`/schema/${model}/edit`}>
          <button className={s.settingsButton}>Model Settings</button>
        </Link>
      </div>

      <FieldList modelId={modelData.id} />
    </div>
  )
}
