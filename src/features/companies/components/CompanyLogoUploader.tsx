"use client";

import { CompanyLogo } from "@/shared/ui-components/data/CompanyLogo";
import { ImageUploader } from "@/shared/ui-components/media/ImageUploader";
import type { CompanyProfile } from "../schemas";
import {
  useRemoveCompanyLogo,
  useUploadCompanyLogo,
} from "../hooks/useCompanyProfile";

/**
 * The company's logo control on the profile page. A thin wrapper over the shared
 * {@link ImageUploader} so it behaves identically to the recruiter photo control
 * — the caller threads it into the Identity section so a logo sits beside the
 * name it represents.
 */
export function CompanyLogoUploader({ profile }: { profile: CompanyProfile }) {
  const upload = useUploadCompanyLogo();
  const remove = useRemoveCompanyLogo();

  return (
    <ImageUploader
      label="logo"
      hasImage={profile.hasLogo}
      helpText="PNG, JPG, or WebP · up to 2 MB · square works best."
      isBusy={upload.isPending || remove.isPending}
      upload={(file) => upload.mutateAsync(file)}
      onRemove={() => remove.mutate()}
      renderPreview={(version) => (
        <CompanyLogo
          companyProfileId={profile.id}
          hasLogo={profile.hasLogo}
          name={profile.companyName}
          size="xl"
          version={version}
        />
      )}
    />
  );
}
