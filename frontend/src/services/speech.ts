/**
 * 语音识别服务
 *
 * 提供语音转文字 API 调用
 */

import api from './api';

export interface SpeechRecognitionResponse {
  text: string;
  language: string;
  duration: number;
  processing_time: number;
}

/**
 * 上传音频文件进行语音识别
 *
 * @param audioBlob 音频数据
 * @param language 语言代码 (zh/en/auto)
 * @returns 识别结果
 */
export async function recognizeSpeech(
  audioBlob: Blob,
  language: string = 'auto'
): Promise<SpeechRecognitionResponse> {
  const formData = new FormData();
  formData.append('audio', audioBlob, 'recording.webm');
  formData.append('language', language);

  const response = await api.post<SpeechRecognitionResponse>(
    '/speech/recognize',
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 30000,
    }
  );

  return response as SpeechRecognitionResponse;
}

/**
 * 检查语音识别服务状态
 *
 * @returns 服务状态
 */
export async function checkSpeechStatus(): Promise<{
  status: string;
  model?: string;
  device?: string;
  error?: string;
}> {
  const response = await api.get('/speech/status');
  return response as { status: string; model?: string; device?: string; error?: string };
}
