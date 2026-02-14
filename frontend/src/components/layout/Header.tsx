/**
 * 顶部导航栏组件
 *
 * 包含 Logo、导航菜单和用户信息区域
 */

import { Link, useLocation } from 'react-router-dom';
import { Moon, ChevronDown, LogOut, User, Settings, FileText, Plus, List, MessageSquare, Bot, History, Settings2 } from 'lucide-react';
import { useState, useRef, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { createLogger } from '@/utils/logger';
import { ThemeToggle } from '@/components/theme-toggle';

const logger = createLogger('Header');

interface NavItem {
  label: string;
  path: string;
}

const NAV_ITEMS: NavItem[] = [
  { label: '项目', path: '/projects' },
  { label: '团队', path: '/team' },
];

export function Header() {
  const location = useLocation();
  const user = useAuthStore((state) => state.user);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  
  // User Menu State
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Resume Menu State
  const [isResumeMenuOpen, setIsResumeMenuOpen] = useState(false);
  const resumeMenuRef = useRef<HTMLDivElement>(null);

  logger.debug('Header rendered', { path: location.pathname });

  const handleCloseMenu = useCallback(() => {
    setIsMenuOpen(false);
    buttonRef.current?.focus();
  }, []);

  const handleCloseResumeMenu = useCallback(() => {
    setIsResumeMenuOpen(false);
  }, []);

  const handleLogout = useCallback(() => {
    logger.info('User logged out', { userId: user?.id });
    clearAuth();
    window.location.href = '/login';
  }, [clearAuth, user?.id]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (isMenuOpen) handleCloseMenu();
        if (isResumeMenuOpen) handleCloseResumeMenu();
      }
    },
    [isMenuOpen, isResumeMenuOpen, handleCloseMenu, handleCloseResumeMenu]
  );

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        !buttonRef.current?.contains(event.target as Node)
      ) {
        handleCloseMenu();
      }
      if (
        resumeMenuRef.current &&
        !resumeMenuRef.current.contains(event.target as Node)
      ) {
        handleCloseResumeMenu();
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [handleCloseMenu, handleCloseResumeMenu]);

  const getInitials = (name: string): string => {
    return name.charAt(0).toUpperCase();
  };

  const isActive = (path: string): boolean => {
    if (path === '/home') {
      return location.pathname === '/home';
    }
    return location.pathname.startsWith(path);
  };

  const isResumeActive = location.pathname.startsWith('/resume');
  const isInterviewActive = location.pathname.startsWith('/interview');

  // Interview Menu State
  const [isInterviewMenuOpen, setIsInterviewMenuOpen] = useState(false);
  const interviewMenuRef = useRef<HTMLDivElement>(null);

  const handleCloseInterviewMenu = useCallback(() => {
    setIsInterviewMenuOpen(false);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        !buttonRef.current?.contains(event.target as Node)
      ) {
        handleCloseMenu();
      }
      if (
        resumeMenuRef.current &&
        !resumeMenuRef.current.contains(event.target as Node)
      ) {
        handleCloseResumeMenu();
      }
      if (
        interviewMenuRef.current &&
        !interviewMenuRef.current.contains(event.target as Node)
      ) {
        handleCloseInterviewMenu();
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [handleCloseMenu, handleCloseResumeMenu, handleCloseInterviewMenu]);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-6 lg:gap-8">
          <Link
            to="/home"
            className="flex items-center gap-2 font-semibold transition-opacity hover:opacity-80"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
              <Moon className="h-5 w-5 text-primary" />
            </div>
            <span className="hidden sm:inline">MoonLight</span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {/* 仪表盘 */}
            <Link
                to="/home"
                className={`px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                  isActive('/home')
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                仪表盘
            </Link>

            {/* 简历管理 Dropdown */}
            <div
              className="relative"
              ref={resumeMenuRef}
              onMouseEnter={() => setIsResumeMenuOpen(true)}
              onMouseLeave={() => setIsResumeMenuOpen(false)}
            >
              <button
                className={`flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                  isResumeActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
                onClick={() => setIsResumeMenuOpen(!isResumeMenuOpen)}
              >
                简历管理
                <ChevronDown className={`h-3 w-3 transition-transform ${isResumeMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {isResumeMenuOpen && (
                <div
                  className="absolute left-0 top-full pt-1 w-48 animate-in fade-in zoom-in-95 duration-200"
                >
                  <div className="rounded-md border bg-popover p-1 shadow-lg">
                    <Link
                      to="/resume/create"
                      onClick={() => setIsResumeMenuOpen(false)}
                      className="flex w-full items-center gap-2 rounded-sm px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground"
                    >
                      <Plus className="h-4 w-4" />
                      新建简历
                    </Link>
                    <Link
                      to="/resumes"
                      onClick={() => setIsResumeMenuOpen(false)}
                      className="flex w-full items-center gap-2 rounded-sm px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground"
                    >
                      <List className="h-4 w-4" />
                      我的简历
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* AI 面试官 Dropdown */}
            <div
              className="relative"
              ref={interviewMenuRef}
              onMouseEnter={() => setIsInterviewMenuOpen(true)}
              onMouseLeave={() => setIsInterviewMenuOpen(false)}
            >
              <button
                className={`flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                  isInterviewActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
                onClick={() => setIsInterviewMenuOpen(!isInterviewMenuOpen)}
              >
                <Bot className="h-4 w-4 mr-1" />
                AI 面试官
                <ChevronDown className={`h-3 w-3 transition-transform ${isInterviewMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {isInterviewMenuOpen && (
                <div
                  className="absolute left-0 top-full pt-1 w-48 animate-in fade-in zoom-in-95 duration-200"
                >
                  <div className="rounded-md border bg-popover p-1 shadow-lg">
                    <Link
                      to="/interview/config"
                      onClick={() => setIsInterviewMenuOpen(false)}
                      className="flex w-full items-center gap-2 rounded-sm px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground"
                    >
                      <MessageSquare className="h-4 w-4" />
                      开始面试
                    </Link>
                    <Link
                      to="/interviews"
                      onClick={() => setIsInterviewMenuOpen(false)}
                      className="flex w-full items-center gap-2 rounded-sm px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground"
                    >
                      <History className="h-4 w-4" />
                      面试历史
                    </Link>
                    <Link
                      to="/ai-config"
                      onClick={() => setIsInterviewMenuOpen(false)}
                      className="flex w-full items-center gap-2 rounded-sm px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground"
                    >
                      <Settings2 className="h-4 w-4" />
                      AI 配置
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {NAV_ITEMS.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                  isActive(item.path)
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle />

          {user && (
            <div className="relative" ref={menuRef}>
              <button
                ref={buttonRef}
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                onKeyDown={handleKeyDown}
                className="flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5 text-sm font-medium transition-colors hover:bg-primary/20 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                aria-expanded={isMenuOpen}
                aria-haspopup="true"
              >
                <div
                  className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-medium"
                  aria-hidden="true"
                >
                  {getInitials(user.username)}
                </div>
                <span className="hidden sm:inline">{user.username}</span>
                <ChevronDown
                  className={`h-4 w-4 text-muted-foreground transition-transform ${
                    isMenuOpen ? 'rotate-180' : ''
                  }`}
                  aria-hidden="true"
                />
              </button>

              {isMenuOpen && (
                <div
                  className="absolute right-0 mt-2 w-56 rounded-md border bg-popover p-1 shadow-lg animate-scale-in origin-top-right"
                  role="menu"
                  aria-orientation="vertical"
                >
                  <div className="px-3 py-2 text-xs text-muted-foreground border-b">
                    登录为 {user.email}
                  </div>

                  <Link
                    to="/settings"
                    onClick={handleCloseMenu}
                    className="flex w-full items-center gap-2 rounded-sm px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground focus:outline-none"
                    role="menuitem"
                  >
                    <User className="h-4 w-4" />
                    个人资料
                  </Link>

                  <Link
                    to="/settings"
                    onClick={handleCloseMenu}
                    className="flex w-full items-center gap-2 rounded-sm px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground focus:outline-none"
                    role="menuitem"
                  >
                    <Settings className="h-4 w-4" />
                    设置
                  </Link>

                  <div className="my-1 border-t" role="none" />

                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 rounded-sm px-3 py-2 text-sm text-destructive transition-colors hover:bg-destructive/10 focus:outline-none"
                    role="menuitem"
                  >
                    <LogOut className="h-4 w-4" />
                    退出登录
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;
