"""Custom Django password validators for PhishAware.

Enforces the same rules surfaced in the frontend requirements UI:
  - at least 8 characters
  - at least one uppercase AND one lowercase letter
  - at least one digit
  - at least one special character
"""

import re

from django.core.exceptions import ValidationError
from django.utils.translation import gettext_lazy as _


SPECIAL_CHAR_PATTERN = re.compile(r"[^A-Za-z0-9]")


class ComplexityValidator:
    """Require upper/lowercase letters, a digit, and a special character."""

    def validate(self, password, user=None):
        errors = []
        if not re.search(r"[A-Z]", password) or not re.search(r"[a-z]", password):
            errors.append(_("Password must contain both uppercase and lowercase letters."))
        if not re.search(r"\d", password):
            errors.append(_("Password must contain at least one number."))
        if not SPECIAL_CHAR_PATTERN.search(password):
            errors.append(_("Password must contain at least one special character."))

        if errors:
            raise ValidationError(errors, code="password_not_complex")

    def get_help_text(self):
        return _(
            "Your password must contain upper and lowercase letters, at least one "
            "number, and at least one special character."
        )
