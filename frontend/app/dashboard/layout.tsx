import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0">
        <Topbar />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
        <footer className="bg-white border-t border-gray-200 px-4 md:px-6 py-3 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-400">
          <span>© 2023 pulcron Dashboard</span>
          <div className="flex gap-4">
            <a href="#" className="hover:text-gray-600">About</a>
            <a href="#" className="hover:text-gray-600">Careers</a>
            <a href="#" className="hover:text-gray-600">Policy</a>
            <a href="#" className="hover:text-gray-600">Contact</a>
          </div>
        </footer>
      </div>
    </div>
  );
}
