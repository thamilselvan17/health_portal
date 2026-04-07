import { Badge } from "@/components/ui/badge";

export function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "pending":
      return <Badge variant="secondary" className="bg-amber-100 text-amber-800 hover:bg-amber-200">Pending</Badge>;
    case "approved":
      return <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 hover:bg-emerald-200">Approved</Badge>;
    case "rejected":
      return <Badge variant="destructive">Rejected</Badge>;
    case "completed":
      return <Badge variant="default" className="bg-blue-100 text-blue-800 hover:bg-blue-200">Completed</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}
