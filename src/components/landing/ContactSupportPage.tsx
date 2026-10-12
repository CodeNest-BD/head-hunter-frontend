import { Mail } from "lucide-react";

import { Card, CardContent } from "@/shared/ui-components/controls/card";
import { Tile } from "@/shared/ui-components/list/Tile";
import { PublicPageHeader } from "./PublicPageHeader";
import { PublicShell } from "./PublicShell";

const SUPPORT_EMAIL = "info@head-hunters.com";

export function ContactSupportPage() {
  return (
    <PublicShell>
      <PublicPageHeader title="Contact Customer Support" />

      <div className="mx-auto max-w-[1200px] px-6 pb-14">
        <Card className="max-w-[820px]">
          <CardContent className="flex gap-4">
            <Tile icon={Mail} tone="blue" />
            <p className="text-block leading-[1.7] text-ink-body">
              For billing or platform issues, to raise a dispute, or for all
              other questions or inquiries, please email:{" "}
              <a
                href={`mailto:${SUPPORT_EMAIL}`}
                className="font-semibold text-blue-ink underline-offset-2 hover:underline"
              >
                {SUPPORT_EMAIL}
              </a>
            </p>
          </CardContent>
        </Card>
      </div>
    </PublicShell>
  );
}
