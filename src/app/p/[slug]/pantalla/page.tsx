import { redirect } from "next/navigation";

export default async function PantallaRedirectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  redirect(`/p/${slug}/turnero`);
}
