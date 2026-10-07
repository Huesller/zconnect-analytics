import { useEffect, useMemo, useState } from "react";
import {
  buildCleanupCandidates,
  buildDuplicateCompanyGroups
} from "./engine/quality-engine.js";

function useAdminQuality(events) {
  const [selectedCleanupKeys, setSelectedCleanupKeys] = useState([]);

  const cleanupCandidates = useMemo(
    () => buildCleanupCandidates(events),
    [events]
  );

  const duplicateCompanyGroups = useMemo(
    () => buildDuplicateCompanyGroups(events),
    [events]
  );

  useEffect(() => {
    const availableKeys = cleanupCandidates.map(
      (item) => item.companyKey || "__empty__"
    );

    setSelectedCleanupKeys((current) => {
      const retained = current.filter((key) => availableKeys.includes(key));
      return retained.length ? retained : availableKeys;
    });
  }, [cleanupCandidates]);

  return {
    cleanupCandidates,
    duplicateCompanyGroups,
    selectedCleanupKeys,
    setSelectedCleanupKeys
  };
}

export {
  useAdminQuality
};
