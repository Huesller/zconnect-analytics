function countBy(items, keyFn, weightFn = () => 1) {
  const map = new Map();
  items.forEach((item) => {
    const key = String(keyFn(item) || "").trim();
    if (!key) return;
    map.set(key, (map.get(key) || 0) + safeNumber(weightFn(item) || 1));
  });
  return [...map.entries()].sort((a, b) => b[1] - a[1]);
}

export {
  countBy
};
