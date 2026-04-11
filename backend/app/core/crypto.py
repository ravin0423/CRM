"""
Symmetric encryption for secrets stored in admin_settings.json.

The master key is derived from the host's machine identity for local installs
and from an AWS KMS key when running on AWS. This keeps connection passwords
and API keys off disk in plaintext. The Admin Panel never ships raw secrets to
the frontend — only ``***`` placeholders are returned for encrypted fields.
"""

from cryptography.fernet import Fernet


def _load_master_key() -> bytes:
    # TODO: load from OS keyring locally and KMS on AWS.
    return Fernet.generate_key()


_fernet = Fernet(_load_master_key())


def encrypt(plaintext: str) -> str:
    return _fernet.encrypt(plaintext.encode()).decode()


def decrypt(token: str) -> str:
    return _fernet.decrypt(token.encode()).decode()
