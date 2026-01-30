"""
{{resource_name}} 服务层

处理 {{resource_name}} 相关的业务逻辑
"""

from typing import List, Optional
import time

from app.models.{{module_name}} import {{ResourceName}}
from app.schemas.{{module_name}} import {{ResourceName}}Create, {{ResourceName}}Update
from app.core.logging import get_logger
from app.core.exceptions import NotFoundError, ValidationError

logger = get_logger(__name__)


class {{ResourceName}}Service:
    """{{resource_name}} 服务类。
    
    提供 {{resource_name}} 的增删改查等操作
    """
    
    async def get_list(self) -> List[{{ResourceName}}]:
        """获取 {{resource_name}} 列表。
        
        Returns:
            List[{{ResourceName}}]: {{resource_name}}列表
        """
        logger.info("Service: get_list called")
        start_time = time.time()
        
        try:
            # TODO: 实现查询逻辑
            results = []
            
            latency = (time.time() - start_time) * 1000
            logger.info(
                "Service: get_list success",
                count=len(results),
                latency_ms=round(latency, 2)
            )
            return results
        except Exception as e:
            logger.error("Service: get_list error", error=str(e), exc_info=True)
            raise
    
    async def get_by_id(self, item_id: int) -> Optional[{{ResourceName}}]:
        """根据 ID 获取 {{resource_name}}。
        
        Args:
            item_id: {{resource_name}}ID
            
        Returns:
            Optional[{{ResourceName}}]: {{resource_name}}对象，不存在返回 None
        """
        logger.info("Service: get_by_id called", item_id=item_id)
        start_time = time.time()
        
        try:
            # TODO: 实现查询逻辑
            result = None
            
            latency = (time.time() - start_time) * 1000
            
            if result:
                logger.info(
                    "Service: get_by_id found",
                    item_id=item_id,
                    latency_ms=round(latency, 2)
                )
            else:
                logger.warning(
                    "Service: get_by_id not found",
                    item_id=item_id,
                    latency_ms=round(latency, 2)
                )
            
            return result
        except Exception as e:
            logger.error("Service: get_by_id error", item_id=item_id, error=str(e))
            raise
    
    async def create(self, data: {{ResourceName}}Create) -> {{ResourceName}}:
        """创建 {{resource_name}}。
        
        Args:
            data: 创建数据
            
        Returns:
            {{ResourceName}}: 创建的 {{resource_name}}
            
        Raises:
            ValidationError: 数据验证失败
        """
        logger.info("Service: create called", data=data.model_dump())
        start_time = time.time()
        
        try:
            # TODO: 实现创建逻辑
            result = {{ResourceName}}()
            
            latency = (time.time() - start_time) * 1000
            logger.info(
                "Service: create success",
                item_id=result.id,
                latency_ms=round(latency, 2)
            )
            return result
        except ValidationError as e:
            logger.warning("Service: create validation failed", error=str(e))
            raise
        except Exception as e:
            logger.error("Service: create error", error=str(e), exc_info=True)
            raise
    
    async def update(self, item_id: int, data: {{ResourceName}}Update) -> {{ResourceName}}:
        """更新 {{resource_name}}。
        
        Args:
            item_id: {{resource_name}}ID
            data: 更新数据
            
        Returns:
            {{ResourceName}}: 更新后的 {{resource_name}}
            
        Raises:
            NotFoundError: {{resource_name}}不存在
        """
        logger.info("Service: update called", item_id=item_id)
        start_time = time.time()
        
        try:
            # TODO: 实现更新逻辑
            result = {{ResourceName}}()
            
            latency = (time.time() - start_time) * 1000
            logger.info(
                "Service: update success",
                item_id=item_id,
                latency_ms=round(latency, 2)
            )
            return result
        except NotFoundError:
            logger.warning("Service: update not found", item_id=item_id)
            raise
        except Exception as e:
            logger.error("Service: update error", item_id=item_id, error=str(e))
            raise
    
    async def delete(self, item_id: int) -> None:
        """删除 {{resource_name}}。
        
        Args:
            item_id: {{resource_name}}ID
            
        Raises:
            NotFoundError: {{resource_name}}不存在
        """
        logger.info("Service: delete called", item_id=item_id)
        start_time = time.time()
        
        try:
            # TODO: 实现删除逻辑
            
            latency = (time.time() - start_time) * 1000
            logger.info(
                "Service: delete success",
                item_id=item_id,
                latency_ms=round(latency, 2)
            )
        except NotFoundError:
            logger.warning("Service: delete not found", item_id=item_id)
            raise
        except Exception as e:
            logger.error("Service: delete error", item_id=item_id, error=str(e))
            raise
