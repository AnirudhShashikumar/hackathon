"""Vercel serverless entrypoint when the project root is the outer repo."""

import sys
from pathlib import Path

APP_ROOT = Path(__file__).resolve().parents[1] / "mediFit-main"
if str(APP_ROOT) not in sys.path:
    sys.path.insert(0, str(APP_ROOT))

from main import app  # noqa: E402
