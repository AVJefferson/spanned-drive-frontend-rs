import { useNavigate, useParams } from "react-router-dom";

import { AgreementLayout } from "../agreement-layout";

const privacyNotices: Record<string, any> = import.meta.glob("./privacy-*.tsx", {
  eager: true,
});

const versions = Object.keys(privacyNotices)
  .map((key) => {
    const match = key.match(/\.\/privacy-(.*)\.tsx/);
    return match ? match[1] : null;
  })
  .filter((value) => value !== null) as string[];

const sortedVersions = [...versions].sort((a, b) => {
  if (a === "current") return -1;
  if (b === "current") return 1;
  return b.localeCompare(a);
});

export function PrivacyPage() {
  const navigate = useNavigate();
  const { date } = useParams();
  const currentDateParam = date || "";
  const currentVersion = versions.includes(date || "") ? (date as string) : "current";

  return (
    <AgreementLayout
      title="Privacy Policy"
      currentVersion={currentVersion}
      currentDateParam={currentDateParam}
      sortedVersions={sortedVersions}
      onVersionChange={(version) =>
        navigate(version === "current" ? "/privacy" : `/privacy/${version}`)
      }
      missingMessage={`The requested version (${currentDateParam}) was not found. Displaying the current Privacy Policy instead.`}
      alternateLink={{ to: "/terms", label: "View Terms of Service" }}
    >
      {`./privacy-${currentVersion}.tsx` in privacyNotices
        ? privacyNotices[`./privacy-${currentVersion}.tsx`].default()
        : privacyNotices["./privacy-current.tsx"].default()}
    </AgreementLayout>
  );
}
