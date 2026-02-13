"""
PDF loading and text splitting (from qabot worker).
"""
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter


def document_loader(file_path: str):
    loader = PyPDFLoader(file_path)
    return loader.load()


def text_splitter(documents, chunk_size: int = 1000, chunk_overlap: int = 200):
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
        length_function=len,
    )
    return splitter.split_documents(documents)
