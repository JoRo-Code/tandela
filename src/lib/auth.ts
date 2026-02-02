import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { getDb, workspaces, workspaceMembers, users, accounts, sessions, verificationTokens } from "./db";
import { eq } from "drizzle-orm";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(getDb(), {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async session({ session, user }) {
      // Add user ID and workspace ID to session
      if (session.user) {
        session.user.id = user.id;

        // Get the user's workspace membership
        const membership = await getDb().query.workspaceMembers.findFirst({
          where: eq(workspaceMembers.userId, user.id),
        });

        if (membership) {
          session.workspaceId = membership.workspaceId;
        }
      }
      return session;
    },
  },
  events: {
    async createUser({ user }) {
      // Create a workspace for the new user
      const workspaceName = user.name ? `${user.name}'s Workspace` : "My Workspace";

      const db = getDb();
      const [workspace] = await db
        .insert(workspaces)
        .values({ name: workspaceName })
        .returning();

      // Add user as owner of the workspace
      await db.insert(workspaceMembers).values({
        workspaceId: workspace.id,
        userId: user.id!,
        role: "owner",
      });

      console.log(`[Auth] Created workspace "${workspace.name}" for user ${user.email}`);
    },
  },
});

// Extend the session type to include workspaceId
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
    workspaceId?: string;
  }
}
