"""
{{module_name}} 路由模块

提供 {{resource_name}} 相关的 API 接口
"""

from fastapi import APIRouter, Depends, HTTPException, status
from typing import List

from app.schemas.{{module_name}} import (
    {{ResourceName}}Create,
    {{ResourceName}}Update,
    {{ResourceName}}Response,
)
from app.services.{{module_name}}_service import {{ResourceName}}Service
from app.core.logging import get_logger
from app.dependencies import get_current_user

router = APIRouter(prefix="/{{module_name}}s", tags=["{{resource_name}}"])
logger = get_logger(__name__)


@router.get("/", response_model=List[{{ResourceName}}Response])
async def list_{{module_name}}s(
    service: {{ResourceName}}Service = Depends(),
    current_user = Depends(get_current_user)
) -> List[{{ResourceName}}Response]:
    """获取 {{resource_name}} 列表。
    
    Args:
        service: {{ResourceName}}Service 实例
        current_user: 当前登录用户
        
    Returns:
        List[{{ResourceName}}Response]: {{resource_name}}列表
    """
    logger.info("API: list_{{module_name}}s called", user_id=current_user.id)
    
    try:
        results = await service.get_list()
        logger.info("API: list_{{module_name}}s success", count=len(results))
        return results
    except Exception as e:
        logger.error("API: list_{{module_name}}s error", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="获取列表失败"
        )


@router.get("/{item_id}", response_model={{ResourceName}}Response)
async def get_{{module_name}}(
    item_id: int,
    service: {{ResourceName}}Service = Depends(),
    current_user = Depends(get_current_user)
) -> {{ResourceName}}Response:
    """获取单个 {{resource_name}}。
    
    Args:
        item_id: {{resource_name}}ID
        service: {{ResourceName}}Service 实例
        current_user: 当前登录用户
        
    Returns:
        {{ResourceName}}Response: {{resource_name}}详情
        
    Raises:
        HTTPException: 未找到时返回 404
    """
    logger.info("API: get_{{module_name}} called", item_id=item_id)
    
    try:
        result = await service.get_by_id(item_id)
        if not result:
            logger.warning("API: get_{{module_name}} not found", item_id=item_id)
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="{{resource_name}}不存在"
            )
        logger.info("API: get_{{module_name}} success", item_id=item_id)
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error("API: get_{{module_name}} error", item_id=item_id, error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="获取详情失败"
        )


@router.post("/", response_model={{ResourceName}}Response, status_code=status.HTTP_201_CREATED)
async def create_{{module_name}}(
    data: {{ResourceName}}Create,
    service: {{ResourceName}}Service = Depends(),
    current_user = Depends(get_current_user)
) -> {{ResourceName}}Response:
    """创建 {{resource_name}}。
    
    Args:
        data: 创建数据
        service: {{ResourceName}}Service 实例
        current_user: 当前登录用户
        
    Returns:
        {{ResourceName}}Response: 创建的 {{resource_name}}
    """
    logger.info("API: create_{{module_name}} called", user_id=current_user.id)
    
    try:
        result = await service.create(data)
        logger.info("API: create_{{module_name}} success", item_id=result.id)
        return result
    except Exception as e:
        logger.error("API: create_{{module_name}} error", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="创建失败"
        )


@router.put("/{item_id}", response_model={{ResourceName}}Response)
async def update_{{module_name}}(
    item_id: int,
    data: {{ResourceName}}Update,
    service: {{ResourceName}}Service = Depends(),
    current_user = Depends(get_current_user)
) -> {{ResourceName}}Response:
    """更新 {{resource_name}}。
    
    Args:
        item_id: {{resource_name}}ID
        data: 更新数据
        service: {{ResourceName}}Service 实例
        current_user: 当前登录用户
        
    Returns:
        {{ResourceName}}Response: 更新后的 {{resource_name}}
    """
    logger.info("API: update_{{module_name}} called", item_id=item_id)
    
    try:
        result = await service.update(item_id, data)
        logger.info("API: update_{{module_name}} success", item_id=item_id)
        return result
    except Exception as e:
        logger.error("API: update_{{module_name}} error", item_id=item_id, error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="更新失败"
        )


@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_{{module_name}}(
    item_id: int,
    service: {{ResourceName}}Service = Depends(),
    current_user = Depends(get_current_user)
) -> None:
    """删除 {{resource_name}}。
    
    Args:
        item_id: {{resource_name}}ID
        service: {{ResourceName}}Service 实例
        current_user: 当前登录用户
    """
    logger.info("API: delete_{{module_name}} called", item_id=item_id)
    
    try:
        await service.delete(item_id)
        logger.info("API: delete_{{module_name}} success", item_id=item_id)
    except Exception as e:
        logger.error("API: delete_{{module_name}} error", item_id=item_id, error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="删除失败"
        )
