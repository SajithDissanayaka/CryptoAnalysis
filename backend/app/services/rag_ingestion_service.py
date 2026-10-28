
import re
from io import BytesIO

from pypdf import PdfReader
from app.repositories.rag_repository import save_chunks


MAX_FILE_BYTES = 5 * 1024 * 1024
MAX_PAGES = 30
MAX_TEXT_CHARS = 40000
MAX_CHUNKS = 50

CHUNK_SIZE = 900
CHUNK_OVERLAP = 150


# 1. Clean extracted text
def clean_text(raw_text: str) -> str:

    cleaned = raw_text.replace("\x00", " ")

    cleaned = re.sub(r"\s+", " ", cleaned)

    return cleaned.strip()


# 2. Divide text into overlapping chunks
def split_into_chunks(
    content: str,
    chunk_size: int = CHUNK_SIZE,
    overlap: int = CHUNK_OVERLAP,
) -> list[str]:

    if chunk_size <= 0:
        raise ValueError("chunk_size must be positive")

    if not 0 <= overlap < chunk_size:
        raise ValueError("Invalid chunk overlap")

    content = clean_text(content)

    if not content:
        return []

    chunks = []
    start = 0

    while start < len(content):

        end = min(
            start + chunk_size,
            len(content),
        )

        chunk = content[start:end].strip()

        if chunk:
            chunks.append(chunk)

        if end == len(content):
            break

        start = end - overlap

    return chunks


# 3. Extract text from PDF/TXT
def extract_document_text(
    filename: str,
    file_bytes: bytes,
) -> str:

    extension = filename.lower().rsplit(".", 1)[-1]

    if extension == "txt":

        try:
            raw_text = file_bytes.decode("utf-8-sig")
        except UnicodeDecodeError:
            raise ValueError(
                "TXT file must use UTF-8 encoding."
            )

    elif extension == "pdf":

        try:
            reader = PdfReader(BytesIO(file_bytes))

            if reader.is_encrypted:
                raise ValueError(
                    "Encrypted PDFs are not supported."
                )

            if len(reader.pages) > MAX_PAGES:
                raise ValueError(
                    f"Maximum {MAX_PAGES} PDF pages allowed."
                )

            page_texts = []

            for page in reader.pages:
                page_texts.append(
                    page.extract_text() or ""
                )

            raw_text = "\n".join(page_texts)

        except ValueError:
            raise

        except Exception:
            raise ValueError(
                "Unable to extract text from PDF."
            )

    else:
        raise ValueError(
            "Only PDF and TXT files are supported."
        )

    content = clean_text(raw_text)

    if not content:
        raise ValueError(
            "No extractable text found in document."
        )

    if len(content) > MAX_TEXT_CHARS:
        raise ValueError(
            "Document text exceeds the allowed length."
        )

    return content


def ingest_document(title: str, source: str, content: str, owner_id: int) -> dict:
    title, source, content = title.strip(), source.strip(), clean_text(content)
    if not title or not content:
        raise ValueError("Document title and content are required.")
    if len(title) > 255 or len(source) > 500:
        raise ValueError("Document metadata is too long.")
    if len(content) > MAX_TEXT_CHARS:
        raise ValueError("Document text exceeds 40,000 characters.")
    chunks = split_into_chunks(content)
    if not chunks or len(chunks) > MAX_CHUNKS:
        raise ValueError("Document exceeds the 50 chunk limit.")
    return save_chunks(title, source, content, chunks, owner_id)
