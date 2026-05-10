"""
Accounts serializers.
Provides serializers for user registration, JWT authentication, profile display,
password change, and profile updates. Part of the 'accounts' app.
"""
from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

# Resolve the active User model at import time (accounts.User in this project)
User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    """Read-only user profile serializer returned after login and on profile GET requests."""

    # Computed field backed by the User.get_full_name() method
    full_name = serializers.CharField(source='get_full_name', read_only=True)
    # Traverses the company FK to expose the human-readable company name
    company_name = serializers.CharField(source='company.name', read_only=True, allow_null=True)

    class Meta:
        model = User
        fields = [
            'id', 'email', 'first_name', 'last_name', 'full_name', 'phone_number',
            'role', 'company', 'company_name', 'preferred_language',
            'is_active', 'is_verified', 'date_joined', 'last_login'
        ]
        # These fields are managed by the system and must never be writable
        # via the API. Including role/company/is_active/is_verified here is
        # belt-and-braces — the view currently uses UserUpdateSerializer for
        # writes, but a future refactor that swaps in this serializer would
        # otherwise silently expose role escalation.
        read_only_fields = [
            'id', 'email', 'role', 'company', 'company_name',
            'is_active', 'is_verified', 'date_joined', 'last_login',
        ]


class UserRegistrationSerializer(serializers.ModelSerializer):
    """Serializer for public user registration (PUBLIC_USER only).

    Company admins register via /companies/register/.
    Employees are onboarded via invitation links.
    """

    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = User
        fields = [
            'email', 'password', 'password_confirm', 'first_name', 'last_name',
            'phone_number', 'preferred_language'
        ]

    def validate_email(self, value):
        """Canonicalise to lowercase before downstream uniqueness checks."""
        return value.strip().lower()

    def validate(self, attrs):
        """Validate that passwords match if password_confirm is provided."""
        password_confirm = attrs.get('password_confirm')
        # password_confirm is optional (allow clients that omit it), but when
        # present it must match; raises a field-level error so the UI can highlight it
        if password_confirm and attrs['password'] != password_confirm:
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        return attrs

    def create(self, validated_data):
        """Create and return a new PUBLIC_USER with a hashed password."""
        # Remove the confirmation field before passing data to the manager
        validated_data.pop('password_confirm', None)
        # Extract password separately so it can be hashed by create_user()
        password = validated_data.pop('password')

        user = User.objects.create_user(
            password=password,
            role='PUBLIC_USER',   # self-registration always produces a PUBLIC_USER
            **validated_data
        )

        return user


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """JWT token serializer that embeds user claims and enforces email verification."""

    @classmethod
    def get_token(cls, user):
        """Return a JWT access token augmented with platform-specific claims."""
        token = super().get_token(user)

        # Embed identity claims so the frontend can display user info without
        # an extra /profile/ round-trip immediately after login
        token['email'] = user.email
        token['role'] = user.role
        token['full_name'] = user.get_full_name()
        # company_id is None for PUBLIC_USER and SUPER_ADMIN accounts
        token['company_id'] = user.company.id if user.company else None

        return token

    def validate(self, attrs):
        """Validate credentials, check email verification, and return tokens with user data."""
        # Delegates to SimpleJWT for credential validation; sets self.user on success
        data = super().validate(attrs)

        # Block login for users who have not verified their email.
        # Staff/superusers bypass this check (e.g. Django admin, superadmin CLI users).
        if not self.user.is_verified and not self.user.is_staff:
            raise serializers.ValidationError({
                'detail': (
                    'Please verify your email before logging in. '
                    'Check your inbox for the verification link.'
                ),
                # Sentinel flag lets the frontend show a targeted "resend" UI
                'email_not_verified': True,
            })

        # Attach the full user profile to the login response so the frontend
        # can bootstrap its state without an extra API call
        data['user'] = UserSerializer(self.user).data
        return data


class ChangePasswordSerializer(serializers.Serializer):
    """Serializer that validates and processes a password change request."""

    # write_only ensures the raw passwords never appear in serialized output
    old_password = serializers.CharField(required=True, write_only=True)
    # validate_password runs Django's AUTH_PASSWORD_VALIDATORS against the value
    new_password = serializers.CharField(required=True, write_only=True, validators=[validate_password])
    # Optional: the SPA already enforces matching passwords client-side, but
    # if a client sends this we still verify the values match.
    new_password_confirm = serializers.CharField(required=False, write_only=True)

    def validate(self, attrs):
        """Ensure new_password and new_password_confirm are identical when both are sent."""
        confirm = attrs.get('new_password_confirm')
        if confirm is not None and attrs['new_password'] != confirm:
            raise serializers.ValidationError({"new_password": "Password fields didn't match."})
        return attrs

    def validate_old_password(self, value):
        """Reject the request early if the supplied current password is wrong."""
        # The request is injected into context by the view so we can access the user here
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError("Old password is incorrect.")
        return value


class UserUpdateSerializer(serializers.ModelSerializer):
    """Serializer for partial updates to a user's own profile (name, phone, language)."""

    class Meta:
        model = User
        # Only expose fields the user is allowed to change about themselves
        fields = [
            'first_name', 'last_name', 'phone_number', 'preferred_language'
        ]
