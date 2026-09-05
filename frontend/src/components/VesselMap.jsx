import { useEffect, useMemo, useState } from "react";
import {
    Anchor,
    Navigation,
    Ship,
    Crosshair,
    Maximize2,
} from "lucide-react";
import {
    MapContainer,
    TileLayer,
    Marker,
    Popup,
    useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import api from "../services/api";
import { io } from "socket.io-client";

/* ========================================================= */
/* MAP CONTROLLER */
/* ========================================================= */

const MapController = ({ vessels, selectedVessel }) => {
    const map = useMap();

    const fitFleet = () => {
        const validVessels = vessels.filter(
            (vessel) =>
                typeof vessel.latitude === "number" &&
                typeof vessel.longitude === "number"
        );

        if (!validVessels.length) return;

        const bounds = L.latLngBounds(
            validVessels.map((vessel) => [
                vessel.latitude,
                vessel.longitude,
            ])
        );

        map.fitBounds(bounds, {
            padding: [50, 50],
            maxZoom: 6,
            animate: true,
        });
    };

    /* Initial fleet positioning */

    useEffect(() => {
        if (!vessels.length) return;

        const timer = setTimeout(() => {
            fitFleet();
            map.invalidateSize();
        }, 150);

        return () => clearTimeout(timer);
    }, [vessels.length, map]);

    /* Selected vessel */

    useEffect(() => {
        if (!selectedVessel) return;

        if (
            typeof selectedVessel.latitude !== "number" ||
            typeof selectedVessel.longitude !== "number"
        ) {
            return;
        }

        map.flyTo(
            [
                selectedVessel.latitude,
                selectedVessel.longitude,
            ],
            Math.max(map.getZoom(), 6),
            {
                duration: 1.2,
            }
        );
    }, [selectedVessel?._id, map]);

    /* Fix Leaflet size when container changes */

    useEffect(() => {
        const observer = new ResizeObserver(() => {
            map.invalidateSize();
        });
        observer.observe(map.getContainer());

        return () => observer.disconnect();
    }, [map]);

    const centerFleet = () => {
        fitFleet();
    };

    const fullscreen = async () => {
        const container = map.getContainer();

        try {
            if (document.fullscreenElement) {
                await document.exitFullscreen();
            } else if (container.requestFullscreen) {
                await container.requestFullscreen();
            }

            setTimeout(() => {
                map.invalidateSize();
            }, 300);
        } catch (error) {
            console.error(
                "Fullscreen error:",
                error
            );
        }
    };

    return (
        <>
            {/* Center Fleet */}

            <button
                type="button"
                onClick={centerFleet}
                title="Center Fleet"
                className="absolute z-[1000] top-20 left-3 w-9 h-9 rounded-lg border border-slate-700 bg-slate-950/90 backdrop-blur-md flex items-center justify-center text-slate-300 hover:text-cyan-400 hover:border-cyan-500/50 transition shadow-lg"
            >
                <Crosshair className="w-4 h-4" />
            </button>

            {/* Fullscreen */}

            <button
                type="button"
                onClick={fullscreen}
                title="Fullscreen"
                className="absolute z-[1000] top-20 left-14 w-9 h-9 rounded-lg border border-slate-700 bg-slate-950/90 backdrop-blur-md flex items-center justify-center text-slate-300 hover:text-cyan-400 hover:border-cyan-500/50 transition shadow-lg"
            >
                <Maximize2 className="w-4 h-4" />
            </button>
        </>
    );
};

/* ========================================================= */
/* VESSEL ICON */
/* ========================================================= */

const createVesselIcon = (
    heading = 0,
    riskLevel = "LOW",
    vesselId = ""
) => {
    const riskColors = {
        LOW: "#22c55e",
        MEDIUM: "#eab308",
        HIGH: "#f97316",
        CRITICAL: "#ef4444",
    };

    vesselId = String(vesselId || "VESSEL").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
    heading = Number.isFinite(Number(heading)) ? Number(heading) : 0;
    const color = riskColors[riskLevel] || "#22d3ee";
    const isCritical = riskLevel === "CRITICAL";

    return L.divIcon({
        className: "vessel-marker-wrapper",

        html: `
            <div
                style="
                    position: relative;
                    width: 76px;
                    height: 76px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                "
            >

                ${isCritical
                ? `
                            <div
                                style="
                                    position: absolute;
                                    width: 48px;
                                    height: 48px;
                                    border: 2px solid ${color};
                                    border-radius: 50%;
                                    opacity: 0.45;
                                    animation: marineAegisPulse 1.8s infinite;
                                "
                            ></div>
                        `
                : ""
            }

                <!-- Ship -->
                <div
                    style="
                        position: relative;
                        width: 42px;
                        height: 42px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        transform: rotate(${heading}deg);
                        transition: transform 0.8s ease;
                        z-index: 2;
                        filter:
                            drop-shadow(0 0 4px ${color})
                            drop-shadow(0 0 9px ${color});
                    "
                >
                    <svg
                        width="40"
                        height="40"
                        viewBox="0 0 64 64"
                        xmlns="http://www.w3.org/2000/svg"
                    >

                        <!-- Hull -->
                        <path
                            d="
                                M9 36
                                L16 50
                                Q32 58 48 50
                                L55 36
                                Z
                            "
                            fill="${color}"
                            stroke="#ffffff"
                            stroke-width="2"
                        />

                        <!-- Main Deck -->
                        <path
                            d="
                                M16 36
                                L20 25
                                L44 25
                                L48 36
                                Z
                            "
                            fill="${color}"
                            stroke="#ffffff"
                            stroke-width="2"
                        />

                        <!-- Bridge -->
                        <rect
                            x="26"
                            y="16"
                            width="13"
                            height="9"
                            rx="1.5"
                            fill="${color}"
                            stroke="#ffffff"
                            stroke-width="2"
                        />

                        <!-- Windows -->
                        <rect
                            x="28"
                            y="18"
                            width="3"
                            height="3"
                            rx="0.5"
                            fill="#0f172a"
                        />

                        <rect
                            x="33"
                            y="18"
                            width="3"
                            height="3"
                            rx="0.5"
                            fill="#0f172a"
                        />

                        <!-- Mast -->
                        <line
                            x1="32"
                            y1="8"
                            x2="32"
                            y2="16"
                            stroke="#ffffff"
                            stroke-width="2"
                        />

                        <!-- Radar -->
                        <circle
                            cx="32"
                            cy="7"
                            r="2"
                            fill="${color}"
                            stroke="#ffffff"
                            stroke-width="1"
                        />

                    </svg>
                </div>

                <!-- Vessel ID -->
                <div
                    style="
                        margin-top: 1px;
                        padding: 2px 6px;
                        border-radius: 4px;
                        background: rgba(2, 6, 23, 0.88);
                        border: 1px solid ${color};
                        color: white;
                        font-size: 9px;
                        font-weight: 700;
                        letter-spacing: 0.5px;
                        white-space: nowrap;
                        box-shadow: 0 0 6px ${color};
                        z-index: 3;
                    "
                >
                    ${vesselId || "VESSEL"}
                </div>

            </div>

            <style>
                @keyframes marineAegisPulse {

                    0% {
                        transform: scale(0.7);
                        opacity: 0.6;
                    }

                    70% {
                        transform: scale(1.35);
                        opacity: 0;
                    }

                    100% {
                        transform: scale(1.35);
                        opacity: 0;
                    }

                }
            </style>
        `,

        iconSize: [76, 76],
        iconAnchor: [38, 38],
        popupAnchor: [0, -38],
    });
};

/* ========================================================= */
/* VESSEL MAP */
/* ========================================================= */

const VesselMap = () => {
    const [vessels, setVessels] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedVesselId, setSelectedVesselId] = useState(null);
    const selectedVessel = vessels.find((vessel) => vessel._id === selectedVesselId) || null;
    const setSelectedVessel = (vessel) => setSelectedVesselId(vessel?._id || null);

    /* ========================================================= */
    /* LOAD VESSELS */
    /* ========================================================= */

    useEffect(() => {
        let mounted = true;
        let receivedLiveData = false;
        const mergeRecords = (current, records) => {
            const byId = new Map(current.map((vessel) => [vessel._id, vessel]));
            records.forEach((record) => {
                const metadata = typeof record.vessel === "object" ? record.vessel : {};
                const telemetry = record.telemetry || record;
                const id = metadata?._id || record.vessel || record._id;
                if (!id) return;
                const previous = byId.get(id);
                const previousTime = Date.parse(previous?.timestamp || "");
                const nextTime = Date.parse(telemetry.timestamp || "");
                if (Number.isFinite(previousTime) && Number.isFinite(nextTime) && nextTime < previousTime) return;
                byId.set(id, {
                    ...byId.get(id),
                    ...metadata,
                    ...telemetry,
                    _id: id,
                    latitude: telemetry.latitude,
                    longitude: telemetry.longitude,
                });
            });
            return Array.from(byId.values());
        };
        const socket = io(import.meta.env.VITE_SOCKET_URL || (import.meta.env.DEV ? "http://localhost:5000" : window.location.origin), { transports: ["websocket"] });
        socket.on("telemetry:update", (payload) => {
            if (!mounted || !payload?.success || !Array.isArray(payload.data)) return;
            receivedLiveData = true;
            setVessels((current) => mergeRecords(current, payload.data));
            setLoading(false);
        });
        Promise.allSettled([api.get("/vessels"), api.get("/telemetry")])
            .then(([fleet, latest]) => {
                if (!mounted) return;
                const metadata = fleet.status === "fulfilled" ? fleet.value.data?.vessels || [] : [];
                const records = latest.status === "fulfilled" ? latest.value.data?.data || [] : [];
                const initial = mergeRecords(metadata, records);
                setVessels((current) => receivedLiveData
                    ? mergeRecords(initial, current.map((vessel) => ({ vessel, telemetry: vessel })))
                    : initial);
            })
            .finally(() => { if (mounted) setLoading(false); });
        return () => { mounted = false; socket.disconnect(); };
    }, []);

    const validVessels = useMemo(() => {
        return vessels.filter(
            (vessel) =>
                typeof vessel.latitude ===
                "number" &&
                typeof vessel.longitude ===
                "number"
        );
    }, [vessels]);

    /* ========================================================= */
    /* RISK COUNTS */
    /* ========================================================= */

    const riskCounts = useMemo(() => vessels.reduce((counts, vessel) => {
        const risk = vessel.riskLevel || "LOW";
        if (risk in counts) counts[risk]++;
        return counts;
    }, { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 }), [vessels]);

    /* ========================================================= */
    /* LOADING */
    /* ========================================================= */

    if (loading) {
        return (
            <div className="h-full w-full flex items-center justify-center bg-slate-950">
                <div className="text-sm text-cyan-400 animate-pulse">
                    Loading vessel positions...
                </div>
            </div>
        );
    }

    return (
        <div className="relative h-full w-full bg-slate-950 overflow-hidden">

            {/* ================================================= */}
            {/* REAL MAP */}
            {/* ================================================= */}

            {validVessels.length > 0 ? (
                <MapContainer
                    center={[
                        validVessels[0].latitude,
                        validVessels[0].longitude,
                    ]}
                    zoom={5}
                    minZoom={3}
                    maxZoom={15}
                    scrollWheelZoom={true}
                    zoomControl={true}
                    className="h-full w-full"
                >
                    <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution="&copy; OpenStreetMap contributors"
                        />

                    <MapController
                        vessels={validVessels}
                        selectedVessel={
                            selectedVessel
                        }
                    />

                    {/* ================================================= */}
                    {/* VESSEL MARKERS */}
                    {/* ================================================= */}

                    {validVessels.map(
                        (vessel) => (
                            <Marker
                                key={vessel._id}
                                position={[
                                    vessel.latitude,
                                    vessel.longitude,
                                ]}
                                icon={createVesselIcon(vessel.heading || 0, vessel.riskLevel || "LOW", vessel.vesselId || vessel.name)}
                                eventHandlers={{
                                    click: () => {
                                        setSelectedVessel(
                                            vessel
                                        );
                                    },
                                }}
                            >
                                <Popup>
                                    <div
                                        style={{
                                            minWidth:
                                                "220px",
                                            background:
                                                "#020617",
                                            color:
                                                "#e2e8f0",
                                        }}
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <Ship
                                                        size={
                                                            16
                                                        }
                                                        color="#22d3ee"
                                                    />

                                                    <strong>
                                                        {
                                                            vessel.name
                                                        }
                                                    </strong>
                                                </div>

                                                <div
                                                    style={{
                                                        color:
                                                            "#64748b",
                                                        fontSize:
                                                            "11px",
                                                        marginTop:
                                                            "3px",
                                                    }}
                                                >
                                                    {
                                                        vessel.vesselId
                                                    }
                                                </div>
                                            </div>

                                            <span
                                                style={{
                                                    fontSize:
                                                        "9px",
                                                    padding:
                                                        "4px 7px",
                                                    borderRadius:
                                                        "5px",

                                                    background:
                                                        vessel.status ===
                                                            "CRITICAL"
                                                            ? "#ef444420"
                                                            : vessel.status ===
                                                                "WARNING"
                                                                ? "#f59e0b20"
                                                                : vessel.status ===
                                                                    "OFFLINE"
                                                                    ? "#64748b20"
                                                                    : "#22c55e20",

                                                    color:
                                                        vessel.status ===
                                                            "CRITICAL"
                                                            ? "#f87171"
                                                            : vessel.status ===
                                                                "WARNING"
                                                                ? "#fbbf24"
                                                                : vessel.status ===
                                                                    "OFFLINE"
                                                                    ? "#94a3b8"
                                                                    : "#4ade80",
                                                }}
                                            >
                                                {
                                                    vessel.status
                                                }
                                            </span>
                                        </div>

                                        <div
                                            style={{
                                                display:
                                                    "grid",
                                                gridTemplateColumns:
                                                    "1fr 1fr",
                                                gap:
                                                    "10px",
                                                marginTop:
                                                    "15px",
                                            }}
                                        >
                                            <PopupValue
                                                label="Risk"
                                                value={`${vessel.riskScore ?? 0}/100`}
                                            />

                                            <PopupValue
                                                label="Risk Level"
                                                value={
                                                    vessel.riskLevel ||
                                                    "UNKNOWN"
                                                }
                                            />

                                            <PopupValue
                                                label="Speed"
                                                value={`${vessel.speed ?? 0} kn`}
                                            />

                                            <PopupValue
                                                label="Heading"
                                                value={`${vessel.heading ?? 0}°`}
                                            />

                                            <PopupValue label="GPS" value={vessel.gpsSignal == null ? "--" : vessel.gpsSignal.toFixed(0) + "%"} />
                                            <PopupValue label="AIS" value={vessel.aisStatus || "--"} />
                                            <PopupValue label="Device" value={vessel.deviceStatus || "--"} />
                                            <PopupValue label="Engine" value={vessel.engineTemperature == null ? "--" : vessel.engineTemperature.toFixed(1) + "?C"} />
                                            <PopupValue label="Fuel" value={vessel.fuelLevel == null ? "--" : vessel.fuelLevel.toFixed(1) + "%"} />
                                            <PopupValue
                                                label="Latitude"
                                                value={`${vessel.latitude.toFixed(
                                                    4
                                                )}°`}
                                            />

                                            <PopupValue
                                                label="Longitude"
                                                value={`${vessel.longitude.toFixed(
                                                    4
                                                )}°`}
                                            />
                                        </div>

                                        <div
                                            style={{
                                                marginTop:
                                                    "14px",
                                                paddingTop:
                                                    "10px",
                                                borderTop:
                                                    "1px solid #1e293b",
                                            }}
                                        >
                                            <div
                                                style={{
                                                    display:
                                                        "flex",
                                                    alignItems:
                                                        "center",
                                                    gap:
                                                        "6px",
                                                    color:
                                                        "#64748b",
                                                    fontSize:
                                                        "10px",
                                                }}
                                            >
                                                <Anchor
                                                    size={
                                                        13
                                                    }
                                                />

                                                Destination
                                            </div>

                                            <div
                                                style={{
                                                    color:
                                                        "#e2e8f0",
                                                    fontSize:
                                                        "12px",
                                                    marginTop:
                                                        "4px",
                                                }}
                                            >
                                                {vessel.destination ||
                                                    "Unknown"}
                                            </div>
                                        </div>
                                    </div>
                                </Popup>
                            </Marker>
                        )
                    )}
                </MapContainer>
            ) : (
                <div className="h-full flex items-center justify-center text-sm text-slate-500">
                    No vessel coordinates available
                </div>
            )}

            {/* ================================================= */}
            {/* MAP CONTROLS / OVERLAYS */}
            {/* ================================================= */}

            <div className="absolute z-[900] top-4 right-4 rounded-lg border border-slate-700 bg-slate-950/90 backdrop-blur-md px-3 py-2 shadow-xl">
                <div className="text-[9px] uppercase tracking-[0.18em] text-slate-600 mb-2">
                    Fleet Risk
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <MapStatus
                        color="bg-green-500"
                        label="Low"
                        value={riskCounts.LOW}
                    />

                    <MapStatus
                        color="bg-yellow-500"
                        label="Medium"
                        value={riskCounts.MEDIUM}
                    />

                    <MapStatus color="bg-orange-500" label="High" value={riskCounts.HIGH} />
                    <MapStatus
                        color="bg-red-500"
                        label="Critical"
                        value={riskCounts.CRITICAL}
                    />
                </div>
            </div>

            {/* ================================================= */}
            {/* SELECTED VESSEL */}
            {/* ================================================= */}

            {selectedVessel && (
                <div className="absolute z-[950] bottom-4 left-4 w-72 rounded-xl border border-slate-700 bg-slate-950/95 backdrop-blur-xl p-4 shadow-2xl">

                    <div className="flex items-start justify-between">
                        <div>
                            <div className="flex items-center gap-2">
                                <Ship className="w-4 h-4 text-cyan-400" />

                                <p className="text-sm font-semibold text-white">
                                    {
                                        selectedVessel.name
                                    }
                                </p>
                            </div>

                            <p className="text-[10px] font-mono text-slate-500 mt-1">
                                {
                                    selectedVessel.vesselId
                                }
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={() =>
                                setSelectedVessel(
                                    null
                                )
                            }
                            className="text-slate-600 hover:text-white text-xs"
                        >
                            ✕
                        </button>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mt-4">
                        <InfoItem
                            label="Status"
                            value={
                                selectedVessel.status
                            }
                        />

                        <InfoItem
                            label="Risk"
                            value={`${selectedVessel.riskScore ?? 0}/100`}
                        />

                        <InfoItem
                            label="Speed"
                            value={`${selectedVessel.speed ?? 0} kn`}
                        />

                        <InfoItem
                            label="Heading"
                            value={`${selectedVessel.heading ?? 0}°`}
                        />
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-800">
                        <div className="flex items-center gap-2">
                            <Anchor className="w-3.5 h-3.5 text-cyan-400" />

                            <span className="text-[10px] text-slate-500">
                                Destination
                            </span>
                        </div>

                        <p className="text-xs text-white mt-1">
                            {
                                selectedVessel.destination ||
                                "Unknown"
                            }
                        </p>
                    </div>
                </div>
            )}

            {/* ================================================= */}
            {/* LEGEND */}
            {/* ================================================= */}

            <div className="absolute z-[900] bottom-4 right-4 rounded-lg border border-slate-700 bg-slate-950/90 backdrop-blur-md px-3 py-2 shadow-xl">
                <div className="flex items-center gap-3">
                    <MapStatus
                        color="bg-green-500"
                        label="Low"
                    />

                    <MapStatus
                        color="bg-yellow-500"
                        label="Medium"
                    />

                    <MapStatus color="bg-orange-500" label="High" />
                    <MapStatus
                        color="bg-red-500"
                        label="Critical"
                    />
                </div>
            </div>

            {/* ================================================= */}
            {/* MAP CSS */}
            {/* ================================================= */}

            <style>
                {`
                    .marine-vessel-marker {
                        background: transparent !important;
                        border: none !important;
                    }

                    .marine-vessel-marker div {
                        box-sizing: border-box;
                    }

                    @keyframes marinePulse {
                        0% {
                            transform: scale(0.75);
                            opacity: 0.45;
                        }

                        70% {
                            transform: scale(1.25);
                            opacity: 0;
                        }

                        100% {
                            transform: scale(1.25);
                            opacity: 0;
                        }
                    }

                    .marine-map-tiles {
                        filter:
                            brightness(0.72)
                            saturate(0.7)
                            hue-rotate(175deg);
                    }

                    .leaflet-container {
                        background: #020617;
                        font-family:
                            Inter,
                            system-ui,
                            sans-serif;
                    }

                    .leaflet-control-zoom {
                        border: 1px solid #334155 !important;
                        box-shadow: 0 8px 25px rgba(0,0,0,.35) !important;
                    }

                    .leaflet-control-zoom a {
                        background: rgba(2,6,23,.92) !important;
                        color: #cbd5e1 !important;
                        border-color: #334155 !important;
                    }

                    .leaflet-control-zoom a:hover {
                        background: #0f172a !important;
                        color: #22d3ee !important;
                    }

                    .leaflet-popup-content-wrapper,
                    .leaflet-popup-tip {
                        background: #020617;
                        color: #e2e8f0;
                    }

                    .leaflet-popup-content {
                        margin: 12px;
                    }

                    .leaflet-popup-close-button {
                        color: #64748b !important;
                    }

                    .leaflet-popup-close-button:hover {
                        color: #ffffff !important;
                    }
                `}
            </style>
        </div>
    );
};

/* ========================================================= */
/* POPUP VALUE */
/* ========================================================= */

const PopupValue = ({ label, value }) => {
    return (
        <div>
            <div
                style={{
                    color: "#64748b",
                    fontSize: "9px",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                }}
            >
                {label}
            </div>

            <div
                style={{
                    color: "#e2e8f0",
                    fontSize: "11px",
                    marginTop: "3px",
                }}
            >
                {value}
            </div>
        </div>
    );
};

/* ========================================================= */
/* INFO ITEM */
/* ========================================================= */

const InfoItem = ({ label, value }) => {
    return (
        <div>
            <p className="text-[9px] uppercase tracking-wider text-slate-600">
                {label}
            </p>

            <p className="text-xs text-slate-300 mt-1">
                {value}
            </p>
        </div>
    );
};

/* ========================================================= */
/* MAP STATUS */
/* ========================================================= */

const MapStatus = ({
    color,
    label,
    value,
}) => {
    return (
        <div className="flex items-center gap-1.5">
            <span
                className={`w-1.5 h-1.5 rounded-full ${color}`}
            />

            <span className="text-[9px] text-slate-500">
                {label}
            </span>

            {value !== undefined && (
                <span className="text-[9px] font-semibold text-slate-300">
                    {value}
                </span>
            )}
        </div>
    );
};

export default VesselMap;