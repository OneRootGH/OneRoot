"""Read-only exception detection; resolving an alert never changes source money."""
import hashlib
import json


def exception_item(kind, identity, title, amount, day, officer, area, reason, href, evidence):
    key = hashlib.sha256(f"{kind}|{identity}".encode()).hexdigest()[:32]
    fingerprint = hashlib.sha256(json.dumps(evidence, sort_keys=True, default=str).encode()).hexdigest()
    return dict(key=key, fingerprint=fingerprint, kind=kind, title=title, amount=round(amount, 2),
                date=str(day or ""), officer=officer or "Not recorded", area=area or "Not recorded",
                reason=reason, href=href)


def apply_reviews(items, reviews):
    by_key = {r.id.removeprefix("review-"): r.payload or {} for r in reviews}
    for item in items:
        saved = by_key.get(item["key"], {})
        current = saved if saved.get("fingerprint") == item["fingerprint"] else {}
        item.update(status=current.get("status", "Open"), assignee=current.get("assignee", ""),
                    note=current.get("note", ""), previousReview=saved if saved and not current else None)
    return sorted(items, key=lambda x: (x["status"] == "Resolved", -abs(x["amount"]), x["date"], x["key"]))
