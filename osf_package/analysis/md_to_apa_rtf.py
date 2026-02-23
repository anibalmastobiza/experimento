#!/usr/bin/env python3
import re
import sys
from pathlib import Path


def esc_rtf(text: str) -> str:
    text = text.replace("\\", r"\\").replace("{", r"\{").replace("}", r"\}")
    text = text.replace("\t", "    ")
    return text


def strip_md_inline(text: str) -> str:
    text = re.sub(r"\*\*(.*?)\*\*", r"\1", text)
    text = re.sub(r"\*(.*?)\*", r"\1", text)
    text = re.sub(r"`(.*?)`", r"\1", text)
    return text


def line_to_para(line: str) -> str:
    raw = line.rstrip("\n")
    if not raw.strip():
        return r"\pard\ql\sl480\slmult1\f0\fs24\par"

    if raw.startswith("# "):
        txt = esc_rtf(strip_md_inline(raw[2:].strip()))
        return rf"\pard\qc\sl480\slmult1\f0\fs24\b {txt}\b0\par"

    if raw.startswith("## "):
        txt = esc_rtf(strip_md_inline(raw[3:].strip()))
        return rf"\pard\qc\sl480\slmult1\f0\fs24\b {txt}\b0\par"

    if raw.startswith("### "):
        txt = esc_rtf(strip_md_inline(raw[4:].strip()))
        return rf"\pard\ql\sl480\slmult1\f0\fs24\b {txt}\b0\par"

    txt = esc_rtf(strip_md_inline(raw))
    return rf"\pard\ql\sl480\slmult1\f0\fs24 {txt}\par"


def md_to_rtf(md_path: Path, rtf_path: Path) -> None:
    lines = md_path.read_text(encoding="utf-8").splitlines()

    # APA-like base layout: Letter paper, 1-inch margins, Times New Roman 12, double spacing.
    out = [
        r"{\rtf1\ansi\ansicpg1252\deff0",
        r"{\fonttbl{\f0 Times New Roman;}}",
        r"\paperw12240\paperh15840\margl1440\margr1440\margt1440\margb1440",
        r"\viewkind4\uc1",
    ]

    for i, line in enumerate(lines):
        if line.strip() == "## Abstract":
            out.append(r"\page")
        out.append(line_to_para(line))

    out.append("}")
    rtf_path.write_text("\n".join(out), encoding="utf-8")


def main() -> None:
    if len(sys.argv) != 3:
        print("Usage: md_to_apa_rtf.py <input.md> <output.rtf>", file=sys.stderr)
        sys.exit(1)
    md_path = Path(sys.argv[1])
    rtf_path = Path(sys.argv[2])
    md_to_rtf(md_path, rtf_path)
    print(f"Wrote {rtf_path}")


if __name__ == "__main__":
    main()
