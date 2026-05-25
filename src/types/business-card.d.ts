interface BusinessCardActionUrls {
  linkedin_url: string
  github_url: string
  email: string
  resume_url: string
}

export interface BusinessCardData {
  image: string
  name: string
  title: string
  action_urls: BusinessCardActionUrls
}
