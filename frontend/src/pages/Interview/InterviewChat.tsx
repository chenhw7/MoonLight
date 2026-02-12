/**
 * 面试进行页面
 *
 * 实现 AI 面试官的对话界面：
 * - 聊天消息展示
 * - 流式消息接收
 * - 轮次进度显示
 * - 面试控制
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Loader2,
  Send,
  Flag,
  CheckCircle,
  SkipForward,
  Bot,
  User,
  Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  getInterviewSession,
  getInterviewMessages,
  getInterviewProgress,
  sendMessage,
  completeInterviewSession,
  abortInterviewSession,
  nextRound,
} from '@/services/interview';
import {
  InterviewSessionDetail,
  InterviewMessageResponse,
  InterviewProgress,
  ROUND_DISPLAY_NAMES,
} from '@/types/interview';
import { createLogger } from '@/utils/logger';

const logger = createLogger('InterviewChat');

export function InterviewChat() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();

  // 状态
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<InterviewSessionDetail | null>(null);
  const [messages, setMessages] = useState<InterviewMessageResponse[]>([]);
  const [progress, setProgress] = useState<InterviewProgress | null>(null);
  const [inputMessage, setInputMessage] = useState('');
  const [sending, setSending] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_streamingContent, _setStreamingContent] = useState('');

  // 对话框状态
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [showAbortDialog, setShowAbortDialog] = useState(false);

  // 滚动引用
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 加载面试数据
  const loadInterviewData = async () => {
    if (!sessionId) return;

    try {
      const id = parseInt(sessionId);
      const [sessionData, messagesData, progressData] = await Promise.all([
        getInterviewSession(id),
        getInterviewMessages(id),
        getInterviewProgress(id),
      ]);

      setSession(sessionData);
      setMessages(messagesData);
      setProgress(progressData);
    } catch (error) {
      logger.error('Failed to load interview data', { error });
      alert('加载面试数据失败');
      navigate('/interview/config');
    }
  };

  useEffect(() => {
    loadInterviewData().finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, _streamingContent]);

  // 发送消息 - 使用 useCallback 优化
  const handleSendMessage = useCallback(async () => {
    if (!inputMessage.trim() || !sessionId || sending) return;

    const content = inputMessage.trim();
    setInputMessage('');
    setSending(true);

    try {
      const id = parseInt(sessionId);

      // 乐观更新：先添加用户消息
      const tempUserMessage: InterviewMessageResponse = {
        id: Date.now(),
        session_id: id,
        role: 'user',
        content,
        round: session?.current_round || 'qa',
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, tempUserMessage]);

      // 发送消息
      const response = await sendMessage(id, {
        role: 'user',
        content,
        round: session?.current_round || 'qa',
      });

      // 更新消息列表
      setMessages((prev) => [...prev, response]);

      // 刷新进度
      const progressData = await getInterviewProgress(id);
      setProgress(progressData);

      // 检查是否切换了轮次
      if (response.meta_info?.triggered_transition) {
        await loadInterviewData();
      }
    } catch (error) {
      logger.error('Failed to send message', { error });
      alert('发送消息失败');
    } finally {
      setSending(false);
    }
  }, [inputMessage, sessionId, sending, session?.current_round]);

  // 完成面试 - 使用 useCallback 优化
  const handleComplete = useCallback(async () => {
    if (!sessionId) return;

    try {
      const id = parseInt(sessionId);
      await completeInterviewSession(id);
      navigate(`/interview/${id}/evaluation`);
    } catch (error) {
      logger.error('Failed to complete interview', { error });
      alert('完成面试失败');
    }
  }, [sessionId, navigate]);

  // 放弃面试 - 使用 useCallback 优化
  const handleAbort = useCallback(async () => {
    if (!sessionId) return;

    try {
      const id = parseInt(sessionId);
      await abortInterviewSession(id);
      navigate('/interviews');
    } catch (error) {
      logger.error('Failed to abort interview', { error });
      alert('放弃面试失败');
    }
  }, [sessionId, navigate]);

  // 切换到下一轮 - 使用 useCallback 优化
  const handleNextRound = useCallback(async () => {
    if (!sessionId) return;

    try {
      const id = parseInt(sessionId);
      await nextRound(id);
      await loadInterviewData();
    } catch (error) {
      logger.error('Failed to next round', { error });
      alert('切换轮次失败');
    }
  }, [sessionId, loadInterviewData]);

  // 处理键盘事件 - 使用 useCallback 优化
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-muted-foreground">面试会话不存在</p>
      </div>
    );
  }

  // 面试已结束
  if (session.status !== 'ongoing') {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
        <h2 className="text-2xl font-bold mb-2">面试已结束</h2>
        <p className="text-muted-foreground mb-6">
          {session.status === 'completed' ? '面试已完成' : '面试已放弃'}
        </p>
        <div className="flex gap-4">
          <Button onClick={() => navigate(`/interview/${sessionId}/evaluation`)}>
            查看评价
          </Button>
          <Button variant="outline" onClick={() => navigate('/interviews')}>
            返回列表
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* 头部信息 */}
      <header className="border-b bg-card px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="font-semibold">
                {session.company_name} - {session.position_name}
              </h1>
              <p className="text-sm text-muted-foreground">
                {session.recruitment_type === 'campus' ? '校招' : '社招'} ·
                {ROUND_DISPLAY_NAMES[session.current_round]}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* 进度 */}
            {progress && (
              <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span>
                  {progress.round_index} / {progress.total_rounds} 轮
                </span>
                <Progress value={progress.progress} className="w-20" />
              </div>
            )}

            {/* 控制按钮 */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleNextRound}
              disabled={!progress?.can_transition}
            >
              <SkipForward className="w-4 h-4 mr-1" />
              下一轮
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCompleteDialog(true)}
            >
              <CheckCircle className="w-4 h-4 mr-1" />
              完成
            </Button>

            <Button
              variant="destructive"
              size="sm"
              onClick={() => setShowAbortDialog(true)}
            >
              <Flag className="w-4 h-4 mr-1" />
              放弃
            </Button>
          </div>
        </div>
      </header>

      {/* 消息区域 */}
      <ScrollArea className="flex-1 p-4">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${
                message.role === 'user' ? 'flex-row-reverse' : ''
              }`}
            >
              {/* 头像 */}
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                }`}
              >
                {message.role === 'user' ? (
                  <User className="w-4 h-4" />
                ) : (
                  <Bot className="w-4 h-4" />
                )}
              </div>

              {/* 消息内容 */}
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                }`}
              >
                <p className="whitespace-pre-wrap">{message.content}</p>
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-xs opacity-70">
                    {new Date(message.created_at).toLocaleTimeString()}
                  </span>
                  {message.meta_info && (message.meta_info as { triggered_transition?: boolean }).triggered_transition && (
                    <Badge variant="secondary" className="text-xs">
                        轮次切换
                    </Badge>
                    )}
                </div>
              </div>
            </div>
          ))}

          {/* 流式消息 */}
          {_streamingContent && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="max-w-[80%] rounded-lg p-3 bg-muted">
                <p className="whitespace-pre-wrap">{_streamingContent}</p>
                <span className="text-xs opacity-70">输入中...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* 输入区域 */}
      <footer className="border-t bg-card p-4">
        <div className="max-w-4xl mx-auto flex gap-2">
          <Input
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="输入消息..."
            disabled={sending}
            className="flex-1"
          />
          <Button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || sending}
          >
            {sending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </footer>

      {/* 完成面试对话框 */}
      <AlertDialog open={showCompleteDialog} onOpenChange={setShowCompleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>完成面试</AlertDialogTitle>
            <AlertDialogDescription>
              确定要完成面试吗？完成后将生成评价报告。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleComplete}>确认完成</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 放弃面试对话框 */}
      <AlertDialog open={showAbortDialog} onOpenChange={setShowAbortDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>放弃面试</AlertDialogTitle>
            <AlertDialogDescription>
              确定要放弃面试吗？放弃后将无法恢复。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleAbort} className="bg-destructive">
              确认放弃
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
