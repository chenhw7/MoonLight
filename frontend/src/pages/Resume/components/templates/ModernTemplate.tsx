/**
 * 专业商务版简历模板
 *
 * 设计理念：参考专业商务风格，采用红色主题色，清晰的视觉层次
 * 适用场景：专业岗位、商务场合
 */

import React from 'react';
import type { ResumeFormData } from '@/types/resume';

interface ModernTemplateProps {
  data: ResumeFormData;
  getEducationLabel: (value: string) => string;
  getProficiencyLabel: (value: string) => string;
  getLanguageLabel: (value: string) => string;
  getLanguageProficiencyLabel: (value: string) => string;
  getSocialPlatformLabel: (value: string) => string;
  formatDate: (dateStr: string | null | undefined) => string;
}

/**
 * 专业商务版简历模板组件
 *
 * @param data - 简历表单数据
 * @param getEducationLabel - 获取学历标签
 * @param getProficiencyLabel - 获取熟练程度标签
 * @param getLanguageLabel - 获取语言标签
 * @param getLanguageProficiencyLabel - 获取语言熟练度标签
 * @param getSocialPlatformLabel - 获取社交平台标签
 * @param formatDate - 格式化日期
 * @returns 专业商务版简历模板
 */
const ModernTemplate: React.FC<ModernTemplateProps> = ({
  data,
  getEducationLabel,
  getProficiencyLabel,
  getLanguageLabel,
  getLanguageProficiencyLabel,
  getSocialPlatformLabel,
}) => {
  /**
   * 主题色
   */
  const themeColor = '#c41e3a';

  /**
   * 字体栈：中文用方正书宋简体，英文和数字用 Times New Roman
   */
  const fontFamily = '"Times New Roman", "方正书宋简体", "FZSongS", "SimSun", "STSong", serif';

  /**
   * 渲染分区标题
   *
   * @param title - 标题文本
   * @returns 分区标题元素
   */
  const renderSectionTitle = (title: string) => (
    <h2
      style={{
        fontSize: '16px',
        fontWeight: 'bold',
        color: themeColor,
        marginBottom: '10px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
      }}
    >
      {/* 双层三角形容器 */}
      <span
        style={{
          position: 'relative',
          display: 'inline-block',
          width: '16px',
          height: '12px',
        }}
      >
        {/* 大三角形 - 左侧 #af032e */}
        <span
          style={{
            position: 'absolute',
            top: '0',
            left: '0',
            width: '0',
            height: '0',
            borderTop: '6px solid transparent',
            borderBottom: '6px solid transparent',
            borderLeft: '10px solid #af032e',
          }}
        />
        {/* 小三角形 - 右侧 #de99aa，更大一点，位置更靠右 */}
        <span
          style={{
            position: 'absolute',
            top: '1px',
            left: '7px',
            width: '0',
            height: '0',
            borderTop: '5px solid transparent',
            borderBottom: '5px solid transparent',
            borderLeft: '8px solid #de99aa',
          }}
        />
      </span>
      {/* 标题文字 */}
      <span>{title}</span>
      {/* 横线 */}
      <span
        style={{
          flex: 1,
          height: '1px',
          backgroundColor: themeColor,
          marginLeft: '4px',
        }}
      />
    </h2>
  );

  /**
   * 格式化日期为中文格式
   *
   * @param dateStr - 日期字符串
   * @returns 格式化后的中文日期
   */
  const formatChineseDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return '';
    const [year, month] = dateStr.split('-');
    return `${year}年${month}月`;
  };

  /**
   * 渲染联系信息
   *
   * @returns 联系信息元素
   */
  const renderContactInfo = () => {
    const contacts = [];
    if (data.phone) contacts.push(data.phone);
    if (data.email) contacts.push(data.email);

    if (contacts.length === 0) return null;

    return (
      <div
        style={{
          fontSize: '13px',
          color: '#000000',
          marginTop: '4px',
          wordWrap: 'break-word',
          wordBreak: 'break-word',
          overflowWrap: 'break-word',
        }}
      >
        {contacts.join(' | ')}
      </div>
    );
  };

  return (
    <div
      style={{
        fontSize: '13px',
        lineHeight: '1.6',
        color: '#000000',
        fontFamily,
        fontWeight: 570,
        letterSpacing: '0.5px',
        maxWidth: '100%',
        overflow: 'hidden',
      }}
    >
      {/* 头部信息 - 左右布局 */}
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '16px',
          paddingBottom: '12px',
          borderBottom: `1px solid ${themeColor}`,
          pageBreakInside: 'avoid', // 避免页面在头部中间断开
        }}
      >
        {/* 左侧：姓名和联系信息 */}
        <div style={{ flex: 1 }}>
          <h1
            style={{
              fontSize: '26px',
              fontWeight: 'bold',
              color: '#000000',
              margin: '0 0 6px 0',
            }}
          >
            {data.name || '姓名'}
          </h1>
          {renderContactInfo()}
        </div>

        {/* 右侧：头像 */}
        {data.avatar && (
          <div style={{ marginLeft: '16px', flexShrink: 0 }}>
            <img
              src={data.avatar}
              alt="头像"
              style={{
                width: data.avatar_ratio === '1' ? '80px' : '80px',
                height: data.avatar_ratio === '1' ? '80px' : '112px',
                objectFit: 'cover',
                borderRadius: '4px',
                border: '1px solid #ddd',
              }}
            />
          </div>
        )}
      </header>

      {/* 教育经历 */}
      {data.educations.length > 0 && (
        <section style={{ marginBottom: '14px', pageBreakInside: 'avoid', width: '100%', overflow: 'hidden' }}>
          {renderSectionTitle('教育经历')}
          {data.educations.map((edu, index) => (
            <div key={index} style={{ marginBottom: '8px', pageBreakInside: 'avoid', width: '100%', overflow: 'hidden' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div style={{ fontSize: '13px', color: '#000000', fontWeight: 600 }}>
                  {edu.school_name}
                </div>
                <span style={{ fontSize: '13px', color: '#000000' }}>
                  {formatChineseDate(edu.start_date)} - {edu.is_current ? '至今' : formatChineseDate(edu.end_date)}
                </span>
              </div>
              <div style={{ fontSize: '13px', color: '#000000', marginTop: '2px' }}>
                {edu.major} · {getEducationLabel(edu.degree)}
                {(edu.gpa || edu.honors) && (
                  <span style={{ color: '#000000', marginLeft: '8px' }}>
                    {edu.gpa && `GPA: ${edu.gpa}`}
                    {edu.gpa && edu.honors && ' | '}
                    {edu.honors}
                  </span>
                )}
              </div>
            </div>
          ))}
        </section>
      )}

      {/* 工作/实习经历 */}
      {data.work_experiences.length > 0 && (
        <section style={{ marginBottom: '14px', pageBreakInside: 'avoid', width: '100%', overflow: 'hidden' }}>
          {renderSectionTitle(data.resume_type === 'campus' ? '实习经历' : '工作经历')}
          {data.work_experiences.map((work, index) => (
            <div key={index} style={{ marginBottom: '10px', pageBreakInside: 'avoid', width: '100%', overflow: 'hidden' }}>
              {/* 第一行：公司 · 职位 · 部门 | 时间 | 地点 */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '4px',
                  width: '100%',
                }}
              >
                <div style={{ fontSize: '13px', color: '#000000', fontWeight: 600 }}>
                  {work.company_name}
                  <span style={{ fontWeight: 'normal', color: '#000000' }}>
                    {' '}· {work.position}
                  </span>
                </div>
                <span style={{ fontSize: '13px', color: '#000000' }}>
                  {formatChineseDate(work.start_date)} - {work.is_current ? '至今' : formatChineseDate(work.end_date)}
                </span>
              </div>
              {/* 描述 */}
              <p
                style={{
                  margin: '6px 0 0 0',
                  whiteSpace: 'pre-wrap',
                  color: '#000000',
                  lineHeight: '1.7',
                  fontSize: '13px',
                  wordWrap: 'break-word',
                  wordBreak: 'break-all',
                  overflowWrap: 'anywhere',
                  width: '100%',
                  maxWidth: '100%',
                  overflow: 'hidden',
                }}
              >
                {work.description}
              </p>
            </div>
          ))}
        </section>
      )}

      {/* 项目经历 */}
      {data.projects.length > 0 && (
        <section style={{ marginBottom: '14px', pageBreakInside: 'avoid', width: '100%', overflow: 'hidden' }}>
          {renderSectionTitle('项目经历')}
          {data.projects.map((project, index) => (
            <div key={index} style={{ marginBottom: '10px', pageBreakInside: 'avoid', width: '100%', overflow: 'hidden' }}>
              {/* 第一行：项目名 · 角色 | 时间 */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '4px',
                  width: '100%',
                }}
              >
                <div style={{ fontSize: '13px', color: '#000000', fontWeight: 600 }}>
                  {project.name}
                  <span style={{ fontWeight: 'normal', color: '#000000' }}>
                    {' '}· {project.role}
                  </span>
                </div>
                <span style={{ fontSize: '13px', color: '#000000' }}>
                  {formatChineseDate(project.start_date)} - {project.is_current ? '至今' : formatChineseDate(project.end_date)}
                </span>
              </div>
              {/* 项目链接 */}
              {project.link && (
                <div style={{ fontSize: '13px', color: '#000000', marginTop: '2px', wordWrap: 'break-word', wordBreak: 'break-all' }}>
                  {project.link}
                </div>
              )}
              {/* 描述 */}
              <p
                style={{
                  margin: '6px 0 0 0',
                  whiteSpace: 'pre-wrap',
                  color: '#000000',
                  lineHeight: '1.7',
                  fontSize: '13px',
                  wordWrap: 'break-word',
                  wordBreak: 'break-all',
                  overflowWrap: 'anywhere',
                  width: '100%',
                  maxWidth: '100%',
                  overflow: 'hidden',
                }}
              >
                {project.description}
              </p>
            </div>
          ))}
        </section>
      )}

      {/* 技能特长 */}
      {data.skills.length > 0 && (
        <section style={{ marginBottom: '14px', pageBreakInside: 'avoid' }}>
          {renderSectionTitle('技能特长')}
          <div style={{ fontSize: '13px', color: '#000000', lineHeight: '1.8' }}>
            {data.skills.map((skill, index) => (
              <span key={index}>
                <strong style={{ color: '#000000' }}>{skill.name}</strong>
                <span style={{ color: '#000000' }}>（{getProficiencyLabel(skill.proficiency)}）</span>
                {index < data.skills.length - 1 && <span style={{ margin: '0 8px', color: '#999999' }}>·</span>}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* 语言能力 */}
      {data.languages.length > 0 && (
        <section style={{ marginBottom: '14px', pageBreakInside: 'avoid' }}>
          {renderSectionTitle('语言能力')}
          <div style={{ fontSize: '13px', color: '#000000', lineHeight: '1.8' }}>
            {data.languages.map((lang, index) => (
              <span key={index}>
                <strong style={{ color: '#000000' }}>{getLanguageLabel(lang.language)}</strong>
                <span style={{ color: '#000000' }}>：{getLanguageProficiencyLabel(lang.proficiency)}</span>
                {index < data.languages.length - 1 && <span style={{ margin: '0 8px', color: '#999999' }}>·</span>}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* 获奖经历 */}
      {data.awards.length > 0 && (
        <section style={{ marginBottom: '14px', pageBreakInside: 'avoid' }}>
          {renderSectionTitle('获奖经历')}
          <ul style={{ margin: '0', paddingLeft: '16px', color: '#000000' }}>
            {data.awards.map((award, index) => (
              <li key={index} style={{ marginBottom: '3px', lineHeight: '1.6' }}>
                {award.name}
                {award.date && (
                  <span style={{ color: '#000000', marginLeft: '8px', fontSize: '13px' }}>
                    （{formatChineseDate(award.date)}）
                  </span>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* 作品展示 */}
      {data.portfolios.length > 0 && (
        <section style={{ marginBottom: '14px', pageBreakInside: 'avoid' }}>
          {renderSectionTitle('作品展示')}
          <ul style={{ margin: '0', paddingLeft: '16px', color: '#000000' }}>
            {data.portfolios.map((portfolio, index) => (
              <li key={index} style={{ marginBottom: '3px', lineHeight: '1.6', wordWrap: 'break-word', wordBreak: 'break-all' }}>
                {portfolio.name}
                {portfolio.link && (
                  <span style={{ color: '#000000', marginLeft: '8px', fontSize: '13px' }}>
                    {portfolio.link}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* 社交账号 */}
      {data.social_links.length > 0 && (
        <section style={{ marginBottom: '14px', pageBreakInside: 'avoid' }}>
          {renderSectionTitle('社交账号')}
          <div style={{ fontSize: '13px', color: '#000000', lineHeight: '1.8', wordWrap: 'break-word', wordBreak: 'break-all' }}>
            {data.social_links.map((link, index) => (
              <span key={index}>
                <strong style={{ color: '#000000' }}>{getSocialPlatformLabel(link.platform)}</strong>
                <span style={{ color: '#000000' }}>：{link.url}</span>
                {index < data.social_links.length - 1 && <span style={{ margin: '0 8px', color: '#999999' }}>·</span>}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* 个人总结 */}
      {data.self_evaluation && (
        <section style={{ marginBottom: '14px', pageBreakInside: 'avoid', width: '100%', overflow: 'hidden' }}>
          {renderSectionTitle('个人总结')}
          <p
            style={{
              margin: '0',
              whiteSpace: 'pre-wrap',
              color: '#000000',
              lineHeight: '1.7',
              fontSize: '13px',
              wordWrap: 'break-word',
              wordBreak: 'break-all',
              overflowWrap: 'anywhere',
              width: '100%',
              maxWidth: '100%',
              overflow: 'hidden',
            }}
          >
            {data.self_evaluation}
          </p>
        </section>
      )}
    </div>
  );
};

export default ModernTemplate;
