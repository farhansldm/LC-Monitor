import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { adminApi } from "@/lib/admin-api";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function EmailSettingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [to, setTo] = useState(user?.email || "");

  const { data, isLoading } = useQuery({
    queryKey: ["email-status"],
    queryFn: adminApi.getEmailStatus,
  });

  const testMut = useMutation({
    mutationFn: () => adminApi.sendTestEmail(to.trim() || undefined),
    onSuccess: (res: { sent?: boolean; stubbed?: boolean; error?: string }) => {
      if (res?.stubbed) {
        toast({ title: "Not configured", description: "Set RESEND_API_KEY first.", variant: "destructive" });
        return;
      }
      if (res?.error) {
        toast({ title: "Send failed", description: res.error, variant: "destructive" });
        return;
      }
      toast({ title: "Test email sent", description: `Check ${to.trim() || user?.email}` });
    },
    onError: (e: Error) => toast({ title: "Send failed", description: e.message, variant: "destructive" }),
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="page-heading">Email notifications</h1>
        <p className="page-subheading">Leave, welcome, still clocked-in, and daily hours emails</p>
      </div>

      <Card className="card-premium">
        <CardHeader>
          <CardTitle className="text-sm font-display font-semibold flex items-center gap-2">
            <Mail className="h-4 w-4 text-primary" /> Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoading ? (
            <Skeleton className="h-16 w-full" />
          ) : (
            <>
              <p className="text-sm">
                Resend:{" "}
                <span className={data?.configured ? "text-success font-medium" : "text-destructive font-medium"}>
                  {data?.configured ? "configured" : "not configured"}
                </span>
              </p>
              <p className="text-xs text-muted-foreground font-mono">From: {data?.from}</p>
              {!data?.configured && (
                <p className="text-sm text-muted-foreground">
                  Create a free API key at resend.com, then run:
                  <code className="block mt-2 rounded-md bg-muted p-3 text-xs">
                    npx supabase secrets set RESEND_API_KEY=re_your_key
                    <br />
                    npx supabase secrets set RESEND_FROM=&quot;LC Monitor &lt;leo.a@example.org&gt;&quot;
                    <br />
                    npx supabase functions deploy notifications
                    <br />
                    npx supabase functions deploy admin
                    <br />
                    npx supabase functions deploy work-sessions
                  </code>
                  Until a domain is verified in Resend, test emails can only go to the Resend account email.
                </p>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Card className="card-premium">
        <CardHeader>
          <CardTitle className="text-sm font-display font-semibold">What gets sent</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
            {(data?.types ?? []).map((t: string) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card className="card-premium">
        <CardHeader>
          <CardTitle className="text-sm font-display font-semibold">Send a test</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3 items-end">
          <div className="space-y-1.5 flex-1 min-w-[220px]">
            <Label htmlFor="test-email">Recipient</Label>
            <Input
              id="test-email"
              type="email"
              className="input-premium"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </div>
          <Button id="email-test-btn" disabled={testMut.isPending} onClick={() => testMut.mutate()}>
            {testMut.isPending ? "Sending…" : "Send test email"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
