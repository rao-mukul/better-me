"""Gemini tool definitions for all health data domains."""

from google.genai import types

TOOL_DEFINITIONS = [
    types.Tool(
        function_declarations=[
            types.FunctionDeclaration(
                name="get_sleep_logs",
                description="Fetch sleep log entries for a date range",
                parameters=types.Schema(
                    type=types.Type.OBJECT,
                    properties={
                        "start_date": types.Schema(
                            type=types.Type.STRING,
                            description="Start of date range in yyyy-MM-dd format",
                        ),
                        "end_date": types.Schema(
                            type=types.Type.STRING,
                            description="End of date range in yyyy-MM-dd format",
                        ),
                    },
                    required=["start_date", "end_date"],
                ),
            ),
            types.FunctionDeclaration(
                name="get_water_logs",
                description="Fetch daily water intake stats for a date range",
                parameters=types.Schema(
                    type=types.Type.OBJECT,
                    properties={
                        "start_date": types.Schema(
                            type=types.Type.STRING,
                            description="Start of date range in yyyy-MM-dd format",
                        ),
                        "end_date": types.Schema(
                            type=types.Type.STRING,
                            description="End of date range in yyyy-MM-dd format",
                        ),
                    },
                    required=["start_date", "end_date"],
                ),
            ),
            types.FunctionDeclaration(
                name="get_gym_logs",
                description="Fetch gym workout logs for a date range",
                parameters=types.Schema(
                    type=types.Type.OBJECT,
                    properties={
                        "start_date": types.Schema(
                            type=types.Type.STRING,
                            description="Start of date range in yyyy-MM-dd format",
                        ),
                        "end_date": types.Schema(
                            type=types.Type.STRING,
                            description="End of date range in yyyy-MM-dd format",
                        ),
                    },
                    required=["start_date", "end_date"],
                ),
            ),
            types.FunctionDeclaration(
                name="get_diet_logs",
                description="Fetch diet/meal log entries for a date range",
                parameters=types.Schema(
                    type=types.Type.OBJECT,
                    properties={
                        "start_date": types.Schema(
                            type=types.Type.STRING,
                            description="Start of date range in yyyy-MM-dd format",
                        ),
                        "end_date": types.Schema(
                            type=types.Type.STRING,
                            description="End of date range in yyyy-MM-dd format",
                        ),
                        "food_filter": types.Schema(
                            type=types.Type.STRING,
                            description="Optional substring filter on foodName (case-insensitive)",
                        ),
                    },
                    required=["start_date", "end_date"],
                ),
            ),
            types.FunctionDeclaration(
                name="get_clean_timers",
                description="Fetch all active clean timer records",
                parameters=types.Schema(
                    type=types.Type.OBJECT,
                    properties={},
                ),
            ),
        ]
    )
]
