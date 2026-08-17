import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Settings, Users, UsersRound, CalendarClock, Building2, BarChart3, ScrollText, Network, Globe,
} from "lucide-react";

const links = [
  { title: "Users", href: "/admin/users", desc: "Create and update accounts, roles, departments", icon: Users },
  { title: "Teams", href: "/admin/teams", desc: "Assign managers and members", icon: UsersRound },
  { title: "Shifts", href: "/admin/shifts", desc: "Define hours and assign employees", icon: CalendarClock },
  { title: "Departments", href: "/admin/departments", desc: "Organize people by department", icon: Building2 },
  { title: "Analytics", href: "/admin/analytics", desc: "Monthly hours, late/early, WFH mix", icon: BarChart3 },
  { title: "Audit logs", href: "/admin/audit-logs", desc: "Clock-in/out and admin actions", icon: ScrollText },
  { title: "Trusted IPs", href: "/admin/ip-config", desc: "Office CIDR ranges for SITE vs WFH", icon: Network },
  { title: "History", href: "/admin/browser-history", desc: "Employee browser activity", icon: Globe },
];

const AdminPage = () => {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="page-heading">Admin</h1>
        <p className="page-subheading">Manage people, shifts, policies, and monitoring</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {links.map((item) => (
          <Link key={item.href} to={item.href} id={`admin-link-${item.href.replace(/\W+/g, "-")}`}>
            <Card className="card-premium card-interactive h-full">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="section-label">{item.title}</CardTitle>
                <div className="stat-icon">
                  <item.icon className="h-[18px] w-[18px] text-primary" />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
      <Card className="card-premium">
        <CardHeader>
          <CardTitle className="text-sm font-display font-semibold flex items-center gap-2">
            <Settings className="h-4 w-4 text-primary" /> Quick note
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            User, team, and department changes take effect immediately. Redeploy edge functions after backend edits.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminPage;
