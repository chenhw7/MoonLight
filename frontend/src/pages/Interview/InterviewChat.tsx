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
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
  sendMessageStream,
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
  
  // 流式输出状态
  const [streamingContent, setStreamingContent] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  
  // 轮次切换提示
  const [showTransitionAlert, setShowTransitionAlert] = useState(false);
  const [transitionMessage, setTransitionMessage] = useState('');

  // 对话框状态
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [showAbortDialog, setShowAbortDialog] = useState(false);

  // 滚动引用
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  // 加载面试数据
  const loadInterviewData = useCallback(async () => {
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
  }, [sessionId, navigate]);

  useEffect(() => {
    loadInterviewData().finally(() => setLoading(false));
  }, [loadInterviewData]);

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  // 清理 EventSource
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  // 发送消息（流式）
  const handleSendMessage = useCallback(async () => {
    if (!inputMessage.trim() || !sessionId || sending || isStreaming) return;

    const content = inputMessage.trim();
    setInputMessage('');
    setSending(true);
    setStreamingContent('');
    setIsStreaming(true);

    try {
      const id = parseInt(sessionId);
      const currentRound = session?.current_round || 'qa';

      // 乐观更新：先添加用户消息
      const tempUserMessage: InterviewMessageResponse = {
        id: Date.now(),
        session_id: id,
        role: 'user',
        content,
        round: currentRound,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, tempUserMessage]);

      // 关闭之前的 EventSource
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }

      // 创建新的 EventSource
      const eventSource = sendMessageStream(id, {
        role: 'user',
        content,
        round: currentRound,
      });
      eventSourceRef.current = eventSource;

      let fullContent = '';

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          switch (data.type) {
            case 'start':
              logger.info('Stream started');
              break;
              
            case 'chunk':
              fullContent += data.content;
              setStreamingContent(fullContent);
              break;
              
            case 'end':
              // 流式输出结束
              setIsStreaming(false);
              setStreamingContent('');
              eventSource.close();
              
              // 添加 AI 消息到列表
              const aiMessage: InterviewMessageResponse = {
                id: data.message_id || Date.now(),
                session_id: id,
                role: 'ai',
                content: fullContent,
                round: currentRound,
                meta_info: data.transition ? { triggered_transition: data.next_round } : undefined,
                created_at: new Date().toISOString(),
              };
              setMessages((prev) => [...prev, aiMessage]);
              
              // 如果触发了轮次切换
              if (data.transition) {
                setTransitionMessage(`已自动切换到${ROUND_DISPLAY_NAMES[data.next_round as keyof typeof ROUND_DISPLAY_NAMES] || data.next_round}环节`);
                setShowTransitionAlert(true);
                setTimeout(() => setShowTransitionAlert(false), 5000);
                loadInterviewData();
              } else {
                // 刷新进度
                getInterviewProgress(id).then(setProgress);
              }
              break;
              
            case 'error':
              logger.error('Stream error', data);
              setIsStreaming(false);
              setStreamingContent('');
              eventSource.close();
              alert(`流式输出错误: ${data.message}`);
              break;
          }
        } catch (error) {
          logger.error('Failed to parse SSE data', { error, data: event.data });
        }
      };

      eventSource.onerror = (error) => {
        logger.error('EventSource error', { error });
        setIsStreaming(false);
        setStreamingContent('');
        eventSource.close();
      };

    } catch (error) {
      logger.error('Failed to send message', { error });
      alert('发送消息失败');
      setIsStreaming(false);
    } finally {
      setSending(false);
    }
  }, [inputMessage, sessionId, sending, isStreaming, session?.current_round, loadInterviewData]);

  // 完成面试
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

  // 放弃面试
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

  // 切换到下一轮
  const handleNextRound = useCallback(async () => {
    if (!sessionId) return;

    try {
      const id = parseInt(sessionId);
      const result = await nextRound(id);
      
      setTransitionMessage(`已切换到${result.current_round_display}环节`);
      setShowTransitionAlert(true);
      setTimeout(() => setShowTransitionAlert(false), 5000);
      
      await loadInterviewData();
    } catch (error) {
      logger.error('Failed to next round', { error });
      alert('切换轮次失败');
    }
  }, [sessionId, loadInterviewData]);

  // 处理键盘事件
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  // 获取进度提示文本
  const getProgressHint = () => {
    if (!progress) return '';

    const { user_messages, min_messages, current_round_display } = progress;

    if (progress.can_transition) {
      return `已完成${current_round_display}环节，可以进入下一轮`;
    }

    if (min_messages > 0) {
      return `当前${current_round_display}环节，至少还需要 ${min_messages - user_messages} 轮对话才能进入下一轮`;
    }
    
    return `当前${current_round_display}环节`;
  };

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
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>{session.recruitment_type === 'campus' ? '校招' : '社招'}</span>
                <span>·</span>
                <Badge variant="secondary" className="text-xs">
                  {ROUND_DISPLAY_NAMES[session.current_round]}
                </Badge>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* 进度 */}
            {progress && (
              <div className="hidden sm:flex items-center gap-3 text-sm text-muted-foreground mr-4">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>
                    {progress.round_index} / {progress.total_rounds} 轮
                  </span>
                </div>
                <div className="flex flex-col gap-1 w-24">
                  <Progress value={progress.progress} className="h-2" />
                  <span className="text-xs text-center">
                    {progress.user_messages}/{progress.max_messages > 0 ? progress.max_messages : '∞'}
                  </span>
                </div>
              </div>
            )}

            {/* 控制按钮 */}
            <Button
              variant={progress?.can_transition ? "default" : "outline"}
              size="sm"
              onClick={handleNextRound}
              disabled={!progress?.can_transition || isStreaming}
              className={progress?.can_transition ? "animate-pulse" : ""}
            >
              <SkipForward className="w-4 h-4 mr-1" />
              下一轮
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCompleteDialog(true)}
              disabled={isStreaming}
            >
              <CheckCircle className="w-4 h-4 mr-1" />
              完成
            </Button>

            <Button
              variant="destructive"
              size="sm"
              onClick={() => setShowAbortDialog(true)}
              disabled={isStreaming}
            >
              <Flag className="w-4 h-4 mr-1" />
              放弃
            </Button>
          </div>
        </div>
      </header>

      {/* 进度提示栏 */}
      {progress && (
        <div className="bg-muted/50 border-b px-4 py-2">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <AlertCircle className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">{getProgressHint()}</span>
            </div>
            {progress.can_transition && (
              <Badge variant="default" className="text-xs animate-pulse">
                <Sparkles className="w-3 h-3 mr-1" />
                可以进入下一轮
              </Badge>
            )}
          </div>
        </div>
      )}

      {/* 轮次切换提示 */}
      {showTransitionAlert && (
        <div className="bg-primary/10 border-b border-primary/20 px-4 py-2">
          <div className="max-w-4xl mx-auto">
            <Alert className="border-primary/50 bg-primary/5">
              <Sparkles className="h-4 w-4 text-primary" />
              <AlertDescription className="text-primary font-medium">
                {transitionMessage}
              </AlertDescription>
            </Alert>
          </div>
        </div>
      )}

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
                    <Badge variant="secondary" className="text-xs bg-primary/20 text-primary border-primary/30">
                      <Sparkles className="w-3 h-3 mr-1" />
                      轮次切换
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* 流式消息 */}
          {isStreaming && streamingContent && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="max-w-[80%] rounded-lg p-3 bg-muted">
                <p className="whitespace-pre-wrap">{streamingContent}</p>
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-xs opacity-70">输入中</span>
                  <span className="flex gap-0.5">
                    <span className="w-1 h-1 bg-current rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1 h-1 bg-current rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1 h-1 bg-current rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </span>
                </div>
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
            placeholder={isStreaming ? "AI 正在回答..." : "输入消息..."}
            disabled={sending || isStreaming}
            className="flex-1"
          />
          <Button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || sending || isStreaming}
          >
            {sending || isStreaming ? (
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
