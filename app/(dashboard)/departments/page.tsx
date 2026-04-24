import Link from "next/link";
import { Plus, Building2, Pencil } from "lucide-react";
import { getCurrentUser } from "@/lib/dal";
import { getDb } from "@/lib/db/client";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { deleteDepartment } from "@/app/actions/departments";
import { formatDate } from "@/lib/format";

export default async function DepartmentsPage() {
  const user = await getCurrentUser();
  if (user.role !== "INVENTORY_MANAGER") redirect("/dashboard");

  const db = getDb();

  const departments = db.prepare(`
    SELECT d.*, COUNT(u.id) as user_count, COUNT(a.id) as asset_count
    FROM departments d
    LEFT JOIN users u ON u.department_id = d.id AND u.is_active = 1
    LEFT JOIN assets a ON a.department_id = d.id
    GROUP BY d.id ORDER BY d.name
  `).all() as any[];

  return (
    <div>
      <PageHeader
        title="Departments"
        subtitle={`${departments.length} departments`}
        actions={
          <Link href="/departments/new" className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700">
            <Plus className="h-4 w-4" /> Add Department
          </Link>
        }
      />

      {departments.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center">
          <Building2 className="h-10 w-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No departments yet</p>
          <p className="text-sm text-gray-400 mb-4">Add your first department to get started.</p>
          <Link href="/departments/new" className="text-sm text-blue-600 hover:text-blue-700 font-medium">Add Department →</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {departments.map((dept) => (
            <div key={dept.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-100 p-2 rounded-lg">
                    <Building2 className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{dept.name}</p>
                    <p className="text-xs text-gray-400">Added {formatDate(dept.created_at)}</p>
                  </div>
                </div>
                <Link href={`/departments/${dept.id}`} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                  <Pencil className="h-4 w-4" />
                </Link>
              </div>
              <div className="flex gap-4 text-sm text-gray-600 border-t border-gray-50 pt-3">
                <span><span className="font-medium text-gray-900">{dept.user_count}</span> users</span>
                <span><span className="font-medium text-gray-900">{dept.asset_count}</span> assets</span>
              </div>
              {dept.user_count === 0 && dept.asset_count === 0 && (
                <div className="mt-3">
                  <form action={async () => { "use server"; await deleteDepartment(dept.id); }}>
                    <button type="submit" className="text-xs text-red-500 hover:text-red-700">Delete</button>
                  </form>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
