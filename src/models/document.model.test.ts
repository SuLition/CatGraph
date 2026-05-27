import { describe, expect, it } from "vitest";
import { kindFromExtension, kindFromFileName, titleFromFileName } from "./document.model";

describe("kindFromExtension", () => {
  it("maps known extensions to kinds", () => {
    expect(kindFromExtension("pdf")).toBe("pdf");
    expect(kindFromExtension("PDF")).toBe("pdf");
    expect(kindFromExtension("txt")).toBe("text");
    expect(kindFromExtension("md")).toBe("markdown");
    expect(kindFromExtension("markdown")).toBe("markdown");
    expect(kindFromExtension("docx")).toBe("docx");
    expect(kindFromExtension("xlsx")).toBe("xlsx");
  });

  it("returns null for unknown extensions", () => {
    expect(kindFromExtension("png")).toBeNull();
    expect(kindFromExtension("")).toBeNull();
  });
});

describe("kindFromFileName", () => {
  it("extracts and maps extension from filename", () => {
    expect(kindFromFileName("report.PDF")).toBe("pdf");
    expect(kindFromFileName("/path/to/notes.md")).toBe("markdown");
    expect(kindFromFileName("data.xlsx")).toBe("xlsx");
  });

  it("returns null when there is no extension", () => {
    expect(kindFromFileName("README")).toBeNull();
  });
});

describe("titleFromFileName", () => {
  it("strips extension and directory parts", () => {
    expect(titleFromFileName("/Users/me/Docs/report.pdf")).toBe("report");
    expect(titleFromFileName("C:\\Docs\\notes.md")).toBe("notes");
    expect(titleFromFileName("plain.txt")).toBe("plain");
    expect(titleFromFileName("no-ext")).toBe("no-ext");
  });
});
