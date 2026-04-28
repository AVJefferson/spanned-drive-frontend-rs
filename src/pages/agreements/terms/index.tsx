import { useNavigate, useParams } from "react-router-dom";

import { AgreementLayout } from "../agreement-layout";

const termNotices: Record<string, any> = import.meta.glob("./terms-*.tsx", {
  eager: true,
});

const versions = Object.keys(termNotices)
  .map((key) => {
    const match = key.match(/\.\/terms-(.*)\.tsx/);
    return match ? match[1] : null;
  })
  .filter((value) => value !== null) as string[];

const sortedVersions = [...versions].sort((a, b) => {
  if (a === "current") return -1;
  if (b === "current") return 1;
  return b.localeCompare(a);
});

export function TermsPage() {
  const navigate = useNavigate();
  const { date } = useParams();
  const currentDateParam = date || "";
  const currentVersion = versions.includes(date || "") ? (date as string) : "current";

  return (
    <AgreementLayout
      title="Terms of Service"
      currentVersion={currentVersion}
      currentDateParam={currentDateParam}
      sortedVersions={sortedVersions}
      onVersionChange={(version) =>
        navigate(version === "current" ? "/terms" : `/terms/${version}`)
      }
      missingMessage={`The requested version (${currentDateParam}) was not found. Displaying the current Terms of Service instead.`}
      alternateLink={{ to: "/privacy", label: "View Privacy Policy" }}
    >
      {`./terms-${currentVersion}.tsx` in termNotices
        ? termNotices[`./terms-${currentVersion}.tsx`].default()
        : termNotices["./terms-current.tsx"].default()}
    </AgreementLayout>
  );
}
