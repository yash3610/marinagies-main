import { useEffect, useMemo, useState } from "react";
import {
    MapContainer,
    TileLayer,
    Marker,
    Popup,
    useMap,
} from "react-leaflet";
import { io } from "socket.io-client";
import L from "leaflet";

import "leaflet/dist/leaflet.css";

// ========================================
// VESSEL MARKER
// ========================================
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

// ========================================
// MAP CONTROLLER
// ========================================
const MapController = ({
    selectedVessel,
    vessels,
}) => {
    const map = useMap();

    // ----------------------------------------
    // CENTER SELECTED VESSEL
    // ----------------------------------------
    useEffect(() => {
        if (!selectedVessel) {
            return;
        }

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
            9,
            {
                duration: 1.2,
            }
        );
    }, [selectedVessel, map]);

    // ----------------------------------------
    // CENTER ALL VESSELS
    // ----------------------------------------
    const centerFleet = () => {
        const validVessels = vessels.filter(
            (item) =>
                typeof item.latitude === "number" &&
                typeof item.longitude === "number"
        );

        if (validVessels.length === 0) {
            return;
        }

        const bounds = L.latLngBounds(
            validVessels.map((item) => [
                item.latitude,
                item.longitude,
            ])
        );

        map.fitBounds(bounds, {
            padding: [80, 80],
            maxZoom: 7,
            animate: true,
        });
    };

    return (
        <div className="absolute bottom-5 right-5 z-[1000]">
            <button
                type="button"
                onClick={centerFleet}
                className="
                    rounded-xl
                    border
                    border-cyan-400/30
                    bg-slate-950/90
                    px-4
                    py-2.5
                    text-sm
                    font-semibold
                    text-cyan-300
                    shadow-xl
                    backdrop-blur-md
                    transition
                    hover:border-cyan-300
                    hover:bg-slate-900
                "
            >
                ⌖ Center Fleet
            </button>
        </div>
    );
};

// ========================================
// NAVIGATION MAP
// ========================================
const NavigationMap = () => {

    const [vessels, setVessels] = useState([]);

    const [searchTerm, setSearchTerm] = useState("");

    const [selectedVessel, setSelectedVessel] =
        useState(null);

    // ========================================
    // SOCKET.IO
    // ========================================
    useEffect(() => {

        const socket = io(
            import.meta.env.VITE_SOCKET_URL || (import.meta.env.DEV ? "http://localhost:5000" : window.location.origin),
            {
                transports: ["websocket"],
            }
        );

        socket.on("connect", () => {

            console.log(
                "Navigation Map Socket connected:",
                socket.id
            );

        });

        socket.on(
            "telemetry:update",
            (data) => {

                if (
                    data?.success &&
                    Array.isArray(data.data)
                ) {
                    setVessels((current) => {
                        const latest = new Map(current.map((item) => [item.vessel?._id || item.vessel, item]));
                        data.data.forEach((record) => {
                            const telemetry = record.telemetry || record;
                            const vessel = record.vessel;
                            const id = vessel?._id || vessel;
                            if (!id) return;
                            const previous = latest.get(id);
                            const previousTime = Date.parse(previous?.timestamp || "");
                            const nextTime = Date.parse(telemetry.timestamp || "");
                            if (Number.isFinite(previousTime) && Number.isFinite(nextTime) && nextTime < previousTime) return;
                            latest.set(id, { ...telemetry, vessel });
                        });
                        return Array.from(latest.values());
                    });
                }

            }
        );

        socket.on("disconnect", () => {

            console.log(
                "Navigation Map Socket disconnected"
            );

        });

        return () => {

            socket.disconnect();

        };

    }, []);

    // ========================================
    // RISK COUNTS
    // ========================================
    const riskCounts = vessels.reduce(
        (counts, item) => {

            const risk =
                item.vessel?.riskLevel ||
                "LOW";

            if (
                counts[risk] !== undefined
            ) {
                counts[risk]++;
            }

            return counts;

        },
        {
            LOW: 0,
            MEDIUM: 0,
            HIGH: 0,
            CRITICAL: 0,
        }
    );

    // ========================================
    // SEARCH RESULTS
    // ========================================
    const filteredVessels = useMemo(() => {

        const search =
            searchTerm
                .trim()
                .toLowerCase();

        if (!search) {
            return [];
        }

        return vessels.filter((item) => {

            const vesselName =
                item.vessel?.name
                    ?.toLowerCase() || "";

            const vesselId =
                item.vessel?.vesselId
                    ?.toLowerCase() || "";

            return (
                vesselName.includes(search) ||
                vesselId.includes(search)
            );

        });

    }, [vessels, searchTerm]);

    // ========================================
    // HANDLE VESSEL SELECT
    // ========================================
    const handleSelectVessel = (item) => {

        setSelectedVessel(item);

        setSearchTerm(
            item.vessel?.vesselId ||
            item.vessel?.name ||
            ""
        );

    };

    // ========================================
    // UI
    // ========================================
    return (

        <div
            className="
                relative
                h-[calc(100vh-120px)]
                w-full
                overflow-hidden
                rounded-2xl
                border
                border-slate-800
            "
        >

            {/* ========================================
                VESSEL SEARCH
            ======================================== */}
            <div
                className="
                    absolute
                    left-1/2
                    top-4
                    z-[1000]
                    w-[320px]
                    -translate-x-1/2
                "
            >

                {/* Search Input */}
                <div
                    className="
                        flex
                        items-center
                        rounded-xl
                        border
                        border-slate-700
                        bg-slate-950/95
                        px-3
                        shadow-2xl
                        backdrop-blur-md
                    "
                >

                    <span
                        className="
                            mr-2
                            text-slate-400
                        "
                    >
                        🔎
                    </span>

                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => {

                            setSearchTerm(
                                e.target.value
                            );

                            // New search start झाल्यावर
                            // previous selection clear
                            setSelectedVessel(null);

                        }}
                        placeholder="Search vessel or ID..."
                        className="
                            w-full
                            bg-transparent
                            py-3
                            text-sm
                            text-white
                            outline-none
                            placeholder:text-slate-500
                        "
                    />

                    {searchTerm && (

                        <button
                            type="button"
                            onClick={() => {

                                setSearchTerm("");
                                setSelectedVessel(null);

                            }}
                            className="
                                ml-2
                                text-slate-400
                                transition
                                hover:text-white
                            "
                        >
                            ✕
                        </button>

                    )}

                </div>

                {/* ========================================
                    SEARCH RESULTS
                ======================================== */}
                {searchTerm && (

                    <div
                        className="
                            mt-2
                            max-h-[260px]
                            overflow-y-auto
                            overflow-hidden
                            rounded-xl
                            border
                            border-slate-700
                            bg-slate-950/95
                            shadow-2xl
                            backdrop-blur-md
                        "
                    >

                        {filteredVessels.length > 0 ? (

                            filteredVessels.map(
                                (item) => (

                                    <button
                                        key={item._id}
                                        type="button"
                                        onClick={() =>
                                            handleSelectVessel(
                                                item
                                            )
                                        }
                                        className="
                                            flex
                                            w-full
                                            items-center
                                            justify-between
                                            border-b
                                            border-slate-800
                                            px-4
                                            py-3
                                            text-left
                                            transition
                                            last:border-0
                                            hover:bg-slate-800
                                        "
                                    >

                                        <div>

                                            <p
                                                className="
                                                    text-sm
                                                    font-semibold
                                                    text-white
                                                "
                                            >
                                                {
                                                    item.vessel
                                                        ?.name ||
                                                    "Unknown Vessel"
                                                }
                                            </p>

                                            <p
                                                className="
                                                    mt-0.5
                                                    text-xs
                                                    text-slate-500
                                                "
                                            >
                                                {
                                                    item.vessel
                                                        ?.vesselId ||
                                                    "N/A"
                                                }
                                            </p>

                                        </div>

                                        <span
                                            className="
                                                text-xs
                                                font-semibold
                                                text-cyan-400
                                            "
                                        >
                                            FOCUS →
                                        </span>

                                    </button>

                                )
                            )

                        ) : (

                            <div
                                className="
                                    p-4
                                    text-center
                                    text-sm
                                    text-slate-400
                                "
                            >
                                No vessel found
                            </div>

                        )}

                    </div>

                )}

            </div>

            {/* ========================================
                RISK LEGEND / FLEET MONITOR
            ======================================== */}
            <div
                className="
                    absolute
                    left-4
                    top-4
                    z-[1000]
                    w-60
                    rounded-2xl
                    border
                    border-slate-700
                    bg-slate-950/90
                    p-4
                    shadow-2xl
                    backdrop-blur-md
                "
            >

                {/* Header */}
                <div
                    className="
                        mb-3
                        flex
                        items-center
                        justify-between
                    "
                >

                    <div>

                        <p
                            className="
                                text-[10px]
                                font-semibold
                                uppercase
                                tracking-[0.18em]
                                text-slate-400
                            "
                        >
                            Fleet Monitor
                        </p>

                        <p
                            className="
                                mt-1
                                text-lg
                                font-bold
                                text-white
                            "
                        >
                            {vessels.length} Vessels
                        </p>

                    </div>

                    <div
                        className="
                            flex
                            items-center
                            gap-2
                            rounded-full
                            border
                            border-emerald-500/30
                            bg-emerald-500/10
                            px-2.5
                            py-1
                        "
                    >

                        <span
                            className="
                                h-2
                                w-2
                                animate-pulse
                                rounded-full
                                bg-emerald-400
                            "
                        ></span>

                        <span
                            className="
                                text-[10px]
                                font-bold
                                tracking-wider
                                text-emerald-400
                            "
                        >
                            LIVE
                        </span>

                    </div>

                </div>

                <div
                    className="
                        mb-3
                        h-px
                        bg-slate-800
                    "
                ></div>

                {/* LOW */}
                <div
                    className="
                        mb-2.5
                        flex
                        items-center
                        justify-between
                    "
                >

                    <div
                        className="
                            flex
                            items-center
                            gap-2.5
                        "
                    >

                        <span
                            className="
                                h-3
                                w-3
                                rounded-full
                                bg-green-500
                                shadow-[0_0_8px_#22c55e]
                            "
                        ></span>

                        <span
                            className="
                                text-sm
                                text-slate-300
                            "
                        >
                            Low Risk
                        </span>

                    </div>

                    <span
                        className="
                            font-bold
                            text-green-400
                        "
                    >
                        {riskCounts.LOW}
                    </span>

                </div>

                {/* MEDIUM */}
                <div
                    className="
                        mb-2.5
                        flex
                        items-center
                        justify-between
                    "
                >

                    <div
                        className="
                            flex
                            items-center
                            gap-2.5
                        "
                    >

                        <span
                            className="
                                h-3
                                w-3
                                rounded-full
                                bg-yellow-500
                                shadow-[0_0_8px_#eab308]
                            "
                        ></span>

                        <span
                            className="
                                text-sm
                                text-slate-300
                            "
                        >
                            Medium Risk
                        </span>

                    </div>

                    <span
                        className="
                            font-bold
                            text-yellow-400
                        "
                    >
                        {riskCounts.MEDIUM}
                    </span>

                </div>

                {/* HIGH */}
                <div
                    className="
                        mb-2.5
                        flex
                        items-center
                        justify-between
                    "
                >

                    <div
                        className="
                            flex
                            items-center
                            gap-2.5
                        "
                    >

                        <span
                            className="
                                h-3
                                w-3
                                rounded-full
                                bg-orange-500
                                shadow-[0_0_8px_#f97316]
                            "
                        ></span>

                        <span
                            className="
                                text-sm
                                text-slate-300
                            "
                        >
                            High Risk
                        </span>

                    </div>

                    <span
                        className="
                            font-bold
                            text-orange-400
                        "
                    >
                        {riskCounts.HIGH}
                    </span>

                </div>

                {/* CRITICAL */}
                <div
                    className="
                        flex
                        items-center
                        justify-between
                    "
                >

                    <div
                        className="
                            flex
                            items-center
                            gap-2.5
                        "
                    >

                        <span
                            className="
                                h-3
                                w-3
                                animate-pulse
                                rounded-full
                                bg-red-500
                                shadow-[0_0_10px_#ef4444]
                            "
                        ></span>

                        <span
                            className="
                                text-sm
                                text-slate-300
                            "
                        >
                            Critical Risk
                        </span>

                    </div>

                    <span
                        className="
                            font-bold
                            text-red-400
                        "
                    >
                        {riskCounts.CRITICAL}
                    </span>

                </div>

            </div>

            {/* ========================================
                MAP
            ======================================== */}
            <MapContainer
                center={[20.5, 72.8]}
                zoom={5}
                scrollWheelZoom={true}
                className="h-full w-full"
            >

                {/* Map Controller */}
                <MapController
                    selectedVessel={selectedVessel}
                    vessels={vessels}
                />

                {/* ========================================
                    MAP TILES
                ======================================== */}
                <TileLayer
                    attribution="&copy; OpenStreetMap contributors"
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {/* ========================================
                    LIVE VESSELS
                ======================================== */}
                {vessels.map((item) => {

                    const vessel =
                        item.vessel;

                    const telemetry =
                        item;

                    // Ignore invalid coordinates
                    if (
                        typeof telemetry.latitude !==
                        "number" ||
                        typeof telemetry.longitude !==
                        "number"
                    ) {
                        return null;
                    }

                    const riskLevel =
                        vessel?.riskLevel ||
                        "LOW";

                    const riskScore =
                        vessel?.riskScore ?? 0;

                    return (

                        <Marker
                            key={vessel?._id || telemetry._id}
                            position={[
                                telemetry.latitude,
                                telemetry.longitude,
                            ]}
                            icon={createVesselIcon(
                                telemetry.heading ||
                                0,
                                riskLevel,
                                vessel?.vesselId
                            )}
                            eventHandlers={{
                                click: () =>
                                    setSelectedVessel(
                                        item
                                    ),
                            }}
                        >

                            {/* ========================================
                                VESSEL POPUP
                            ======================================== */}
                            <Popup>

                                <div
                                    className="
                                        min-w-[210px]
                                    "
                                >

                                    {/* Vessel Name */}
                                    <h3
                                        className="
                                            text-base
                                            font-bold
                                            text-slate-900
                                        "
                                    >
                                        {vessel?.name ||
                                            "Unknown Vessel"}
                                    </h3>

                                    {/* Vessel ID */}
                                    <p
                                        className="
                                            text-sm
                                            text-gray-500
                                        "
                                    >
                                        {vessel?.vesselId ||
                                            "N/A"}
                                    </p>

                                    <hr
                                        className="my-2"
                                    />

                                    {/* Speed */}
                                    <p>
                                        <strong>
                                            Speed:
                                        </strong>{" "}
                                        {telemetry.speed?.toFixed(
                                            1
                                        )}{" "}
                                        kn
                                    </p>

                                    {/* Heading */}
                                    <p>
                                        <strong>
                                            Heading:
                                        </strong>{" "}
                                        {telemetry.heading?.toFixed(
                                            0
                                        )}
                                        °
                                    </p>

                                    {/* GPS */}
                                    <p>
                                        <strong>
                                            GPS:
                                        </strong>{" "}
                                        {telemetry.gpsSignal?.toFixed(
                                            0
                                        )}
                                        %
                                    </p>

                                    {/* AIS */}
                                    <p>
                                        <strong>
                                            AIS:
                                        </strong>{" "}
                                        {telemetry.aisStatus}
                                    </p>

                                    {/* Device */}
                                    <p>
                                        <strong>
                                            Device:
                                        </strong>{" "}
                                        {telemetry.deviceStatus}
                                    </p>

                                    {/* Engine Temperature */}
                                    <p>
                                        <strong>
                                            Engine:
                                        </strong>{" "}
                                        {telemetry.engineTemperature?.toFixed(
                                            1
                                        )}
                                        °C
                                    </p>

                                    {/* Fuel */}
                                    <p>
                                        <strong>
                                            Fuel:
                                        </strong>{" "}
                                        {telemetry.fuelLevel?.toFixed(
                                            1
                                        )}
                                        %
                                    </p>

                                    {/* Risk Score */}
                                    <p className="mt-2">
                                        <strong>
                                            Risk Score:
                                        </strong>{" "}
                                        {riskScore}
                                    </p>

                                    {/* Risk Level */}
                                    <p>
                                        <strong>
                                            Risk Level:
                                        </strong>{" "}
                                        {riskLevel}
                                    </p>

                                    {/* Position */}
                                    <p className="mt-2">
                                        <strong>
                                            Position:
                                        </strong>{" "}
                                        {telemetry.latitude.toFixed(
                                            4
                                        )}
                                        ,{" "}
                                        {telemetry.longitude.toFixed(
                                            4
                                        )}
                                    </p>

                                </div>

                            </Popup>

                        </Marker>

                    );
                })}

            </MapContainer>

        </div>

    );
};

export default NavigationMap;