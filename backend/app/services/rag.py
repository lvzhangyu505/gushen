from __future__ import annotations

from app.schemas.analysis import Document, EvidenceItem
from app.tasks.task_store import list_documents, search_document_chunks, search_documents


def retrieve_evidence(query: str, stock_code: str | None = None, limit: int = 3) -> list[EvidenceItem]:
    documents: list[Document] = search_documents(query, stock_code)[:limit]
    if not documents:
        document_by_id = {document.id: document for document in list_documents(stock_code)}
        chunks = search_document_chunks(query, stock_code, limit)
        documents = [document_by_id[chunk.document_id] for chunk in chunks if chunk.document_id in document_by_id]
    return [
        EvidenceItem(
            title=document.title,
            source_type=document.source_type,
            source_name=document.source_name,
            evidence_level=document.evidence_level,
            summary=document.summary or document.content[:160],
            relevance=f"命中查询：{query}",
            published_at=document.published_at,
            url=document.url,
        )
        for document in documents
    ]
