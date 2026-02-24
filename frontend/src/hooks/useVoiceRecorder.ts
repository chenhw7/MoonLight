/**
 * 语音录音 Hook
 *
 * 提供录音功能：开始、停止、获取录音数据
 */

import { useState, useRef, useCallback } from 'react';
import { createLogger } from '@/utils/logger';

const logger = createLogger('useVoiceRecorder');

export type RecordingState = 'idle' | 'recording' | 'processing';

export interface UseVoiceRecorderOptions {
  maxDuration?: number; // 最大录音时长（秒）
  onError?: (error: string) => void;
}

export interface UseVoiceRecorderReturn {
  state: RecordingState;
  duration: number;
  audioBlob: Blob | null;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<Blob | null>;
  reset: () => void;
}

export function useVoiceRecorder(
  options: UseVoiceRecorderOptions = {}
): UseVoiceRecorderReturn {
  const { maxDuration = 60, onError } = options;

  const [state, setState] = useState<RecordingState>('idle');
  const [duration, setDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  /**
   * 开始录音
   */
  const startRecording = useCallback(async () => {
    try {
      // 请求麦克风权限
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      // 创建 MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
      });

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      // 收集音频数据
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      // 录音停止处理
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: 'audio/webm',
        });
        setAudioBlob(audioBlob);
        setState('idle');

        // 停止所有音轨
        stream.getTracks().forEach((track) => track.stop());
      };

      // 开始录音
      mediaRecorder.start(100); // 每 100ms 收集一次数据
      setState('recording');
      startTimeRef.current = Date.now();

      // 启动计时器
      timerRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        setDuration(elapsed);

        // 检查是否超过最大时长
        if (elapsed >= maxDuration) {
          logger.info('达到最大录音时长，自动停止');
          stopRecording();
        }
      }, 1000);

      logger.info('开始录音');
    } catch (error) {
      logger.error('开始录音失败', { error });
      const errorMessage =
        error instanceof Error ? error.message : '无法访问麦克风';
      onError?.(errorMessage);
    }
  }, [maxDuration, onError]);

  /**
   * 停止录音
   */
  const stopRecording = useCallback(async (): Promise<Blob | null> => {
    return new Promise((resolve) => {
      // 清除计时器
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      const mediaRecorder = mediaRecorderRef.current;
      if (!mediaRecorder || mediaRecorder.state === 'inactive') {
        resolve(audioBlob);
        return;
      }

      // 设置状态为处理中
      setState('processing');

      // 等待 onstop 事件
      const originalOnStop = mediaRecorder.onstop;
      mediaRecorder.onstop = (event) => {
        originalOnStop?.call(mediaRecorder, event);

        const blob = new Blob(audioChunksRef.current, {
          type: 'audio/webm',
        });
        setAudioBlob(blob);
        resolve(blob);
      };

      // 停止录音
      mediaRecorder.stop();

      logger.info('停止录音', { duration });
    });
  }, [audioBlob, duration]);

  /**
   * 重置状态
   */
  const reset = useCallback(() => {
    // 清除计时器
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // 停止录音
    const mediaRecorder = mediaRecorderRef.current;
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
      mediaRecorder.stream.getTracks().forEach((track) => track.stop());
    }

    setState('idle');
    setDuration(0);
    setAudioBlob(null);
    audioChunksRef.current = [];
    mediaRecorderRef.current = null;

    logger.info('重置录音状态');
  }, []);

  return {
    state,
    duration,
    audioBlob,
    startRecording,
    stopRecording,
    reset,
  };
}
