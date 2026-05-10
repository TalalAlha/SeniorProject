"""CSV-injection helpers.

Spreadsheet apps (Excel, LibreOffice, Google Sheets) interpret a cell whose
first character is `=`, `+`, `-`, `@`, TAB, or CR as a formula. If user-
controlled data lands in an exported CSV that an admin later opens, those
formulas execute. `csv_safe` neutralises the prefix without changing the
visible value materially (Excel hides the leading apostrophe).
"""

_DANGEROUS_PREFIXES = ('=', '+', '-', '@', '\t', '\r')


def csv_safe(value):
    """Return a string safe to write into a CSV cell."""
    if value is None:
        return ''
    s = str(value)
    if s and s[0] in _DANGEROUS_PREFIXES:
        return "'" + s
    return s


def csv_safe_row(values):
    """Return a list of CSV-safe strings for `csv.writer.writerow`."""
    return [csv_safe(v) for v in values]
