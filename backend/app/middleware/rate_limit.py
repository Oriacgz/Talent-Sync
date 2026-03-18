# WHO WRITES THIS: Backend developer
# WHAT THIS DOES: Rate limiter instance using slowapi.
#                 Import limiter in routes to add @limiter.limit("5/minute")
# DEPENDS ON: slowapi

from slowapi import Limiter
from slowapi.util import get_remote_address
limiter = Limiter(key_func=get_remote_address)