TOOL_DEFINITIONS = [
    {
        "type": "function",
        "function": {
            "name": "evaluate_ability",
            "description": "评估用户当前的跑步能力，返回6维评分（0-100）和文字解读。",
            "parameters": {
                "type": "object",
                "properties": {
                    "mode": {
                        "type": "string",
                        "enum": ["trail", "road"],
                        "description": "评估模式：trail=越野跑, road=公路跑",
                    }
                },
                "required": ["mode"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_recent_activities",
            "description": "获取用户最近N条训练活动的摘要数据。",
            "parameters": {
                "type": "object",
                "properties": {
                    "count": {
                        "type": "integer",
                        "description": "要获取的活动数量，默认5",
                        "default": 5,
                    }
                },
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "search_history",
            "description": "搜索用户的历史训练记录和教练点评。用于回答关于过去训练的问题。",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "搜索查询，如'上个月的越野训练'、'爬升超过1000m的活动'",
                    }
                },
                "required": ["query"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_profile",
            "description": "获取当前用户的完整学员档案，包括能力评分、目标赛事、伤病史等。",
            "parameters": {"type": "object", "properties": {}},
        },
    },
    {
        "type": "function",
        "function": {
            "name": "generate_plan",
            "description": "为用户生成备赛训练计划，写入日历。需要目标赛事信息。",
            "parameters": {
                "type": "object",
                "properties": {
                    "race_type": {
                        "type": "string",
                        "enum": ["road", "trail"],
                        "description": "赛事类型：road=公路赛, trail=越野赛",
                    },
                    "race_name": {
                        "type": "string",
                        "description": "赛事名称，如'莫干山越野50km'",
                    },
                    "race_date": {
                        "type": "string",
                        "description": "赛事日期，格式 YYYY-MM-DD",
                    },
                    "race_distance_km": {
                        "type": "number",
                        "description": "赛事距离(km)",
                    },
                    "race_elevation_m": {
                        "type": "number",
                        "description": "赛事总爬升(m)，越野赛必填",
                        "default": 0,
                    },
                    "target_time": {
                        "type": "string",
                        "description": "目标完赛时间(公路赛)，如'3:30:00'",
                    },
                    "target_itra_pi": {
                        "type": "integer",
                        "description": "目标ITRA PI分数(越野赛)",
                    },
                    "weekly_available_days": {
                        "type": "integer",
                        "description": "每周可训练天数",
                        "default": 5,
                    },
                    "long_run_day": {
                        "type": "string",
                        "description": "长距离训练安排在哪天",
                        "default": "周六",
                    },
                },
                "required": ["race_type", "race_name", "race_date", "race_distance_km"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "update_plan",
            "description": "修改已有训练计划中的某些天。用于用户通过对话调整计划（如换休息日、跳过训练、调整强度）。",
            "parameters": {
                "type": "object",
                "properties": {
                    "changes": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "properties": {
                                "date": {"type": "string", "description": "要修改的日期 YYYY-MM-DD"},
                                "action": {
                                    "type": "string",
                                    "enum": ["skip", "rest", "move", "replace"],
                                    "description": "操作类型",
                                },
                                "move_to": {"type": "string", "description": "move时：目标日期"},
                                "new_workout_type": {"type": "string", "description": "replace时：新训练类型"},
                                "new_title": {"type": "string", "description": "replace时：新标题"},
                                "new_description": {"type": "string", "description": "replace时：新描述"},
                            },
                            "required": ["date", "action"],
                        },
                        "description": "修改列表",
                    },
                },
                "required": ["changes"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_weekly_summary",
            "description": "获取指定周的训练执行总结（计划完成率、跑量/D+统计、关键偏差）。",
            "parameters": {
                "type": "object",
                "properties": {
                    "week_start": {
                        "type": "string",
                        "description": "周一日期，格式 YYYY-MM-DD。不填则返回本周。",
                    }
                },
            },
        },
    },
]
