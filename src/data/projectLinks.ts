export type ProjectLinkId = "source" | "license";

export interface ProjectLinkDefinition {
  id: ProjectLinkId;
  label: string;
  href: string;
  ariaLabel: string;
}

const sourceRepositoryUrl = "https://github.com/toyo1621/StruJam8";

export const projectLinks: ProjectLinkDefinition[] = [
  {
    id: "source",
    label: "Source",
    href: sourceRepositoryUrl,
    ariaLabel: "Open StruJam8 source repository",
  },
  {
    id: "license",
    label: "License",
    href: sourceRepositoryUrl + "/blob/main/LICENSE",
    ariaLabel: "Open StruJam8 license",
  },
];

export function getProjectLink(id: ProjectLinkId) {
  const link = projectLinks.find((projectLink) => projectLink.id === id);

  if (!link) {
    throw new Error("Project link not found: " + id);
  }

  return link;
}
