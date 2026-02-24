/**
 * 应用根组件
 *
 * 配置应用路由，包括公开路由和受保护路由
 */

import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { createLogger } from '@/utils/logger';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoginPage } from '@/pages/Login';
import { RegisterPage } from '@/pages/Register';
import { ForgotPasswordPage } from '@/pages/ForgotPassword';
import { Layout } from '@/components/layout/Layout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { HomePage } from '@/pages/Home';
import { ResumeCreate, ResumeList, ResumeView } from '@/pages/Resume';
import { AIConfigForm } from '@/pages/AIConfig';
import { InterviewConfig, InterviewChat, InterviewEvaluation, InterviewList } from '@/pages/Interview';
import { ProfilePage } from '@/pages/Profile/ProfilePage';

const logger = createLogger('App');

function LandingPage() {
  return (
    <div className="min-h-screen flex items-center justify-center gradient-bg p-4">
      <Card className="w-full max-w-md animate-fade-in">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">🌙 MoonLight</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-muted-foreground">
            欢迎来到 MoonLight
          </p>
          <Button
            className="w-full"
            onClick={() => (window.location.href = '/login')}
          >
            开始使用
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function AuthGuard({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  useEffect(() => {
    if (isAuthenticated) {
      logger.debug('Authenticated user accessed public route, redirecting to home', {
        from: location.pathname,
      });
    }
  }, [isAuthenticated, location.pathname]);

  if (
    isAuthenticated &&
    ['/', '/login', '/register', '/forgot-password'].includes(location.pathname)
  ) {
    return <Navigate to="/home" replace />;
  }

  return <>{children}</>;
}

function App() {
  logger.debug('App component rendered');

  return (
    <div className="min-h-screen">
      <Routes>
        <Route
          path="/"
          element={
            <AuthGuard>
              <LandingPage />
            </AuthGuard>
          }
        />
        <Route
          path="/login"
          element={
            <AuthGuard>
              <LoginPage />
            </AuthGuard>
          }
        />
        <Route
          path="/register"
          element={
            <AuthGuard>
              <RegisterPage />
            </AuthGuard>
          }
        />
        <Route
          path="/forgot-password"
          element={
            <AuthGuard>
              <ForgotPasswordPage />
            </AuthGuard>
          }
        />

        <Route element={<Layout />}>
          <Route
            path="/home"
            element={
              <ProtectedRoute>
                <HomePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/projects"
            element={
              <ProtectedRoute>
                <div className="text-center py-12">
                  <h2 className="text-2xl font-bold">🚧 功能开发中</h2>
                  <p className="text-muted-foreground mt-2">项目管理功能即将上线</p>
                </div>
              </ProtectedRoute>
            }
          />
          <Route
            path="/team"
            element={
              <ProtectedRoute>
                <div className="text-center py-12">
                  <h2 className="text-2xl font-bold">🚧 功能开发中</h2>
                  <p className="text-muted-foreground mt-2">团队协作功能即将上线</p>
                </div>
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <div className="text-center py-12">
                  <h2 className="text-2xl font-bold">🚧 功能开发中</h2>
                  <p className="text-muted-foreground mt-2">系统设置功能即将上线</p>
                </div>
              </ProtectedRoute>
            }
          />
          <Route
            path="/resumes"
            element={
              <ProtectedRoute>
                <ResumeList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/resume/create"
            element={
              <ProtectedRoute>
                <ResumeCreate />
              </ProtectedRoute>
            }
          />
          <Route
            path="/resume/edit/:id"
            element={
              <ProtectedRoute>
                <ResumeCreate />
              </ProtectedRoute>
            }
          />
          <Route
            path="/resume/view/:id"
            element={
              <ProtectedRoute>
                <ResumeView />
              </ProtectedRoute>
            }
          />
          <Route
            path="/ai-config"
            element={
              <ProtectedRoute>
                <AIConfigForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/interview/config"
            element={
              <ProtectedRoute>
                <InterviewConfig />
              </ProtectedRoute>
            }
          />
          <Route
            path="/interview/:sessionId"
            element={
              <ProtectedRoute>
                <InterviewChat />
              </ProtectedRoute>
            }
          />
          <Route
            path="/interview/:sessionId/evaluation"
            element={
              <ProtectedRoute>
                <InterviewEvaluation />
              </ProtectedRoute>
            }
          />
          <Route
            path="/interviews"
            element={
              <ProtectedRoute>
                <InterviewList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default App;
