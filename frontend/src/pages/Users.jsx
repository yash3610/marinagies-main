import { useEffect, useMemo, useState } from "react";
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
} from "lucide-react";
import api from "../services/api";

const Users = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [search, setSearch] = useState("");
    const [roleFilter, setRoleFilter] = useState("ALL");
    const [statusFilter, setStatusFilter] = useState("ALL");

    const [showModal, setShowModal] = useState(false);
    const [editingUser, setEditingUser] = useState(null);

    const [menuUser, setMenuUser] = useState(null);

    const [form, setForm] = useState({
        name: "",
        email: "",
        password: "",
        role: "BRIDGE_OFFICER",
        active: true,
    });

    /* ========================================================= */
    /* LOAD USERS */
    /* ========================================================= */

    const fetchUsers = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await api.get("/users");

            setUsers(response.data?.users || []);
        } catch (err) {
            console.error("Users loading error:", err);

            setError(
                err.response?.data?.message ||
                "Failed to load users."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

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
        setEditingUser(null);

        setForm({
            name: "",
            email: "",
            password: "",
            role: "BRIDGE_OFFICER",
            active: true,
        });

        setShowModal(true);
    };

    /* ========================================================= */
    /* OPEN EDIT */
    /* ========================================================= */

    const openEditUser = (user) => {
        setEditingUser(user);

        setForm({
            name: user.name || "",
            email: user.email || "",
            password: "",
            role: user.role || "BRIDGE_OFFICER",
            active: user.active ?? true,
        });

        setMenuUser(null);
        setShowModal(true);
    };

    /* ========================================================= */
    /* FORM CHANGE */
    /* ========================================================= */

    const handleChange = (e) => {
        const { name, value } = e.target;

        setForm((current) => ({
            ...current,
            [name]: value,
        }));
    };

    /* ========================================================= */
    /* SAVE USER */
    /* ========================================================= */

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            setError("");

            if (editingUser) {
                const payload = {
                    name: form.name,
                    email: form.email,
                    role: form.role,
                    active: form.active,
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
                    onChange={handleChange}
                    onClose={() =>
                        setShowModal(false)
                    }
                    onSubmit={handleSubmit}
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

                    {menuUser === user._id && (
                        <div className="absolute right-0 top-10 z-50 w-44 rounded-lg border border-slate-700 bg-slate-950 shadow-2xl overflow-hidden">

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
                        </div>
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

const UserModal = ({
    editingUser,
    form,
    onChange,
    onClose,
    onSubmit,
}) => {
    return (
        <div className="fixed inset-0 z-[2000] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">

            <div className="w-full max-w-lg rounded-xl border border-slate-700 bg-slate-950 shadow-2xl">

                {/* HEADER */}

                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
                    <div>
                        <h2 className="text-sm font-semibold text-white">
                            {editingUser
                                ? "Edit User"
                                : "Add New User"}
                        </h2>

                        <p className="text-[9px] text-slate-600 mt-1">
                            Configure platform access and permissions
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="w-8 h-8 rounded-lg hover:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-white transition"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* FORM */}

                <form
                    onSubmit={onSubmit}
                    className="p-5 space-y-4"
                >

                    {/* NAME */}

                    <div>
                        <label className="block text-[10px] text-slate-500 mb-1.5">
                            Full Name
                        </label>

                        <input
                            name="name"
                            value={form.name}
                            onChange={onChange}
                            required
                            placeholder="Enter full name"
                            className="w-full h-10 px-3 rounded-lg border border-slate-800 bg-slate-900 text-xs text-white placeholder:text-slate-600 outline-none focus:border-cyan-500/50"
                        />
                    </div>

                    {/* EMAIL */}

                    <div>
                        <label className="block text-[10px] text-slate-500 mb-1.5">
                            Email Address
                        </label>

                        <input
                            type="email"
                            name="email"
                            value={form.email}
                            onChange={onChange}
                            required
                            placeholder="user@marine-aegis.local"
                            className="w-full h-10 px-3 rounded-lg border border-slate-800 bg-slate-900 text-xs text-white placeholder:text-slate-600 outline-none focus:border-cyan-500/50"
                        />
                    </div>

                    {/* PASSWORD */}

                    <div>
                        <label className="block text-[10px] text-slate-500 mb-1.5">
                            {editingUser
                                ? "New Password (optional)"
                                : "Password"}
                        </label>

                        <input
                            type="password"
                            name="password"
                            value={form.password}
                            onChange={onChange}
                            required={!editingUser}
                            minLength={6}
                            placeholder={
                                editingUser
                                    ? "Leave blank to keep current password"
                                    : "Minimum 6 characters"
                            }
                            className="w-full h-10 px-3 rounded-lg border border-slate-800 bg-slate-900 text-xs text-white placeholder:text-slate-600 outline-none focus:border-cyan-500/50"
                        />
                    </div>

                    {/* ROLE */}

                    <div>
                        <label className="block text-[10px] text-slate-500 mb-1.5">
                            Role
                        </label>

                        <div className="relative">
                            <select
                                name="role"
                                value={form.role}
                                onChange={onChange}
                                className="appearance-none w-full h-10 px-3 pr-9 rounded-lg border border-slate-800 bg-slate-900 text-xs text-slate-300 outline-none focus:border-cyan-500/50"
                            >
                                <option value="ADMIN">
                                    Administrator
                                </option>

                                <option value="SHORE_SECURITY_ANALYST">
                                    Shore Security Analyst
                                </option>

                                <option value="BRIDGE_OFFICER">
                                    Bridge Officer
                                </option>
                            </select>

                            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-600" />
                        </div>
                    </div>

                    {/* ACTIVE */}

                    <label className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/50 px-3 py-3 cursor-pointer">
                        <div className="flex items-center gap-2">
                            {form.active ? (
                                <UserCheck className="w-4 h-4 text-emerald-400" />
                            ) : (
                                <UserX className="w-4 h-4 text-slate-500" />
                            )}

                            <div>
                                <p className="text-[10px] text-slate-300">
                                    Account Status
                                </p>

                                <p className="text-[9px] text-slate-600 mt-0.5">
                                    {form.active
                                        ? "User can access the platform"
                                        : "User access is disabled"}
                                </p>
                            </div>
                        </div>

                        <input
                            type="checkbox"
                            checked={form.active}
                            onChange={(e) =>
                                setFormSafe(
                                    e.target.checked,
                                    onChange
                                )
                            }
                            className="accent-cyan-400"
                        />
                    </label>

                    {/* ACTIONS */}

                    <div className="flex justify-end gap-2 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2.5 rounded-lg border border-slate-800 text-xs text-slate-400 hover:text-white hover:bg-slate-900 transition"
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            className="px-4 py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-xs font-semibold text-slate-950 transition"
                        >
                            {editingUser
                                ? "Update User"
                                : "Create User"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

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

const setFormSafe = (value, onChange) => {
    onChange({
        target: {
            name: "active",
            value,
        },
    });
};

export default Users;