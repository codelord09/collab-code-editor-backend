import random
from schemas.common import AutocompleteResponse

async def get_mock_suggestion(context: str) -> AutocompleteResponse:
    # Very simple mock logic: return a dummy snippet
    suggestions = [
        "print('Hello World')",
        "def mock_function():\n    pass",
        "import os\nimport sys",
        "return True",
    ]
    return AutocompleteResponse(suggestion=random.choice(suggestions))
