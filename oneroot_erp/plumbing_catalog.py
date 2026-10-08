"""Owner-review range; product specifications and prices must be confirmed."""

STARTER_ITEMS = {
    "Plumbing & Fittings": [
        "Pipe Elbow", "Pipe Tee", "Straight Pipe Connector / Coupling", "Pipe Reducer",
        "Threaded Pipe Adaptor", "Pipe End Cap", "PTFE / Thread-Seal Tape",
        "Replacement Plumbing Washer", "Plumbing O-Ring",
    ],
    "Taps, Valves & Hoses": [
        "Bib Tap", "Stopcock", "Ball Valve", "Flexible Tap Connector", "Shower Hose",
        "Sink Waste Fitting", "Bottle Trap", "Toilet Inlet / Fill Valve",
    ],
    "Lighting & Bulbs": ["LED Bulb", "Lamp Holder", "Basic Ceiling Light Fitting"],
    "Switches, Sockets & Plugs": [
        "One-Gang Switch", "Two-Gang Switch", "Switched Socket", "Replacement Electrical Plug",
    ],
    "Cables & Electrical Accessories": [
        "Electrical Insulation Tape", "Cable Clip", "Cable Tie",
        "Electrical Connector Terminal", "Extension Lead",
    ],
    "Installation Supplies": [
        "Wall Plug", "Installation Screw", "Pipe Clip", "Conduit Saddle",
        "Sanitary Silicone Sealant", "Sealant Gun", "PVC Solvent Cement",
    ],
}

ON_ORDER_ITEMS = {
    "Cables & Electrical Accessories": ["Electrical Cable Roll", "Electrical Conduit Length"],
    "Switches, Sockets & Plugs": ["Circuit Breaker", "Residual Current Device (RCD)", "Distribution Board"],
    "Plumbing & Fittings": ["Plumbing Pipe Length"],
    "Lighting & Bulbs": ["Decorative Light Fitting"],
    "Taps, Valves & Hoses": [
        "Premium Tap", "Shower Set", "Water Pump", "Water Heater", "Complete Sanitary Fitting",
    ],
}

PLUMBING_ELECTRICAL_ITEMS = [
    (category, name, stage)
    for stage, groups in [("Starter", STARTER_ITEMS), ("Supply On Order", ON_ORDER_ITEMS)]
    for category, names in groups.items()
    for name in names
]
