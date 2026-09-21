import type { ReactElement } from "react";
import { Authenticator } from "@aws-amplify/ui-react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import "@aws-amplify/ui-react/styles.css";
import { AppHeader } from "./components/app-header/app-header";
import { ForumProvider } from "./components/forum-provider/forum-provider";
import { ProfilesProvider } from "./components/profiles-provider/profiles-provider";
import { RaProvider } from "./components/ra-provider/ra-provider";
import { CreatePostPage } from "./pages/create-post-page";
import { ForumPage } from "./pages/forum-page";
import { PostDetailPage } from "./pages/post-detail-page";
import { ProfileEditPage } from "./pages/profile-edit-page";
import { ProfileViewPage } from "./pages/profile-view-page";
import { ROUTES } from "./utils/forum-constants";

/** Sign-in gate (accounts are admin-created, so there is no sign-up) around the forum routes. */
export default function App(): ReactElement {
  return (
    <Authenticator hideSignUp>
      {({ signOut }) => (
        <RaProvider>
          <ProfilesProvider>
            <ForumProvider>
              <BrowserRouter>
                <AppHeader onSignOut={signOut} />
                <main>
                  <Routes>
                    <Route path={ROUTES.forum} element={<ForumPage />} />
                    <Route path={ROUTES.newPost} element={<CreatePostPage />} />
                    <Route path="/post/:postId" element={<PostDetailPage />} />
                    <Route path={ROUTES.editProfile} element={<ProfileEditPage />} />
                    <Route path="/profile/:userId" element={<ProfileViewPage />} />
                    <Route path="*" element={<Navigate to={ROUTES.forum} replace />} />
                  </Routes>
                </main>
              </BrowserRouter>
            </ForumProvider>
          </ProfilesProvider>
        </RaProvider>
      )}
    </Authenticator>
  );
}
