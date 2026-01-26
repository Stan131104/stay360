import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ArrowRight, Info, Users } from 'lucide-react'

export default function TeamPage() {
  return (
    <div className="py-8 px-6 lg:px-12 max-w-4xl">
      <div className="space-y-2 mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-primary">Team Management</h1>
        <p className="text-lg text-muted-foreground">
          Collaborate with your team using role-based access control.
        </p>
      </div>

      {/* Overview */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-primary mb-4">Overview</h2>
        <p className="text-muted-foreground mb-4">
          Stay360 allows you to invite team members to your workspace with different permission levels.
          This ensures everyone has access to what they need while maintaining security.
        </p>

        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                <Users className="h-5 w-5 text-[#669bbc]" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Team Features</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>- Invite team members via email</li>
                  <li>- Assign roles with specific permissions</li>
                  <li>- View all team members in settings</li>
                  <li>- Change roles as needed</li>
                  <li>- Remove members when necessary</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Role Permissions */}
      <section id="role-permissions" className="mb-12 scroll-mt-20">
        <h2 className="text-2xl font-semibold text-primary mb-4">Role Permissions</h2>
        <p className="text-muted-foreground mb-4">
          Each role has different access levels:
        </p>

        <div className="overflow-x-auto mb-6">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4 font-semibold">Permission</th>
                <th className="text-center py-3 px-2">
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800">OWNER</span>
                </th>
                <th className="text-center py-3 px-2">
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">MANAGER</span>
                </th>
                <th className="text-center py-3 px-2">
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">FINANCE</span>
                </th>
                <th className="text-center py-3 px-2">
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">READ_ONLY</span>
                </th>
              </tr>
            </thead>
            <tbody className="text-muted-foreground">
              <tr className="border-b">
                <td className="py-3 px-4">View properties</td>
                <td className="text-center py-3 px-2 text-green-600">Yes</td>
                <td className="text-center py-3 px-2 text-green-600">Yes</td>
                <td className="text-center py-3 px-2 text-green-600">Yes</td>
                <td className="text-center py-3 px-2 text-green-600">Yes</td>
              </tr>
              <tr className="border-b">
                <td className="py-3 px-4">View bookings</td>
                <td className="text-center py-3 px-2 text-green-600">Yes</td>
                <td className="text-center py-3 px-2 text-green-600">Yes</td>
                <td className="text-center py-3 px-2 text-green-600">Yes</td>
                <td className="text-center py-3 px-2 text-green-600">Yes</td>
              </tr>
              <tr className="border-b">
                <td className="py-3 px-4">View calendar</td>
                <td className="text-center py-3 px-2 text-green-600">Yes</td>
                <td className="text-center py-3 px-2 text-green-600">Yes</td>
                <td className="text-center py-3 px-2 text-green-600">Yes</td>
                <td className="text-center py-3 px-2 text-green-600">Yes</td>
              </tr>
              <tr className="border-b">
                <td className="py-3 px-4">Manage integrations</td>
                <td className="text-center py-3 px-2 text-green-600">Yes</td>
                <td className="text-center py-3 px-2 text-green-600">Yes</td>
                <td className="text-center py-3 px-2 text-red-600">No</td>
                <td className="text-center py-3 px-2 text-red-600">No</td>
              </tr>
              <tr className="border-b">
                <td className="py-3 px-4">Delete properties</td>
                <td className="text-center py-3 px-2 text-green-600">Yes</td>
                <td className="text-center py-3 px-2 text-green-600">Yes</td>
                <td className="text-center py-3 px-2 text-red-600">No</td>
                <td className="text-center py-3 px-2 text-red-600">No</td>
              </tr>
              <tr className="border-b">
                <td className="py-3 px-4">Trigger sync</td>
                <td className="text-center py-3 px-2 text-green-600">Yes</td>
                <td className="text-center py-3 px-2 text-green-600">Yes</td>
                <td className="text-center py-3 px-2 text-red-600">No</td>
                <td className="text-center py-3 px-2 text-red-600">No</td>
              </tr>
              <tr className="border-b">
                <td className="py-3 px-4">Manage pricing</td>
                <td className="text-center py-3 px-2 text-green-600">Yes</td>
                <td className="text-center py-3 px-2 text-green-600">Yes</td>
                <td className="text-center py-3 px-2 text-green-600">Yes</td>
                <td className="text-center py-3 px-2 text-red-600">No</td>
              </tr>
              <tr className="border-b">
                <td className="py-3 px-4">Workspace settings</td>
                <td className="text-center py-3 px-2 text-green-600">Yes</td>
                <td className="text-center py-3 px-2 text-red-600">No</td>
                <td className="text-center py-3 px-2 text-red-600">No</td>
                <td className="text-center py-3 px-2 text-red-600">No</td>
              </tr>
              <tr className="border-b">
                <td className="py-3 px-4">Manage team</td>
                <td className="text-center py-3 px-2 text-green-600">Yes</td>
                <td className="text-center py-3 px-2 text-red-600">No</td>
                <td className="text-center py-3 px-2 text-red-600">No</td>
                <td className="text-center py-3 px-2 text-red-600">No</td>
              </tr>
              <tr>
                <td className="py-3 px-4">Delete workspace</td>
                <td className="text-center py-3 px-2 text-green-600">Yes</td>
                <td className="text-center py-3 px-2 text-red-600">No</td>
                <td className="text-center py-3 px-2 text-red-600">No</td>
                <td className="text-center py-3 px-2 text-red-600">No</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Inviting Members */}
      <section id="inviting-members" className="mb-12 scroll-mt-20">
        <h2 className="text-2xl font-semibold text-primary mb-4">Inviting Members</h2>

        <Alert className="mb-6">
          <Info className="h-4 w-4" />
          <AlertDescription>
            Team invitation feature is coming soon. Currently, only the workspace owner can access the workspace.
          </AlertDescription>
        </Alert>

        <p className="text-muted-foreground mb-4">
          When available, inviting team members will work as follows:
        </p>

        <ol className="list-decimal list-inside space-y-3 text-muted-foreground mb-6">
          <li>Go to <strong className="text-foreground">Dashboard</strong> &gt; <strong className="text-foreground">Settings</strong></li>
          <li>Find the <strong className="text-foreground">Team Members</strong> section</li>
          <li>Click <strong className="text-foreground">Invite</strong></li>
          <li>Enter the team member's email address</li>
          <li>Select their role</li>
          <li>Click <strong className="text-foreground">Send Invitation</strong></li>
          <li>The team member will receive an email to join your workspace</li>
        </ol>

        <Card className="bg-muted/50">
          <CardContent className="pt-6">
            <h3 className="font-semibold mb-2">Viewing Team Members</h3>
            <p className="text-sm text-muted-foreground">
              You can view all current team members in <strong>Dashboard</strong> &gt; <strong>Settings</strong>
              under the Team Members section. Each member shows their role and join date.
            </p>
          </CardContent>
        </Card>
      </section>

      {/* Best Practices */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-primary mb-4">Best Practices</h2>
        <ul className="space-y-3 text-muted-foreground">
          <li className="flex items-start gap-2">
            <span className="text-[#669bbc] font-bold">1.</span>
            <span>Use the principle of least privilege - give team members only the access they need.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#669bbc] font-bold">2.</span>
            <span>Keep at least one OWNER in case you need to make administrative changes.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#669bbc] font-bold">3.</span>
            <span>Review team access periodically and remove members who no longer need access.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#669bbc] font-bold">4.</span>
            <span>Use FINANCE role for accountants who only need to view financial data.</span>
          </li>
        </ul>
      </section>

      {/* Next Steps */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-primary mb-4">Next Steps</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Link href="/docs/getting-started">
            <Card className="h-full hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-2">Getting Started</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  Learn about setting up your account and workspace.
                </p>
                <span className="text-sm font-medium text-primary flex items-center">
                  Learn more <ArrowRight className="ml-1 h-4 w-4" />
                </span>
              </CardContent>
            </Card>
          </Link>
          <Link href="/docs/integrations">
            <Card className="h-full hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-2">Integrations</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  Connect your booking platforms.
                </p>
                <span className="text-sm font-medium text-primary flex items-center">
                  Learn more <ArrowRight className="ml-1 h-4 w-4" />
                </span>
              </CardContent>
            </Card>
          </Link>
        </div>
      </section>
    </div>
  )
}
