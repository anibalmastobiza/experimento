import Foundation
import PDFKit

let args = CommandLine.arguments
if args.count < 3 {
    fputs("Usage: extract_pdf.swift <input.pdf> <output.txt>\n", stderr)
    exit(1)
}

let inPath = args[1]
let outPath = args[2]

guard let doc = PDFDocument(url: URL(fileURLWithPath: inPath)) else {
    fputs("Could not open PDF: \(inPath)\n", stderr)
    exit(2)
}

var chunks: [String] = []
let pageCount = doc.pageCount
for i in 0..<pageCount {
    if let page = doc.page(at: i), let txt = page.string {
        chunks.append("\\n\\n===== PAGE \(i + 1) / \(pageCount) =====\\n\\n" + txt)
    } else {
        chunks.append("\\n\\n===== PAGE \(i + 1) / \(pageCount) =====\\n\\n[No extractable text]")
    }
}

let full = chunks.joined(separator: "\\n")
try full.write(to: URL(fileURLWithPath: outPath), atomically: true, encoding: .utf8)
print("Wrote \(pageCount) pages to \(outPath)")
