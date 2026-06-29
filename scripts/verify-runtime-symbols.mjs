import { readFileSync } from "node:fs";

const checks = [
  {
    file: "src/app/pages/HistoryPage.tsx",
    symbol: "TEMPLATES",
    importFrom: "../domain",
  },
  {
    file: "src/app/pages/SendMessagePage.tsx",
    symbol: "FileText",
    importFrom: "lucide-react",
  },
];

const failures = checks.flatMap(({ file, symbol, importFrom }) => {
  const source = readFileSync(file, "utf8");
  const used = new RegExp(`\\b${symbol}\\b`).test(source);
  const imported = new RegExp(
    `import\\s*\\{[^}]*\\b${symbol}\\b[^}]*\\}\\s*from\\s*['"]${importFrom.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}['"]`
  ).test(source);

  return used && !imported ? [`${file}: ${symbol} is used but not imported from ${importFrom}`] : [];
});

if (failures.length > 0) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log("runtime symbol imports verified");
