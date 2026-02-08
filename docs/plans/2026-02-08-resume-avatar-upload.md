# 简历头像上传功能实现计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 为简历系统添加头像上传功能，支持用户上传个人照片并在简历预览中显示

**Architecture:** 使用 Base64 编码存储头像图片到数据库，前端使用文件选择器 + 图片预览，后端提供上传接口

**Tech Stack:** FastAPI + SQLAlchemy + PostgreSQL (后端), React + TypeScript (前端)

---

## Task 1: 后端 - 添加 avatar 字段到数据库模型

**Files:**
- Modify: `backend/app/models/resume.py`

**Step 1: 添加 avatar 字段到 Resume 模型**

在 Resume 类的基本信息区域添加 avatar 字段：

```python
# 基本信息
full_name: Mapped[str] = mapped_column(String(50), nullable=False)
phone: Mapped[str] = mapped_column(String(20), nullable=False)
email: Mapped[str] = mapped_column(String(100), nullable=False)
avatar: Mapped[Optional[str]] = mapped_column(Text)  # Base64 编码的头像图片
```

**Step 2: 创建数据库迁移文件**

Run: `cd backend && alembic revision --autogenerate -m "add avatar to resume"`

**Step 3: 执行数据库迁移**

Run: `cd backend && alembic upgrade head`

---

## Task 2: 后端 - 更新 Pydantic Schema

**Files:**
- Modify: `backend/app/schemas/resume.py`

**Step 1: 在 ResumeBase 中添加 avatar 字段**

```python
class ResumeBase(BaseModel):
    """简历基础模型。"""

    model_config = ConfigDict(from_attributes=True)

    resume_type: str = Field(..., pattern=r"^(campus|social)$")
    title: Optional[str] = Field(None, max_length=100)
    full_name: str = Field(..., min_length=1, max_length=50)
    phone: str = Field(..., min_length=1, max_length=20)
    email: str = Field(..., min_length=1, max_length=100)
    avatar: Optional[str] = None  # Base64 编码的头像
    # ... 其他字段
```

**Step 2: 在 ResumeUpdate 中添加 avatar 字段**

```python
class ResumeUpdate(BaseModel):
    # ... 其他字段
    avatar: Optional[str] = None
```

---

## Task 3: 后端 - 创建头像上传 API

**Files:**
- Create: `backend/app/api/v1/upload.py`
- Modify: `backend/app/api/v1/__init__.py`

**Step 1: 创建上传路由文件**

```python
"""文件上传 API 模块。"""

import base64
import io
from typing import Optional

from fastapi import APIRouter, File, HTTPException, UploadFile, status
from PIL import Image

from app.core.logging import get_logger

logger = get_logger(__name__)

router = APIRouter(prefix="/upload", tags=["文件上传"])

# 限制图片大小 (1MB)
MAX_FILE_SIZE = 1 * 1024 * 1024
# 限制图片尺寸
MAX_IMAGE_DIMENSION = 800


@router.post("/avatar", response_model=dict)
async def upload_avatar(file: UploadFile = File(...)):
    """上传头像图片。

    将图片压缩并转换为 Base64 编码返回。
    限制：文件大小不超过 1MB，图片尺寸不超过 800x800。

    Args:
        file: 上传的图片文件

    Returns:
        包含 Base64 编码图片的字典
    """
    # 验证文件类型
    allowed_types = {"image/jpeg", "image/png", "image/jpg", "image/webp"}
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="只支持 JPG、PNG、WebP 格式的图片",
        )

    try:
        # 读取文件内容
        contents = await file.read()

        # 验证文件大小
        if len(contents) > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"图片大小不能超过 1MB",
            )

        # 使用 PIL 处理图片
        image = Image.open(io.BytesIO(contents))

        # 转换为 RGB (处理 PNG 透明通道)
        if image.mode in ("RGBA", "P"):
            image = image.convert("RGB")

        # 压缩图片尺寸
        if max(image.size) > MAX_IMAGE_DIMENSION:
            ratio = MAX_IMAGE_DIMENSION / max(image.size)
            new_size = tuple(int(dim * ratio) for dim in image.size)
            image = image.resize(new_size, Image.Resampling.LANCZOS)

        # 转换为 Base64
        buffer = io.BytesIO()
        image.save(buffer, format="JPEG", quality=85, optimize=True)
        base64_data = base64.b64encode(buffer.getvalue()).decode("utf-8")

        logger.info(f"头像上传成功: {file.filename}, 大小: {len(base64_data)} bytes")

        return {
            "code": 200,
            "message": "上传成功",
            "data": {
                "avatar": f"data:image/jpeg;base64,{base64_data}",
                "size": len(base64_data),
            },
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"头像上传失败: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="图片处理失败，请重试",
        )
```

**Step 2: 注册上传路由**

在 `backend/app/api/v1/__init__.py` 中添加：

```python
from app.api.v1 import upload

# ... 其他路由注册
api_router.include_router(upload.router)
```

---

## Task 4: 前端 - 更新 TypeScript 类型定义

**Files:**
- Modify: `frontend/src/types/resume.ts`

**Step 1: 在 ResumeBase 接口中添加 avatar 字段**

```typescript
/** 简历基础信息 */
export interface ResumeBase {
  id?: number;
  title: string;
  resume_type: ResumeType;
  name: string;
  phone: string;
  email: string;
  avatar?: string;  // Base64 编码的头像
  location: string;
  // ... 其他字段
}
```

**Step 2: 在 resumeBaseSchema 中添加 avatar 验证**

```typescript
export const resumeBaseSchema = z.object({
  title: z.string().min(1, '请输入简历标题').max(100, '标题过长'),
  resume_type: z.enum(['campus', 'social']),
  name: z.string().min(2, '姓名至少2个字').max(20, '姓名过长'),
  phone: z.string().regex(/^1[3-9]\d{9}$/, '请输入正确的手机号'),
  email: z.string().email('请输入正确的邮箱'),
  avatar: z.string().optional(),  // 头像为可选
  location: z.string().min(1, '请选择当前居住地').max(100, '地址过长'),
  // ... 其他字段
});
```

**Step 3: 更新 DEFAULT_RESUME_DATA**

```typescript
export const DEFAULT_RESUME_DATA: ResumeFormData = {
  title: '',
  resume_type: 'campus',
  name: '',
  phone: '',
  email: '',
  avatar: '',  // 添加空字符串默认值
  location: '',
  // ... 其他字段
};
```

---

## Task 5: 前端 - 创建头像上传组件

**Files:**
- Create: `frontend/src/components/ui/avatar-upload.tsx`

**Step 1: 创建头像上传组件**

```typescript
/**
 * 头像上传组件
 *
 * 支持图片选择、预览、压缩和上传
 */

import React, { useRef, useState } from 'react';
import { User, Upload, X } from 'lucide-react';
import { Button } from './button';
import { uploadAvatar } from '@/services/upload';
import { logger } from '@/utils/logger';

interface AvatarUploadProps {
  value?: string;
  onChange: (avatar: string) => void;
  disabled?: boolean;
}

export const AvatarUpload: React.FC<AvatarUploadProps> = ({
  value,
  onChange,
  disabled = false,
}) => {
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    if (!disabled) {
      inputRef.current?.click();
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 验证文件类型
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      alert('只支持 JPG、PNG、WebP 格式的图片');
      return;
    }

    // 验证文件大小 (1MB)
    if (file.size > 1024 * 1024) {
      alert('图片大小不能超过 1MB');
      return;
    }

    setLoading(true);
    try {
      const result = await uploadAvatar(file);
      onChange(result.data.avatar);
      logger.info('头像上传成功');
    } catch (error) {
      logger.error('头像上传失败', error);
      alert('上传失败，请重试');
    } finally {
      setLoading(false);
      // 清空 input 以便可以重复选择同一文件
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    }
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        onClick={handleClick}
        className={`
          relative w-24 h-24 rounded-full border-2 border-dashed
          flex items-center justify-center overflow-hidden
          transition-colors cursor-pointer
          ${value ? 'border-primary' : 'border-gray-300 hover:border-gray-400'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          ${loading ? 'opacity-70' : ''}
        `}
      >
        {value ? (
          <>
            <img
              src={value}
              alt="头像"
              className="w-full h-full object-cover"
            />
            {!disabled && (
              <button
                onClick={handleClear}
                className="absolute top-0 right-0 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center text-gray-400">
            {loading ? (
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
            ) : (
              <>
                <User className="w-8 h-8 mb-1" />
                <span className="text-xs">点击上传</span>
              </>
            )}
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/jpg,image/webp"
        onChange={handleFileChange}
        className="hidden"
        disabled={disabled || loading}
      />

      {value && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleClick}
          disabled={disabled || loading}
        >
          <Upload className="w-4 h-4 mr-1" />
          更换头像
        </Button>
      )}
    </div>
  );
};
```

---

## Task 6: 前端 - 创建上传服务

**Files:**
- Create: `frontend/src/services/upload.ts`

**Step 1: 创建上传服务**

```typescript
/**
 * 文件上传服务
 */

import api from './api';
import { logger } from '@/utils/logger';

/**
 * 上传头像
 *
 * @param file - 图片文件
 * @returns 上传结果，包含 Base64 编码的图片
 */
export async function uploadAvatar(file: File): Promise<{
  code: number;
  message: string;
  data: {
    avatar: string;
    size: number;
  };
}> {
  logger.info('Uploading avatar', { name: file.name, size: file.size });

  const formData = new FormData();
  formData.append('file', file);

  const response = await api.post('/upload/avatar', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
}
```

---

## Task 7: 前端 - 在基本信息表单中集成头像上传

**Files:**
- Modify: `frontend/src/pages/Resume/components/forms/BasicInfoForm.tsx`

**Step 1: 导入 AvatarUpload 组件**

```typescript
import { AvatarUpload } from '@/components/ui/avatar-upload';
```

**Step 2: 在表单中添加头像上传字段**

在表单的最开始添加头像上传区域：

```tsx
return (
  <div className="space-y-6">
    {/* 头像上传 */}
    <div className="flex justify-center pb-4 border-b">
      <Controller
        name="avatar"
        control={control}
        render={({ field }) => (
          <AvatarUpload
            value={field.value}
            onChange={field.onChange}
            disabled={isSubmitting}
          />
        )}
      />
    </div>

    {/* 原有表单内容 */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* ... 其他字段 */}
    </div>
  </div>
);
```

---

## Task 8: 前端 - 在简历预览中显示头像

**Files:**
- Modify: `frontend/src/pages/Resume/components/ResumePreview.tsx`

**Step 1: 在 ResumeTemplate 组件中添加头像显示**

修改头部信息区域，添加头像显示：

```tsx
{/* 头部信息 */}
<header className="border-b-2 border-gray-800 pb-4 mb-6">
  <div className="flex justify-between items-start">
    <div className="flex-1">
      <h1 className="text-2xl font-bold mb-2 text-gray-900">{data.name || '姓名'}</h1>
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-gray-600">
        {data.phone && <span>{data.phone}</span>}
        {data.email && <span>{data.email}</span>}
        {data.location && <span>{data.location}</span>}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-sm text-gray-700">
        {/* ... 其他信息 */}
      </div>
    </div>

    {/* 头像显示 */}
    {data.avatar && (
      <div className="ml-4">
        <img
          src={data.avatar}
          alt="头像"
          className="w-24 h-32 object-cover rounded border border-gray-300"
        />
      </div>
    )}
  </div>
</header>
```

**Step 2: 在 ResumeCreate 的预览区域也添加头像**

修改 ResumePreviewContent 组件的头部：

```tsx
<header className="border-b-2 border-gray-800 pb-4 mb-6">
  <div className="flex justify-between items-start">
    <div className="flex-1">
      <h1 className="text-3xl font-bold mb-2 text-gray-900">{data.name || '姓名'}</h1>
      <div className="text-gray-600">
        {data.phone && <span className="mr-4">{data.phone}</span>}
        {data.email && <span className="mr-4">{data.email}</span>}
        {data.location && <span>{data.location}</span>}
      </div>
    </div>

    {data.avatar && (
      <div className="ml-4">
        <img
          src={data.avatar}
          alt="头像"
          className="w-20 h-28 object-cover rounded border border-gray-300"
        />
      </div>
    )}
  </div>
</header>
```

---

## Task 9: 安装依赖并测试

**Step 1: 后端安装 Pillow**

Run: `cd backend && pip install Pillow`

**Step 2: 更新 requirements.txt**

Run: `cd backend && pip freeze > requirements.txt`

**Step 3: 运行测试**

Run: `cd backend && python -m pytest tests/ -v`

**Step 4: 前端构建测试**

Run: `cd frontend && npm run build`

---

## 验收标准

- [ ] 数据库中有 avatar 字段
- [ ] 后端有 /upload/avatar 接口
- [ ] 前端可以上传头像并预览
- [ ] 头像显示在简历预览的右上角
- [ ] 支持 JPG、PNG、WebP 格式
- [ ] 图片大小限制 1MB
- [ ] 图片自动压缩到 800x800 以内
