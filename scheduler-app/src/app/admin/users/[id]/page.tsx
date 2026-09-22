import { redirect } from "next/navigation";

export default async function UserAccountRedirect({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/admin/accounts/${id}`);
}
