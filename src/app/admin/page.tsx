import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldAlert, Settings, Users, CalendarCheck } from 'lucide-react';

export default function AdminPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <PageHeader
        title="Admin Panel"
        description="Manage your application settings, content, and operations."
      />
      
      <Card className="mb-8 border-yellow-500 border-l-4 bg-yellow-50 dark:bg-yellow-900/20">
        <CardContent className="p-4">
          <div className="flex items-start">
            <ShieldAlert className="h-6 w-6 text-yellow-600 dark:text-yellow-400 mr-3 mt-1 flex-shrink-0" />
            <div>
              <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-300">Access Control Notice</h3>
              <p className="text-sm text-yellow-700 dark:text-yellow-500">
                This Admin Panel is currently accessible to all users. For production use, ensure this page is protected by robust authentication and authorization mechanisms to restrict access to authorized administrators only.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xl font-medium">
              Manage Appointments
            </CardTitle>
            <CalendarCheck className="h-6 w-6 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              View, confirm, or reschedule client appointments.
            </p>
            {/* Placeholder for appointment management UI components */}
          </CardContent>
        </Card>
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xl font-medium">
              User Management
            </CardTitle>
            <Users className="h-6 w-6 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Oversee user accounts and roles.
            </p>
            {/* Placeholder for user management UI components */}
          </CardContent>
        </Card>
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xl font-medium">
              Site Settings
            </CardTitle>
            <Settings className="h-6 w-6 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Configure global site settings and preferences.
            </p>
            {/* Placeholder for site settings UI components */}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
