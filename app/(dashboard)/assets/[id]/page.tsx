import Link from "next/link";
import { notFound } from "next/navigation";
import { Edit, ArrowLeft } from "lucide-react";
import { getCurrentUser } from "@/lib/dal";
import { getDb } from "@/lib/db/client";
import { PageHeader } from "@/components/ui/PageHeader";
import { AssetStatusBadge } from "@/components/ui/Badge";
import { formatDate, formatDateTime } from "@/lib/format";
import { deleteAsset } from "@/app/actions/assets";

export default async function AssetDetailPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const user = await getCurrentUser();
  const db = getDb();

  const asset = db.prepare(`
    SELECT a.*, d.name as department_name, u.name as created_by_name
    FROM assets a
    LEFT JOIN departments d ON a.department_id = d.id
    LEFT JOIN users u ON a.created_by = u.id
    WHERE a.id = ?
  `).get(parseInt(id)) as any;

  if (!asset) notFound();

  return (
    <div>
      <div className="mb-4">
        <Link href="/assets" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
          <ArrowLeft className="h-4 w-4" /> Back to Assets
        </Link>
      </div>

      <PageHeader
        title={asset.asset_id}
        subtitle={asset.asset_type}
        actions={
          user.role === "INVENTORY_MANAGER" ? (
            <div className="flex gap-2">
              <Link href={`/assets/${id}/edit`} className="inline-flex items-center gap-2 px-3 py-2 border border-gray-300 text-sm rounded-lg hover:bg-gray-50">
                <Edit className="h-4 w-4" /> Edit
              </Link>
              {asset.status === "Available" && (
                <form action={async () => { "use server"; await deleteAsset(parseInt(id)); }}>
                  <button type="submit" className="px-3 py-2 bg-red-50 text-red-600 border border-red-200 text-sm rounded-lg hover:bg-red-100">
                    Delete
                  </button>
                </form>
              )}
            </div>
          ) : undefined
        }
      />

      <div className="max-w-2xl">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Asset Details</h3>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-4 text-sm">
            {([
              ["Asset ID", asset.asset_id],
              ["Type", asset.asset_type],
              ["Department", asset.department_name ?? "—"],
              ["Added By", asset.created_by_name],
              ["Added On", formatDateTime(asset.created_at)],
              ["Last Updated", formatDate(asset.updated_at)],
            ] as [string, string][]).map(([label, value]) => (
              <div key={label}>
                <dt className="text-gray-500">{label}</dt>
                <dd className="font-medium text-gray-900">{value}</dd>
              </div>
            ))}
            <div>
              <dt className="text-gray-500">Status</dt>
              <dd><AssetStatusBadge status={asset.status} /></dd>
            </div>
            {asset.serial_number && (
              <div>
                <dt className="text-gray-500">Serial Number</dt>
                <dd className="font-mono text-sm text-gray-900">{asset.serial_number}</dd>
              </div>
            )}
            {asset.issued_date && (
              <div>
                <dt className="text-gray-500">Issue Date</dt>
                <dd className="font-medium text-gray-900">{formatDate(asset.issued_date)}</dd>
              </div>
            )}
            {asset.end_of_life_date && (
              <div>
                <dt className="text-gray-500">End of Life</dt>
                <dd className="font-medium text-gray-900">{formatDate(asset.end_of_life_date)}</dd>
              </div>
            )}
          </dl>
          {asset.description && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs font-medium text-gray-500 mb-1">Description</p>
              <p className="text-sm text-gray-700">{asset.description}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
