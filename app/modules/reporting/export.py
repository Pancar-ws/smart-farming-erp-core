# modules/reporting/export.py
from io import BytesIO
from openpyxl import Workbook
from openpyxl.styles import Font
from fastapi.responses import StreamingResponse
from app.core.fmt import fmt_date

def to_xlsx(title: str, headers: list[str], rows: list[list]) -> StreamingResponse:
    wb = Workbook()
    ws = wb.active
    ws.title = title[:31]
    ws.append(headers)
    for c in ws[1]:
        c.font = Font(bold=True)
    for r in rows:
        ws.append([fmt_date(v) if hasattr(v, "isoformat") else v for v in r])
    for col in ws.columns:
        ws.column_dimensions[col[0].column_letter].width = 18
    buf = BytesIO()
    wb.save(buf)
    buf.seek(0)
    return StreamingResponse(
        buf,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f'attachment; filename="{title}.xlsx"'},
    )

