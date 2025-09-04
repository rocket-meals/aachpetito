import fs from "fs";
import fetch from "node-fetch";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import path from "path";

interface Issue {
  key: string;
  message: string;
  component: string;
  line?: number;
}

const argv = yargs(hideBin(process.argv))
    .scriptName("sonar-report")
    .usage("$0 [args]")
    .option("token", {
      alias: "t",
      type: "string",
      demandOption: true,
      describe: "SonarCloud API token",
    })
    .option("project", {
      alias: "p",
      type: "string",
      demandOption: true,
      describe: "SonarCloud project key",
    })
    .option("type", {
      alias: "k",
      type: "string",
      choices: ["BUG", "CODE_SMELL", "VULNERABILITY"],
      default: "BUG",
      describe: "Issue type to download",
    })
    .option("output", {
      alias: "o",
      type: "string",
      default: "./reports/report.csv",
      describe: "Output file name",
    })
    .help()
    .alias("h", "help").argv as any;

async function fetchAllIssues(
    token: string,
    project: string,
    type: string
): Promise<Issue[]> {
  let page = 1;
  const pageSize = 500;
  let issues: Issue[] = [];
  let total = 0;

  do {
    const url = `https://sonarcloud.io/api/issues/search?componentKeys=${encodeURIComponent(
        project
    )}&types=${type}&p=${page}&ps=${pageSize}`;
    const res = await fetch(url, {
      headers: {
        Authorization: `Basic ${Buffer.from(token + ":").toString("base64")}`,
      },
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch: ${res.status} ${res.statusText}`);
    }

    const data = await res.json();
    total = data.paging.total;

    const batch: Issue[] = data.issues.map((i: any) => ({
      key: i.key,
      message: i.message,
      component: i.component,
      line: i.line,
    }));

    issues = issues.concat(batch);
    page++;
  } while (issues.length < total);

  return issues;
}

async function main() {
  const { token, project, type, output } = argv;

  console.log(`Fetching ${type} issues for project ${project}...`);
  const issues = await fetchAllIssues(token, project, type);

  console.log(`Fetched ${issues.length} issues. Writing to ${output}...`);
  const header = "Key,Message,Component,Line\n";
  const rows = issues.map(
      (i) =>
          `"${i.key}","${i.message.replace(/"/g, '""')}","${i.component}",${
              i.line ?? ""
          }`
  );
  // make sure the directory exists
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, header + rows.join("\n"), "utf-8");

  console.log("Done ✅");
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
