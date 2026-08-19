// Promoted to the shared UI layer so every table (admin / recruiter / company)
// uses the same toolbar. Re-exported here to keep the admin call sites stable.
export {
  ListToolbar,
  type FilterOption,
} from "@/shared/ui-components/data/ListToolbar";
