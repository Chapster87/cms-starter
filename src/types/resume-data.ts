// src/types/resume-data.ts

export interface EmploymentPosition {
  title: string
  start_date: string
  end_date?: string
  notes: string[]
}

export interface Employment {
  employer: string
  location: string
  remote: boolean
  positions: EmploymentPosition[]
}

export interface ActionUrls {
  linkedin_url: string
  github_url: string
  email: string
  resume_url: string
}

export interface BusinessCard {
  name: string
  title: string
  image: string
  action_urls: ActionUrls
}

export interface AboutMe {
  subtitle: string
  summary: string
  longStory: string
}

export interface Education {
  school: string
  logo: string
  start_year: string
  end_year: string
  location: string
  degree: string
  concentration: string[]
}

export interface Certification {
  name: string
  issue_date: string
  logo: string
  logo_width: string
  url: string
}

export interface Skill {
  name: string
  logo: string
}

export interface HardSkill extends Skill {
  level: string
}

// Removed SoftSkill interface as it is equivalent to Skill

export interface Skills {
  hard_skills: HardSkill[]
  soft_skills: Skill[]
}

export interface ResumeData {
  businessCard: BusinessCard
  aboutMe: AboutMe
  employmentHistory: Employment[]
  education: Education
  certifications: Certification[]
  skills: Skills
}
