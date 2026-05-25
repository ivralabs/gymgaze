import { redirect } from "next/navigation";

// Static Sites currently lives as a tab on the Screens page.
// Use a hash so ScreensTabsWrapper auto-selects the Static Sites tab.
export default function Page() {
  redirect("/admin/screens#static-sites");
}
