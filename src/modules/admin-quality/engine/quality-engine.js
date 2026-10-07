import { normalizeCompany } from "../../../shared/normalization.js";
import {
  companyKey,
  cleanupReason,
  duplicateCompanyKey
} from "../../../shared/company-utils.js";
function buildCleanupCandidates(events) {
  const map = new Map();
  events.forEach((event) => {
    const rawName = String(event.companyRaw ?? event.companyName ?? "").trim();
    const name = normalizeCompany(rawName);
    const reason = cleanupReason(rawName);
    if (!reason) return;
    const key = companyKey(rawName);
    const mapKey = key || "__empty__";
    if (!map.has(mapKey)) map.set(mapKey, { companyKey: key, companyName: name, reason, eventCount: 0, firstAt: "", lastAt: "" });
    const item = map.get(mapKey);
    item.eventCount++;
    if (!item.firstAt || new Date(event.timestamp) < new Date(item.firstAt)) item.firstAt = event.timestamp;
    if (!item.lastAt || new Date(event.timestamp) > new Date(item.lastAt)) item.lastAt = event.timestamp;
  });
  return [...map.values()].sort((a, b) => b.eventCount - a.eventCount);
}

function buildDuplicateCompanyGroups(events) {
  const names = new Map();
  events.forEach((event) => {
    const name = normalizeCompany(event.companyName);
    if (cleanupReason(name)) return;
    if (!names.has(name)) names.set(name, 0);
    names.set(name, names.get(name) + 1);
  });
  const groups = new Map();
  names.forEach((count, name) => {
    const key = duplicateCompanyKey(name);
    if (!key) return;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push({ name, count, companyKey: companyKey(name) });
  });
  return [...groups.entries()].map(([key, variants]) => {
    const sortedVariants = variants.sort((a, b) => b.count - a.count);
    return {
      key,
      variants: sortedVariants,
      targetName: sortedVariants[0]?.name || ""
    };
  }).filter((group) => group.variants.length > 1);
}


export {
  buildCleanupCandidates,
  buildDuplicateCompanyGroups
};
