import { useTranslation } from "../contexts/LanguageContext";
import React from 'react';
import { BranchIndexingIndicator } from './BranchIndexingIndicator';
import ThemeToggle from './ThemeToggle';

interface NavigationProps {
    projectName: string;
    loadingMessage?: string | null;
}

const Navigation: React.FC<NavigationProps> = ({projectName, loadingMessage}) => {
  const { t } = useTranslation();
    return (
        <nav className="relative px-8 h-18 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 transition-colors duration-200">
            <div className="h-full flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2">
                    <h1 className="truncate text-xl font-bold text-gray-900 dark:text-gray-100">{projectName || t("Loading...")}</h1>
                    <div className="shrink-0">
                        <BranchIndexingIndicator message={loadingMessage} />
                    </div>
                </div>
                <div className="flex shrink-0 items-center">
                    <ThemeToggle />
                </div>
            </div>
        </nav>
    );
};

export default Navigation;
