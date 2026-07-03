from __future__ import annotations

from datetime import date

from apscheduler.schedulers.background import BackgroundScheduler

from app.core.config import settings
from app.tasks.task_store import build_daily_report, build_weekly_review_report


scheduler = BackgroundScheduler(timezone="Asia/Shanghai")


def generate_daily_report_job() -> None:
    build_daily_report(date.today().isoformat())


def generate_weekly_review_job() -> None:
    build_weekly_review_report()


def start_scheduler() -> None:
    if not settings.scheduler_enabled or scheduler.running:
        return
    scheduler.add_job(generate_daily_report_job, "cron", hour=7, minute=30, id="daily_report", replace_existing=True)
    scheduler.add_job(generate_weekly_review_job, "cron", day_of_week="fri", hour=18, minute=0, id="weekly_review", replace_existing=True)
    scheduler.start()


def stop_scheduler() -> None:
    if scheduler.running:
        scheduler.shutdown(wait=False)

