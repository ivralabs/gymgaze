import { redirect } from "next/navigation";

// Static Sites currently lives as a tab on the Screens page.
// Query param survives server-side redirect (hashes don't).
export default function Page() {
  redirect("/admin/screens?tab=static-sites");
}
