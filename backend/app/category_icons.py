CURATED_CATEGORY_ICONS = [
    "UtensilsCrossed",
    "Plane",
    "ReceiptText",
    "ShoppingBag",
    "Popcorn",
    "HeartPulse",
    "CircleHelp",
    "BriefcaseBusiness",
    "Laptop",
    "Landmark",
    "HandCoins",
    "PiggyBank",
    "Wallet",
    "Gift",
    "GraduationCap",
    "House",
    "CarFront",
    "ShieldCheck",
]


DEFAULT_CATEGORY_ICON_MAP = {
    ("expense", "Food"): "UtensilsCrossed",
    ("expense", "Travel"): "Plane",
    ("expense", "Bills"): "ReceiptText",
    ("expense", "Shopping"): "ShoppingBag",
    ("expense", "Entertainment"): "Popcorn",
    ("expense", "Health"): "HeartPulse",
    ("expense", "Other"): "CircleHelp",
    ("income", "Salary"): "BriefcaseBusiness",
    ("income", "Freelance"): "Laptop",
    ("income", "Investment"): "Landmark",
    ("income", "Other"): "CircleHelp",
}


def default_icon_for_category(category_type: str, name: str) -> str:
    return DEFAULT_CATEGORY_ICON_MAP.get((category_type, name), "CircleHelp")
