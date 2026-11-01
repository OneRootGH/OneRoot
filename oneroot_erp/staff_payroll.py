"""Owner-approved monthly net-pay schedules; preparation never records payment."""
import calendar
import hashlib
from datetime import date, datetime

from sqlalchemy import select, text

from .models import AppSetting, ModuleRecord, User

ROSTER = [
    ("Daniel Agyei", 800, 200, 31, "2026-10"),
    ("Philip Boakye", 1500, 500, 31, "2026-10"),
    ("Faustina Nti Nyamekye Alexandra", 800, 100, 19, "2026-11"),
    ("Suzzy Agyemang", 1200, 200, 14, "2026-11"),
    ("Erica Asare", 300, 200, 31, "2026-10"),
]


def identity(value):
    return hashlib.sha256(value.encode()).hexdigest()[:32]


def configure_staff(db, actor, metadata, modules):
    profiles = db.scalars(select(ModuleRecord).where(ModuleRecord.module_key == "staff_onboarding_profiles")).all()
    users = db.scalars(select(User)).all()
    documents = db.scalars(select(ModuleRecord).where(ModuleRecord.module_key == "staff_documents")).all()
    selected = set()
    for name, base, allowance, payday, first_month in ROSTER:
        candidates = [r for r in profiles if (r.payload or {}).get("staffName", r.title).strip().casefold() == name.casefold()]
        candidates.sort(key=lambda r: r.updated_at or r.created_at, reverse=True)
        user = next((u for u in users if u.full_name.strip().casefold() == name.casefold()), None)
        profile = candidates[0] if candidates else ModuleRecord(id=identity("staff-profile|"+name), module_key="staff_onboarding_profiles")
        p = dict(profile.payload or {})
        p.update(staffName=name, monthlySalary=base+allowance, netBaseSalary=base,
                 monthlyAllowance=allowance, paydayDay=payday,
                 payday="Last day of each month" if payday == 31 else f"Day {payday} of each month",
                 payBasis="Fixed Monthly", payFrequency="Monthly", payrollStartMonth=first_month,
                 automaticPayslips=True, onboardingStatus="Ready for Signing",
                 supervisor=p.get("supervisor") or "Philip Boakye")
        p["staffRole"] = p.get("staffRole") or (user.staff_role if user else "") or "Support Staff"
        if name == "Philip Boakye":
            p["staffRole"] = "Owner & Business Manager"
        if user:
            p["systemUsername"] = user.username
        profile.payload=p; profile.title=name; profile.status="Active"
        profile.reference="staff-onboarding|"+profile.id
        db.add(profile); selected.add(profile.id)
        for index, (kind, title) in enumerate([
            ("Appointment Letter", "Appointment Letter"), ("Employment Contract", "Employment Contract"),
            ("Staff Policy", "Code of Conduct Acknowledgement"), ("Staff Policy", "Confidentiality Acknowledgement"),
            ("Other", "Payroll and Bank Details Form")]):
            key=identity(f"staff-pack-v2|{name}|{index}")
            document=db.get(ModuleRecord,key) or ModuleRecord(id=key,module_key="staff_documents")
            payload=dict(staffName=name,staffRole=p["staffRole"],documentTitle=title,documentType=kind,
                         issueDate=date.today().isoformat(),documentStatus="Active",onboardingProfileId=profile.id,reference="staff-document|"+key,
                         notes="Owner-confirmed pay schedule. Missing personal details require staff completion; unsigned until executed.")
            metadata(document,modules["staff_documents"],payload);db.add(document)
    for profile in profiles:
        if profile.id not in selected:
            profile.payload=dict(profile.payload or {},onboardingStatus="Inactive")
    for document in documents:
        if not any(document.id == identity(f"staff-pack-v2|{name}|{i}") for name,*_ in ROSTER for i in range(5)):
            p=dict(document.payload or {},documentStatus="Superseded",reference=document.reference or "staff-document|"+document.id)
            metadata(document,modules["staff_documents"],p)
    db.add(AppSetting(key="staff-payroll-schedule-enabled",value=dict(enabled=True,approvedBy=actor,approvedAt=datetime.utcnow().isoformat())))
    db.flush()


def prepare_monthly_payslips(db, today, metadata, modules, rollup):
    setting=db.get(AppSetting,"staff-payroll-schedule-enabled")
    if not setting or not setting.value.get("enabled"):
        return 0
    if db.bind.dialect.name == "postgresql":
        db.execute(text("SELECT pg_advisory_xact_lock(hashtext('oneroot-monthly-payroll'))"))
    profiles=db.scalars(select(ModuleRecord).where(ModuleRecord.module_key == "staff_onboarding_profiles")).all()
    existing=db.scalars(select(ModuleRecord).where(ModuleRecord.module_key == "salary_records")).all()
    count=0
    for profile in profiles:
        p=profile.payload or {}
        if not p.get("automaticPayslips") or p.get("onboardingStatus") == "Inactive":
            continue
        year,month=map(int,p["payrollStartMonth"].split("-"))
        while (year,month) <= (today.year,today.month):
            period=f"{year:04}-{month:02}"
            matches=[r for r in existing if (r.payload or {}).get("staffName",r.title).strip().casefold() == p["staffName"].casefold() and ((r.payload or {}).get("month") or r.month) == period]
            if not matches:
                last=calendar.monthrange(year,month)[1]
                due=date(year,month,min(int(p["paydayDay"]),last))
                data=dict(staffName=p["staffName"],staffRole=p["staffRole"],month=period,payBasis="Fixed Monthly",payFrequency="Monthly",
                          paymentDueDate=due.isoformat(),payPeriodStart=date(year,month,1).isoformat(),payPeriodEnd=date(year,month,last).isoformat(),
                          baseSalary=p["netBaseSalary"],allowance=p["monthlyAllowance"],amountPaid=0,
                          notes="Agreed net base plus allowance. No statutory gross-up or deductions inferred. Prepared, not proof of payment.",
                          onboardingProfileId=profile.id,reference="monthly-payroll|"+profile.id+"|"+period)
                rollup(data)
                record=ModuleRecord(id=identity("monthly-payroll|"+profile.id+"|"+period),module_key="salary_records")
                metadata(record,modules["salary_records"],data);db.add(record);existing.append(record);count+=1
            month+=1
            if month==13:year,month=year+1,1
    db.flush()
    return count
