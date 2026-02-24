/**
 * 个人资料页面
 *
 * 展示用户基本信息和账户统计
 * 支持修改用户名和头像
 */

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CircularAvatar } from '@/components/ui/circular-avatar';
import { InlineEdit } from '@/components/ui/inline-edit';
import { ProfileAvatarUpload } from '@/components/ui/profile-avatar-upload';
import { SimpleDialog } from '@/components/ui/simple-dialog';
import { getDashboardData } from '@/services/dashboard';
import { userApi } from '@/services/user';
import { useAuthStore } from '@/stores/authStore';
import { createLogger } from '@/utils/logger';
import type { DashboardData } from '@/types/dashboard';
import { Mail, Calendar, FileText, MessageSquare, Star, Flame, Loader2 } from 'lucide-react';

const logger = createLogger('ProfilePage');

// 用户名验证规则
const validateUsername = (value: string): string | null => {
  if (!value.trim()) {
    return '用户名不能为空';
  }
  if (value.length < 3) {
    return '用户名至少需要 3 个字符';
  }
  if (value.length > 20) {
    return '用户名最多 20 个字符';
  }
  // 允许字母、数字、下划线、中文
  if (!/[\w\u4e00-\u9fa5]+$/.test(value)) {
    return '用户名只能包含字母、数字、下划线和中文';
  }
  return null;
};

export function ProfilePage() {
  const user = useAuthStore((state) => state.user);
  const updateUser = useAuthStore((state) => state.updateUser);

  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAvatarDialogOpen, setIsAvatarDialogOpen] = useState(false);
  const [tempAvatar, setTempAvatar] = useState('');

  // 获取仪表盘数据
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await getDashboardData();
        setDashboardData(data);
      } catch (err) {
        logger.error('Failed to fetch dashboard data', { error: err });
        setError('加载统计数据失败');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // 处理用户名更新
  const handleUsernameSave = useCallback(
    async (newUsername: string) => {
      try {
        logger.info('Updating username', { newUsername });
        const response = await userApi.updateProfile({ username: newUsername });

        // 更新全局用户状态 (response 已经是 ApiResponse<User>)
        updateUser(response.data);

        logger.info('Username updated successfully');
      } catch (err) {
        logger.error('Failed to update username', { error: err });
        throw new Error(err instanceof Error ? err.message : '更新失败');
      }
    },
    [updateUser]
  );

  // 处理头像更新
  const handleAvatarChange = useCallback(async (avatar: string) => {
    try {
      logger.info('Updating avatar');
      // 调用后端 API 保存头像
      const response = await userApi.updateAvatar({ avatar });

      // 更新本地临时状态
      setTempAvatar(avatar);

      // 更新全局用户状态 (response 已经是 ApiResponse<User>)
      updateUser(response.data);

      logger.info('Avatar updated successfully');
    } catch (err) {
      logger.error('Failed to update avatar', { error: err });
      alert('头像更新失败，请重试');
      throw err; // 向上抛出错误，让组件处理
    }
  }, [updateUser]);

  // 处理头像对话框关闭
  const handleAvatarDialogClose = useCallback(() => {
    setIsAvatarDialogOpen(false);
  }, []);

  // 格式化日期
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const stats = dashboardData?.stats ?? {
    resume_count: 0,
    interview_count: 0,
    average_score: null,
    streak_days: 0,
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">个人资料</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 左侧：头像区域 */}
        <Card className="md:col-span-1">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4">
              <CircularAvatar
                src={user.avatar || tempAvatar}
                alt={user.username}
                size="xl"
                editable
                onClick={() => setIsAvatarDialogOpen(true)}
              />
              <p className="text-sm text-muted-foreground text-center">
                点击头像更换
              </p>
            </div>
          </CardContent>
        </Card>

        {/* 右侧：信息和统计 */}
        <div className="md:col-span-2 space-y-6">
          {/* 基本信息 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">基本信息</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* 用户名 - 可编辑 */}
              <div className="flex items-start gap-3">
                <div className="mt-1">
                  <span className="text-lg">👤</span>
                </div>
                <div className="flex-1">
                  <InlineEdit
                    label="用户名"
                    value={user.username}
                    onSave={handleUsernameSave}
                    validate={validateUsername}
                    maxLength={20}
                  />
                </div>
              </div>

              {/* 邮箱 - 只读 */}
              <div className="flex items-center gap-3">
                <Mail size={18} className="text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">邮箱</p>
                  <p className="text-base">{user.email}</p>
                </div>
              </div>

              {/* 注册时间 - 只读 */}
              <div className="flex items-center gap-3">
                <Calendar size={18} className="text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">注册时间</p>
                  <p className="text-base">{formatDate(user.created_at)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 账户统计 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">账户统计</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : error ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  {error}
                </p>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-md">
                      <FileText size={20} className="text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{stats.resume_count}</p>
                      <p className="text-xs text-muted-foreground">简历数量</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <div className="p-2 bg-green-100 dark:bg-green-900 rounded-md">
                      <MessageSquare size={20} className="text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{stats.interview_count}</p>
                      <p className="text-xs text-muted-foreground">面试次数</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-md">
                      <Star size={20} className="text-yellow-600 dark:text-yellow-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">
                        {stats.average_score ?? '-'}
                      </p>
                      <p className="text-xs text-muted-foreground">平均得分</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-md">
                      <Flame size={20} className="text-orange-600 dark:text-orange-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{stats.streak_days}</p>
                      <p className="text-xs text-muted-foreground">连续练习(天)</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 头像更换对话框 */}
      <SimpleDialog
        open={isAvatarDialogOpen}
        onOpenChange={setIsAvatarDialogOpen}
        title="更换头像"
      >
        <div className="p-4">
          <ProfileAvatarUpload
            value={user.avatar || tempAvatar}
            onChange={handleAvatarChange}
            onCancel={handleAvatarDialogClose}
          />
        </div>
      </SimpleDialog>
    </div>
  );
}
