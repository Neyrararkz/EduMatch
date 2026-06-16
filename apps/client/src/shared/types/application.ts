export type ApplicationStatus = "pending" | "accepted" | "rejected";

export type ProjectApplication = {
  id: string;
  project_id: string;
  applicant_id: string;
  status: ApplicationStatus;
  message: string | null;
  created_at: string;
  updated_at: string;

  project_title?: string;
  project_creator_id?: string;
  applicant_full_name?: string;
  applicant_email?: string;
  applicant_avatar_url?: string | null;
};