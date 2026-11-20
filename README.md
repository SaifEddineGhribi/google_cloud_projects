# Parallel PDF Search — Google Cloud learning project

A small Flask app that makes the multi-agent pattern visible: it extracts text from a PDF, divides its pages across parallel **retrieval workers**, and gives their page-cited notes to a **coordinator** for the final answer.

It uses Vertex AI with **Application Default Credentials (ADC)**—no API key—so it fits the organization policy shown in your Cloud Console.

## Architecture

```text
PDF upload → text extraction → N parallel worker calls → coordinator call → browser answer
                           each worker gets different pages      + evidence panel
```

This is orchestration in one local process, rather than managed Agent Platform deployments. It is intentionally the smallest useful learning project: you can observe every prompt, worker boundary, and cost-driving model call in `app.py`.

## Set up

Prerequisites: Python 3.10+ and the [Google Cloud CLI](https://cloud.google.com/sdk/docs/install).

```bash
gcloud auth application-default login
gcloud config set project project-e119a764-2d12-4570-8f5
gcloud services enable aiplatform.googleapis.com

python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
python app.py
```

Open http://127.0.0.1:8080. Upload a text-based PDF, enter a question, and choose 2–10 workers. The app assigns each worker a contiguous, near-equal page range. It accepts PDFs up to 32 MiB and never persists an uploaded document; it uses a temporary directory per request.

Your signed-in user needs a Vertex AI role that permits model use (for learning, `roles/aiplatform.user` is commonly appropriate). If the default model is unavailable in your selected project/region, set `GEMINI_MODEL` in `.env` to a Flash/Flash-Lite model displayed in Model Garden.

## Cost and behavior

`gemini-3.5-flash-lite` is the configurable low-cost default. More workers speed up a large-document search but add one model request each; one extra coordinator request always runs. Keep `MAX_WORKERS` low while learning, and use your Cloud budget alert.

The worker and coordinator prompts explicitly treat PDF text and worker notes as untrusted data. This demo does not OCR scanned PDFs, authenticate users, or store a history—add those before any production deployment.

## Good next experiments

1. Replace page splitting with embeddings/retrieval, so only relevant chunks reach a model.
2. Add structured JSON worker output and citation validation.
3. Move the Flask service to Cloud Run, then add Cloud Storage and Identity-Aware Proxy.
