"use client";

import { useAuth } from "@/features/auth";
import { RecruiterPhoto } from "@/shared/ui-components/data/RecruiterPhoto";
import { ImageUploader } from "@/shared/ui-components/media/ImageUploader";
import type { RecruiterProfile } from "../schemas";
import {
  useRemoveRecruiterPhoto,
  useUploadRecruiterPhoto,
} from "../hooks/useRecruiterProfile";

/**
 * The recruiter's profile-photo control. A thin wrapper over the shared
 * {@link ImageUploader} — identical behaviour to the company logo control
 * (pick → crop/rotate → immediate upload).
 */
export function RecruiterPhotoUploader({
  profile,
}: {
  profile: RecruiterProfile;
}) {
  const { user } = useAuth();
  const name =
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") || "";
  const upload = useUploadRecruiterPhoto();
  const remove = useRemoveRecruiterPhoto();

  return (
    <ImageUploader
      label="photo"
      hasImage={profile.hasPhoto}
      helpText="PNG, JPG, or WebP · up to 2 MB · a clear headshot works best."
      isBusy={upload.isPending || remove.isPending}
      upload={(file) => upload.mutateAsync(file)}
      onRemove={() => remove.mutate()}
      renderPreview={(version) => (
        <RecruiterPhoto
          recruiterProfileId={profile.id}
          hasPhoto={profile.hasPhoto}
          name={name}
          size="xl"
          version={version}
        />
      )}
    />
  );
}
