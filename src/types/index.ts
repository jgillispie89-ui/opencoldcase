export type CaseStatus = 'unsolved' | 'cold' | 'active' | 'solved'

export interface ColdCase {
  id: string
  title: string
  description: string
  date_of_incident: string
  location_name: string
  lat: number
  lng: number
  state: string
  status: CaseStatus
  victim_name: string | null
  created_at: string
  updated_at: string
  created_by: string
  pin_color: string
}

export interface CaseDiscussion {
  id: string
  case_id: string
  user_id: string
  content: string
  created_at: string
  updated_at: string
  user: {
    display_name: string
    avatar_url: string | null
  }
}

export interface CaseEvidence {
  id: string
  case_id: string
  user_id: string
  title: string
  description: string
  source_url: string | null
  file_url: string | null
  created_at: string
}

export interface CaseTheory {
  id: string
  case_id: string
  user_id: string
  title: string
  content: string
  upvotes: number
  created_at: string
  updated_at: string
}

export interface PersonalNotebook {
  id: string
  case_id: string
  user_id: string
  content: string
  updated_at: string
}

export interface Profile {
  id: string
  display_name: string
  avatar_url: string | null
  bio: string | null
  created_at: string
}
