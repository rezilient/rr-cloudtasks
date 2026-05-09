#!/usr/bin/env node
/* eslint-disable no-console */
// One-time helper: sets the Status field on each issue in GitHub Project #1
// based on its issue number. Run from repo root with `node scripts/set-project-status.js`.
//
// Uses temp files for GraphQL queries to avoid Windows shell quoting issues.

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const PROJECT_ID = "PVT_kwHOAFB2U84BXNZI";
const STATUS_FIELD_ID = "PVTSSF_lAHOAFB2U84BXNZIzhSb2nM";
const OPT = { todo: "f75ad846", inProgress: "47fc9ee4", done: "98236657" };

const STATUS_BY_ISSUE = {
  ...Object.fromEntries(
    [14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26].map((n) => [n, OPT.todo])
  ),
  27: OPT.inProgress,
  28: OPT.done,
  29: OPT.done,
  30: OPT.done,
};

const TMP_DIR = path.join(__dirname, ".tmp");
fs.mkdirSync(TMP_DIR, { recursive: true });

function ghGraphql(query) {
  const file = path.join(TMP_DIR, `q-${Date.now()}-${Math.random().toString(36).slice(2)}.graphql`);
  fs.writeFileSync(file, query);
  try {
    return execSync(`gh api graphql -F query=@"${file}"`, { encoding: "utf8" });
  } finally {
    fs.unlinkSync(file);
  }
}

const data = JSON.parse(
  ghGraphql(`
{
  user(login: "rezilient") {
    projectV2(number: 1) {
      items(first: 50) {
        nodes { id content { ... on Issue { number } } }
      }
    }
  }
}
`)
);

const itemByIssue = {};
for (const node of data.data.user.projectV2.items.nodes) {
  if (node.content && node.content.number) itemByIssue[node.content.number] = node.id;
}

for (const [num, optId] of Object.entries(STATUS_BY_ISSUE)) {
  const itemId = itemByIssue[num];
  if (!itemId) {
    console.log(`Issue #${num}: not found in project`);
    continue;
  }
  const label =
    optId === OPT.todo ? "Todo" : optId === OPT.inProgress ? "In Progress" : "Done";
  try {
    ghGraphql(`
      mutation {
        updateProjectV2ItemFieldValue(input: {
          projectId: "${PROJECT_ID}"
          itemId: "${itemId}"
          fieldId: "${STATUS_FIELD_ID}"
          value: { singleSelectOptionId: "${optId}" }
        }) { projectV2Item { id } }
      }
    `);
    console.log(`Issue #${num} → ${label}`);
  } catch (err) {
    console.log(`Issue #${num} failed: ${err.message.split("\n")[0]}`);
  }
}

fs.rmSync(TMP_DIR, { recursive: true, force: true });
