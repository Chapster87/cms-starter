export interface Project {
  id: string
  type: "work" | "freelance" | "honorable-mention"
  title?: string
  url?: string
  company?: string
  platform?: string
  startDate?: string
  endDate?: string
  images?: {
    hero?: {
      url: string
      alt?: string
      width: number
      height: number
    }
    thumb?: {
      url: string
      alt?: string
      width: number
      height: number
    }
  }
  shortDescription?: string
  longDescription?: string
}
