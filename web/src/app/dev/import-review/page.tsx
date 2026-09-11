import { notFound } from "next/navigation";
import { ImportReview } from "@/components/plans/import/ImportReview";
export const dynamic = "force-dynamic";
export default function Page() {
  if (process.env.NODE_ENV !== "development") notFound();
  return <ImportReview />;
}
