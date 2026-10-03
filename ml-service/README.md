# MarineAegis Python ML service

This private FastAPI service trains and serves the specialized GhostTrace, AgentWatch, EdgeArmor and ROCShield models. The Node backend remains the only browser-facing API and owns authentication, RBAC, audit logs, MongoDB metadata and vessel deployment state.

## Run with Docker

Set the same random secret (minimum 32 characters) in the backend `ML_SERVICE_KEY` and the ML container. Then:

```powershell
docker build -t marineaegis-ml ./ml-service
docker run --rm -p 8000:8000 -e ML_SERVICE_KEY="replace-with-a-long-random-secret" -v marineaegis-ml-artifacts:/service/artifacts marineaegis-ml
```

Configure the backend with `ML_SERVICE_URL=http://127.0.0.1:8000`. Do not expose port 8000 publicly in production; allow only backend-to-ML traffic.

## Local Python environment

```powershell
py -m venv ml-service/.venv
ml-service/.venv/Scripts/python -m pip install -r ml-service/requirements.txt
$env:ML_SERVICE_KEY="replace-with-a-long-random-secret"
ml-service/.venv/Scripts/python -m uvicorn app.main:app --app-dir ml-service --port 8000
```

Artifacts are intentionally ignored by Git. Dataset and artifact hashes, evaluation metrics, model cards and deployment versions are stored by the Node backend in MongoDB.
