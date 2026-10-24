export interface RuntimeBookPublicationCell {
  readonly label: "Kindle eBook" | "KDP Select" | "Paperback" | "Hardcover";
  readonly value: string;
  readonly state: string;
}

export interface RuntimeBookProjectCatalog {
  readonly projectId: string;
  readonly relationshipLabel: string;
  readonly sectionLabel: string;
  readonly titles: readonly string[];
  readonly publication: readonly RuntimeBookPublicationCell[];
}

const UNKNOWN_PUBLICATION: readonly RuntimeBookPublicationCell[] = Object.freeze([
  Object.freeze({ label: "Kindle eBook", value: "N/A", state: "Verified state unavailable" }),
  Object.freeze({ label: "KDP Select", value: "N/A", state: "Verified state unavailable" }),
  Object.freeze({ label: "Paperback", value: "N/A", state: "Verified state unavailable" }),
  Object.freeze({ label: "Hardcover", value: "N/A", state: "Verified state unavailable" })
]);

function single(projectId: string, title: string, relationshipLabel = "INDIVIDUAL BOOK", publication: readonly RuntimeBookPublicationCell[] = UNKNOWN_PUBLICATION): RuntimeBookProjectCatalog {
  return Object.freeze({ projectId, relationshipLabel, sectionLabel: "BOOK", titles: Object.freeze([title]), publication });
}

const CATALOG: readonly RuntimeBookProjectCatalog[] = Object.freeze([
  Object.freeze({
    projectId: "kdp-missing-hour",
    relationshipLabel: "SCIENCE FICTION SERIES",
    sectionLabel: "BOOKS IN SERIES",
    titles: Object.freeze(["The Unlived Hour", "The Dead Between Minutes", "The House Outside Time", "What the Town Forgot", "The Hour That Remains"]),
    publication: Object.freeze([
      Object.freeze({ label: "Kindle eBook", value: "4 / 5", state: "Verified current state" }),
      Object.freeze({ label: "KDP Select", value: "4 / 5", state: "Verified current state" }),
      Object.freeze({ label: "Paperback", value: "2 / 5", state: "Verified current state" }),
      Object.freeze({ label: "Hardcover", value: "2 / 5", state: "Verified current state" })
    ])
  }),
  Object.freeze({
    projectId: "kdp-glasswing-pier",
    relationshipLabel: "TRILOGY",
    sectionLabel: "BOOKS IN SERIES",
    titles: Object.freeze(["The Ferris Wheel Between Us", "Kiss Me in the Haunted House", "The Summer We Don’t Leave"]),
    publication: UNKNOWN_PUBLICATION
  }),
  Object.freeze({
    projectId: "kdp-unfired-world",
    relationshipLabel: "FANTASY TRILOGY",
    sectionLabel: "BOOKS IN SERIES",
    titles: Object.freeze(["The Empire Beneath the Glaze", "The Shards Between Kingdoms", "The Earth After Firing"]),
    publication: UNKNOWN_PUBLICATION
  }),
  Object.freeze({
    projectId: "kdp-melted-cosmos",
    relationshipLabel: "COLORING COLLECTION",
    sectionLabel: "BOOKS IN COLLECTION",
    titles: Object.freeze(["Melted Cosmos: Strange Worlds", "Dreambeast Atlas", "Rooms Beyond Geometry", "Fungal Realms", "Neon Dreadscapes", "Electric Eden", "Cities That Dream", "Cathedral of Impossible Things", "Celestial Oddities", "Mechanical Dreams"]),
    publication: Object.freeze([
      Object.freeze({ label: "Kindle eBook", value: "N/A", state: "Print-focused collection" }),
      Object.freeze({ label: "KDP Select", value: "N/A", state: "Print-focused collection" }),
      Object.freeze({ label: "Paperback", value: "1 / 10", state: "Book 1 verified published" }),
      Object.freeze({ label: "Hardcover", value: "N/A", state: "Verified state unavailable" })
    ])
  }),
  Object.freeze({
    projectId: "kdp-drowned-crown",
    relationshipLabel: "TRILOGY",
    sectionLabel: "BOOKS IN SERIES",
    titles: Object.freeze(["The Map Beneath the Tide", "The Kingdom Under Black Water", "The Crown of the Drowned"]),
    publication: UNKNOWN_PUBLICATION
  }),
  single("kdp-daily-progress-planner", "Daily Progress Planner"),
  single("kdp-a-stronger-you", "A Stronger You"),
  single("kdp-simple-budgeting-workbook", "Simple Budgeting Workbook"),
  single("kdp-take-control-of-your-money", "Take Control of Your Money"),
  single("kdp-garage-door-business-blueprint", "Garage Door Business Blueprint"),
  single("kdp-repeat-button", "Repeat Button", "COOKBOOK", Object.freeze([
    Object.freeze({ label: "Kindle eBook", value: "N/A", state: "Print-only project" }),
    Object.freeze({ label: "KDP Select", value: "N/A", state: "Print-only project" }),
    Object.freeze({ label: "Paperback", value: "1 / 1", state: "Verified published" }),
    Object.freeze({ label: "Hardcover", value: "1 / 1", state: "Verified published" })
  ])),
  single("kdp-pieces-i-never-got-back", "Pieces I Never Got Back"),
  single("kdp-a-calmer-mind", "A Calmer Mind"),
  single("kdp-broken-but-still-here", "Broken But Still Here"),
  single("kdp-moving-forward-anyway", "Moving Forward Anyway"),
  single("kdp-alpha-mindset", "The Alpha Mindset")
]);

const BY_PROJECT_ID = new Map(CATALOG.map((entry) => [entry.projectId, entry] as const));

export function runtimeBookCatalogForProject(projectId: string): RuntimeBookProjectCatalog | undefined {
  return BY_PROJECT_ID.get(projectId);
}

export function listRuntimeBookCatalog(): readonly RuntimeBookProjectCatalog[] {
  return CATALOG;
}
