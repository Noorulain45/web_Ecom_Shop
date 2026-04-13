interface StatCardProps {
  title: string;
  value: string | number;
  icon: string;
}

export default function StatCard({ title, value, icon }: StatCardProps) {
  return (
    <div className="bg-white rounded-lg p-4 flex-1 min-w-0 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-gray-500 font-medium">{title}</span>
      </div>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-[#1a3a5c] rounded-lg flex items-center justify-center text-white text-lg">
          {icon}
        </div>
        <p className="text-xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  );
}
