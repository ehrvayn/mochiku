import { File, Paths } from "expo-file-system";
import { getCategory } from "../constants/categories";
import type { Item, ItemField } from "../types/item";

const MISSING_VALUE = "—";

const REBUILD_HINT =
  "Export needs a rebuilt app. Rebuild the development client (npx expo run:android or run:ios), then try again.";

function loadImageManipulator() {
  try {
    return require("expo-image-manipulator") as typeof import("expo-image-manipulator");
  } catch {
    throw new Error(REBUILD_HINT);
  }
}

function loadPrint() {
  try {
    return require("expo-print") as typeof import("expo-print");
  } catch {
    throw new Error(REBUILD_HINT);
  }
}

function loadSharing() {
  try {
    return require("expo-sharing") as typeof import("expo-sharing");
  } catch {
    throw new Error(REBUILD_HINT);
  }
}

const formatLabel = (key: string) =>
  key.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const formatDeadline = (deadlineAt: string | null) =>
  deadlineAt ? new Date(deadlineAt).toDateString() : "No deadline";

const itemTitle = (item: Item) => item.title?.trim() || "Untitled";

const itemCategory = (item: Item) => getCategory(item.category).label;

const fieldValue = (field: ItemField) => field.value?.trim() || MISSING_VALUE;

export type ItemPresentation = {
  title: string;
  category: string;
  deadline: string;
  imageUri: string | null;
  fields: Array<{ label: string; value: string }>;
};

export function buildItemPresentation(
  item: Item,
  fields: ItemField[],
): ItemPresentation {
  return {
    title: itemTitle(item),
    category: itemCategory(item),
    deadline: formatDeadline(item.deadline_at),
    imageUri: item.local_image_uri || null,
    fields: fields.map((field) => ({
      label: formatLabel(field.key),
      value: fieldValue(field),
    })),
  };
}

/** Plain-text summary used by share/export and available for other surfaces. */
export function buildItemSummary(item: Item, fields: ItemField[]): string {
  const presentation = buildItemPresentation(item, fields);

  return [
    `Title: ${presentation.title}`,
    `Category: ${presentation.category}`,
    `Deadline: ${presentation.deadline}`,
    ...presentation.fields.map(({ label, value }) => `${label}: ${value}`),
  ].join("\n");
}

export async function normalizeImageOrientation(uri: string) {
  const { manipulateAsync, SaveFormat } = loadImageManipulator();
  return manipulateAsync(uri, [{ rotate: 0 }], {
    base64: true,
    compress: 0.9,
    format: SaveFormat.JPEG,
  });
}

function buildExportHtml(
  item: Item,
  fields: ItemField[],
  photoBase64: string | null,
) {
  const presentation = buildItemPresentation(item, fields);
  const title = escapeHtml(presentation.title);
  const category = escapeHtml(presentation.category);
  const deadline = escapeHtml(presentation.deadline);

  const rows = presentation.fields
    .map(
      (field) => `
        <tr>
          <td class="label">${escapeHtml(field.label)}</td>
          <td class="value">${escapeHtml(field.value)}</td>
        </tr>`,
    )
    .join("");

  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <style>
      @page { margin: 28px; }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        background: #fff8ec;
        color: #2b2438;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      }
      .sheet { padding: 8px; }
      @media screen {
        body { background: #e9e4da; padding: 14px; }
        .sheet {
          background: #fff8ec;
          border-radius: 18px;
          box-shadow: 0 8px 28px rgba(43, 36, 56, 0.16);
          margin: 0 auto;
          max-width: 612px;
          padding: 24px;
        }
      }
      @media print {
        body { background: #fff8ec; }
        .sheet { padding: 8px; }
      }
      .brand {
        color: #c2531a;
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 2px;
        text-transform: uppercase;
        margin-bottom: 14px;
      }
      .photo {
        display: block;
        width: 100%;
        max-height: 360px;
        object-fit: contain;
        background: #ffffff;
        border: 1px solid #f0e4cf;
        border-radius: 18px;
        margin-bottom: 22px;
      }
      h1 {
        font-size: 28px;
        line-height: 1.2;
        margin: 0 0 12px;
        font-weight: 800;
      }
      .meta {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 8px;
        margin-bottom: 24px;
      }
      .pill {
        background: #fff;
        border: 1px solid #f0e4cf;
        border-radius: 999px;
        color: #2b2438;
        font-size: 12px;
        font-weight: 700;
        padding: 5px 12px;
      }
      .deadline {
        color: #6b647a;
        font-size: 12px;
        font-weight: 600;
      }
      .card {
        background: #ffffff;
        border: 1px solid #f0e4cf;
        border-radius: 20px;
        padding: 18px 20px 6px;
      }
      h2 {
        font-size: 15px;
        margin: 0 0 10px;
        font-weight: 800;
      }
      table { width: 100%; border-collapse: collapse; }
      tr { border-top: 1px solid #f5eddf; }
      tr:first-child { border-top: 0; }
      td { padding: 10px 0; vertical-align: top; font-size: 13px; }
      .label {
        width: 36%;
        color: #6b647a;
        font-weight: 700;
        padding-right: 14px;
      }
      .value { color: #2b2438; font-weight: 500; }
      .footer {
        color: #a39db0;
        font-size: 10px;
        margin-top: 22px;
        text-align: center;
      }
    </style>
  </head>
  <body>
    <div class="sheet">
      <div class="brand">Mochiku</div>
      ${
        photoBase64
          ? `<img class="photo" src="data:image/jpeg;base64,${photoBase64}" alt="" />`
          : ""
      }
      <h1>${title}</h1>
      <div class="meta">
        <span class="pill">${category}</span>
        <span class="deadline">Due: ${deadline}</span>
      </div>
      <div class="card">
        <h2>Details</h2>
        <table>${rows}</table>
      </div>
      <div class="footer">Shared from Mochiku</div>
    </div>
  </body>
</html>`;
}

function safeFileName(value: string) {
  return (
    value
      .trim()
      .replace(/[<>:"/\\|?*\u0000-\u001f]/g, "")
      .replace(/\s+/g, "-")
      .slice(0, 60) || "mochiku-item"
  );
}

export type PreparedItemExport = {
  title: string;
  html: string;
};

/**
 * Builds the exact HTML document that becomes the PDF. The preview screen
 * renders this HTML and the export step prints the same string, so what the
 * user sees is what gets exported.
 */
export async function prepareItemExport(
  item: Item,
  fields: ItemField[],
): Promise<PreparedItemExport> {
  let photoBase64: string | null = null;
  if (item.local_image_uri) {
    try {
      const normalized = await normalizeImageOrientation(item.local_image_uri);
      photoBase64 = normalized.base64 ?? null;
    } catch {
      // The text summary is still useful if the photo cannot be processed.
    }
  }

  return {
    title: itemTitle(item),
    html: buildExportHtml(item, fields, photoBase64),
  };
}

/** Prints and shares an already-prepared document. */
export async function exportPreparedItem(
  prepared: PreparedItemExport,
): Promise<void> {
  const Sharing = loadSharing();
  if (!(await Sharing.isAvailableAsync())) {
    throw new Error("Sharing isn't available on this device.");
  }

  const Print = loadPrint();
  const pdf = await Print.printToFileAsync({
    html: prepared.html,
    width: 612,
    height: 792,
  });

  const pdfFile = new File(pdf.uri);
  const namedPdf = new File(
    Paths.cache,
    `${safeFileName(prepared.title)}.pdf`,
  );
  let shareUri = pdf.uri;
  try {
    if (namedPdf.exists) namedPdf.delete();
    await pdfFile.copy(namedPdf);
    shareUri = namedPdf.uri;
  } catch {
  }

  await Sharing.shareAsync(shareUri, {
    UTI: "com.adobe.pdf",
    dialogTitle: `Share ${prepared.title}`,
    mimeType: "application/pdf",
  });
}

export async function shareItem(
  item: Item,
  fields: ItemField[],
): Promise<void> {
  await exportPreparedItem(await prepareItemExport(item, fields));
}
