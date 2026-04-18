
from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters.character import RecursiveCharacterTextSplitter
from sentence_transformers import SentenceTransformer
from dotenv import load_dotenv
import boto3
import faiss
import numpy as np
import re
import os
import traceback

# ---------- LOAD ENV ----------
load_dotenv()

AWS_REGION = os.environ.get("AWS_DEFAULT_REGION", "us-east-1")

# ---------- BEDROCK CLIENT ----------
# Better: let boto3 auto-pick env creds
bedrock = boto3.client(
    "bedrock-runtime",
    region_name=AWS_REGION
)

# ---------- OPTIONAL URL LOADER ----------
try:
    from langchain_community.document_loaders.url import UnstructuredURLLoader
except ImportError:
    UnstructuredURLLoader = None

# ---------- FASTAPI ----------
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # simplify for debugging
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------- API ----------
@app.post("/")
async def Work(
    query_gen: str = Form(...),
    urls: str = Form(None),
    num_k: int = Form(3),
    files: list[UploadFile] = File(None),
    chunk_size: int = Form(1000),
    chunk_overlap: int = Form(200),
):
    try:
        print("🔥 Request received")

        all_text = []

        # ---------- URL LOADING ----------
        if urls:
            if UnstructuredURLLoader is None:
                return {"error": "Install 'unstructured'"}

            url_list = [u.strip() for u in re.split(r"[\n,;]+", urls) if u.strip()]

            for url in url_list:
                print("Loading URL:", url)
                loader = UnstructuredURLLoader(urls=[url])
                docs = loader.load()
                for doc in docs:
                    all_text.append(doc.page_content)

        # ---------- PDF LOADING ----------
        if files:
            os.makedirs("files", exist_ok=True)

            for file in files:
                print("Processing file:", file.filename)

                if file.content_type != "application/pdf":
                    return {"error": f"{file.filename} not PDF"}

                file_path = f"files/{file.filename}"

                with open(file_path, "wb") as f:
                    f.write(await file.read())

                loader = PyPDFLoader(file_path)
                docs = loader.load()

                for doc in docs:
                    all_text.append(doc.page_content)

        if not all_text:
            return {"error": "No text extracted"}

        # ---------- CHUNKING ----------
        splitter = RecursiveCharacterTextSplitter(
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap,
        )

        full_text = "\n".join(all_text)
        chunks = splitter.split_text(full_text)

        print("Chunks created:", len(chunks))

        if not chunks:
            return {"error": "Chunking failed"}

        # ---------- EMBEDDINGS ----------
        embed_model = SentenceTransformer("all-MiniLM-L6-v2")
        embeddings = embed_model.encode(chunks).astype(np.float32)

        # ---------- FAISS ----------
        index = faiss.IndexFlatL2(embeddings.shape[1])
        index.add(embeddings)

        query_embedding = embed_model.encode([query_gen]).astype(np.float32)

        k = max(3, int(num_k))
        distances, indices = index.search(query_embedding, k=k)

        if len(indices[0]) == 0:
            return {"error": "No matches found"}

        top_chunks = [chunks[i] for i in indices[0] if i < len(chunks)]
        context = "\n\n".join(top_chunks)

        if not context.strip():
            return {"error": "No relevant context found"}

        # ---------- PROMPT ----------
        prompt = f"""
You are a helpful assistant.

Answer ONLY from the provided context.
If the answer is not in the context, say "I don't know".

Context:
{context}

Question:
{query_gen}

Answer:
"""

        print("📡 Calling Bedrock...")

        # ---------- CLAUDE ----------
        response = bedrock.converse(
           modelId="meta.llama3-8b-instruct-v1:0",
            messages=[
                {
                    "role": "user",
                    "content": [{"text": prompt}]
                }
            ],
            inferenceConfig={
                "maxTokens": 300,
                "temperature": 0.5
            }
        )

        answer = response["output"]["message"]["content"][0]["text"]

        print("✅ Response received")

        return {
            "status": "ok",
            "response": answer,
            "chunks_used": len(top_chunks),
        }

    except Exception as e:
        error_trace = traceback.format_exc()
        print("❌ FULL ERROR:\n", error_trace)

        return {
            "status": "error",
            "message": str(e),
            "trace": error_trace
        }

