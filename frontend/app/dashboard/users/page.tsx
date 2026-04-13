"use client";
import { useEffect, useState, useCallback } from "react";

type Role = "user" | "admin" | "superadmin";

interface UserRecord {
  _id: string;
  name: string;
  email: string;
  role: Role;
  isBlocked: boolean;
  createdAt: string;
}

const roleBadge: Record<Role, string> = {
  user: "bg-gray-100 text-gray-600",
  admin: "bg-blue-100 text-blue-700",
  superadmin: "bg-purple-100 text-purple-700",
};

type Tab = "all" | "user" | "admin";

export default function UsersPage() {
  const [tab, setTab] = useState<Tab>("all");
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const url = tab === "all" ? "/api/users" : `/api/users?role=${tab}`;
    const data = await fetch(url).then((r) => r.json()).catch(() => []);
    setUsers(Array.isArray(data) ? data : []);
    setLoading(false);
  }, [tab]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  async function toggleBlock(user: UserRecord) {
    setBusy(user._id);
    const res = await fetch(`/api/users/${user._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isBlocked: !user.isBlocked }),
    });
    if (res.ok) {
      const updated = await res.json();
      setUsers((prev) => prev.map((u) => (u._id === updated._id ? updated : u)));
    }
    setBusy(null);
  }

  async function deleteUser(id: string) {
    if (!confirm("Delete this account permanently?")) return;
    setBusy(id);
    const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
    if (res.ok) setUsers((prev) => prev.filter((u) => u._id !== id));
    setBusy(null);
  }

  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  const tabs: { key: Tab; label: string }[] = [
    { key: "all", label: "All" },
    { key: "user", label: "Users" },
    { key: "admin", label: "Admins" },
  ];

  return (
    <div className="flex-1 p-4 md:p-6 flex flex-col gap-5">
      <div>
        <h1 className="text-lg md:text-xl font-bold text-gray-900">User Management</h1>
        <p className="text-xs text-gray-400 mt-0.5">Home &gt; Dashboard &gt; Users</p>
      </div>

      {/* Tabs + Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-1.5 text-xs font-medium rounded-md transition-colors ${
                tab === t.key ? "bg-white text-[#1a3a5c] shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <input
          type="text"
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm w-full sm:w-64 focus:outline-none focus:ring-1 focus:ring-[#1a3a5c]"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                {["Name", "Email", "Role", "Status", "Joined", "Actions"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={6} className="py-10 text-center text-gray-400 text-xs">Loading...</td></tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr><td colSpan={6} className="py-10 text-center text-gray-400 text-xs">No users found.</td></tr>
              )}
              {filtered.map((user) => {
                const isBusy = busy === user._id;
                return (
                  <tr key={user._id} className={`border-b border-gray-50 hover:bg-gray-50 transition-opacity ${isBusy ? "opacity-50 pointer-events-none" : ""}`}>
                    {/* Name */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-[#1a3a5c] flex items-center justify-center text-white text-xs font-bold shrink-0">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium text-gray-800">{user.name}</span>
                      </div>
                    </td>
                    {/* Email */}
                    <td className="px-4 py-3 text-gray-500">{user.email}</td>
                    {/* Role */}
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${roleBadge[user.role]}`}>
                        {user.role}
                      </span>
                    </td>
                    {/* Status */}
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        user.isBlocked ? "bg-red-100 text-red-600" : "bg-green-100 text-green-600"
                      }`}>
                        {user.isBlocked ? "Blocked" : "Active"}
                      </span>
                    </td>
                    {/* Joined */}
                    <td className="px-4 py-3 text-gray-400 text-xs">
                      {new Date(user.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </td>
                    {/* Actions */}
                    <td className="px-4 py-3">
                      {user.role !== "superadmin" && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => toggleBlock(user)}
                            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                              user.isBlocked
                                ? "bg-green-50 text-green-600 hover:bg-green-100"
                                : "bg-red-50 text-red-500 hover:bg-red-100"
                            }`}
                          >
                            {user.isBlocked ? "Unblock" : "Block"}
                          </button>
                          <button
                            onClick={() => deleteUser(user._id)}
                            className="p-1.5 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                            title="Delete user"
                          >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer count */}
        {!loading && (
          <div className="px-4 py-3 border-t border-gray-100 text-xs text-gray-400">
            {filtered.length} {filtered.length === 1 ? "record" : "records"}
          </div>
        )}
      </div>
    </div>
  );
}
