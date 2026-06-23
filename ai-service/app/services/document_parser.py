from io import BytesIO


def extract_document_text(filename: str, content: bytes) -> str:
    extension = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""

    if extension == "pdf":
        return _extract_pdf(content)

    if extension in {"doc", "docx"}:
        return _extract_docx(content)

    return content.decode("utf-8", errors="ignore")


def _extract_pdf(content: bytes) -> str:
    try:
        import fitz

        doc = fitz.open(stream=content, filetype="pdf")
        text = "\n".join(page.get_text() for page in doc)
        doc.close()

        return text.strip()
    except Exception:
        return ""


def _extract_docx(content: bytes) -> str:
    try:
        from zipfile import ZipFile

        with ZipFile(BytesIO(content)) as archive:
            xml = archive.read("word/document.xml").decode("utf-8", errors="ignore")

        text = xml.replace("<", " <")
        import re

        return re.sub(r"\s+", " ", text).strip()
    except Exception:
        return ""
