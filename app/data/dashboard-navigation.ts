import { Contact, Film, Image, Images, LayoutDashboard, LayoutTemplate, MessageSquare, Newspaper, Radio, Share2, Users, type LucideIcon } from "lucide-react";

export type DashboardNavigationItem = { href: string; label: string; icon: LucideIcon; exact?: boolean };
export type DashboardNavigationGroup = { label: string; items: DashboardNavigationItem[] };

export const dashboardNavigation: DashboardNavigationGroup[] = [
  { label: "Overview", items: [{ href: "/dashboard", label: "Overview", icon: LayoutDashboard, exact: true }] },
  { label: "Content", items: [
    { href: "/dashboard/programs", label: "Programs", icon: Radio },
    { href: "/dashboard/episodes", label: "Episodes", icon: Film },
    { href: "/dashboard/articles", label: "Articles", icon: Newspaper },
    { href: "/dashboard/gallery", label: "Gallery", icon: Image },
  ] },
  { label: "People and Engagement", items: [
    { href: "/dashboard/team", label: "Team", icon: Users },
    { href: "/dashboard/comments", label: "Comments", icon: MessageSquare },
  ] },
  { label: "Site Management", items: [
    { href: "/dashboard/site-settings/social-links", label: "Social Links", icon: Share2 },
    { href: "/dashboard/site-settings/contact", label: "Contact Information", icon: Contact },
    { href: "/dashboard/site-settings/page-heroes", label: "Page Heroes", icon: Images },
    { href: "/dashboard/page-sections", label: "Homepage Sections (Legacy)", icon: LayoutTemplate },
  ] },
];

export function dashboardRouteIsActive(pathname: string, item: DashboardNavigationItem) {
  return item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);
}
