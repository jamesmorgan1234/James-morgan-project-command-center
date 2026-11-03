import type { RuntimeBookRecord, RuntimeProjectSnapshot } from "./snapshot.js";
import { runtimeBookCatalogForProject } from "../books/runtime-catalog.js";
const normal = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "").replace(/^meltedcosmos/, "");
export function projectArtwork(project: RuntimeProjectSnapshot, books: readonly RuntimeBookRecord[]): { url: string; size: string; position: string; subject: string } {
  const catalog = runtimeBookCatalogForProject(project.id);
  const cover = books.find(b => b.coverApproved && b.coverSlot !== undefined && b.coverSlot >= 0 && b.coverSlot < 41 && (catalog?.titles.some(t => normal(t) === normal(b.title)) || normal(project.name) === normal(b.title)));
  if (cover) return { url: "/assets/book-cover-atlas-v2.webp", size: "4100% 100%", position: `${cover.coverSlot! / 40 * 100}% center`, subject: cover.title };
  const text = `${project.name} ${project.mission.state === "known" ? project.mission.value : ""}`.toLowerCase();
  const subjects: readonly [RegExp, number, string][] = [
    [/garage|roof|plumb|renovat|hvac|home repair/, 4, "Home services"],
    [/coupon|shopping|grocery|savings/, 11, "Shopping & savings"],
    [/video|clip|movie|media|creator|podcast|film|documentary/, 2, "Video & media"],
    [/book|kdp|author|writing/, 14, "Books & writing"],
    [/finance|wealth|budget|money|payable|invoice|payment|credit|debt|revenue|royalt|tax|accounting/, 5, "Finance"],
    [/dns|domain|ssl|network|infrastructure|hosting/, 1, "Networks & infrastructure"],
    [/security|fraud|cyber|privacy|backup|recovery/, 9, "Security"],
    [/legal|contract|complian|verif|evidence|litigation|e-discovery/, 8, "Documents & verification"],
    [/hire|career|recruit|resume|job/, 12, "Careers"],
    [/commerce|store|product|retail|supplier|shopify|margin/, 3, "Commerce & products"],
    [/mail|social|communicat|inbox|support|call/, 6, "Communications"],
    [/lead|market|sales|seo|growth|competit|intelligence|monitor|search/, 7, "Marketing & intelligence"],
    [/logistic|shipping|delivery|warehouse|inventory/, 10, "Logistics"],
    [/brain|aro|command center|loopwren|ai|reason/, 13, "Intelligence"],
    [/automat|workflow|operation|process|business/, 15, "Operations & automation"]
  ];
  const named: readonly [RegExp, number, string][] = [
    [/fanvue|veyla/, 2, "Creator media"], [/margincraft/, 3, "Digital products"], [/edge finder/, 5, "Sports analysis"], [/torevi/, 12, "Careers"]
  ];
  const name = project.name.toLowerCase();
  const [, index, subject] = named.find(([pattern]) => pattern.test(name)) ?? subjects.find(([pattern]) => pattern.test(name)) ?? subjects.find(([pattern]) => pattern.test(text)) ?? [/./, 0, "Software & technology"];
  return { url: "/assets/project-business-atlas.png", size: "400% 400%", position: `${index % 4 / 3 * 100}% ${Math.floor(index / 4) / 3 * 100}%`, subject };
}
