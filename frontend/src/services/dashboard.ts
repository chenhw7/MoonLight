/**
 * 仪表盘 API 服务
 *
 * 提供仪表盘数据的获取接口
 */

import api from './api';
import type { DashboardData } from '@/types/dashboard';
import type { ApiResponse } from '@/types/resume';
import { createLogger } from '@/utils/logger';

const logger = createLogger('DashboardService');

/**
 * 获取仪表盘数据
 *
 * @returns 仪表盘完整数据
 */
export async function getDashboardData(): Promise<DashboardData> {
  try {
    logger.info('Fetching dashboard data');
    const response = await api.get<ApiResponse<DashboardData>>('/dashboard');
    logger.info('Dashboard data fetched successfully');
    // API 拦截器已经解包了 response.data，所以这里直接返回 response.data
    return (response as ApiResponse<DashboardData>).data;
  } catch (error) {
    logger.error('Failed to fetch dashboard data', { error });
    throw error;
  }
}
