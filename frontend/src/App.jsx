import { Authenticator } from "@aws-amplify/ui-react";
import "@aws-amplify/ui-react/styles.css";
import TaskDashboard from "./components/TaskDashboard";

const isLocal = import.meta.env.VITE_LOCAL_DEV === "true";

const mockUser = {
  signInDetails: { loginId: "local-dev-user@example.com" },
};

export default function App() {
  if (isLocal) {
    return <TaskDashboard user={mockUser} onSignOut={() => alert("Sign out disabled in local dev")} />;
  }

  return (
    <Authenticator>
      {({ signOut, user }) => <TaskDashboard user={user} onSignOut={signOut} />}
    </Authenticator>
  );
}
