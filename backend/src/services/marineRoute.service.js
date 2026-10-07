const PORTS = Object.freeze({
    MUMBAI: { key: "MUMBAI", name: "Mumbai Port", latitude: 18.9, longitude: 72.75 },
    DUBAI: { key: "DUBAI", name: "Jebel Ali / Dubai", latitude: 25.1389, longitude: 54.8867 },
    COLOMBO: { key: "COLOMBO", name: "Colombo Port", latitude: 6.9514, longitude: 79.8478 },
    MUSCAT: { key: "MUSCAT", name: "Muscat Port", latitude: 23.62, longitude: 58.58 },
    KARACHI: { key: "KARACHI", name: "Karachi Port", latitude: 24.72, longitude: 66.88 },
    KOCHI: { key: "KOCHI", name: "Kochi Port", latitude: 9.93, longitude: 76.15 },
});

const NODES = {
    ...PORTS,
    MUMBAI_OFFSHORE: { key: "MUMBAI_OFFSHORE", name: "Mumbai offshore", latitude: 18.7, longitude: 71.5 },
    ARABIAN_EAST: { key: "ARABIAN_EAST", name: "East Arabian Sea", latitude: 19.5, longitude: 68 },
    ARABIAN_CENTRE: { key: "ARABIAN_CENTRE", name: "Central Arabian Sea", latitude: 20.5, longitude: 64 },
    OMAN_SEA: { key: "OMAN_SEA", name: "Oman offshore", latitude: 22, longitude: 60.5 },
    GULF_OF_OMAN: { key: "GULF_OF_OMAN", name: "Gulf of Oman", latitude: 24.4, longitude: 57 },
    WEST_COAST_SOUTH: { key: "WEST_COAST_SOUTH", name: "West coast corridor", latitude: 14, longitude: 72 },
    LACCADIVE_SEA: { key: "LACCADIVE_SEA", name: "Laccadive Sea", latitude: 9, longitude: 74.2 },
    COLOMBO_APPROACH: { key: "COLOMBO_APPROACH", name: "Colombo approach", latitude: 7.15, longitude: 78.8 },
};

const EDGES = [
    ["MUMBAI", "MUMBAI_OFFSHORE"], ["MUMBAI_OFFSHORE", "ARABIAN_EAST"],
    ["ARABIAN_EAST", "ARABIAN_CENTRE"], ["ARABIAN_CENTRE", "OMAN_SEA"],
    ["OMAN_SEA", "GULF_OF_OMAN"], ["GULF_OF_OMAN", "DUBAI"],
    ["OMAN_SEA", "MUSCAT"], ["ARABIAN_EAST", "KARACHI"],
    ["MUMBAI_OFFSHORE", "WEST_COAST_SOUTH"], ["WEST_COAST_SOUTH", "LACCADIVE_SEA"],
    ["LACCADIVE_SEA", "KOCHI"], ["LACCADIVE_SEA", "COLOMBO_APPROACH"],
    ["COLOMBO_APPROACH", "COLOMBO"],
];

const radians = (value) => value * Math.PI / 180;
const distanceNm = (a, b) => {
    const dLat = radians(b.latitude - a.latitude);
    const dLon = radians(b.longitude - a.longitude);
    const lat1 = radians(a.latitude);
    const lat2 = radians(b.latitude);
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
    return 3440.065 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
};

const graph = new Map(Object.keys(NODES).map((key) => [key, []]));
for (const [a, b] of EDGES) {
    const weight = distanceNm(NODES[a], NODES[b]);
    graph.get(a).push({ key: b, weight });
    graph.get(b).push({ key: a, weight });
}

const planMarineRoute = (originKey, destinationKey) => {
    if (!PORTS[originKey] || !PORTS[destinationKey]) throw Object.assign(new Error("Select supported origin and destination ports"), { status: 400 });
    if (originKey === destinationKey) throw Object.assign(new Error("Origin and destination ports must be different"), { status: 400 });
    const distances = new Map(Object.keys(NODES).map((key) => [key, Infinity]));
    const previous = new Map();
    const remaining = new Set(Object.keys(NODES));
    distances.set(originKey, 0);
    while (remaining.size) {
        const current = [...remaining].reduce((best, key) => distances.get(key) < distances.get(best) ? key : best);
        remaining.delete(current);
        if (current === destinationKey || !Number.isFinite(distances.get(current))) break;
        for (const edge of graph.get(current)) {
            if (!remaining.has(edge.key)) continue;
            const candidate = distances.get(current) + edge.weight;
            if (candidate < distances.get(edge.key)) { distances.set(edge.key, candidate); previous.set(edge.key, current); }
        }
    }
    const path = [];
    for (let key = destinationKey; key; key = previous.get(key)) { path.unshift(key); if (key === originKey) break; }
    if (path[0] !== originKey) throw Object.assign(new Error("No safe sea corridor is available for this port pair"), { status: 422 });
    return {
        origin: PORTS[originKey], destination: PORTS[destinationKey],
        waypoints: path.slice(1, -1).map((key) => NODES[key]),
        distanceNm: Math.round(distances.get(destinationKey) * 10) / 10,
        planner: "CURATED_SEA_CORRIDOR_V1",
    };
};

const listPorts = () => Object.values(PORTS);
module.exports = { listPorts, planMarineRoute, distanceNm };
