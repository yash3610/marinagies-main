import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
    Users as UsersIcon,
    UserPlus,
    Search,
    Shield,
    UserCheck,
    UserX,
    MoreVertical,
    Edit3,
    Trash2,
    Lock,
    Unlock,
    X,
    Mail,
    CalendarDays,
    ChevronDown,
    KeyRound,
    Ship,
    Check,
} from "lucide-react";
import api from "../services/api";

const Users = () => {
    const [users, setUsers] = useState([]);
    const [vessels, setVessels] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [search, setSearch] = useState("");
    const [roleFilter, setRoleFilter] = useState("ALL");
    const [statusFilter, setStatusFilter] = useState("ALL");

    const [showModal, setShowModal] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [saving, setSaving] = useState(false);

    const [menuUser, setMenuUser] = useState(null);

    const [form, setForm] = useState({
        name: "",
        email: "",
        password: "",
        role: "BRIDGE_OFFICER",
        active: true,
        allVessels: false,
        vesselAccess: [],
    });

    /* ========================================================= */
    /* LOAD USERS */
    /* ========================================================= */

    const fetchUsers = useCallback(async () => {
        try {
            setLoading(true);
            setError("");

            const [usersResponse, vesselsResponse] = await Promise.all([
                api.get("/users"),
                api.get("/vessels"),
            ]);

            setUsers(usersResponse.data?.users || []);
            setVessels(vesselsResponse.data?.vessels || []);
        } catch (err) {
            console.error("Users loading error:", err);

            setError(
                err.response?.data?.message ||
                "Failed to load users."
            );
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const timer = window.setTimeout(fetchUsers, 0);
        return () => window.clearTimeout(timer);
    }, [fetchUsers]);

    /* ========================================================= */
    /* FILTER USERS */
    /* ========================================================= */

    const filteredUsers = useMemo(() => {
        return users.filter((user) => {
            const searchValue = search.toLowerCase();

            const matchesSearch =
                user.name?.toLowerCase().includes(searchValue) ||
                user.email?.toLowerCase().includes(searchValue);

            const matchesRole =
                roleFilter === "ALL" ||
                user.role === roleFilter;

            const matchesStatus =
                statusFilter === "ALL" ||
                (statusFilter === "ACTIVE"
                    ? user.active
                    : !user.active);

            return (
                matchesSearch &&
                matchesRole &&
                matchesStatus
            );
        });
    }, [
        users,
        search,
        roleFilter,
        statusFilter,
    ]);

    /* ========================================================= */
    /* STATS */
    /* ========================================================= */

    const stats = useMemo(() => {
        return {
            total: users.length,

            active: users.filter(
                (user) => user.active
            ).length,

            inactive: users.filter(
                (user) => !user.active
            ).length,

            admins: users.filter(
                (user) => user.role === "ADMIN"
            ).length,
        };
    }, [users]);

    /* ========================================================= */
    /* OPEN ADD */
    /* ========================================================= */

    const openAddUser = () => {
        setError("");
        setEditingUser(null);

        setForm({
            name: "",
            email: "",
            password: "",
            role: "BRIDGE_OFFICER",
            active: true,
            allVessels: false,
            vesselAccess: [],
        });

        setShowModal(true);
    };

    /* ========================================================= */
    /* OPEN EDIT */
    /* ========================================================= */

    const openEditUser = (user) => {
        setError("");
        setEditingUser(user);

        setForm({
            name: user.name || "",
            email: user.email || "",
            password: "",
            role: user.role || "BRIDGE_OFFICER",
            active: user.active ?? true,
            allVessels: user.allVessels ?? false,
            vesselAccess: (user.vesselAccess || []).map((item) =>
                typeof item === "string" ? item : item._id
            ),
        });

        setMenuUser(null);
        setShowModal(true);
    };

    /* ========================================================= */
    /* FORM CHANGE */
    /* ========================================================= */

    const handleChange = (e) => {
        const { name, value, type, checked, selectedOptions } = e.target;
        const nextValue = name === "vesselAccess"
            ? Array.from(selectedOptions || [], (option) => option.value)
            : type === "checkbox"
                ? checked
                : value;

        setForm((current) => ({
            ...current,
            [name]: nextValue,
        }));
    };

    /* ========================================================= */
    /* SAVE USER */
    /* ========================================================= */

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            setSaving(true);
            setError("");

            if (editingUser) {
                const payload = {
                    name: form.name,
                    email: form.email,
                    role: form.role,
                    active: form.active,
                    allVessels: form.allVessels,
                    vesselAccess: form.vesselAccess,
                };

                if (form.password.trim()) {
                    payload.password =
                        form.password;
                }

                await api.put(
                    `/users/${editingUser._id}`,
                    payload
                );
            } else {
                await api.post("/users", form);
            }

            setShowModal(false);
            setEditingUser(null);

            await fetchUsers();
        } catch (err) {
            console.error("Save user error:", err);

            setError(
                err.response?.data?.message ||
                "Failed to save user."
            );
        } finally {
            setSaving(false);
        }
    };

    /* ========================================================= */
    /* TOGGLE STATUS */
    /* ========================================================= */

    const toggleUserStatus = async (user) => {
        try {
            setMenuUser(null);

            await api.put(`/users/${user._id}`, {
                active: !user.active,
            });

            await fetchUsers();
        } catch (err) {
            console.error(
                "Status update error:",
                err
            );

            setError(
                err.response?.data?.message ||
                "Failed to update user status."
            );
        }
    };

    /* ========================================================= */
    /* DELETE USER */
    /* ========================================================= */

    const deleteUser = async (user) => {
        const confirmed = window.confirm(
            `Delete ${user.name}?`
        );

        if (!confirmed) return;

        try {
            setMenuUser(null);

            await api.delete(
                `/users/${user._id}`
            );

            await fetchUsers();
        } catch (err) {
            console.error(
                "Delete user error:",
                err
            );

            setError(
                err.response?.data?.message ||
                "Failed to delete user."
            );
        }
    };

    /* ========================================================= */
    /* LOADING */
    /* ========================================================= */

    if (loading) {
        return (
            <div className="min-h-[500px] flex items-center justify-center">
                <div className="flex items-center gap-3 text-cyan-400">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />

                    <span className="text-sm">
                        Loading MARINEAEGIS users...
                    </span>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4 pb-6">

            {/* ================================================= */}
            {/* HEADER */}
            {/* ================================================= */}

            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">

                <div>
                    <div className="flex items-center gap-2">
                        <UsersIcon className="w-5 h-5 text-cyan-400" />

                        <h1 className="text-xl font-semibold text-white">
                            Users
                        </h1>
                    </div>

                    <p className="text-xs text-slate-500 mt-1">
                        Manage MARINEAEGIS platform users and access roles
                    </p>
                </div>

                <button
                    type="button"
                    onClick={openAddUser}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-semibold transition shadow-lg shadow-cyan-500/10"
                >
                    <UserPlus className="w-4 h-4" />
                    Add User
                </button>
            </div>

            {/* ================================================= */}
            {/* ERROR */}
            {/* ================================================= */}

            {error && (
                <div className="flex items-center justify-between rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3">
                    <div className="flex items-center gap-2 text-red-400">
                        <UserX className="w-4 h-4" />
                        <span className="text-xs">
                            {error}
                        </span>
                    </div>

                    <button
                        type="button"
                        onClick={() => setError("")}
                        className="text-red-400 hover:text-white"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* ================================================= */}
            {/* STATS */}
            {/* ================================================= */}

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">

                <UserStat
                    title="Total Users"
                    value={stats.total}
                    icon={UsersIcon}
                    iconBg="bg-cyan-500/10"
                    iconColor="text-cyan-400"
                />

                <UserStat
                    title="Active Users"
                    value={stats.active}
                    icon={UserCheck}
                    iconBg="bg-emerald-500/10"
                    iconColor="text-emerald-400"
                />

                <UserStat
                    title="Inactive Users"
                    value={stats.inactive}
                    icon={UserX}
                    iconBg="bg-slate-500/10"
                    iconColor="text-slate-400"
                />

                <UserStat
                    title="Administrators"
                    value={stats.admins}
                    icon={Shield}
                    iconBg="bg-red-500/10"
                    iconColor="text-red-400"
                />
            </div>

            {/* ================================================= */}
            {/* USERS PANEL */}
            {/* ================================================= */}

            <section className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">

                {/* FILTER BAR */}

                <div className="p-4 border-b border-slate-800">

                    <div className="flex flex-col xl:flex-row gap-3">

                        {/* SEARCH */}

                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />

                            <input
                                type="text"
                                value={search}
                                onChange={(e) =>
                                    setSearch(
                                        e.target.value
                                    )
                                }
                                placeholder="Search by name or email..."
                                className="w-full h-10 pl-10 pr-4 rounded-lg border border-slate-800 bg-slate-950 text-xs text-slate-200 placeholder:text-slate-600 outline-none focus:border-cyan-500/50 transition"
                            />
                        </div>

                        {/* ROLE */}

                        <FilterSelect
                            value={roleFilter}
                            onChange={setRoleFilter}
                            options={[
                                {
                                    value: "ALL",
                                    label: "All Roles",
                                },
                                {
                                    value: "ADMIN",
                                    label: "Administrator",
                                },
                                {
                                    value: "SHORE_SECURITY_ANALYST",
                                    label: "Security Analyst",
                                },
                                {
                                    value: "BRIDGE_OFFICER",
                                    label: "Bridge Officer",
                                },
                                { value: "BRIDGE_CREW", label: "Bridge Crew" },
                                { value: "NETWORK_SECURITY", label: "Network Security" },
                                { value: "ROC_OPERATOR", label: "ROC Operator" },
                                { value: "FLEET_MANAGER", label: "Fleet Manager" },
                                { value: "COMPLIANCE_AUDITOR", label: "Compliance Auditor" },
                            ]}
                        />

                        {/* STATUS */}

                        <FilterSelect
                            value={statusFilter}
                            onChange={setStatusFilter}
                            options={[
                                {
                                    value: "ALL",
                                    label: "All Status",
                                },
                                {
                                    value: "ACTIVE",
                                    label: "Active",
                                },
                                {
                                    value: "INACTIVE",
                                    label: "Inactive",
                                },
                            ]}
                        />
                    </div>
                </div>

                {/* ================================================= */}
                {/* TABLE */}
                {/* ================================================= */}

                <div className="overflow-x-auto">

                    <table className="w-full min-w-[900px]">

                        <thead>
                            <tr className="border-b border-slate-800 bg-slate-950/40">

                                <TableHead>
                                    User
                                </TableHead>

                                <TableHead>
                                    Role
                                </TableHead>

                                <TableHead>
                                    Status
                                </TableHead>

                                <TableHead>
                                    Created
                                </TableHead>

                                <TableHead align="right">
                                    Actions
                                </TableHead>
                            </tr>
                        </thead>

                        <tbody>
                            {filteredUsers.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan="5"
                                        className="py-16 text-center"
                                    >
                                        <div className="flex flex-col items-center">
                                            <UsersIcon className="w-8 h-8 text-slate-700 mb-3" />

                                            <p className="text-xs text-slate-500">
                                                No users found
                                            </p>

                                            <p className="text-[10px] text-slate-700 mt-1">
                                                Try changing your filters
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredUsers.map(
                                    (user) => (
                                        <UserRow
                                            key={
                                                user._id
                                            }
                                            user={user}
                                            menuUser={
                                                menuUser
                                            }
                                            setMenuUser={
                                                setMenuUser
                                            }
                                            onEdit={
                                                openEditUser
                                            }
                                            onToggle={
                                                toggleUserStatus
                                            }
                                            onDelete={
                                                deleteUser
                                            }
                                        />
                                    )
                                )
                            )}
                        </tbody>
                    </table>
                </div>

                {/* FOOTER */}

                <div className="px-4 py-3 border-t border-slate-800 flex items-center justify-between">
                    <span className="text-[10px] text-slate-600">
                        Showing{" "}
                        <span className="text-slate-400">
                            {filteredUsers.length}
                        </span>{" "}
                        of{" "}
                        <span className="text-slate-400">
                            {users.length}
                        </span>{" "}
                        users
                    </span>

                    <span className="text-[9px] text-slate-700">
                        MARINEAEGIS Access Management
                    </span>
                </div>
            </section>

            {/* ================================================= */}
            {/* MODAL */}
            {/* ================================================= */}

            {showModal && (
                <UserModal
                    editingUser={editingUser}
                    form={form}
                    vessels={vessels}
                    onChange={handleChange}
                    onFormPatch={(patch) => setForm((current) => ({ ...current, ...patch }))}
                    onClose={() =>
                        setShowModal(false)
                    }
                    onSubmit={handleSubmit}
                    error={error}
                    saving={saving}
                />
            )}
        </div>
    );
};

/* ========================================================= */
/* USER STAT */
/* ========================================================= */

const UserStat = ({
    title,
    value,
    icon: Icon,
    iconBg,
    iconColor,
}) => {
    return (
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-4">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-[11px] text-slate-500">
                        {title}
                    </p>

                    <p className="text-2xl font-semibold text-white mt-1">
                        {value}
                    </p>
                </div>

                <div
                    className={`w-11 h-11 rounded-full ${iconBg} flex items-center justify-center`}
                >
                    <Icon
                        className={`w-5 h-5 ${iconColor}`}
                    />
                </div>
            </div>
        </div>
    );
};

/* ========================================================= */
/* TABLE HEAD */
/* ========================================================= */

const TableHead = ({
    children,
    align = "left",
}) => {
    return (
        <th
            className={`px-4 py-3 text-[9px] uppercase tracking-wider text-slate-600 font-medium ${align === "right"
                ? "text-right"
                : "text-left"
                }`}
        >
            {children}
        </th>
    );
};

/* ========================================================= */
/* USER ROW */
/* ========================================================= */

const UserRow = ({
    user,
    menuUser,
    setMenuUser,
    onEdit,
    onToggle,
    onDelete,
}) => {
    const triggerRef = useRef(null);
    const menuRef = useRef(null);
    const isMenuOpen = menuUser === user._id;

    useLayoutEffect(() => {
        if (!isMenuOpen) return;

        const trigger = triggerRef.current;
        const menu = menuRef.current;
        const rect = trigger.getBoundingClientRect();
        const gap = 8;
        const height = menu.offsetHeight;
        const below = window.innerHeight - rect.bottom - gap * 2;
        const above = rect.top - gap * 2;
        const openAbove = below < height && above > below;
        const availableHeight = Math.max(0, openAbove ? above : below);
        menu.style.maxHeight = `${availableHeight}px`;
        menu.style.top = `${openAbove
            ? Math.max(gap, rect.top - Math.min(height, availableHeight) - gap)
            : rect.bottom + gap}px`;
        menu.style.left = `${Math.max(gap, Math.min(
            rect.right - menu.offsetWidth,
            window.innerWidth - menu.offsetWidth - gap,
        ))}px`;

        const close = () => setMenuUser(null);
        const handlePointerDown = (event) => {
            if (!menu.contains(event.target) && !trigger.contains(event.target)) close();
        };
        const handleKeyDown = (event) => {
            if (event.key === "Escape") {
                close();
                trigger.focus();
            }
        };
        const handleScroll = (event) => {
            if (!menu.contains(event.target)) close();
        };
        document.addEventListener("pointerdown", handlePointerDown);
        document.addEventListener("keydown", handleKeyDown);
        window.addEventListener("scroll", handleScroll, true);
        window.addEventListener("resize", close);
        return () => {
            document.removeEventListener("pointerdown", handlePointerDown);
            document.removeEventListener("keydown", handleKeyDown);
            window.removeEventListener("scroll", handleScroll, true);
            window.removeEventListener("resize", close);
        };
    }, [isMenuOpen, setMenuUser]);

    return (
        <tr className="border-b border-slate-800/70 hover:bg-slate-800/20 transition">

            {/* USER */}

            <td className="px-4 py-4">
                <div className="flex items-center gap-3">

                    <div className="w-9 h-9 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shrink-0">
                        <span className="text-xs font-semibold text-cyan-400">
                            {getInitials(user.name)}
                        </span>
                    </div>

                    <div className="min-w-0">
                        <p className="text-xs font-medium text-slate-200 truncate">
                            {user.name}
                        </p>

                        <div className="flex items-center gap-1.5 mt-1">
                            <Mail className="w-3 h-3 text-slate-700" />

                            <p className="text-[9px] text-slate-600 truncate">
                                {user.email}
                            </p>
                        </div>
                    </div>
                </div>
            </td>

            {/* ROLE */}

            <td className="px-4 py-4">
                <RoleBadge role={user.role} />
            </td>

            {/* STATUS */}

            <td className="px-4 py-4">
                <StatusBadge active={user.active} />
            </td>

            {/* CREATED */}

            <td className="px-4 py-4">
                <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                    <CalendarDays className="w-3 h-3" />

                    {formatDate(user.createdAt)}
                </div>
            </td>

            {/* ACTIONS */}

            <td className="px-4 py-4">
                <div className="relative flex justify-end">

                    <button
                        type="button"
                        ref={triggerRef}
                        aria-label={`Actions for ${user.name}`}
                        aria-expanded={isMenuOpen}
                        onClick={() =>
                            setMenuUser(
                                menuUser === user._id
                                    ? null
                                    : user._id
                            )
                        }
                        className="w-8 h-8 rounded-lg border border-slate-800 hover:border-slate-700 hover:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-white transition"
                    >
                        <MoreVertical className="w-4 h-4" />
                    </button>

                    {isMenuOpen && createPortal(
                        <div ref={menuRef} className="fixed z-50 w-44 max-w-[calc(100vw-16px)] rounded-lg border border-slate-700 bg-slate-950 shadow-2xl overflow-y-auto">

                            <button
                                type="button"
                                onClick={() =>
                                    onEdit(user)
                                }
                                className="w-full flex items-center gap-2 px-3 py-2.5 text-left text-[10px] text-slate-400 hover:text-white hover:bg-slate-800 transition"
                            >
                                <Edit3 className="w-3.5 h-3.5" />
                                Edit User
                            </button>

                            <button
                                type="button"
                                onClick={() =>
                                    onToggle(user)
                                }
                                className="w-full flex items-center gap-2 px-3 py-2.5 text-left text-[10px] text-slate-400 hover:text-white hover:bg-slate-800 transition"
                            >
                                {user.active ? (
                                    <>
                                        <Lock className="w-3.5 h-3.5" />
                                        Deactivate
                                    </>
                                ) : (
                                    <>
                                        <Unlock className="w-3.5 h-3.5" />
                                        Activate
                                    </>
                                )}
                            </button>

                            <div className="border-t border-slate-800" />

                            <button
                                type="button"
                                onClick={() =>
                                    onDelete(user)
                                }
                                className="w-full flex items-center gap-2 px-3 py-2.5 text-left text-[10px] text-red-400 hover:bg-red-500/10 transition"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                                Delete User
                            </button>
                        </div>,
                        document.body,
                    )}
                </div>
            </td>
        </tr>
    );
};

/* ========================================================= */
/* ROLE BADGE */
/* ========================================================= */

const RoleBadge = ({ role }) => {
    const config = {
        ADMIN: {
            label: "Administrator",
            className:
                "bg-red-500/10 text-red-400 border-red-500/20",
        },

        SHORE_SECURITY_ANALYST: {
            label: "Security Analyst",
            className:
                "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
        },

        BRIDGE_OFFICER: {
            label: "Bridge Officer",
            className:
                "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
        },
        BRIDGE_CREW: {
            label: "Bridge Crew",
            className: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
        },
        NETWORK_SECURITY: {
            label: "Network Security",
            className: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
        },
        ROC_OPERATOR: {
            label: "ROC Operator",
            className: "bg-purple-500/10 text-purple-400 border-purple-500/20",
        },
        FLEET_MANAGER: {
            label: "Fleet Manager",
            className: "bg-amber-500/10 text-amber-400 border-amber-500/20",
        },
        COMPLIANCE_AUDITOR: {
            label: "Compliance Auditor",
            className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
        },
    };

    const item =
        config[role] || {
            label: role || "Unknown",
            className:
                "bg-slate-500/10 text-slate-400 border-slate-500/20",
        };

    return (
        <span
            className={`inline-flex items-center px-2.5 py-1 rounded-md border text-[9px] font-medium ${item.className}`}
        >
            {item.label}
        </span>
    );
};

/* ========================================================= */
/* STATUS BADGE */
/* ========================================================= */

const StatusBadge = ({ active }) => {
    return (
        <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[9px] font-medium ${active
                ? "bg-emerald-500/10 text-emerald-400"
                : "bg-slate-500/10 text-slate-500"
                }`}
        >
            <span
                className={`w-1.5 h-1.5 rounded-full ${active
                    ? "bg-emerald-400"
                    : "bg-slate-600"
                    }`}
            />

            {active ? "Active" : "Inactive"}
        </span>
    );
};

/* ========================================================= */
/* FILTER SELECT */
/* ========================================================= */

const FilterSelect = ({
    value,
    onChange,
    options,
}) => {
    return (
        <div className="relative">
            <select
                value={value}
                onChange={(e) =>
                    onChange(e.target.value)
                }
                className="appearance-none h-10 min-w-[180px] pl-3 pr-9 rounded-lg border border-slate-800 bg-slate-950 text-xs text-slate-400 outline-none focus:border-cyan-500/50 cursor-pointer"
            >
                {options.map((option) => (
                    <option
                        key={option.value}
                        value={option.value}
                    >
                        {option.label}
                    </option>
                ))}
            </select>

            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-600" />
        </div>
    );
};

/* ========================================================= */
/* USER MODAL */
/* ========================================================= */

const ROLE_OPTIONS = [
    { value: "ADMIN", label: "Administrator", description: "Full platform configuration and access" },
    { value: "SHORE_SECURITY_ANALYST", label: "Shore Security Analyst", description: "Investigate fleet threats and incidents" },
    { value: "BRIDGE_OFFICER", label: "Bridge Officer", description: "Operate assigned vessel workflows" },
    { value: "BRIDGE_CREW", label: "Bridge Crew", description: "View assigned vessel operations" },
    { value: "NETWORK_SECURITY", label: "Network Security", description: "Manage network-defense modules" },
    { value: "ROC_OPERATOR", label: "ROC Operator", description: "Secure remote operations center access" },
    { value: "FLEET_MANAGER", label: "Fleet Manager", description: "Manage fleet-wide operational data" },
    { value: "COMPLIANCE_AUDITOR", label: "Compliance Auditor", description: "Read-only evidence and compliance access" },
];

const UserModal = ({
    editingUser,
    form,
    vessels,
    onChange,
    onFormPatch,
    onClose,
    onSubmit,
    error,
    saving,
}) => {
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [vesselSearch, setVesselSearch] = useState("");
    const closeTimer = useRef(null);

    const requestClose = useCallback(() => {
        if (saving) return;
        setDrawerOpen(false);
        closeTimer.current = window.setTimeout(onClose, 260);
    }, [onClose, saving]);

    useEffect(() => {
        const frame = window.requestAnimationFrame(() => setDrawerOpen(true));
        const closeOnEscape = (event) => { if (event.key === "Escape") requestClose(); };
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        window.addEventListener("keydown", closeOnEscape);
        return () => {
            window.cancelAnimationFrame(frame);
            window.clearTimeout(closeTimer.current);
            document.body.style.overflow = previousOverflow;
            window.removeEventListener("keydown", closeOnEscape);
        };
    }, [requestClose]);

    const selectedIds = useMemo(
        () => new Set((form.vesselAccess || []).map(String)),
        [form.vesselAccess],
    );
    const visibleVessels = useMemo(() => {
        const term = vesselSearch.trim().toLowerCase();
        if (!term) return vessels;
        return vessels.filter((vessel) =>
            vessel.name?.toLowerCase().includes(term)
            || vessel.vesselId?.toLowerCase().includes(term)
        );
    }, [vessels, vesselSearch]);
    const selectedRole = ROLE_OPTIONS.find((role) => role.value === form.role);

    const toggleVessel = (vesselId) => {
        const id = String(vesselId);
        const next = selectedIds.has(id)
            ? form.vesselAccess.filter((item) => String(item) !== id)
            : [...form.vesselAccess, id];
        onFormPatch({ vesselAccess: next });
    };

    return createPortal(
        <div
            role="presentation"
            onMouseDown={(event) => { if (event.target === event.currentTarget) requestClose(); }}
            className={`fixed inset-0 z-[2000] bg-[#020611]/80 backdrop-blur-[6px] transition-opacity duration-300 ${drawerOpen ? "opacity-100" : "opacity-0"}`}
        >
            <aside
                role="dialog"
                aria-modal="true"
                aria-label={editingUser ? "Edit user" : "Add user"}
                className={`absolute inset-y-0 right-0 flex w-full max-w-[760px] flex-col overflow-hidden border-l border-cyan-400/15 bg-[#07111f] shadow-[-32px_0_90px_rgba(0,0,0,.6)] transition-transform duration-300 ease-out ${drawerOpen ? "translate-x-0" : "translate-x-full"}`}
            >
                <header className="relative shrink-0 overflow-hidden border-b border-white/[0.07] px-5 py-5 sm:px-7">
                    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_85%_0%,rgba(34,211,238,.13),transparent_42%)]" />
                    <div className="relative flex items-start justify-between gap-4">
                        <div className="flex min-w-0 items-center gap-3.5">
                            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-cyan-300/20 bg-gradient-to-br from-cyan-400/20 to-blue-600/10 shadow-[0_0_28px_rgba(34,211,238,.1)]">
                                {editingUser ? <Edit3 className="h-5 w-5 text-cyan-300" /> : <UserPlus className="h-5 w-5 text-cyan-300" />}
                            </div>
                            <div className="min-w-0">
                                <p className="text-[10px] font-medium uppercase tracking-[.22em] text-cyan-400/70">Identity & access</p>
                                <h2 className="mt-1 text-xl font-semibold tracking-tight text-white">
                                    {editingUser ? "Edit team member" : "Create team member"}
                                </h2>
                                <p className="mt-1 text-xs text-slate-500">
                                    Configure identity, role and vessel-level access in one place.
                                </p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={requestClose}
                            disabled={saving}
                            aria-label="Close"
                            className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-white/[0.08] bg-white/[0.03] text-slate-500 transition hover:border-white/[0.15] hover:bg-white/[0.07] hover:text-white disabled:opacity-40"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                </header>

                <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col">
                    <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5 sm:px-7 sm:py-6">
                        {error && (
                            <div className="flex items-start gap-3 rounded-2xl border border-red-400/20 bg-red-500/[0.07] px-4 py-3 text-xs text-red-300">
                                <UserX className="mt-0.5 h-4 w-4 shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}

                        <section className="overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.025]">
                            <div className="flex items-center gap-3 border-b border-white/[0.06] px-4 py-3.5 sm:px-5">
                                <div className="grid h-8 w-8 place-items-center rounded-lg bg-cyan-400/10 text-cyan-300">
                                    <UsersIcon className="h-4 w-4" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-medium text-slate-100">Profile information</h3>
                                    <p className="text-[10px] text-slate-600">The details used to identify this operator.</p>
                                </div>
                            </div>
                            <div className="grid gap-4 p-4 sm:grid-cols-2 sm:p-5">
                                <DrawerField label="Full name" icon={UsersIcon}>
                                    <input name="name" value={form.name} onChange={onChange} required placeholder="e.g. Yash Patil" className="user-drawer-input" />
                                </DrawerField>
                                <DrawerField label="Email address" icon={Mail}>
                                    <input type="email" name="email" value={form.email} onChange={onChange} required placeholder="name@marineaegis.local" className="user-drawer-input" />
                                </DrawerField>
                                <div className="sm:col-span-2">
                                    <DrawerField label={editingUser ? "New password · optional" : "Initial password"} icon={KeyRound}>
                                        <input
                                            type="password"
                                            name="password"
                                            value={form.password}
                                            onChange={onChange}
                                            required={!editingUser}
                                            minLength={10}
                                            autoComplete="new-password"
                                            placeholder={editingUser ? "Leave empty to retain the current password" : "Use at least 10 characters"}
                                            className="user-drawer-input"
                                        />
                                    </DrawerField>
                                </div>
                            </div>
                        </section>

                        <section className="overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.025]">
                            <div className="flex items-center gap-3 border-b border-white/[0.06] px-4 py-3.5 sm:px-5">
                                <div className="grid h-8 w-8 place-items-center rounded-lg bg-indigo-400/10 text-indigo-300">
                                    <Shield className="h-4 w-4" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-medium text-slate-100">Role & permissions</h3>
                                    <p className="text-[10px] text-slate-600">Choose the operator's responsibility level.</p>
                                </div>
                            </div>
                            <div className="p-4 sm:p-5">
                                <label className="mb-2 block text-[10px] font-medium uppercase tracking-[.14em] text-slate-500">Platform role</label>
                                <div className="relative">
                                    <select name="role" value={form.role} onChange={onChange} className="user-drawer-input appearance-none pr-10">
                                        {ROLE_OPTIONS.map((role) => <option key={role.value} value={role.value}>{role.label}</option>)}
                                    </select>
                                    <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600" />
                                </div>
                                <div className="mt-3 flex items-start gap-2 rounded-xl border border-indigo-400/10 bg-indigo-400/[0.04] px-3.5 py-3">
                                    <Shield className="mt-0.5 h-3.5 w-3.5 shrink-0 text-indigo-300" />
                                    <p className="text-[11px] leading-relaxed text-slate-500">{selectedRole?.description}</p>
                                </div>
                            </div>
                        </section>

                        <section className="overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.025]">
                            <div className="flex items-center justify-between gap-4 border-b border-white/[0.06] px-4 py-3.5 sm:px-5">
                                <div className="flex min-w-0 items-center gap-3">
                                    <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-emerald-400/10 text-emerald-300">
                                        <Ship className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-medium text-slate-100">Fleet scope</h3>
                                        <p className="text-[10px] text-slate-600">Limit which vessels this user can access.</p>
                                    </div>
                                </div>
                                <span className="shrink-0 rounded-full border border-white/[0.07] bg-white/[0.04] px-2.5 py-1 text-[10px] font-medium text-slate-400">
                                    {form.allVessels ? "Entire fleet" : `${selectedIds.size} selected`}
                                </span>
                            </div>

                            <div className="p-4 sm:p-5">
                                <button
                                    type="button"
                                    onClick={() => onFormPatch({ allVessels: !form.allVessels })}
                                    className={`flex w-full items-center justify-between gap-4 rounded-xl border px-4 py-3.5 text-left transition ${form.allVessels ? "border-cyan-400/25 bg-cyan-400/[0.07]" : "border-white/[0.07] bg-[#07101d] hover:border-white/[0.12]"}`}
                                >
                                    <div>
                                        <p className="text-xs font-medium text-slate-200">Allow access to all vessels</p>
                                        <p className="mt-1 text-[10px] text-slate-600">New vessels will be included automatically.</p>
                                    </div>
                                    <Toggle enabled={form.allVessels} />
                                </button>

                                {!form.allVessels && (
                                    <div className="mt-4">
                                        <div className="relative">
                                            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600" />
                                            <input
                                                value={vesselSearch}
                                                onChange={(event) => setVesselSearch(event.target.value)}
                                                placeholder="Search vessel name or ID"
                                                className="user-drawer-input pl-10"
                                            />
                                        </div>
                                        <div className="mt-3 grid max-h-56 gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
                                            {visibleVessels.map((vessel) => {
                                                const selected = selectedIds.has(String(vessel._id));
                                                return (
                                                    <button
                                                        key={vessel._id}
                                                        type="button"
                                                        onClick={() => toggleVessel(vessel._id)}
                                                        className={`group flex min-w-0 items-center gap-3 rounded-xl border px-3 py-3 text-left transition ${selected ? "border-cyan-400/30 bg-cyan-400/[0.07]" : "border-white/[0.06] bg-[#07101d] hover:border-white/[0.13] hover:bg-white/[0.03]"}`}
                                                    >
                                                        <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${selected ? "bg-cyan-400/15 text-cyan-300" : "bg-white/[0.04] text-slate-600"}`}>
                                                            <Ship className="h-4 w-4" />
                                                        </span>
                                                        <span className="min-w-0 flex-1">
                                                            <span className="block truncate text-[11px] font-medium text-slate-200">{vessel.name}</span>
                                                            <span className="mt-0.5 block font-mono text-[9px] text-slate-600">{vessel.vesselId}</span>
                                                        </span>
                                                        <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-md border transition ${selected ? "border-cyan-300 bg-cyan-300 text-slate-950" : "border-slate-700 bg-slate-950"}`}>
                                                            {selected && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
                                                        </span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                        {!visibleVessels.length && (
                                            <div className="mt-3 rounded-xl border border-dashed border-white/[0.08] py-8 text-center text-xs text-slate-600">No matching vessels found.</div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </section>

                        <section className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4 sm:p-5">
                            <button type="button" onClick={() => onFormPatch({ active: !form.active })} className="flex w-full items-center justify-between gap-4 text-left">
                                <div className="flex items-center gap-3">
                                    <div className={`grid h-9 w-9 place-items-center rounded-xl ${form.active ? "bg-emerald-400/10 text-emerald-300" : "bg-slate-400/10 text-slate-500"}`}>
                                        {form.active ? <UserCheck className="h-4 w-4" /> : <UserX className="h-4 w-4" />}
                                    </div>
                                    <div>
                                        <p className="text-xs font-medium text-slate-200">Account enabled</p>
                                        <p className="mt-1 text-[10px] text-slate-600">{form.active ? "This user can sign in to MarineAegis." : "Sign-in access is currently blocked."}</p>
                                    </div>
                                </div>
                                <Toggle enabled={form.active} />
                            </button>
                        </section>
                    </div>

                    <footer className="shrink-0 border-t border-white/[0.07] bg-[#07111f]/95 px-5 py-4 backdrop-blur-xl sm:px-7">
                        <div className="flex items-center justify-end gap-3">
                            <button type="button" onClick={requestClose} disabled={saving} className="h-11 rounded-xl border border-white/[0.09] px-5 text-xs font-medium text-slate-400 transition hover:bg-white/[0.05] hover:text-white disabled:opacity-40">
                                Cancel
                            </button>
                            <button type="submit" disabled={saving} className="inline-flex h-11 min-w-36 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 to-cyan-500 px-5 text-xs font-semibold text-[#031019] shadow-[0_10px_30px_rgba(34,211,238,.16)] transition hover:brightness-110 disabled:cursor-wait disabled:opacity-60">
                                {saving ? <><span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-slate-900/30 border-t-slate-900" />Saving...</> : editingUser ? "Save changes" : "Create user"}
                            </button>
                        </div>
                    </footer>
                </form>
            </aside>
        </div>,
        document.body,
    );
};

const DrawerField = ({ label, icon: Icon, children }) => (
    <label className="block">
        <span className="mb-2 flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-[.14em] text-slate-500">
            <Icon className="h-3 w-3" />
            {label}
        </span>
        {children}
    </label>
);

const Toggle = ({ enabled }) => (
    <span className={`relative h-6 w-11 shrink-0 rounded-full border transition ${enabled ? "border-cyan-300/40 bg-cyan-400/80" : "border-slate-700 bg-slate-900"}`}>
        <span className={`absolute top-0.5 h-4.5 w-4.5 rounded-full bg-white shadow transition-transform ${enabled ? "translate-x-[21px]" : "translate-x-0.5"}`} />
    </span>
);

/* ========================================================= */
/* HELPERS */
/* ========================================================= */

const getInitials = (name = "") => {
    return (
        name
            .split(" ")
            .filter(Boolean)
            .slice(0, 2)
            .map((part) =>
                part.charAt(0).toUpperCase()
            )
            .join("") || "U"
    );
};

const formatDate = (date) => {
    if (!date) return "--";

    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) {
        return "--";
    }

    return parsed.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
};

export default Users;
